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
        const { email, archetype_segment, first_name } = JSON.parse(event.body);

        if (!email) {
            return { statusCode: 400, body: JSON.stringify({ message: 'Email is required' }) };
        }

        const { data, error } = await supabase
            .from('marketing_leads')
            .insert([
                { 
                    email, 
                    archetype_segment,
                    first_name
                }
            ]);

        if (error) {
            // Handle potential duplicate email error
            if (error.code === '23505') { 
                return { statusCode: 409, body: JSON.stringify({ message: 'Email already subscribed.' }) };
            }
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Subscription successful!' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};