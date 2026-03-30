// modules/grammarCheckers/aAnThe.js
export const aAnTheChecker = {
    name: "A vs. An - Articles",
    minWords: 10,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 15 words.', icon: 'Pencil' };
        }

        // Helper functions
        const startsWithVowelSound = (word) => {
            const vowels = ['a', 'e', 'i', 'o', 'u'];
            const firstLetter = word.charAt(0).toLowerCase();
            // Special cases
            if (word.startsWith('uni')) return false; // university sounds like 'yu'
            if (word.startsWith('eu')) return false; // euro sounds like 'yu'
            if (word.startsWith('one')) return false; // one sounds like 'won'
            if (word.startsWith('hon')) return true; // honest sounds like 'on'
            if (word.startsWith('hou')) return true; // hour sounds like 'au'
            return vowels.includes(firstLetter);
        };

        // Check for incorrect A/AN usage
        const words = clean.split(' ').filter(w => w);
        for (let i = 0; i < words.length - 1; i++) {
            const current = words[i];
            const next = words[i + 1];

            if (current === 'a' || current === 'an') {
                // Check if next word starts with vowel/consonant sound
                const shouldBeAn = startsWithVowelSound(next);
                if (current === 'a' && shouldBeAn) {
                    return {
                        status: 'grammar',
                        title: 'Article Error',
                        message: `Use <strong>AN</strong> before words starting with vowel sounds: "${next}" starts with a vowel sound.`,
                        icon: 'Prohibited'
                    };
                }
                if (current === 'an' && !shouldBeAn) {
                    return {
                        status: 'grammar',
                        title: 'Article Error',
                        message: `Use <strong>A</strong> before words starting with consonant sounds: "${next}" starts with a consonant sound.`,
                        icon: 'Prohibited'
                    };
                }
            }
        }

        // Check for plural nouns with A/AN
        const pluralWithArticle = /\b(a|an) (cats|dogs|books|houses|teachers|students|children|people)\b/i.test(clean);
        if (pluralWithArticle) {
            return {
                status: 'grammar',
                title: 'Plural Noun Error',
                message: 'Plural nouns don\'t use A or AN. Use no article or THE.',
                icon: 'Prohibited'
            };
        }

        // Check for uncountable nouns with A/AN
        const uncountableWithArticle = /\b(a|an) (information|air|advice|salt|fun|water|music|love|happiness)\b/i.test(clean);
        if (uncountableWithArticle) {
            return {
                status: 'grammar',
                title: 'Uncountable Noun Error',
                message: 'Uncountable nouns like information, air, advice don\'t use A or AN.',
                icon: 'Prohibited'
            };
        }

        // Activity-specific checks
        if (activity.id === 'writing-1') { // A before consonant sounds
            const hasCorrectA = /\ba (teacher|car|bear|dog|cat|book|house|student)\b/i.test(clean);
            if (!hasCorrectA) {
                return {
                    status: 'missing',
                    title: 'Use A correctly',
                    message: 'Use <strong>A</strong> before words with consonant sounds like teacher, car, bear.'
                };
            }
        }

        if (activity.id === 'writing-2') { // AN before vowel sounds
            const hasCorrectAn = /\ban (invitation|eagle|actor|apple|orange|umbrella|hour)\b/i.test(clean);
            if (!hasCorrectAn) {
                return {
                    status: 'missing',
                    title: 'Use AN correctly',
                    message: 'Use <strong>AN</strong> before words with vowel sounds like invitation, eagle, actor.'
                };
            }
        }

        if (activity.id === 'writing-3') { // Introduction with A/AN
            const hasIntroduction = /\b(a|an) (teacher|actor|student|doctor|friend)\b.*\./i.test(original);
            if (!hasIntroduction) {
                return {
                    status: 'missing',
                    title: 'Introduce with A/AN',
                    message: 'Introduce new people/things with A or AN: "Tom is A teacher."'
                };
            }
        }

        if (activity.id === 'writing-4') { // Correction activity
            const hasCorrected = !/\ba bears?\b/i.test(clean) && /\bbears?\b/i.test(clean) && !/\ba informations?\b/i.test(clean);
            if (!hasCorrected) {
                return {
                    status: 'almost',
                    title: 'Check corrections',
                    message: 'Correct: Remove A/AN from plurals and uncountable nouns.'
                };
            }
        }

        return { status: 'correct', title: 'Excellent!', message: 'Perfect use of articles A, AN, and THE! 🎉' };
    },

    checkCommonMistake: function (text) {
        const mistakes = [
            {
                pattern: /\ba (apple|eagle|invitation|actor|orange)\b/gi,
                message: 'Use AN before vowel sounds',
                correction: 'an'
            },
            {
                pattern: /\ban (teacher|car|bear|dog|cat)\b/gi,
                message: 'Use A before consonant sounds',
                correction: 'a'
            },
            {
                pattern: /\b(a|an) (information|advice|air|water)\b/gi,
                message: 'Uncountable nouns don\'t use A/AN',
                correction: 'no article'
            }
        ];

        for (const mistake of mistakes) {
            if (mistake.pattern.test(text)) {
                return mistake;
            }
        }

        return null;
    }
};