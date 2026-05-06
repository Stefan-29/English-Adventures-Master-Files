export const alsoTooAsWellChecker = {
    name: "Also, Too & As well",
    minWords: 20,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return {
                status: 'too-short',
                title: 'Too Short',
                message: 'Write full sentences. Aim for at least 20 words.',
                icon: 'Pencil'
            };
        }

        if (activity.id === 'writing-1') {
            const hasAlso = /\balso\b/i.test(clean);
            const hasAlsoBeforeVerb = /\balso\s+\w+(s|ed|ing|)\b/i.test(original);
            const hasAlsoAfterBe = /\b(is|are|was|were|am)\s+also\b/i.test(original);
            const hasAlsoBetweenAux = /\b(have|has|had|can|could|will|would|should|may|might)\s+also\s+\w+\b/i.test(original);

            if (!hasAlso) {
                return {
                    status: 'missing',
                    title: 'Missing Also',
                    message: 'Use <strong>also</strong> to add information. It goes before the main verb, after &quot;be,&quot; or between an auxiliary and the main verb.'
                };
            }

            if (!hasAlsoBeforeVerb && !hasAlsoAfterBe && !hasAlsoBetweenAux) {
                return {
                    status: 'missing',
                    title: 'Incorrect Also Position',
                    message: 'Place <strong>also</strong> correctly: before the main verb (I also sing), after be (I am also happy), or between auxiliary and verb (I have also seen).'
                };
            }
        }

        if (activity.id === 'writing-2') {
            const hasToo = /\btoo\b/i.test(clean);
            const hasAsWell = /\bas well\b/i.test(clean);
            const hasEither = /\beither\b/i.test(clean);
            const hasNegative = /\b(don't|doesn't|didn't|can't|won't|not|never|no|neither|nor)\b/i.test(clean);

            if (!hasToo && !hasAsWell) {
                return {
                    status: 'missing',
                    title: 'Missing Too or As well',
                    message: 'Use <strong>too</strong> or <strong>as well</strong> at the end of a positive clause. Example: <em>I like it too.</em> or <em>I like it as well.</em>'
                };
            }

            if (!hasEither) {
                return {
                    status: 'missing',
                    title: 'Missing Either',
                    message: 'Use <strong>either</strong> at the end of a negative clause. Example: <em>I don\'t like it either.</em>'
                };
            }

            if (hasEither && !hasNegative) {
                return {
                    status: 'missing',
                    title: 'Either Needs Negative',
                    message: '<strong>Either</strong> is used in negative sentences. Make sure you have a negative word (don\'t, doesn\'t, not, never).'
                };
            }
        }

        if (activity.id === 'writing-3') {
            const hasAlso = /\balso\b/i.test(clean);
            const hasTooOrAsWell = /\btoo\b/i.test(clean) || /\bas well\b/i.test(clean);
            const hasEither = /\beither\b/i.test(clean);

            if (!hasAlso) {
                return {
                    status: 'missing',
                    title: 'Missing Also',
                    message: 'Include <strong>also</strong> in one of your sentences.'
                };
            }

            if (!hasTooOrAsWell) {
                return {
                    status: 'missing',
                    title: 'Missing Too or As well',
                    message: 'Include <strong>too</strong> or <strong>as well</strong> in one of your sentences.'
                };
            }

            if (!hasEither) {
                return {
                    status: 'missing',
                    title: 'Missing Either',
                    message: 'Include <strong>either</strong> in a negative sentence.'
                };
            }
        }

        if (activity.id === 'writing-4') {
            const hasAlsoBeginning = /^\s*Also,\s*/i.test(original) || /\.\s+Also,\s+/i.test(original);

            if (!hasAlsoBeginning) {
                return {
                    status: 'missing',
                    title: 'Missing Also at Beginning',
                    message: 'Start a sentence with <strong>Also,</strong> to add information (like &quot;moreover&quot;). Example: <em>Also, walking shoes are advised.</em>'
                };
            }
        }

        if (activity.id === 'writing-5') {
            const hasFormal = /\bI\s+too\s+think\b/i.test(original) || /\b\w+,\s*too,\s*\w+\b/i.test(original);
            const hasInformal = /\btoo\b/i.test(clean) || /\bas well\b/i.test(clean);

            if (!hasFormal && !hasInformal) {
                return {
                    status: 'missing',
                    title: 'Missing Formal or Informal Usage',
                    message: 'Show you can use these words in different registers. Use <strong>too</strong> informally at the end, or <strong>I too</strong> formally.'
                };
            }
        }

        if (activity.id === 'writing-6') {
            const hasEither = /\beither\b/i.test(clean);
            const hasNegative = /\b(don't|doesn't|didn't|can't|won't|not|never|no|neither|nor)\b/i.test(clean);

            if (!hasEither) {
                return {
                    status: 'missing',
                    title: 'Missing Either',
                    message: 'Use <strong>either</strong> to agree with a negative statement.'
                };
            }

            if (!hasNegative) {
                return {
                    status: 'missing',
                    title: 'Either Needs Negative Context',
                    message: 'Use <strong>either</strong> with a negative verb or negative context.'
                };
            }
        }

        const commonMistake = this.checkCommonMistake(original);
        if (commonMistake) {
            return {
                status: 'grammar',
                title: 'Usage Error',
                message: `Remember: <strong>${commonMistake}</strong>.`,
                icon: 'Prohibited'
            };
        }

        const wordOrderError = this.checkWordOrder(original);
        if (wordOrderError) {
            return {
                status: 'grammar',
                title: 'Word Order Problem',
                message: `The word order should be: <strong>${wordOrderError}</strong>.`,
                icon: 'Prohibited'
            };
        }

        return {
            status: 'correct',
            title: 'Outstanding!',
            message: 'Perfect use of also, too, and as well! 🎉'
        };
    },

    checkCommonMistake: function (text) {
        const mistakes = [
            { pattern: /\btoo\s*,\s*I\b/i, error: 'do not start a sentence with &quot;Too,&quot;' },
            { pattern: /\bas well\s*,\s*\w+\b/i, error: 'do not start a sentence with &quot;As well,&quot;' },
            { pattern: /\balso\s*[.!?]\s*$/i, error: 'do not put &quot;also&quot; at the very end of a sentence when it means &quot;in addition&quot;' },
            { pattern: /\b(either)\s+(is|are|was|were|am|do|does|did|have|has|had|can|could|will|would)\b/i, error: '&quot;either&quot; usually goes at the end of a clause, not before the verb' }
        ];

        for (const { pattern, error } of mistakes) {
            if (pattern.test(text)) {
                return error;
            }
        }

        return null;
    },

    checkWordOrder: function (text) {
        if (/\b\w+(s|ed|ing)\s+also\b/i.test(text)) {
            return 'also usually goes before the verb, not after';
        }
        if (/\btoo\s+\w+(s|ed|ing)\b/i.test(text) && !/\bI\s+too\b/i.test(text)) {
            return 'too usually goes at the end of the clause';
        }
        return null;
    },

    hasRequiredElements: function (text) {
        return true;
    },

    countStructures: function (text, pattern) {
        const matches = text.match(pattern);
        return matches ? matches.length : 0;
    },

    hasProperUsage: function (text) {
        return true;
    }
};