// netlify/functions/subscribe.js

const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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