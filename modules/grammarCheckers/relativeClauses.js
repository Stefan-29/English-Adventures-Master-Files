// checkers/relativeClauses.js
export const relativeClausesChecker = {
    name: "Relative Clauses Intro",
    minWords: 15,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 15 words to practice relative clauses.', icon: 'Pencil' };
        }

        // WRITING-1 to -3: Basic pronoun usage
        if (['writing-1', 'writing-2', 'writing-3'].includes(activity.id)) {
            const pronoun = activity.id === 'writing-1' ? 'who' : activity.id === 'writing-2' ? /(that|which)/ : 'where';
            const hasPronoun = new RegExp(`\\b${pronoun}\\b`, 'i').test(original);
            if (!hasPronoun) {
                return { status: 'missing', title: `Missing "${pronoun}"`, message: `Use <strong>${pronoun}</strong> to introduce your relative clause. Example: <em>The person ${pronoun}... </em>` };
            }
        }

        // WRITING-4: Combining sentences
        if (activity.id === 'writing-4') {
            const hasRelative = /\b(who|which|that|where)\b/i.test(original);
            const hasTwoIdeas = /(and|because|,)/.test(clean) || original.split('.').length >= 2;
            if (!hasRelative) {
                return { status: 'missing', title: 'Missing Relative Pronoun', message: 'Connect your ideas with <strong>who/which/that/where</strong>.' };
            }
            if (!hasTwoIdeas) {
                return { status: 'missing', title: 'Combine Two Ideas', message: 'Your sentence should merge two related thoughts using a relative clause.' };
            }
        }

        // WRITING-5: Multiple clauses
        if (activity.id === 'writing-5') {
            const clauseCount = (text.match(/\b(who|which|that|where)\b/gi) || []).length;
            if (clauseCount < 3) {
                return { status: 'missing', title: 'Use 3 Relative Clauses', message: 'Include <strong>who</strong>, <strong>which/that</strong>, and <strong>where</strong> in your 3 sentences.' };
            }
        }

        // GLOBAL: Basic pronoun-noun agreement
        if (/\bwhich\b.*\b(person|man|woman|someone)\b/i.test(original)) {
            return { status: 'error', title: 'Use "who" for People', message: 'Use <strong>who</strong> for people, not <strong>which</strong>. Example: <em>The person who...</em>' };
        }
        if (/\bwho\b.*\b(thing|book|car|place)\b/i.test(original)) {
            return { status: 'error', title: 'Use "which/that" for Things', message: 'Use <strong>which</strong> or <strong>that</strong> for things, not <strong>who</strong>. Example: <em>The book that...</em>' };
        }

        return { status: 'success', title: 'Great Start! 🎉', message: 'Your relative clauses are clear and correctly formed. Keep practicing!', icon: 'CheckCircle' };
    }
};