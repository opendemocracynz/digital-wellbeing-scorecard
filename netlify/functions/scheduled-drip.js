// netlify/functions/scheduled-drip.js
//
// Runs daily. Sends the Day 3 / 10 / 30 / 90 follow-up email to each lead whose
// quiz_completed_at has crossed a new stage threshold. Day 3/10/30 skip anyone who's
// already purchased the report (no point nurturing a completed sale); Day 90 goes to
// everyone, purchased or not, per product decision.
//
// Uses the service_role key deliberately: marketing_leads has no SELECT/UPDATE policy
// for the anon key (by design, see schema.sql), and this needs to read and update
// across all leads, not just the current request's own row.

const { schedule } = require('@netlify/functions');
const { supabaseAdmin } = require('./lib/report-storage');
const { buildDripEmail } = require('./lib/drip-email');

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = 'hello@digitalwellbeingscore.app';
const FROM_NAME = 'Digital Wellbeing Score';

const STAGES = [3, 10, 30, 90];
const FINAL_STAGE = 90;

async function sendDripEmail(lead, stage) {
    const { subject, html, text } = buildDripEmail({ stage, lead });

    const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: { email: FROM_EMAIL, name: FROM_NAME },
            to: [{ email: lead.email }],
            subject,
            html,
            text,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`MailerSend send failed (${response.status}): ${errorBody}`);
    }
}

function determineTargetStage(lead, daysSince) {
    let targetStage = null;
    for (const stage of STAGES) {
        if (daysSince >= stage && lead.last_email_stage < stage) {
            targetStage = stage;
        }
    }
    return targetStage;
}

async function runDrip() {
    const { data: leads, error } = await supabaseAdmin
        .from('marketing_leads')
        .select('email, archetype_segment, current_score, last_email_stage, quiz_completed_at, has_purchased_report, unsubscribed_from_sequences')
        .eq('unsubscribed_from_sequences', false)
        .not('quiz_completed_at', 'is', null)
        .lt('last_email_stage', FINAL_STAGE);

    if (error) throw error;
    if (!leads || leads.length === 0) {
        return { statusCode: 200, body: 'No leads to process.' };
    }

    const now = Date.now();
    let sent = 0;

    for (const lead of leads) {
        const daysSince = Math.floor((now - new Date(lead.quiz_completed_at).getTime()) / 86400000);
        const targetStage = determineTargetStage(lead, daysSince);

        if (targetStage === null) continue;
        if (targetStage < FINAL_STAGE && lead.has_purchased_report) continue;

        try {
            await sendDripEmail(lead, targetStage);
            await supabaseAdmin
                .from('marketing_leads')
                .update({ last_email_stage: targetStage })
                .eq('email', lead.email);
            sent += 1;
        } catch (sendError) {
            console.error(`Failed to send drip stage ${targetStage} to ${lead.email}:`, sendError);
        }
    }

    return { statusCode: 200, body: `Checked ${leads.length} leads, sent ${sent} emails.` };
}

module.exports.handler = schedule('@daily', runDrip);
