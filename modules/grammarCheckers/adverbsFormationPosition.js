export const adverbsFormationPositionChecker = {
    name: "Adverb Formation & Position",
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
            const hasMannerAdverb = /\b(slowly|quickly|carefully|easily|gracefully|happily|clearly|widely|busily|hopefully|humbly|energetically|beautifully)\b/i.test(original);
            const hasFrequencyAdverb = /\b(often|sometimes|always|usually|rarely|never|generally|regularly|seldom|frequently|occasionally)\b/i.test(original);
            const hasVerb = /\b(run|walk|speak|read|drive|dance|play|work|study|eat|write|talk|move|carry)\b/i.test(clean);

            if (!hasMannerAdverb) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb of Manner',
                    message: 'Use an <strong>adverb of manner</strong> (e.g., slowly, carefully, happily) to describe how an action is done.'
                };
            }

            if (!hasFrequencyAdverb) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb of Frequency',
                    message: 'Include an <strong>adverb of frequency</strong> (e.g., often, always, usually) to say how often something happens.'
                };
            }

            if (!hasVerb) {
                return {
                    status: 'missing',
                    title: 'Missing Action Verb',
                    message: 'Include action verbs like <strong>run, speak, read, work</strong> to build your sentences.'
                };
            }
        }

        if (activity.id === 'writing-2') {
            const freqCount = (text.match(/\b(often|sometimes|always|usually|rarely|never|generally|regularly|seldom|frequently|occasionally|constantly)\b/gi) || []).length;
            const hasContrast = /\b(however|although|but|whereas|while)\b/i.test(clean);

            if (freqCount < 3) {
                return {
                    status: 'missing',
                    title: 'Need 3 Frequency Adverbs',
                    message: 'You need <strong>three</strong> adverbs of frequency. Try using words like <strong>always, usually, sometimes</strong>.'
                };
            }

            if (!hasContrast) {
                return {
                    status: 'missing',
                    title: 'Missing Contrast',
                    message: 'Use <strong>however / although / but</strong> to contrast two different habits or situations.'
                };
            }
        }

        if (activity.id === 'writing-3') {
            const hasManner = /\b\w+ly\b/i.test(original);
            const hasPlace = /\b(here|there|inside|outside|upstairs|downstairs|abroad|everywhere|somewhere)\b/i.test(clean);
            const hasTime = /\b(today|yesterday|tomorrow|recently|soon|now|last|next|every|tonight)\b/i.test(clean);
            const hasTimeClause = /\b(when|before|after|while|as soon as)\b/i.test(clean);

            if (!hasManner) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb of Manner',
                    message: 'Use an <strong>adverb ending in -ly</strong> to describe how something is done.'
                };
            }

            if (!hasPlace) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb of Place',
                    message: 'Add an <strong>adverb of place</strong> (e.g., here, there, inside, abroad) to say where something happens.'
                };
            }

            if (!hasTime) {
                return {
                    status: 'missing',
                    title: 'Missing Time Reference',
                    message: 'Include a <strong>time expression</strong> (e.g., yesterday, tomorrow, recently) to say when something happens.'
                };
            }

            if (!hasTimeClause) {
                return {
                    status: 'missing',
                    title: 'Missing Time Clause',
                    message: 'Add a clause with <strong>when / before / after / while</strong> to connect actions in time.'
                };
            }
        }

        if (activity.id === 'writing-4') {
            const hasCorrectFormation = /\b(carefully|gracefully|hopefully|beautifully|busily|easily|luckily|probably|incredibly|humbly|basically|dynamically|energetically)\b/i.test(original);
            const hasException = /\b(well|hard|fast|early|late|daily|straight)\b/i.test(clean);

            if (!hasCorrectFormation && !hasException) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb Formation',
                    message: 'Use an adverb formed from an adjective (e.g., <strong>carefully, easily, probably</strong>) or an exception (e.g., <strong>well, hard, fast</strong>).'
                };
            }
        }

        if (activity.id === 'writing-5') {
            const hasDegree = /\b(really|quite|very|too|extremely|almost|nearly|especially|fairly|rather)\b/i.test(clean);
            const hasBeforeVerb = /\b(really|quite|just|almost|nearly)\s+\w+\b/i.test(original);

            if (!hasDegree) {
                return {
                    status: 'missing',
                    title: 'Missing Adverb of Degree',
                    message: 'Use an <strong>adverb of degree</strong> like <strong>really, quite, very, too</strong> to strengthen your description.'
                };
            }

            if (!hasBeforeVerb) {
                return {
                    status: 'missing',
                    title: 'Degree Adverb Position',
                    message: 'Place degree adverbs <strong>before the verb</strong> (e.g., I really like it) or between two verbs (e.g., I have really enjoyed it).'
                };
            }
        }

        if (activity.id === 'writing-6') {
            const hasBeFreq = /\b(is|are|was|were|am)\s+(always|often|sometimes|rarely|never|usually|generally|still)\b/i.test(original);
            const hasBeforeVerb = /\b(always|often|sometimes|rarely|never|usually|generally|regularly|seldom)\s+\w+(ed|s|ing|)\b/i.test(original);
            const hasBetweenAux = /\b(have|has|had|can|could|will|would|should|may|might)\s+(always|often|sometimes|rarely|never|usually|generally|regularly)\s+\w+\b/i.test(original);

            if (!hasBeFreq && !hasBeforeVerb && !hasBetweenAux) {
                return {
                    status: 'missing',
                    title: 'Incorrect Adverb Position',
                    message: 'Place frequency adverbs <strong>after be</strong> (e.g., is always) or <strong>before other verbs</strong> (e.g., always goes) or <strong>between auxiliaries</strong> (e.g., have always liked).'
                };
            }
        }

        const commonMistake = this.checkCommonMistake(original);
        if (commonMistake) {
            return {
                status: 'grammar',
                title: 'Adverb Error',
                message: `Remember: <strong>${commonMistake}</strong>. Check your adverb forms and positions.`,
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
            message: 'Perfect use of adverbs! 🎉'
        };
    },

    checkCommonMistake: function (text) {
        const mistakes = [
            { pattern: /\b(friendly|lovely|lonely|lively|silly|ugly)\s+\w+(ed|ing|s)\b/i, error: 'friendly, lovely, lonely, lively, silly, ugly are adjectives, not adverbs' },
            { pattern: /\b(good)\s+\w+(ed|ing|s)\b/i, error: 'use "well" (adverb), not "good" (adjective), to describe verbs' },
            { pattern: /\b(quick|slow|careful|easy|beautiful)\s+(?!and|or|but|,)\w+(ed|ing|s)\b/i, error: 'use the adverb form (-ly) to describe verbs, not the adjective' }
        ];

        for (const { pattern, error } of mistakes) {
            if (pattern.test(text)) {
                return error;
            }
        }

        return null;
    },

    checkWordOrder: function (text) {
        if (/\b\w+(ed|s|ing)\s+(always|often|sometimes|usually|rarely|never|generally|regularly)\b/i.test(text)) {
            return 'verb + frequency adverb is usually incorrect; place frequency adverbs before the verb or after "be"';
        }
        if (/\b\w+ly\s+(is|are|was|were|am)\b/i.test(text)) {
            return 'adverb of manner usually goes after the verb or object, not before "be"';
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