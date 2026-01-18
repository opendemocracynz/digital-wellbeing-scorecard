// netlify/functions/submit-score.js

// IMPORTANT: Set these environment variables in your Netlify project settings
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getArchetype(score) {
    if (score >= 15 && score <= 29) return { level: 1, name: 'Zombie Clickslave' };
    if (score >= 30 && score <= 44) return { level: 2, name: 'Unconscious Doomscroller' };
    if (score >= 45 && score <= 55) return { level: 3, name: 'Digital Drifter' };
    if (score >= 56 && score <= 68) return { level: 4, name: 'Intentional Architect' };
    if (score >= 69 && score <= 75) return { level: 5, name: 'Digital Sovereign' };
    return { level: 0, name: 'Unknown' };
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { answers } = JSON.parse(event.body);
        const totalScore = answers.reduce((acc, score) => acc + score, 0);
        const archetype = getArchetype(totalScore);
        const answer_string = answers.join('');

        const { data, error } = await supabase
            .from('research_data')
            .insert([
                { 
                    answer_string, 
                    total_score: totalScore, 
                    archetype_level: archetype.level 
                }
            ]);

        if (error) {
            throw error;
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                totalScore,
                archetype
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};