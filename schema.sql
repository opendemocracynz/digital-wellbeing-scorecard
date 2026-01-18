-- Supabase Schema for Digital Wellbeing Scorecard

-- Table 1: research_data (Anonymous Quiz Results)
CREATE TABLE IF NOT EXISTS research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quiz_version TEXT NOT NULL DEFAULT 'v1.0',
    answer_string TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    archetype_level INTEGER NOT NULL,
    country_code TEXT
);

-- Table 2: marketing_leads (Email Collection)
CREATE TABLE IF NOT EXISTS marketing_leads (
    email TEXT PRIMARY KEY,
    first_name TEXT,
    signup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    archetype_segment INTEGER
);

-- SECURITY: Enable Row Level Security (RLS)
ALTER TABLE research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- POLICIES: Allow public (anonymous) inserts
-- We do not allow SELECT/UPDATE/DELETE for public to protect privacy

CREATE POLICY "Enable insert for anyone" ON research_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for anyone" ON marketing_leads
    FOR INSERT WITH CHECK (true);
