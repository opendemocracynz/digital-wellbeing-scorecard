// netlify/functions/subscribe.js

const { createClient } = require('@supabase/supabase-js');
const { buildWelcomeEmail } = require('./lib/welcome-email');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const MAILERSEND_API_KEY = process.env.MAILERSEND_API_KEY;
const FROM_EMAIL = 'hello@digitalwellbeingscore.app';
const FROM_NAME = 'Digital Wellbeing Score';

// The token is a bearer secret for this lead (unsubscribe / retake links), so it is read here
// with the service role and goes only into the email sent to that address. Never add it to
// the response: anyone can call this function with any email.
async function getRetakeToken(email) {
    try {
        const { supabaseAdmin } = require('./lib/report-storage');
        const { data } = await supabaseAdmin
            .from('marketing_leads')
            .select('retake_token')
            .eq('email', email)
            .maybeSingle();
        return data?.retake_token || null;
    } catch (error) {
        return null;
    }
}

async function sendWelcomeEmail({ email, totalScore, archetypeLevel, pillarScores }) {
    const retakeToken = await getRetakeToken(email);
    const { subject, html, text } = buildWelcomeEmail({ totalScore, archetypeLevel, pillarScores, email, retakeToken });

    const response = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${MAILERSEND_API_KEY}`,
        },
        body: JSON.stringify({
            from: { email: FROM_EMAIL, name: FROM_NAME },
            to: [{ email }],
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

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, archetype_segment, total_score, first_name, researchId } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Email is required' }) };
        }

        // Call the secure RPC function we created in Supabase
        const { data, error } = await supabase.rpc('submit_lead', {
            p_email: email,
            p_segment: archetype_segment,
            p_score: total_score,
            p_first_name: first_name || null,
            p_research_id: researchId || null
        });

        if (error) throw error;

        // Only send the Day-0 welcome email on a brand-new signup, not on repeat quiz
        // retakes, and only if we actually got pillar scores back (requires a valid
        // researchId — see submit_lead()'s SELECT in schema.sql).
        const pillarScores = {
            Physiological: data.score_physiological,
            Psychological: data.score_psychological,
            Social: data.score_social,
            Cognitive: data.score_cognitive,
        };
        const hasPillarScores = Object.values(pillarScores).every((v) => v !== null && v !== undefined);

        if (data.status === 'inserted' && hasPillarScores) {
            try {
                await sendWelcomeEmail({ email, totalScore: total_score, archetypeLevel: archetype_segment, pillarScores });
            } catch (emailError) {
                // Don't fail the signup if the email fails to send — the lead is already saved.
                console.error('Failed to send welcome email:', emailError);
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};