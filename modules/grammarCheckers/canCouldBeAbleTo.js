// checkers/canCouldBeAbleToChecker.js
export const canCouldBeAbleToChecker = {
    name: "Can - Could - Be Able To",
    minWords: 15,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        // BASIC LENGTH CHECK
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // GLOBAL RULES (apply to ALL activities)
        // Check for common mistakes
        if (/\bcould have been able\b/i.test(clean)) {
            return { status: 'grammar', title: 'Double Modal Error', message: 'Avoid stacking modals like "could have been able". Use either "could have" or "was able to".', icon: 'Prohibited' };
        }

        // ACTIVITY-SPECIFIC CHECKS
        switch (activity.id) {

            case 'writing-1': // Present abilities with 'can' and 'can't'
                const canCount1 = (original.match(/\b(can|can't|cannot)\b/gi) || []).length;
                if (canCount1 < 4) return { status: 'missing', title: 'Use Can/Can\'t', message: 'Use <strong>can</strong> and <strong>can\'t</strong> to describe your present abilities. Include at least 4 examples.' };
                break;

            case 'writing-2': // Past general ability with 'could'
                const couldCount2 = (original.match(/\b(could|couldn't)\b/gi) || []).length;
                if (couldCount2 < 4) return { status: 'missing', title: 'Use Could', message: 'Use <strong>could</strong> and <strong>couldn\'t</strong> to describe past abilities. Include "when I was" or similar time markers.' };
                if (!/when I was|as a child|when I was young|in my youth/i.test(clean)) {
                    return { status: 'almost', title: 'Good start!', message: 'Add time markers like <strong>when I was</strong> or <strong>as a child</strong> to clarify the past setting.' };
                }
                break;

            case 'writing-3': // One-time past achievement with 'was able to'
                const ableTo3 = (original.match(/\b(was able to|were able to|wasn't able to|weren't able to)\b/gi) || []).length;
                if (ableTo3 < 4) return { status: 'missing', title: 'Use Was/Were Able To', message: 'Use <strong>was able to</strong> or <strong>were able to</strong> to describe one-time past achievements.' };
                if (ableTo3 > 0 && !/yesterday|last|one time|finally|managing|succeeded|accomplished/i.test(clean)) {
                    return { status: 'almost', title: 'Almost there!', message: 'Add details about how you felt or what you achieved.' };
                }
                break;

            case 'writing-4': // Permission & polite requests
                const canICount = (original.match(/\bcan (i|I)\b/gi) || []).length;
                const couldICount = (original.match(/\bcould (i|I)\b/gi) || []).length;
                const canYouCount = (original.match(/\bcan you\b/gi) || []).length;
                const couldYouCount = (original.match(/\bcould you\b/gi) || []).length;

                const totalRequests = canICount + couldICount + canYouCount + couldYouCount;
                if (totalRequests < 6) {
                    return { status: 'missing', title: 'Use Permission Forms', message: 'Use <strong>Can I...?</strong>, <strong>Could I...?</strong>, <strong>Can you...?</strong>, and <strong>Could you...?</strong> for requests and permission.' };
                }
                break;

            case 'writing-5': // Future ability
                const willBeAbleTo = (original.match(/\b(will be able to|won't be able to)\b/gi) || []).length;
                const futureTime = (clean.match(/\b(in \d+ year|future|next|will|tomorrow|2025|2026|2027|2028|2029|2030)/gi) || []).length;
                if (willBeAbleTo < 4) return { status: 'missing', title: 'Use Will Be Able To', message: 'Use <strong>will be able to</strong> and <strong>won\'t be able to</strong> for future abilities.' };
                if (futureTime === 0) return { status: 'almost', title: 'Good start!', message: 'Add time references like <strong>in 5 years</strong> or <strong>in the future</strong>.' };
                break;

            case 'writing-6': // Possibilities & impossibilities
                const canForPossibility = (original.match(/\b(can|could|can't)\b/gi) || []).length;
                if (canForPossibility < 6) return { status: 'missing', title: 'Use Can/Could/Can\'t', message: 'Use <strong>can</strong>, <strong>could</strong>, and <strong>can\'t</strong> to express possibility and impossibility.' };
                break;

            case 'writing-7': // Compare present vs. past abilities
                const presentAb = (original.match(/\bcan\b/gi) || []).length;
                const pastAb = (original.match(/\bcould\b/gi) || []).length;
                if (presentAb < 4 || pastAb < 4) {
                    return { status: 'missing', title: 'Compare Ability Forms', message: 'Use <strong>can</strong> for present abilities (at least 4 times) and <strong>could</strong> for past abilities (at least 4 times) to show comparison.' };
                }
                if (!/now|then|past|present|used to|before|ago/i.test(clean)) {
                    return { status: 'almost', title: 'Nice work!', message: 'Try adding time contrasts like <strong>now vs. then</strong> or <strong>before vs. now</strong>.' };
                }
                break;

            case 'writing-8': // Overcoming challenge - wasn't able to → was able to
                const wasntAble = (original.match(/\b(wasn't able to|weren't able to)\b/gi) || []).length;
                const wasAble = (original.match(/\b(was able to|were able to)\b/gi) || []).length;
                if (wasntAble < 2 || wasAble < 2) {
                    return { status: 'missing', title: 'Show Progress', message: 'Use both <strong>wasn\'t able to</strong> (initial failure) and <strong>was able to</strong> (eventual success) to show overcoming challenges.' };
                }
                if (!/finally|eventually|after|studying|practice|hard|improved/i.test(clean)) {
                    return { status: 'almost', title: 'Great start!', message: 'Add transition words like <strong>finally</strong>, <strong>eventually</strong>, or <strong>after practice</strong> to show progress.' };
                }
                break;

            case 'writing-9': // Couldn't vs. Might not distinction
                const couldntForm = (original.match(/\bcouldn't\b/gi) || []).length;
                const mightNotForm = (original.match(/\bmight not\b/gi) || []).length;
                if (couldntForm < 2 || mightNotForm < 2) {
                    return { status: 'missing', title: 'Distinguish Forms', message: 'Use <strong>couldn\'t</strong> (impossible) at least 2 times and <strong>might not</strong> (uncertain) at least 2 times to show the difference.' };
                }
                break;

            case 'writing-10': // Free writing: mix all forms
                const allFormsCount = (original.match(/\b(can|could|am able to|is able to|are able to|was able to|were able to|will be able to|won't be able to)\b/gi) || []).length;
                if (allFormsCount < 8) {
                    return { status: 'missing', title: 'Mix Modal Forms', message: 'Use a mix of <strong>can</strong>, <strong>could</strong>, and <strong>be able to</strong> forms throughout your story.' };
                }
                break;

            default:
                // No specific check for this activity
                break;
        }

        // If we reach here, the text passed all checks
        return { status: 'good', title: 'Great!', message: 'Your sentence looks good. Keep practicing! ', icon: 'Check' };
    }
};

// Export as default for modular usage
export default canCouldBeAbleToChecker;
