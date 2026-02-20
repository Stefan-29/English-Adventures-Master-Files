// checkers/futurePerfectChecker.js
export const futurePerfectChecker = {
    name: "Future Perfect & Future Perfect Continuous",
    minWords: 15,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        // BASIC LENGTH CHECK
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // GLOBAL RULES (apply to ALL activities)
        // 1. No future forms in time clauses
        if (/\b(when|by the time|before|after|as soon as|until|once)\s+\w*\s+(will|going to|'ll)\b/i.test(clean)) {
            return { status: 'grammar', title: 'Future in Time Clause!', message: 'Never use <strong>will / going to / ’ll</strong> in time clauses! Use Present Simple or Present Perfect instead.', icon: 'Prohibited' };
        }

        // 2. Stative verbs in continuous → forbidden
        if (/\b(will have been|going to have been) (having|knowing|wanting|liking|loving|hating|owning|belonging|containing|needing)\b/i.test(clean)) {
            return { status: 'grammar', title: 'Stative Verb Error', message: 'Stative verbs (have, know, want, own, like, etc.) → use <strong>Future Perfect</strong>, NOT Continuous!', icon: 'Prohibited' };
        }

        // ACTIVITY-SPECIFIC CHECKS
        switch (activity.id) {

            case 'writing-1': // Life goals – Future Perfect + by the time/by + date
            case 'writing-4': // Career & personal achievements in 2040
            case 'writing-8': // Family/friends achievements
                const fpCount1 = (original.match(/\b(will have|going to have|'ll have) \w+ed\b/gi) || []).length;
                const byMarker1 = (clean.match(/\bby (the time|next|20\d\d|this time next|\w+day|then)/gi) || []).length;
                if (fpCount1 < 2) return { status: 'missing', title: 'Use Future Perfect', message: 'Use <strong>will have + past participle</strong> to describe completed actions.' };
                if (byMarker1 < 1) return { status: 'almost', title: 'Good work!', message: 'Add <strong>by + date/time</strong> to clarify when completion happens.' };
                break;

            case 'writing-2': // Very busy week – Future Perfect Continuous
            case 'writing-5': // Long intense project
                const fpcCount2 = (original.match(/\b(will have been|going to have been) \w+ing\b/gi) || []).length;
                const durationWord = (clean.match(/\b(for|since)\b/gi) || []).length;
                if (fpcCount2 < 2) return { status: 'missing', title: 'Use Future Perfect Continuous', message: 'Describe duration: <strong>will have been + -ing</strong>' };
                if (durationWord === 0) return { status: 'almost', title: 'Nice!', message: 'Add <strong>for</strong> or <strong>since</strong> to show duration.' };
                break;

            case 'writing-3': // Prediction + cause-effect (both tenses)
            case 'writing-6': // Someone tired/experienced/fluent + because
            case 'writing-9': // World-changing invention/event
                const fpMixed = (original.match(/\b(will have|going to have|'ll have) \w+ed\b/gi) || []).length;
                const fpcMixed = (original.match(/\b(will have been|going to have been) \w+ing\b/gi) || []).length;
                const becauseCount = (clean.match(/\bbecause\b/gi) || []).length;
                if (fpMixed + fpcMixed < 2) return { status: 'missing', title: 'Mix both tenses', message: 'Use <strong>Future Perfect</strong> and/or <strong>Future Perfect Continuous</strong>.' };
                if (becauseCount < 1) return { status: 'almost', title: 'Good explanation!', message: 'Try adding <strong>because</strong> to explain the outcome.' };
                break;

            case 'writing-7': // Letter to future self
                const fpLetter = (original.match(/\b(will have|going to have|'ll have) \w+ed\b/gi) || []).length;
                const fpcLetter = (original.match(/\b(will have been|going to have been) \w+ing\b/gi) || []).length;
                const futureSelf = /\b(dear future|future me|in 10 years|by 203\d)\b/i.test(clean);
                if (!futureSelf) return { status: 'missing', title: 'Format: Letter to Future Self', message: 'Start with <strong>Dear Future Me</strong> or mention a year like 2035.' };
                if (fpLetter + fpcLetter < 2) return { status: 'missing', title: 'Use future perfect tenses', message: 'Use <strong>Future Perfect</strong> and/or <strong>Future Perfect Continuous</strong>.' };
                break;

            case 'writing-10': // Free writing: “by this time next decade”
                const decadeMarker = /\b(by this time next|in \d+ years|by 203\d)\b/i.test(clean);
                const bothTenses = (original.match(/\b(will have been|going to have been) \w+ing\b/gi) || []).length > 0 ||
                                  (original.match(/\b(will have|going to have|'ll have) \w+ed\b/gi) || []).length > 0;
                if (!decadeMarker) return { status: 'missing', title: 'Time frame needed', message: 'Mention <strong>by 2035/2040</strong> or <strong>in 10 years</strong>.' };
                if (!bothTenses) return { status: 'missing', title: 'Use future perfect', message: 'Use <strong>Future Perfect</strong> or <strong>Future Perfect Continuous</strong>.' };
                break;
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect use of Future Perfect & Future Perfect Continuous!' };
    }
};