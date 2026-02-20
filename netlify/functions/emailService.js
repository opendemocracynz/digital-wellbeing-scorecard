const weaknessMapping = {
    1: "Physiological/Digital Fatigue",
    2: "Psychological/Mental Overload",
    3: "Social/Connection Gap",
    4: "Cognitive/Information Haze",
};

/**
 * Finds the pillar with the lowest score and returns its corresponding weakness ID.
 * The ID is determined by the order in which the scores are provided.
 *
 * @param {object} pillarScores - An object containing the scores for each pillar.
 * @returns {number} The ID of the weakest pillar (1-4).
 */
function getWeaknessId(pillarScores) {
    const scores = [
        pillarScores.Physiological,
        pillarScores.Psychological,
        pillarScores.Social,
        pillarScores.Cognitive,
    ];
    const lowestScore = Math.min(...scores);
    const weaknessIndex = scores.indexOf(lowestScore);
    return weaknessIndex + 1; // Return 1-based index
}

/**
 * Prepares the email payload for the MailerSend API.
 *
 * @param {object} userData - An object containing user data, including pillar scores and email.
 * @returns {object} The JSON object for the MailerSend API.
 */
function prepareEmailPayload(userData) {
    const weaknessId = getWeaknessId(userData.pillarScores);
    const weaknessName = weaknessMapping[weaknessId];

    return {
        from: {
            email: "scorecard@digitalwellbeing.com",
            name: "Digital Wellbeing Scorecard",
        },
        to: [
            {
                email: userData.email,
            },
        ],
        subject: `Your Digital Wellbeing Results: ${userData.archetype.name}`,
        personalization: [
            {
                email: userData.email,
                data: {
                    archetype_name: userData.archetype.name,
                    archetype_level: userData.archetype.level,
                    total_score: userData.totalScore,
                    physio_score: userData.pillarScores.Physiological,
                    psych_score: userData.pillarScores.Psychological,
                    social_score: userData.pillarScores.Social,
                    cog_score: userData.pillarScores.Cognitive,
                    weakness_id: weaknessId,
                    weakness_name: weaknessName,
                },
            },
        ],
        template_id: "your_template_id", // Replace with your actual MailerSend template ID
    };
}

module.exports = { prepareEmailPayload };
