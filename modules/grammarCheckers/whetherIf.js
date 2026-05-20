// checkers/whetherIf.js
export const whetherIfChecker = {
    name: "Whether vs. If",
    minWords: 20,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 20 words to practice whether/if usage properly.', icon: 'Pencil' };
        }

        // WRITING-1: Indirect questions with whether/if
        if (activity.id === 'writing-1') {
            const hasWhetherIf = /\b(whether|if)\b/i.test(original);
            const hasReportingVerb = /\b(asked|wondered|knew|didn't know|ask)\b/i.test(clean);
            
            if (!hasWhetherIf) {
                return { status: 'missing', title: 'Use Whether or If', message: 'Include <strong>whether</strong> or <strong>if</strong> to report yes/no questions. Example: <em>She asked whether I was ready.</em>' };
            }
            if (!hasReportingVerb) {
                return { status: 'context', title: 'Use Reporting Context', message: 'Use verbs like <strong>asked/wondered/knew</strong> to introduce indirect questions.' };
            }
        }

        // WRITING-2: Conditional sentences with if ONLY
        if (activity.id === 'writing-2') {
            const hasIf = /\bif\b/i.test(original);
            const hasConditionalStructure = /\bif\s+\w+.*?,\s*(will|would|can|could|may|might)\b/i.test(original) || /\b(will|would)\s+\w+\s+if\b/i.test(original);
            const hasWhether = /\bwhether\b/i.test(original);
            
            if (!hasIf) {
                return { status: 'missing', title: 'Use "if" for Conditions', message: 'Conditional sentences require <strong>if</strong>. Example: <em>If it rains, we\'ll stay home.</em>' };
            }
            if (hasWhether && !/\b(whether.*?or\s+\w+|whether\s+to)\b/i.test(original)) {
                // Warn if 'whether' is used in a likely conditional context
                return { status: 'error', title: 'Avoid "whether" for Conditions', message: '<strong>Whether</strong> cannot introduce conditions. Use <strong>if</strong>: <em>If you invite me, I\'ll come.</em>' };
            }
            if (!hasConditionalStructure) {
                return { status: 'structure', title: 'Use Conditional Pattern', message: 'Follow the pattern: <strong>If + condition, + result</strong>.' };
            }
        }

        // WRITING-3: Whether before to-infinitive
        if (activity.id === 'writing-3') {
            const hasWhetherTo = /\bwhether\s+to\s+\w+/i.test(original);
            const hasIfTo = /\bif\s+to\s+\w+/i.test(original);
            
            if (hasIfTo) {
                return { status: 'error', title: 'Use "whether" Before Infinitives', message: 'Before <strong>to + verb</strong>, only <strong>whether</strong> is correct. ❌ \'if to go\' → ✅ <em>whether to go</em>.' };
            }
            if (!hasWhetherTo) {
                return { status: 'missing', title: 'Use "whether to + verb"', message: 'Include the pattern <strong>whether to + verb</strong>. Example: <em>I don\'t know whether to go.</em>' };
            }
        }

        // WRITING-4: Whether after prepositions
        if (activity.id === 'writing-4') {
            const hasPrepWhether = /\b(on|about|of|for|in)\s+whether\b/i.test(original);
            const hasPrepIf = /\b(on|about|of|for|in)\s+if\b/i.test(original);
            
            if (hasPrepIf) {
                return { status: 'error', title: 'Use "whether" After Prepositions', message: 'After prepositions, only <strong>whether</strong> is correct. ❌ \'on if\' → ✅ <em>on whether</em>.' };
            }
            if (!hasPrepWhether) {
                return { status: 'missing', title: 'Use Preposition + whether', message: 'Include a preposition followed by <strong>whether</strong>. Example: <em>It depends on whether we have time.</em>' };
            }
        }

        // WRITING-5: Whether as sentence subject
        if (activity.id === 'writing-5') {
            const hasSubjectWhether = /^whether\s+\w+/i.test(original.trim()) || /\n\s*whether\s+\w+/i.test(original);
            const hasSubjectIf = /^if\s+\w+/i.test(original.trim()) || /\n\s*if\s+\w+/i.test(original);
            
            if (hasSubjectIf) {
                return { status: 'error', title: 'Use "whether" for Subject Clauses', message: 'When starting a sentence as the subject, only <strong>whether</strong> is correct. ❌ \'If we go makes...\' → ✅ <em>Whether we go makes...</em>' };
            }
            if (!hasSubjectWhether) {
                return { status: 'missing', title: 'Start with "whether" Clause', message: 'Begin your sentence with a <strong>whether-clause as subject</strong>. Example: <em>Whether we win matters less than how we play.</em>' };
            }
        }

        // WRITING-6: 'or not' placement
        if (activity.id === 'writing-6') {
            const hasWhetherOrNot = /\bwhether\s+or\s+not\b/i.test(original);
            const hasWhetherEndOrNot = /\bwhether\b.*?\bor\s+not\b/i.test(original);
            const hasIfOrNotImmediate = /\bif\s+or\s+not\b/i.test(original);
            
            if (hasIfOrNotImmediate) {
                return { status: 'error', title: 'Avoid "if or not" Together', message: 'With <strong>if</strong>, <strong>or not</strong> can only go at the end. ❌ \'if or not she\'s coming\' → ✅ <em>if she\'s coming or not</em>.' };
            }
            if (!hasWhetherOrNot && !hasWhetherEndOrNot) {
                return { status: 'missing', title: 'Use "whether...or not" Pattern', message: 'Include <strong>whether or not</strong> (immediate) or <strong>whether...or not</strong> (at end). Example: <em>I don\'t know whether or not to go.</em>' };
            }
        }

        // WRITING-7: Formal writing prefers whether
        if (activity.id === 'writing-7') {
            const hasWhether = /\bwhether\b/i.test(original);
            const hasIfForAlternative = /\bif\b.*?\b(or|alternative|choice)\b/i.test(original) && !/\bif\s+\w+.*?,\s*(will|would)\b/i.test(original); // if used for alternative, not condition
            const hasFormalVocab = /\b(determine|consider|regarding|committee|proposal)\b/i.test(clean);
            
            if (hasIfForAlternative) {
                return { status: 'register', title: 'Prefer "whether" in Formal Writing', message: 'In formal contexts, prefer <strong>whether</strong> for alternatives to avoid ambiguity. Example: <em>The committee will consider whether to proceed.</em>' };
            }
            if (!hasWhether && !hasIfForAlternative) {
                return { status: 'missing', title: 'Use "whether" for Alternatives', message: 'Include <strong>whether</strong> to express alternatives in formal style.' };
            }
        }

        // WRITING-8: 'only if' for strong condition
        if (activity.id === 'writing-8') {
            const hasOnlyIf = /\bonly\s+if\b/i.test(original);
            const hasOnlyWhether = /\bonly\s+whether\b/i.test(original);
            
            if (hasOnlyWhether) {
                return { status: 'error', title: 'Use "only if" for Strong Conditions', message: '<strong>Only if</strong> expresses strict conditions. <strong>Only whether</strong> is incorrect. Example: <em>I\'ll agree only if you apologize.</em>' };
            }
            if (!hasOnlyIf) {
                return { status: 'missing', title: 'Use "only if"', message: 'Include the phrase <strong>only if</strong> to express a strong condition.' };
            }
        }

        // WRITING-9: Ambiguity demonstration
        if (activity.id === 'writing-9') {
            const hasAmbiguousIf = /\bif\b.*?\b(could|might|may)\b/i.test(original) || /ambiguous/i.test(original);
            const hasClearWhether = /\bwhether\b/i.test(original);
            const hasBothVersions = /ambiguous:|clear:/i.test(original) || original.split(/[:.!?]/).filter(s => /\b(if|whether)\b/i.test(s)).length >= 2;
            
            if (!hasBothVersions) {
                return { status: 'missing', title: 'Show Both Versions', message: 'Write one sentence with ambiguous <strong>if</strong>, then a clearer version with <strong>whether</strong>.' };
            }
            if (!hasClearWhether) {
                return { status: 'missing', title: 'Use "whether" for Clarity', message: 'Demonstrate how <strong>whether</strong> eliminates ambiguity in the alternative meaning.' };
            }
        }

        // WRITING-10: Formal email with whether
        if (activity.id === 'writing-10') {
            const hasWhether = /\bwhether\b/i.test(original);
            const hasFormalStyle = !/\b(can't|don't|won't|isn't)\b/i.test(original) && /\b(regarding|determine|consider|inquiry)\b/i.test(clean);
            const hasIfForAlternative = /\bif\b.*?\b(alternative|choice|option)\b/i.test(original) && !/\bif\s+\w+.*?,\s*(will|would)\b/i.test(original);
            
            if (hasIfForAlternative) {
                return { status: 'register', title: 'Prefer "whether" in Professional Writing', message: 'In professional emails, use <strong>whether</strong> for alternatives to ensure clarity. Example: <em>We must determine whether the proposal meets criteria.</em>' };
            }
            if (!hasWhether) {
                return { status: 'missing', title: 'Use "whether" for Alternatives', message: 'Include <strong>whether</strong> to express alternatives in formal register.' };
            }
            if (!hasFormalStyle) {
                return { status: 'register', title: 'Maintain Formal Register', message: 'Avoid contractions and use precise vocabulary like <strong>determine/consider/regarding</strong>.' };
            }
        }

        // GLOBAL: Critical errors
        if (/\bif\s+to\s+\w+/i.test(original)) {
            return { status: 'error', title: 'Never Use "if to + verb"', message: 'Before infinitives, only <strong>whether</strong> is correct. ❌ \'if to go\' → ✅ <em>whether to go</em>.' };
        }
        if (/\b(on|about|of|for)\s+if\b/i.test(original) && !/\b(if\s+\w+.*?,\s*then|if\s+only)\b/i.test(original)) {
            // Check if it's likely a preposition + if error (not conditional)
            return { status: 'error', title: 'Use "whether" After Prepositions', message: 'After prepositions, only <strong>whether</strong> works. ❌ \'about if\' → ✅ <em>about whether</em>.' };
        }
        if (/\bonly\s+whether\b/i.test(original)) {
            return { status: 'error', title: 'Use "only if" for Conditions', message: '<strong>Only if</strong> expresses strict conditions. <strong>Only whether</strong> is incorrect.' };
        }
        if (/\bif\s+or\s+not\b/i.test(original)) {
            return { status: 'error', title: 'Avoid "if or not" Together', message: 'With <strong>if</strong>, place <strong>or not</strong> at the end only. ✅ <em>if she\'s coming or not</em>.' };
        }

        return { status: 'success', title: 'Whether/If Mastery! 🎉', message: 'Your choices between whether and if are precise, context-appropriate, and ambiguity-free. Excellent linguistic judgment!', icon: 'CheckCircle' };
    }
};