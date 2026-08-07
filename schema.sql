-- Supabase Schema for Digital Wellbeing Scorecard

create table public.research_data (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  quiz_version text not null default 'v1.0'::text,
  answer_string text not null,
  total_score integer not null,
  archetype_level integer not null,
  country_code text null,
  score_physiological integer null,
  score_psychological integer null,
  score_social integer null,
  score_cognitive integer null,
  primary_weakness_id integer null,
  user_email text null,
  constraint research_data_pkey primary key (id)
) TABLESPACE pg_default;

create table public.marketing_leads (
  email text not null,
  first_name text null,
  signup_date date not null default CURRENT_DATE,
  archetype_segment integer null,
  submission_count integer null default 1,
  initial_archetype integer null,
  initial_score integer null,
  current_score integer null,
  quiz_completed_at timestamp with time zone null,
  has_purchased_report boolean null default false,
  unsubscribed_from_sequences boolean null default false,
  last_email_stage integer null default 0,
  score_physiological integer null default 0,
  score_psychological integer null default 0,
  score_social integer null default 0,
  score_cognitive integer null default 0,
  weakness_id integer null default 1,
  last_research_id uuid null,
  constraint marketing_leads_pkey primary key (email),
  constraint marketing_leads_last_research_id_fkey foreign KEY (last_research_id) references research_data (id)
) TABLESPACE pg_default;

create index IF not exists idx_email_automation on public.marketing_leads using btree (
  quiz_completed_at,
  has_purchased_report,
  unsubscribed_from_sequences
) TABLESPACE pg_default;

create index IF not exists idx_marketing_automation_stage on public.marketing_leads using btree (last_email_stage) TABLESPACE pg_default
where
  (
    (unsubscribed_from_sequences = false)
    and (has_purchased_report = false)
  );

-- SECURITY: Enable Row Level Security (RLS)
ALTER TABLE research_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_leads ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraint to link research data to marketing leads
ALTER TABLE public.research_data
ADD CONSTRAINT research_data_user_email_fkey
FOREIGN KEY (user_email) REFERENCES public.marketing_leads(email);

-- POLICIES: Allow public (anonymous) inserts
-- We do not allow SELECT/UPDATE/DELETE for public to protect privacy

CREATE POLICY "Enable insert for anyone" ON research_data
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insert for anyone" ON marketing_leads
    FOR INSERT WITH CHECK (true);

-- RPC: Securely handle lead submission (Insert or Update)
-- This function runs with "SECURITY DEFINER" to bypass RLS for the update logic
CREATE OR REPLACE FUNCTION submit_lead(
    p_email TEXT,
    p_segment INTEGER,
    p_first_name TEXT DEFAULT NULL,
    p_research_id UUID DEFAULT NULL,
    p_score INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
    v_count INTEGER;
    v_initial_score INTEGER;
    v_physio INTEGER;
    v_psych INTEGER;
    v_social INTEGER;
    v_cognitive INTEGER;
BEGIN
    INSERT INTO marketing_leads (
        email,
        archetype_segment,
        current_score,
        initial_archetype,
        initial_score,
        first_name,
        submission_count,
        last_research_id,
        quiz_completed_at,
        last_email_stage
    )
    VALUES (p_email, p_segment, p_score, p_segment, p_score, p_first_name, 1, p_research_id, now(), 0)
    ON CONFLICT (email) DO UPDATE
    SET
        archetype_segment = EXCLUDED.archetype_segment,
        current_score = EXCLUDED.current_score,
        submission_count = marketing_leads.submission_count + 1,
                first_name = COALESCE(EXCLUDED.first_name, marketing_leads.first_name),
                last_research_id = EXCLUDED.last_research_id,
                -- Retaking the quiz restarts the 30/90-day check-in clock from this
                -- new baseline, matching the "we'll remind you in 1 and 3 months"
                -- promise in the Day-0 email — it's about tracking this attempt.
                quiz_completed_at = now(),
                last_email_stage = 0
            RETURNING submission_count, initial_score INTO v_count, v_initial_score;

            -- Back-fill the user's email into the research data record
            UPDATE public.research_data SET user_email = p_email WHERE id = p_research_id AND p_research_id IS NOT NULL;

            -- Fetch pillar scores so the caller can build the results email without a
            -- separate read (research_data intentionally has no SELECT policy for anon).
            SELECT score_physiological, score_psychological, score_social, score_cognitive
            INTO v_physio, v_psych, v_social, v_cognitive
            FROM public.research_data
            WHERE id = p_research_id;

            IF v_count > 1 THEN        RETURN jsonb_build_object(
            'status', 'updated',
            'message', 'Welcome back! Profile updated.',
            'score_diff', (p_score - v_initial_score),
            'score_physiological', v_physio,
            'score_psychological', v_psych,
            'score_social', v_social,
            'score_cognitive', v_cognitive
        );
    ELSE
        RETURN jsonb_build_object(
            'status', 'inserted',
            'message', 'Thank you for subscribing!',
            'score_physiological', v_physio,
            'score_psychological', v_psych,
            'score_social', v_social,
            'score_cognitive', v_cognitive
        );
    END IF;
END;
$func$;

-- RPC: Unsubscribe a lead from the email sequence.
-- SECURITY DEFINER + narrow scope (only this one flag) so the unsubscribe link in
-- emails can call it with the anon key without needing broader UPDATE access to
-- marketing_leads (which has no UPDATE policy for anon by design).
CREATE OR REPLACE FUNCTION unsubscribe_lead(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    UPDATE public.marketing_leads
    SET unsubscribed_from_sequences = true
    WHERE email = p_email;

    RETURN jsonb_build_object('status', 'unsubscribed');
END;
$func$;

-- RPC: Flip has_purchased_report after a verified Stripe payment.
-- SECURITY DEFINER + narrow scope (only this one flag), same rationale as
-- unsubscribe_lead — the webhook calls this with the anon key rather than the
-- service_role key, so a bug in signature verification can't expose broader
-- table access than "mark one email as purchased."
CREATE OR REPLACE FUNCTION mark_report_purchased(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
BEGIN
    -- Case-insensitive match: subscribe.js stores whatever case the lead typed
    -- at signup, but the Stripe checkout email arrives lowercased from the
    -- webhook, so an exact match would silently miss otherwise-valid leads.
    UPDATE public.marketing_leads
    SET has_purchased_report = true
    WHERE lower(email) = lower(trim(p_email));

    RETURN jsonb_build_object('status', 'purchased', 'found', FOUND);
END;
$func$;
