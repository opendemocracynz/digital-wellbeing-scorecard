# PROJECT CONTEXT: Digital Wellbeing Scorecard
**Mission:** Rapid deployment of a standalone tool to assess a user's relationship with technology.
**Parent Organization:** Open Democracy NZ.
**Goal:** Generate revenue (via paid reports) and leads (via email list) to fund broader democratic initiatives.

## 1. Technical Constraints (Strict)
* **Time Budget:** 5 hours/week. Solutions must be low-maintenance.
* **Stack:** Vanilla JS, Tailwind CSS, Netlify Functions, Supabase.
* **Architecture:** "Low-Code Hybrid." No complex frameworks. Logic over boilerplate.

## 2. The 5 Archetypes (The "Product")
The scoring logic places users into one of these 5 buckets. Copy/Tone should reflect these:
1.  **Zombie Clickslave (15-29):** High compulsion, zero agency. Needs emergency intervention.
2.  **Unconscious Doomscroller (30-44):** High regret, low friction. Needs "circuit breakers."
3.  **Digital Drifter (45-55):** Reactive, functional but distracted. Needs proactive systems.
4.  **Intentional Architect (56-68):** Systematized, proactive. Needs optimization.
5.  **Digital Sovereign (69-75):** Independent, privacy-focused. The master level.

## 3. Data Privacy Strategy
* **Research Data:** Stored anonymously (Score + Timestamp + Answer String).
* **Marketing Data:** Stored separately (Email + Name + Archetype Level).
* **Linkage:** We do not link specific answers to specific identities to protect user privacy.

## 4. Current Phase: MVP (V1.0)
* Focus: Smooth questionnaire flow, instant scoring, payment gateway placeholder.
* Out of Scope: User accounts, login, historical tracking.