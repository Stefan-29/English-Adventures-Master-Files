export const alreadyStillYetAlwaysChecker = {
    name: "Already, Still, Yet & Always",
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
            const hasAlready = /\balready\b/i.test(clean);
            const hasPresentPerfect = /\b(have|has)\s+\w+(ed|en|t|d|n)\b/i.test(original);

            if (!hasAlready) {
                return {
                    status: 'missing',
                    title: 'Missing Already',
                    message: 'Use <strong>already</strong> to show something happened earlier than expected. Example: <em>I have already finished my homework.</em>'
                };
            }

            if (!hasPresentPerfect) {
                return {
                    status: 'missing',
                    title: 'Missing Present Perfect',
                    message: 'Use <strong>have/has + past participle</strong> with already. Example: <em>I have already seen that movie.</em>'
                };
            }
        }

        if (activity.id === 'writing-2') {
            const hasStill = /\bstill\b/i.test(clean);
            const hasPresentContinuous = /\b(am|is|are)\s+\w+ing\b/i.test(original);
            const hasPresentSimple = /\bstill\s+\w+(s|es|)\b/i.test(original);

            if (!hasStill) {
                return {
                    status: 'missing',
                    title: 'Missing Still',
                    message: 'Use <strong>still</strong> to show a situation continues. Example: <em>I am still living here.</em>'
                };
            }

            if (!hasPresentContinuous && !hasPresentSimple) {
                return {
                    status: 'missing',
                    title: 'Missing Continuing Tense',
                    message: 'Use <strong>present continuous</strong> (am/is/are + -ing) or present simple with <strong>still</strong> to show continuation.'
                };
            }
        }

        if (activity.id === 'writing-3') {
            const hasYet = /\byet\b/i.test(clean);
            const hasNegative = /\b(have|has|do|does|did|can|could|will|would|should|is|are|am|was|were)\s+not\b/i.test(original) || /\b(haven't|hasn't|don't|doesn't|didn't|can't|won't|wouldn't|shouldn't|isn't|aren't|wasn't|weren't)\b/i.test(clean);
            const hasQuestion = /\?\s*$/.test(original);

            if (!hasYet) {
                return {
                    status: 'missing',
                    title: 'Missing Yet',
                    message: 'Use <strong>yet</strong> in a negative sentence or question. Example: <em>I haven\'t finished yet.</em> or <em>Have you arrived yet?</em>'
                };
            }

            if (!hasNegative && !hasQuestion) {
                return {
                    status: 'missing',
                    title: 'Yet Needs Negative or Question',
                    message: '<strong>Yet</strong> is used in negative sentences (haven\'t...yet) or questions (Have...yet?).'
                };
            }
        }

        if (activity.id === 'writing-4') {
            const hasAlways = /\balways\b/i.test(clean);
            const hasPresentSimple = /\b(always|usually|often|sometimes|rarely|never|generally|regularly)\s+\w+(s|es|)\b/i.test(original) || /\b\w+(s|es)\s+(always|usually|often|sometimes|rarely|never)\b/i.test(original);

            if (!hasAlways) {
                return {
                    status: 'missing',
                    title: 'Missing Always',
                    message: 'Use <strong>always</strong> to describe habits or things that happen regularly. Example: <em>I always drink coffee in the morning.</em>'
                };
            }

            if (!hasPresentSimple) {
                return {
                    status: 'missing',
                    title: 'Missing Present Simple',
                    message: 'Use <strong>present simple</strong> with always for habits. Example: <em>She always takes the bus.</em>'
                };
            }
        }

        if (activity.id === 'writing-5') {
            const hasAlready = /\balready\b/i.test(clean);
            const hasStill = /\bstill\b/i.test(clean);
            const hasContrast = /\b(but|however|although)\b/i.test(clean);

            if (!hasAlready) {
                return {
                    status: 'missing',
                    title: 'Missing Already',
                    message: 'Include <strong>already</strong> to mention a completed change.'
                };
            }

            if (!hasStill) {
                return {
                    status: 'missing',
                    title: 'Missing Still',
                    message: 'Include <strong>still</strong> to mention something that has not changed.'
                };
            }

            if (!hasContrast) {
                return {
                    status: 'missing',
                    title: 'Missing Contrast',
                    message: 'Use <strong>but / however / although</strong> to contrast the completed change with the continuing situation.'
                };
            }
        }

        if (activity.id === 'writing-6') {
            const hasContrastYet = /\b\w+,\s*yet\s+\w+\b/i.test(original) || /\byet\s+(she|he|it|they|we|I|the|this|that|my|your|his|her)\b/i.test(original);

            if (!hasContrastYet) {
                return {
                    status: 'missing',
                    title: 'Missing Contrastive Yet',
                    message: 'Use <strong>yet</strong> to link two contrasting ideas (like &quot;nevertheless&quot;). Example: <em>She was tired, yet she kept working.</em>'
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
            message: 'Excellent use of already, still, yet, and always! 🎉'
        };
    },

    checkCommonMistake: function (text) {
        const mistakes = [
            { pattern: /\bI\s+yet\s+\w+(ed|en|d|t)\b/i, error: 'use &quot;I haven\'t...yet&quot;, not &quot;I yet...&quot;' },
            { pattern: /\b(yet)\s+(already)\b/i, error: 'do not use &quot;yet&quot; and &quot;already&quot; together in the same clause' },
            { pattern: /\bI\s+have\s+finished\s+yet\b/i, error: 'use &quot;already&quot; in positive sentences, not &quot;yet&quot;' },
            { pattern: /\balready\s*\?/i, error: '&quot;Already&quot; is not used in questions expecting a negative; use &quot;yet&quot; instead' }
        ];

        for (const { pattern, error } of mistakes) {
            if (pattern.test(text)) {
                return error;
            }
        }

        return null;
    },

    checkWordOrder: function (text) {
        if (/\b(always|still|already)\s+(is|are|was|were|am|have|has|had)\b/i.test(text)) {
            return 'the adverb usually goes after the auxiliary verb: is always, are still, has already';
        }
        if (/\b(have|has)\s+\w+(ed|en)\s+already\b/i.test(text)) {
            return 'in formal English, &quot;already&quot; usually goes between have/has and the past participle';
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