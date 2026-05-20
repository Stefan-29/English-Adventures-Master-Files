// checkers/relativePronouns.js
export const relativePronounsChecker = {
    name: "Relative Pronouns",
    minWords: 15,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 15 words.', icon: 'Pencil' };
        }

        // Basic pronoun checks per activity
        const pronounMap = {
            'writing-1': { pronoun: 'who', context: 'person' },
            'writing-2': { pronoun: /(which|that)/, context: 'thing' },
            'writing-3': { pronoun: 'where', context: 'place' },
            'writing-4': { pronoun: 'when', context: 'time' },
            'writing-5': { pronoun: 'why', context: 'reason' }
        };

        if (pronounMap[activity.id]) {
            const { pronoun, context } = pronounMap[activity.id];
            const hasPronoun = typeof pronoun === 'string' 
                ? new RegExp(`\\b${pronoun}\\b`, 'i').test(original)
                : pronoun.test(original);
            const hasContext = new RegExp(`\\b${context}\\b`, 'i').test(clean);
            
            if (!hasPronoun) {
                return { status: 'missing', title: `Missing "${typeof pronoun === 'string' ? pronoun : 'which/that'}"`, message: `Use the correct pronoun for ${context}. Example: <em>The ${context} ${typeof pronoun === 'string' ? pronoun : 'that'}...</em>` };
            }
            if (!hasContext && activity.id !== 'writing-2') {
                return { status: 'missing', title: `Specify the ${context}`, message: `Clearly mention the ${context} before your relative clause.` };
            }
        }

        // WRITING-6: Multiple pronouns
        if (activity.id === 'writing-6') {
            const hasWho = /\bwho\b/i.test(original);
            const hasWhich = /\bwhich\b/i.test(original);
            const hasWhere = /\bwhere\b/i.test(original);
            if (!hasWho || !hasWhich || !hasWhere) {
                return { status: 'missing', title: 'Use All Three Pronouns', message: 'Include <strong>who</strong> (people), <strong>which</strong> (things), and <strong>where</strong> (places) in your 3 sentences.' };
            }
        }

        // WRITING-7: Contrast with different pronouns
        if (activity.id === 'writing-7') {
            const hasWho = /\bwho\b/i.test(original);
            const hasThat = /\bthat\b/i.test(original);
            const hasContrast = /\b(but|however|while)\b/i.test(clean);
            if (!hasWho || !hasThat) {
                return { status: 'missing', title: 'Use Both who and that', message: 'Compare a person (who) and a thing (that) in your sentence.' };
            }
            if (!hasContrast) {
                return { status: 'missing', title: 'Add Contrast', message: 'Use <strong>but/however/while</strong> to show the difference.' };
            }
        }

        // WRITING-8: when + why together
        if (activity.id === 'writing-8') {
            const hasWhen = /\bwhen\b/i.test(original);
            const hasWhy = /\bwhy\b/i.test(original);
            if (!hasWhen || !hasWhy) {
                return { status: 'missing', title: 'Use Both when and why', message: 'Connect a time clause (<strong>when</strong>) with a reason clause (<strong>why</strong>).' };
            }
        }

        // GLOBAL: Pronoun-noun agreement errors
        if (/\bwhich\b.*\b(person|man|woman|someone|he|she)\b/i.test(original)) {
            return { status: 'error', title: 'Use "who" for People', message: 'Use <strong>who</strong> for people. Example: <em>The person who...</em>' };
        }
        if (/\bwho\b.*\b(thing|book|car|idea|it|they)\b/i.test(original)) {
            return { status: 'error', title: 'Use "which/that" for Things', message: 'Use <strong>which</strong> or <strong>that</strong> for things. Example: <em>The book that...</em>' };
        }
        if (/\bwhere\b.*\b(person|thing|reason)\b/i.test(original) && !/\b(place|city|house|location)\b/i.test(clean)) {
            return { status: 'error', title: 'Use "where" for Places Only', message: '<strong>Where</strong> describes locations. For people/things, use who/which/that.' };
        }

        return { status: 'success', title: 'Pronoun Perfect! 🎉', message: 'You selected the right relative pronouns for every context. Excellent precision!', icon: 'CheckCircle' };
    }
};