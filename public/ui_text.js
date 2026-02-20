const uiText = {
    "splash": {
        "title": "Digital Wellbeing<br><span class='text-blue-400'>Score</span>",
        "subtitle": "Initialize system scan. Analyze your relationship with technology.",
        "assessment_button": "Begin Assessment",
        "resume_button": "Resume Assessment",
        "clear_progress_button": "Clear Progress & Restart"
    },
    "quiz": {
        "question_placeholder": "Question goes here...",
        "category_placeholder": "Category",
        "previous_button": "Previous",
        "next_button": "Next",
        "skip_button": "Skip",
        "finish_button": "Finish",
        "calculating_button": "Calculating..."
    },
    "results": {
        "title": "Your Digital Archetype",
        "score_label": "Score",
        "subscribe_cta_main": "Sign-up for more information.",
        "subscribe_cta_details": "Learn more about what your score means, explain how to imprive your digital wellbeing<br/>, plus automatic retest reminder to track progress.",
        "email_placeholder": "Enter your email",
        "subscribe_button": "Subscribe",
        "claim_badge_button": "Claim Archetype Badge",
        "unsubscribe_info": "Unsubscribe at any time",
        "share_title": "Challenge a Friend",
        "copy_button": "Click to Copy",
        "copied_button": "Copied!",
        "share_via": "Share via email or social media",
        "unlock_report_button": "🔓 Unlock Full Report <span class='text-sm opacity-80 ml-1'>($5)</span>",
        "viewing_profile_label": "Viewing Profile",
        "share_message_template": "I just scored {{score}}/75 on the Digital Wellbeing Scorecard and my archetype is \\"{{archetype}}\\". Find out yours!",
        "unanswered_warning": "You have skipped {{count}} questions.

Unanswered questions will be scored as zero (Zombie Mode). Do you want to proceed?

Click OK to submit, or Cancel to go back to the missed questions.",
        "subscription": {
            "welcome_back_improved": "Welcome back! You improved by {{score_diff}} points! 🚀",
            "welcome_back_declined": "Welcome back. Your score dropped by {{score_diff}} points.",
            "welcome_back_unchanged": "Welcome back. Your score is unchanged.",
            "error": "Something went wrong. Please try again."
        }
    },
    "archetypes": {
        "1": {
            "name": "Zombie Clickslave",
            "range": [15, 29],
            "desc": "Driven by compulsion. Technology dictates your schedule, mood, and attention span. Immediate intervention recommended.",
            "color": "text-red-500",
            "bg": "bg-red-500",
            "img": "/images/level-1.png",
            "cta": "Reclaim your agency. Immediate intervention recommended to break the cycle."
        },
        "2": {
            "name": "Unconscious Doomscroller",
            "range": [30, 44],
            "desc": "High regret, low friction. You lose hours to screens without meaning to, but you are aware of the pain.",
            "color": "text-orange-500",
            "bg": "bg-orange-500",
            "img": "/images/level-2.png",
            "cta": "Stop the scroll. Learn to build "circuit breakers" into your day."
        },
        "3": {
            "name": "Digital Drifter",
            "range": [45, 55],
            "desc": "Reactive and distracted. You function okay, but your attention is constantly fragmented by pings and buzzes.",
            "color": "text-yellow-400",
            "bg": "bg-yellow-400",
            "img": "/images/level-3.png",
            "cta": "Focus your attention. Move from reactive habits to proactive systems."
        },
        "4": {
            "name": "Intentional Architect",
            "range": [56, 68],
            "desc": "Systematized and proactive. You use tools to block distractions, though you still fight the occasional battle.",
            "color": "text-blue-400",
            "bg": "bg-blue-400",
            "img": "/images/level-4.png",
            "cta": "Optimize your flow. Fine-tune your environment for deep work."
        },
        "5": {
            "name": "Digital Sovereign",
            "range": [69, 75],
            "desc": "The master level. Technology is a precision instrument that serves you. You are fully present offline.",
            "color": "text-purple-400",
            "bg": "bg-purple-400",
            "img": "/images/level-5.png",
            "cta": "Maintain your sovereignty. Lead others by example."
        }
    }
};

export default uiText;
