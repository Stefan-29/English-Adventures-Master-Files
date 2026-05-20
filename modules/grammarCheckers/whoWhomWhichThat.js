// checkers/whoWhomWhichThat.js
export const whoWhomWhichThatChecker = {
    name: "Who/Whom/Which/That Mastery",
    minWords: 20,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 20 words for advanced pronoun practice.', icon: 'Pencil' };
        }

        // WRITING-1: Formal whom as object
        if (activity.id === 'writing-1') {
            const hasWhom = /\bwhom\b/i.test(original);
            const hasObjectContext = /\b(I|we|they|he|she)\s+\w+\s+whom\b/i.test(original) || /\bwhom\s+\w+\b/i.test(original);
            
            if (!hasWhom) {
                return { status: 'missing', title: 'Use "whom" for Formal Object', message: 'In formal writing, use <strong>whom</strong> when the pronoun is the object. Example: <em>The person whom I called</em>.' };
            }
            if (!hasObjectContext) {
                return { status: 'context', title: 'Ensure Object Function', message: '<strong>Whom</strong> should receive the action. Test: "I called him" → "whom I called".' };
            }
        }

        // WRITING-2: Informal who replacing whom
        if (activity.id === 'writing-2') {
            const hasWho = /\bwho\b/i.test(original);
            const hasInformalStructure = /\b(who)\s+\w+\s+\w+\s+to\b/i.test(original) || /\bwho did you\b/i.test(original);
            
            if (!hasWho) {
                return { status: 'missing', title: 'Use "who" for Informal Object', message: 'In informal speech, <strong>who</strong> can replace <strong>whom</strong>. Example: <em>Who did you invite?</em>' };
            }
            if (!hasInformalStructure) {
                return { status: 'context', title: 'Use Informal Structure', message: 'Place the preposition at the end: <em>Who did you speak to?</em> not <em>To whom did you speak?</em>' };
            }
        }

        // WRITING-3: Defining clause with 'that'
        if (activity.id === 'writing-3') {
            const hasThat = /\bthat\b/i.test(original);
            const hasNoCommas = !/,/.test(original);
            const hasDefiningContext = /\b(the|a|my)\s+\w+\s+that\b/i.test(original);
            
            if (!hasThat) {
                return { status: 'missing', title: 'Use "that" for Defining Clauses', message: 'In defining clauses (essential info), prefer <strong>that</strong> for things. Example: <em>The book that I read</em>.' };
            }
            if (!hasNoCommas) {
                return { status: 'punctuation', title: 'Remove Commas for Defining Clauses', message: 'Defining clauses do NOT use commas. Remove commas around your clause.' };
            }
        }

        // WRITING-4: Non-defining clause with 'which' + commas
        if (activity.id === 'writing-4') {
            const hasWhich = /\bwhich\b/i.test(original);
            const hasCommas = /,\s*\w+[^,]*,/.test(original);
            const hasThat = /\bthat\b/i.test(original);
            
            if (!hasWhich) {
                return { status: 'missing', title: 'Use "which" for Non-Defining Clauses', message: 'Non-defining clauses use <strong>which</strong> (never "that"). Example: <em>My book, which I read, is great</em>.' };
            }
            if (!hasCommas) {
                return { status: 'punctuation', title: 'Add Commas for Non-Defining Clauses', message: 'Non-defining clauses require <strong>commas before and after</strong> the clause.' };
            }
            if (hasThat && hasCommas) {
                return { status: 'error', title: 'Never Use "that" with Commas', message: '<strong>That</strong> cannot introduce non-defining clauses. Use <strong>which</strong>: <em>My car, which is red...</em>' };
            }
        }

        // WRITING-5: Formal preposition + whom
        if (activity.id === 'writing-5') {
            const hasPrepWhom = /\b(to|with|for|by|about)\s+whom\b/i.test(original);
            const hasFormalVocab = /\b(formal|candidate|colleague|recommend)\b/i.test(clean);
            
            if (!hasPrepWhom) {
                return { status: 'missing', title: 'Use "Preposition + whom"', message: 'In formal style, place the preposition BEFORE <strong>whom</strong>. Example: <em>the person to whom I spoke</em>.' };
            }
            if (!hasFormalVocab) {
                return { status: 'register', title: 'Use Formal Vocabulary', message: 'Maintain formal register: avoid contractions, use precise terms like <strong>candidate, colleague</strong>.' };
            }
        }

        // WRITING-6: Informal preposition at end
        if (activity.id === 'writing-6') {
            const hasWho = /\bwho\b/i.test(original);
            const hasEndPreposition = /\b(who|that)?\s*\w+\s+to\b/i.test(original) || /\b(who|that)?\s*\w+\s+with\b/i.test(original);
            const hasFormalStructure = /\b(to|with)\s+whom\b/i.test(original);
            
            if (!hasWho && !/\b(that)?\b/i.test(original)) {
                return { status: 'missing', title: 'Use "who" or Omit Pronoun', message: 'In informal style, use <strong>who</strong> or omit the pronoun: <em>The person (who) I spoke to</em>.' };
            }
            if (!hasEndPreposition) {
                return { status: 'structure', title: 'Place Preposition at End', message: 'In informal English, put the preposition at the end: <em>who I spoke to</em>, not <em>to whom I spoke</em>.' };
            }
            if (hasFormalStructure) {
                return { status: 'register', title: 'Use Informal Structure', message: 'For informal contexts, avoid preposition + whom. Use: <em>who I spoke to</em>.' };
            }
        }

        // WRITING-7: Quantifier + whom
        if (activity.id === 'writing-7') {
            const hasQuantifierWhom = /\b(most|several|many|all|few)\s+of\s+whom\b/i.test(original);
            
            if (!hasQuantifierWhom) {
                return { status: 'missing', title: 'Use "Quantifier + of whom"', message: 'After quantifiers like <strong>most/several/many</strong>, use <strong>of whom</strong> for people. Example: <em>the team, most of whom were experts</em>.' };
            }
        }

        // WRITING-8: Academic register adaptation
        if (activity.id === 'writing-8') {
            const hasFormalPronouns = /\b(whom|which)\b/i.test(original);
            const hasPrepPlacement = /\b(to|with|by)\s+(whom|which)\b/i.test(original);
            const hasNoContractions = !/\b(can't|don't|won't|isn't)\b/i.test(original);
            const hasAcademicVocab = /\b(participants|methodology|data|findings)\b/i.test(clean);
            
            if (!hasFormalPronouns) {
                return { status: 'missing', title: 'Use Formal Pronouns', message: 'Academic writing prefers <strong>whom</strong> (people) and <strong>which</strong> (things) in relative clauses.' };
            }
            if (!hasPrepPlacement) {
                return { status: 'structure', title: 'Place Prepositions Before Pronouns', message: 'In formal writing, put prepositions before pronouns: <strong>to whom</strong>, not <strong>who...to</strong>.' };
            }
            if (!hasNoContractions) {
                return { status: 'register', title: 'Avoid Contractions in Academic Writing', message: 'Expand contractions: <strong>cannot</strong> not <strong>can\'t</strong>, <strong>do not</strong> not <strong>don\'t</strong>.' };
            }
        }

        // GLOBAL: Critical errors
        if (/\bto who\b|\bwith who\b|\bfor who\b/i.test(original)) {
            return { status: 'error', title: 'Never Use "Preposition + who"', message: 'After prepositions, always use <strong>whom</strong> for people: <em>to whom</em>, not <em>to who</em>.' };
        }
        if (/, that\b/i.test(original)) {
            return { status: 'error', title: 'Avoid "that" with Commas', message: '<strong>That</strong> cannot introduce non-defining clauses. Use <strong>which</strong> with commas.' };
        }
        if (/\bwhich\b.*\b(person|man|woman)\b/i.test(original) && !/,/.test(original)) {
            // Soft warning: might be defining clause where 'that' is preferred in American English
        }

        return { status: 'success', title: 'Pronoun Mastery Achieved! 🎉', message: 'Your pronoun choices reflect sophisticated understanding of grammar, register, and context. Excellent work!', icon: 'CheckCircle' };
    }
};