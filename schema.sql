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

-- UPDATE: Add submission tracking column
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 1;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS initial_archetype INTEGER;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS initial_score INTEGER;
ALTER TABLE marketing_leads ADD COLUMN IF NOT EXISTS current_score INTEGER;

-- RPC: Securely handle lead submission (Insert or Update)
-- This function runs with "SECURITY DEFINER" to bypass RLS for the update logic
CREATE OR REPLACE FUNCTION submit_lead(
    p_email TEXT,
    p_segment INTEGER,
    p_score INTEGER DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_count INTEGER;
    v_initial_score INTEGER;
BEGIN
    INSERT INTO marketing_leads (
        email, 
        archetype_segment, 
        current_score, 
        initial_archetype, 
        initial_score, 
        first_name, 
        submission_count
    )
    VALUES (p_email, p_segment, p_score, p_segment, p_score, p_first_name, 1)
    ON CONFLICT (email) DO UPDATE
    SET 
        archetype_segment = EXCLUDED.archetype_segment,
        current_score = EXCLUDED.current_score,
        submission_count = marketing_leads.submission_count + 1,
        first_name = COALESCE(EXCLUDED.first_name, marketing_leads.first_name)
    RETURNING submission_count, initial_score INTO v_count, v_initial_score;
    
    IF v_count > 1 THEN
        RETURN jsonb_build_object(
            'status', 'updated', 
            'message', 'Welcome back! Profile updated.',
            'score_diff', (p_score - v_initial_score)
        );
    ELSE
        RETURN jsonb_build_object('status', 'inserted', 'message', 'Thank you for subscribing!');
    END IF;
END;
$func$;
