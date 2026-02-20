// checkers/mustHaveToHaveGotToChecker.js
export const mustHaveToHaveGotToChecker = {
    name: "Must - Have To - Have Got To",
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
        if (/\bmust in the past\b/i.test(clean)) {
            return { status: 'grammar', title: 'Tense Error', message: "'Must' has no past form! Use <strong>had to</strong> instead.", icon: 'Prohibited' };
        }

        // ACTIVITY-SPECIFIC CHECKS
        switch (activity.id) {

            case 'writing-1': // Daily obligations - must vs have to
                const mustCount1 = (original.match(/\bmust\b/gi) || []).length;
                const haveToCount1 = (original.match(/\b(have to|has to)\b/gi) || []).length;
                if (mustCount1 < 3 || haveToCount1 < 3) {
                    return { status: 'missing', title: 'Use Both Forms', message: 'Use <strong>must</strong> (personal obligation) and <strong>have to</strong> (external obligation) at least 3 times each.' };
                }
                break;

            case 'writing-2': // Rules and laws with 'must'
                const ruleCount = (original.match(/\b(must|must not|mustn't)\b/gi) || []).length;
                const ruleWords = (clean.match(/\b(rule|law|forbidden|compulsory|required)\b/gi) || []).length;
                if (ruleCount < 5) return { status: 'missing', title: 'Use Must for Rules', message: 'Use <strong>must</strong> and <strong>mustn\'t</strong> at least 5 times to express rules and laws.' };
                break;

            case 'writing-3': // Mustn't vs Don't have to distinction
                const mustntCount = (original.match(/\b(mustn't|must not)\b/gi) || []).length;
                const dontHaveToCount = (original.match(/\b(don't|does not|doesn't)\s*(have to)\b/gi) || []).length;
                if (mustntCount < 2 || dontHaveToCount < 2) {
                    return { status: 'missing', title: 'Show Both Forms', message: 'Distinguish between <strong>mustn\'t</strong> (forbidden) and <strong>don\'t have to</strong> (not necessary) with at least 2 examples each.' };
                }
                break;

            case 'writing-4': // Have got to for present obligations
                const haveGotTo = (original.match(/\bhave got to|has got to\b/gi) || []).length;
                if (haveGotTo < 4) {
                    return { status: 'missing', title: 'Use Have Got To', message: 'Use <strong>have got to</strong> or <strong>has got to</strong> at least 4 times for present obligations.' };
                }
                break;

            case 'writing-5': // Logical deduction with 'must'
                const mustBeCount = (original.match(/\bmust\s+\w*\s*(be|have had|have been)\b/gi) || []).length;
                if (mustBeCount < 3) {
                    return { status: 'missing', title: 'Use Must for Deduction', message: 'Use <strong>must be</strong>, <strong>must have been</strong>, or similar structures for logical deduction at least 3 times.' };
                }
                break;

            case 'writing-6': // Past obligations with 'had to'
                const hadToCount = (original.match(/\bhad to\b/gi) || []).length;
                const mustHaveBeenCount = (original.match(/\bmust have been\b/gi) || []).length;
                if (hadToCount < 4) return { status: 'missing', title: 'Use Had To', message: 'Use <strong>had to</strong> at least 4 times for past obligations.' };
                break;

            case 'writing-7': // Future obligations with 'will have to'
                const willHaveToCount = (original.match(/\bwill have to\b/gi) || []).length;
                const futureWords = (clean.match(/\b(tomorrow|next|will|future|2024|2025|2026)\b/gi) || []).length;
                if (willHaveToCount < 4) {
                    return { status: 'missing', title: 'Use Will Have To', message: 'Use <strong>will have to</strong> at least 4 times for future obligations.' };
                }
                if (futureWords === 0) {
                    return { status: 'almost', title: 'Good start!', message: 'Add future time references like <strong>tomorrow</strong>, <strong>next week</strong>, or specific dates.' };
                }
                break;

            case 'writing-8': // Compare all three forms
                const allModals = (original.match(/\b(must|have to|has to|have got to)\b/gi) || []).length;
                if (allModals < 8) {
                    return { status: 'missing', title: 'Use All Three Forms', message: 'Mix <strong>must</strong>, <strong>have to</strong>, and <strong>have got to</strong> naturally throughout your sentences.' };
                }
                break;

            case 'writing-9': // School/workplace rules with must and mustn't
                const rulesMust = (original.match(/\b(must|mustn't)\b/gi) || []).length;
                if (rulesMust < 5) {
                    return { status: 'missing', title: 'Use Must & Mustn\'t', message: 'Use <strong>must</strong> and <strong>mustn\'t</strong> at least 5 times to describe rules and prohibitions.' };
                }
                break;

            case 'writing-10': // Free writing with all modals
                const freeWriteModals = (original.match(/\b(must|have to|have got to|don't have to|mustn't)\b/gi) || []).length;
                if (freeWriteModals < 8) {
                    return { status: 'missing', title: 'Use Multiple Modal Forms', message: 'Use a variety of <strong>must</strong>, <strong>have to</strong>, <strong>have got to</strong>, <strong>don\'t have to</strong>, and <strong>mustn\'t</strong> forms in your story.' };
                }
                break;

            default:
                // No specific check for this activity
                break;
        }

        // If we reach here, the text passed all checks
        return { status: 'good', title: 'Great!', message: 'Your writing looks good. Keep practicing!', icon: 'Check' };
    }
};

// Export as default for modular usage
export default mustHaveToHaveGotToChecker;
