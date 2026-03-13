// modules/grammarCheckers/conditionalStructures.js
export const conditionalStructuresChecker = {
    name: "Conditional Structures",
    minWords: 20,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full conditional sentences. Aim for at least 25 words.', icon: 'Pencil' };
        }

        // Helper patterns for different conditionals
        const zeroConditional = /\bif\s+(you|we|they|people|scientists?|doctors?|it|he|she)\s+(\w+)\b.*?\b(it|you|we|they|people|scientists?|doctors?|he|she)\s+(\w+)\b/i;
        const firstConditional = /\bif\s+(I|you|we|they|he|she|it)\s+(\w+)\b.*?\b(will|won't|'ll)\s+(\w+)\b/i;
        const secondConditional = /\bif\s+(I|you|we|they|he|she|it)\s+(were|\w+ed)\b.*?\b(would|could|might|'d)\s+(\w+)\b/i;
        const thirdConditional = /\bif\s+(I|you|we|they|he|she|it)\s+had\s+(\w+)\b.*?\b(would|could|might)\s+have\s+(\w+)\b/i;

        // Check for common mistakes
        const wrongWere = /\bif\s+I\s+was\b/i; // Should be "were"
        const missingHave = /\bwould\s+(not\s+)?\w+\s+(not\s+)?\w+\b(?!have)/i; // Third conditional missing "have"

        if (wrongWere.test(original)) {
            return { status: 'grammar', title: 'Subjunctive Error', message: 'Use <strong>were</strong> instead of <strong>was</strong> after "if" in hypothetical situations.', icon: 'Prohibited' };
        }

        // Activity-specific checks
        if (activity.id === 'writing-1') { // Zero conditional
            if (!zeroConditional.test(original)) {
                return { status: 'missing', title: 'Need Zero Conditional', message: 'Use <strong>Zero Conditional</strong> for facts: If + Present Simple, Present Simple.' };
            }
        }

        if (activity.id === 'writing-2') { // First conditional
            if (!firstConditional.test(original)) {
                return { status: 'missing', title: 'Need First Conditional', message: 'Use <strong>First Conditional</strong> for future possibilities: If + Present Simple, will + verb.' };
            }
        }

        if (activity.id === 'writing-3') { // Second conditional
            if (!secondConditional.test(original)) {
                return { status: 'missing', title: 'Need Second Conditional', message: 'Use <strong>Second Conditional</strong> for hypotheticals: If + Past Simple, would + verb.' };
            }
        }

        if (activity.id === 'writing-4') { // Third conditional
            if (!thirdConditional.test(original)) {
                return { status: 'missing', title: 'Need Third Conditional', message: 'Use <strong>Third Conditional</strong> for past regrets: If + Past Perfect, would have + verb.' };
            }
        }

        if (activity.id === 'writing-5') { // Mixed conditionals
            const hasMixed = (thirdConditional.test(original) && (firstConditional.test(original) || secondConditional.test(original))) ||
                           (secondConditional.test(original) && thirdConditional.test(original));
            if (!hasMixed) {
                return { status: 'missing', title: 'Need Mixed Conditional', message: 'Use <strong>Mixed Conditional</strong>: combine past and present/future tenses.' };
            }
        }

        // Check for proper conditional structure
        const hasIf = /\bif\b/i.test(original);
        const hasConditionalVerb = /\b(would|could|might|will|shall)\b/i.test(original) ||
                                 /\bwere\b/i.test(original) ||
                                 /\bhad\s+\w+\b/i.test(original);

        if (!hasIf && !hasConditionalVerb) {
            return { status: 'missing', title: 'Missing Conditional', message: 'Include conditional structures with <strong>if</strong> and proper verb forms.' };
        }

        return { status: 'correct', title: 'Excellent Conditionals!', message: 'Perfect use of conditional structures! 🎉' };
    },

    checkCommonMistake: function (text) {
        const mistakes = [];

        // Check for "if I was" instead of "if I were"
        if (/\bif\s+I\s+was\b/i.test(text)) {
            mistakes.push({
                type: 'subjunctive',
                message: 'Use "were" instead of "was" after "if" in hypothetical situations',
                correction: text.replace(/\b(if\s+I\s+)was\b/gi, '$1were')
            });
        }

        // Check for missing "have" in third conditional
        if (/\bwould\s+(not\s+)?\w+\s+(not\s+)?\w+\b(?!have)/i.test(text) && /\bhad\s+\w+\b/i.test(text)) {
            mistakes.push({
                type: 'third-conditional',
                message: 'Third conditional needs "would have + past participle"',
                correction: 'Add "have" after "would" in third conditional structures'
            });
        }

        // Check for wrong tense combinations
        if (/\bif\s+(I|you|we|they|he|she|it)\s+(am|is|are|\w+s)\b.*?\bwould\b/i.test(text)) {
            mistakes.push({
                type: 'tense-mismatch',
                message: 'After "if" in unreal conditionals, use past simple, not present',
                correction: 'Change present tense to past simple after "if" in second/third conditionals'
            });
        }

        return mistakes;
    },

    getSuggestions: function (text, activity) {
        const suggestions = [];

        if (activity.id === 'writing-1') {
            suggestions.push(
                "Try: If you heat water, it boils.",
                "Try: When you mix colors, you get new shades.",
                "Try: Unless you add sugar, tea tastes bitter."
            );
        }

        if (activity.id === 'writing-2') {
            suggestions.push(
                "Try: If it rains tomorrow, I'll stay home.",
                "Try: Unless you hurry, you'll miss the bus.",
                "Try: As long as you study, you'll pass the exam."
            );
        }

        if (activity.id === 'writing-3') {
            suggestions.push(
                "Try: If I won the lottery, I would travel the world.",
                "Try: If I were you, I would accept the offer.",
                "Try: If she had more time, she could help us."
            );
        }

        if (activity.id === 'writing-4') {
            suggestions.push(
                "Try: If I had studied harder, I would have passed.",
                "Try: If they had left earlier, they wouldn't have been late.",
                "Try: If she had called me, I would have helped her."
            );
        }

        if (activity.id === 'writing-5') {
            suggestions.push(
                "Try: If I had taken that job, I would be rich now.",
                "Try: If she were more careful, she wouldn't have crashed.",
                "Try: If we had known, we would have come to the party."
            );
        }

        return suggestions;
    }
};