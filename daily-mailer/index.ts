// supabase/edge functions/daily-mailer/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { MailerSend, EmailParams, Sender, Recipient } from "npm:mailersend";

// 1. CONTENT LIBRARY (The "Brain")
// Instead of 50 templates, we map your DB IDs to text here.
// Update these strings to match your actual quiz results.
const ARCHETYPE_CONTENT = {
  1: {
    archetype: "The Digital Minimalist",
    archetype_description: "",
    archetype_response: "",
  },
  2: {
    archetype: "The Infinite Scroller",
    weakness: "Doomscrolling",
    advice_day_5: "Set a 15-minute timer before you open social media. When it rings, close the app.",
    advice_day_15: "Unfollow 5 accounts that make you feel anxious. Do it right now."
  },
  31: {
    archetype: "The Digital Minimalist",
    weakness: "Over-connection",
    advice_day_5: "Try leaving your phone in the kitchen tonight. Just for one night.",
    advice_day_15: "Have you tried 'Grayscale Mode'? It reduces the dopamine hit of colorful icons."
  },
  3: {
    archetype: "The Infinite Scroller",
    weakness: "Doomscrolling",
    advice_day_5: "Set a 15-minute timer before you open social media. When it rings, close the app.",
    advice_day_15: "Unfollow 5 accounts that make you feel anxious. Do it right now."
  },
  5: {
    archetype: "The Digital Minimalist",
    weakness: "Over-connection",
    advice_day_5: "Try leaving your phone in the kitchen tonight. Just for one night.",
    advice_day_15: "Have you tried 'Grayscale Mode'? It reduces the dopamine hit of colorful icons."
  },
  // ... Add IDs 3, 4, 5 etc.
  default: {
    archetype: "Digital Citizen",
    weakness: "General Distraction",
    advice_day_5: "Take a 5-minute breather without any screens.",
    advice_day_15: "Review your notification settings today."
  }
};

const SEGMENT_CONTENT = {
    1: {
        segment: "Over-connection",
        segment_description: "",
        segment_reesponse: "",
        advice_day_5: "Try leaving your phone in the kitchen tonight. Just for one night.",
        advice_day_15: "Have you tried 'Grayscale Mode'? It reduces the dopamine hit of colorful icons.",
        advise_day_30: "",
        advise_day_50: "",
        advise_day_70: "",
        advice_day_90: ""
    },
    2: {
        segment: "Over-connection",
        segment_description: "",
        segment_reesponse: "",
        advice_day_5: "Try leaving your phone in the kitchen tonight. Just for one night.",
        advice_day_15: "Have you tried 'Grayscale Mode'? It reduces the dopamine hit of colorful icons.",
        advise_day_30: "",
        advise_day_50: "",
        advise_day_70: "",
        advice_day_90: ""
    },
    3: {
        segment: "Over-connection",
        segment_description: "",
        segment_reesponse: "",
        advice_day_5: "Try leaving your phone in the kitchen tonight. Just for one night.",
        advice_day_15: "Have you tried 'Grayscale Mode'? It reduces the dopamine hit of colorful icons.",
        advise_day_30: "",
        advise_day_50: "",
        advise_day_70: "",
        advice_day_90: ""
    },
  },

// 2. TEMPLATE IDs (From MailerSend)
// You only need 4 templates in MailerSend total.
const TEMPLATE_IDS = {
  5:  "neqvygmqw5740p7w", // Replace with your "Day 5" Template ID
  15: "z3m5jgrjm04dpyo6", // Replace with your "Day 15" Template ID
  30: "...",
  50: "",
  70: "...",
  90: ""
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAILERSEND_API_KEY = Deno.env.get('MAILERSEND_API_KEY') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mailersend = new MailerSend({ apiKey: MAILERSEND_API_KEY });

Deno.serve(async (req) => {
  try {
    // 3. FETCH USERS
    const { data: leads, error } = await supabase
      .from('marketing_leads')
      .select('*')
      .eq('unsubscribed_from_sequences', false) 
      .eq('has_purchased_report', false)
      .lt('last_email_stage', 70); 

    if (error) throw error;
    if (!leads?.length) return new Response("No leads today.", { status: 200 });

    const updates = [];
    const emailPromises = [];

    // 4. LOOP & SEND
    for (const user of leads) {
      if (!user.quiz_completed_at) continue;

      const daysSince = Math.ceil(Math.abs(new Date().getTime() - new Date(user.quiz_completed_at).getTime()) / (86400000)); 
      
      // Determine Stage
      let targetStage = 0;
      if (daysSince >= 5 && user.last_email_stage < 5) targetStage = 5;
      else if (daysSince >= 15 && user.last_email_stage < 15) targetStage = 15;
      else if (daysSince >= 50 && user.last_email_stage < 50) targetStage = 50;
      else if (daysSince >= 70 && user.last_email_stage < 70) targetStage = 70;

      if (targetStage > 0 && TEMPLATE_IDS[targetStage]) {
        
        // SELECT THE CONTENT based on their Archetype ID
        const content = ARCHETYPE_CONTENT[user.archetype_segment] || ARCHETYPE_CONTENT['default'];
        
        // Select the specific advice for this day
        // Dynamic access: content['advice_day_5']
        const specificAdvice = content[`advice_day_${targetStage}`] || content.advice_day_5;

        const emailParams = new EmailParams()
          .setFrom(new Sender("founder@opendemocracy.nz", "Your Name"))
          .setTo([new Recipient(user.email, user.first_name)])
          .setTemplateId(TEMPLATE_IDS[targetStage])
          .setPersonalization([
            {
              email: user.email,
              data: {
                // These are the tags you put in your MailerSend Template
                name: user.first_name,
                archetype_name: content.name,
                weakness_area: content.weakness,
                custom_advice: specificAdvice, // <--- The Magic Variable
                score: user.current_score
              }
            }
          ]);

        emailPromises.push(mailersend.email.send(emailParams));
        
        updates.push(
          supabase.from('marketing_leads')
            .update({ last_email_stage: targetStage })
            .eq('email', user.email)
        );
      }
    }

    await Promise.all(emailPromises);
    await Promise.all(updates);

    return new Response(`Processed ${leads.length} users.`, { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});