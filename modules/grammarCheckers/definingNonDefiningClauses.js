// checkers/definingNonDefiningClauses.js
export const definingNonDefiningClausesChecker = {
    name: "Defining vs. Non-Defining Clauses",
    minWords: 20,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 20 words to practice clause types properly.', icon: 'Pencil' };
        }

        // WRITING-1: Defining clause (no commas)
        if (activity.id === 'writing-1') {
            const hasCommas = /,\s*\w+[^,]*,/.test(original);
            const hasDefiningPronoun = /\b(that|who|which)\b/i.test(original);
            
            if (hasCommas) {
                return { status: 'punctuation', title: 'Remove Commas for Defining Clauses', message: 'Defining clauses do NOT use commas. Example: <em>The person who helped me</em> (no commas).' };
            }
            if (!hasDefiningPronoun) {
                return { status: 'missing', title: 'Missing Relative Pronoun', message: 'Use <strong>that/who/which</strong> to introduce your defining clause.' };
            }
        }

        // WRITING-2: Non-defining clause (with commas)
        if (activity.id === 'writing-2') {
            const hasCommas = /,\s*\w+[^,]*,/.test(original);
            const hasWhichWho = /\b(which|who)\b/i.test(original);
            const hasThat = /\bthat\b/i.test(original);
            
            if (!hasCommas) {
                return { status: 'punctuation', title: 'Add Commas for Non-Defining Clauses', message: 'Non-defining clauses need <strong>commas before and after</strong>. Example: <em>My car, which is red, is fast</em>.' };
            }
            if (!hasWhichWho) {
                return { status: 'missing', title: 'Use Which or Who', message: 'Non-defining clauses use <strong>which</strong> (things) or <strong>who</strong> (people), not <strong>that</strong>.' };
            }
            if (hasThat) {
                return { status: 'error', title: 'Avoid "that" in Non-Defining Clauses', message: 'Never use <strong>that</strong> with commas. Use <strong>which</strong> for things: <em>My car, which is red...</em>' };
            }
        }

        // WRITING-3: Two versions showing meaning change
        if (activity.id === 'writing-3') {
            const hasDefining = /\b\w+\s+(that|who|which)\b(?!,)/i.test(original); // Pronoun not followed by comma
            const hasNonDefining = /,\s*(which|who)\b.*?,/i.test(original); // Comma + pronoun + comma
            
            if (!hasDefining || !hasNonDefining) {
                return { status: 'missing', title: 'Show Both Clause Types', message: 'Write one sentence with a <strong>defining clause (no commas)</strong> and one with a <strong>non-defining clause (with commas)</strong>.' };
            }
        }

        // WRITING-4: Edit sentence type
        if (activity.id === 'writing-4') {
            const hasOriginal = /original:/i.test(original);
            const hasEdited = /edited:/i.test(original);
            const hasCommaChange = (original.match(/,/g) || []).length !== (text.toLowerCase().match(/original:.*?,/g) || []).length; // Simplified
            
            if (!hasOriginal || !hasEdited) {
                return { status: 'missing', title: 'Show Original and Edited', message: 'Label your <strong>Original:</strong> and <strong>Edited:</strong> versions clearly.' };
            }
            if (!hasCommaChange) {
                return { status: 'missing', title: 'Change the Punctuation', message: 'Your edit should <strong>add or remove commas</strong> to change the clause type.' };
            }
        }

        // WRITING-5: Paragraph with both types + labels
        if (activity.id === 'writing-5') {
            const hasDefiningLabel = /\[defining\]/i.test(original);
            const hasNonDefiningLabel = /\[non-defining\]/i.test(original);
            const hasBothClauses = /\b(that|who|which)\b/i.test(original) && /,\s*(which|who)\b.*?,/i.test(original);
            
            if (!hasDefiningLabel || !hasNonDefiningLabel) {
                return { status: 'missing', title: 'Label Your Clauses', message: 'Mark each clause type: <strong>[defining]</strong> or <strong>[non-defining]</strong>.' };
            }
            if (!hasBothClauses) {
                return { status: 'missing', title: 'Use Both Clause Types', message: 'Include at least one defining clause (no commas) and one non-defining clause (with commas).' };
            }
        }

        // WRITING-7: Formal non-defining with 'which'
        if (activity.id === 'writing-7') {
            const hasWhich = /\bwhich\b/i.test(original);
            const hasCommas = /,\s*\w+[^,]*,/.test(original);
            const hasFormalVocab = /\b(formal|initiative|methodology|recommend)\b/i.test(clean);
            const hasThat = /\bthat\b/i.test(original);
            
            if (!hasWhich) {
                return { status: 'missing', title: 'Use "which" for Formal Non-Defining', message: 'In formal writing, use <strong>which</strong> (not "that") for non-defining clauses about things.' };
            }
            if (!hasCommas) {
                return { status: 'punctuation', title: 'Add Commas', message: 'Non-defining clauses require <strong>commas before and after</strong> the clause.' };
            }
            if (hasThat && hasCommas) {
                return { status: 'error', title: 'Avoid "that" with Commas', message: 'Never combine <strong>that</strong> with commas. Use <strong>which</strong> for non-defining clauses.' };
            }
        }

        // GLOBAL: Common comma errors
        if (/, that\b/i.test(original)) {
            return { status: 'error', title: 'Never Use "that" with Commas', message: '<strong>That</strong> cannot introduce non-defining clauses. Use <strong>which</strong> with commas: <em>My car, which is red...</em>' };
        }
        if (/\bwhich\b/i.test(original) && !/,/.test(original) && /\b(my|the|this)\b/i.test(clean)) {
            // Heuristic: 'which' without commas + possessive/definite article might be non-defining error
            // Soft check: suggest but don't fail
        }

        return { status: 'success', title: 'Clause Clarity Achieved! 🎉', message: 'Your comma usage and clause type selection are precise. You control meaning through punctuation!', icon: 'CheckCircle' };
    }
};