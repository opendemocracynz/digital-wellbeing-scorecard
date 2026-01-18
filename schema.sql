-- Supabase Schema for Digital Wellbeing Scorecard

-- Table 1: research_data
CREATE TABLE research_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    quiz_version TEXT NOT NULL DEFAULT 'v1.0',
    answer_string TEXT NOT NULL,
    total_score INTEGER NOT NULL,
    archetype_level INTEGER NOT NULL,
    country_code TEXT
);

-- Table 2: marketing_leads
CREATE TABLE marketing_leads (
    email TEXT PRIMARY KEY,
    first_name TEXT,
    signup_date DATE NOT NULL DEFAULT CURRENT_DATE,
    archetype_segment INTEGER
);
