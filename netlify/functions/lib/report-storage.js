// netlify/functions/lib/report-storage.js
//
// Reads from the private "reports" Supabase Storage bucket (poster + per-archetype
// PDFs). Requires the service_role key — it deliberately bypasses RLS, so this must
// only ever run server-side (Netlify Functions), never be exposed to the frontend.

const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const REPORTS_BUCKET = 'reports';

async function getSignedReportUrl(filename, expiresInSeconds = 300) {
    const { data, error } = await supabaseAdmin.storage
        .from(REPORTS_BUCKET)
        .createSignedUrl(filename, expiresInSeconds);

    if (error) throw error;
    return data.signedUrl;
}

module.exports = { getSignedReportUrl, supabaseAdmin };
