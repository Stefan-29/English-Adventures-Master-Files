// checkers/presentSimpleContinuous.js
export const presentSimpleContinuousChecker = {
    name: "Present Simple vs Present Continuous",
    minWords: 15,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // Helper regexes
        const simplePatterns = /\b(I|you|we|they|he|she|it|people|cats|dogs|water|the sun) (go|play|work|live|like|love|hate|want|need|know|believe|have|belong|seem|appears?)[\s\.,]/i;
        const continuousPatterns = /\b(I am|you are|he is|she is|it is|we are|they are|'m|'re|'s) ([\w]+ing)\b/i;
        const stativeWrong = /\b(am|is|are) (liking|loving|hating|wanting|needing|knowing|believing|understanding|having|belonging|seeming)\b/i;

        // Global stative verb mistake
        if (stativeWrong.test(clean)) {
            return { status: 'grammar', title: 'Stative Verb Error', message: 'Stative verbs (like, know, want, have…) are NOT used in continuous. Use Present Simple!', icon: 'Prohibited' };
        }

        // Writing activity specific checks
        if (activity.id === 'writing-1') { // Daily routine - Present Simple
            const hasFrequency = /(every|usually|always|often|sometimes|never|daily|on \w+days?)/i.test(clean);
            const hasSimple = /\b(I|you|we|they|he|she|it) (go|play|work|live|like|love|eat|sleep|study|watch|read|get|wake)\b/i.test(original);
            if (!hasSimple) return { status: 'missing', title: 'Need Present Simple', message: 'Use <strong>Present Simple</strong> for routines: I go, he plays, she works.' };
            if (!hasFrequency) return { status: 'almost', title: 'Good writing!', message: 'Add frequency words like <strong>every day, usually, always</strong>.' };
        }

        if (activity.id === 'writing-5') { // What’s happening now - Present Continuous
            const hasTimeMarker = /(now|at the moment|right now|today|currently)/i.test(clean);
            const ingCount = (text.match(/\b(am|is|are)\s+\w+ing\b/gi) || []).length;
            if (ingCount < 2) return { status: 'missing', title: 'Use Present Continuous', message: 'Describe activities happening now: <strong>am/is/are + -ing</strong>' };
            if (!hasTimeMarker) return { status: 'almost', title: 'Nice work!', message: 'Add time markers like <strong>now, right now, at the moment</strong>.' };
        }

        if (activity.id === 'writing-8' || activity.id === 'writing-9' || activity.id === 'writing-10') {
            const hasSimpleVerbs = /\b(I|you|he|she|it|we|they)\s+(go|work|live|like|play|eat|drink|watch|read|study)\b/i.test(original);
            const continuousCount = (original.match(/\b(am|is|are)\s+\w+ing\b/gi) || []).length;
            if (!hasSimpleVerbs && continuousCount === 0) {
                return { status: 'missing', title: 'Use both tenses', message: 'Mix <strong>Present Simple</strong> and <strong>Present Continuous</strong> in your writing.' };
            }
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect use of Present Simple & Continuous! 🎉' };
    },

    checkCommonMistake: function (text) {
        const mistakes = [
            { pattern: /\b(am|is|are) (liking|loving|hating|wanting|needing|knowing|believing)\b/i, error: 'Stative verbs don’t take continuous!' },
            { pattern: /\b(I|you|we|they|he|she|it) (am|is|are) (go|play|work|study|live|eat) now\b/i, error: 'Use Present Continuous for “now”!' }
        ];
        for (const { pattern, error } of mistakes) {
            if (pattern.test(text)) return error;
        }
        return null;
    }
};