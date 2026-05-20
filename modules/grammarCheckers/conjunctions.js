export const conjunctionsChecker = {
    name: "Conjunctions",
    minWords: 20,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ').trim();
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // ══════════════════════════════════════════════════════
        // WRITING-1: Hobby with coordinating conjunctions (FANBOYS)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-1') {
            const fanboysCount = (clean.match(/\b(for|and|nor|but|or|yet|so)\b/g) || []).length;
            const hasHobbyContext = /\b(hobby|like|enjoy|do|benefit|relax|fun)\b/i.test(clean);
            
            if (fanboysCount < 3) {
                return { status: 'missing', title: 'Need 3+ FANBOYS', message: 'Use coordinating conjunctions (<strong>and, but, or, so, yet</strong>) at least 3 times.' };
            }
            if (!hasHobbyContext) {
                return { status: 'missing', title: 'Missing Hobby Context', message: 'Mention a specific <strong>hobby or activity</strong> and its benefits.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-2: Weekend with subordinating + coordinating
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-2') {
            const hasSubordinating = /\b(because|although|when|if|since|while)\b/i.test(clean);
            const hasCoordinating = /\b(and|but|so|or)\b/i.test(clean);
            const hasTimeActivity = /\b(morning|weekend|time|go|sleep|relax|study|eat)\b/i.test(clean);
            
            if (!hasSubordinating) {
                return { status: 'missing', title: 'Missing Subordinating', message: 'Add <strong>because/although/when/if</strong> to explain reasons or conditions.' };
            }
            if (!hasCoordinating) {
                return { status: 'missing', title: 'Missing Coordinating', message: 'Connect actions with <strong>and/but/so</strong>.' };
            }
            if (!hasTimeActivity) {
                return { status: 'missing', title: 'Add Time/Activity Details', message: 'Describe specific weekend <strong>times or activities</strong>.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-3: Persuasive English paragraph (all types)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-3') {
            const hasCorrelative = /\bnot only\b.*\bbut also\b/i.test(original);
            const hasSubordinating = /\b(although|because|since|so that)\b/i.test(clean);
            const hasCoordinating = /\b(and|but|so)\b/i.test(clean);
            const hasFormalAdd = /\b(moreover|furthermore|additionally)\b/i.test(clean);
            
            if (!hasCorrelative) {
                return { status: 'missing', title: 'Missing Correlative Pair', message: 'Use <strong>not only... but also</strong> for emphasis.' };
            }
            if (!hasSubordinating) {
                return { status: 'missing', title: 'Missing Subordinating', message: 'Include <strong>although/because/so that</strong> for complex reasoning.' };
            }
            if (!hasFormalAdd) {
                return { status: 'missing', title: 'Add Formal Transition', message: 'Use <strong>moreover/furthermore</strong> to elevate academic tone.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // GLOBAL CHECKS
        // ══════════════════════════════════════════════════════
        const commonMistake = this.checkCommonMistake(original);
        if (commonMistake) {
            return { status: 'grammar', title: 'Conjunction Error', message: `Remember: <strong>${commonMistake}</strong>. Apply proper comma rules.`, icon: 'Prohibited' };
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect Conjunction usage! 🎉' };
    },

    checkCommonMistake: function (text) {
        if (/\b, and\b/i.test(text) && !/\b, [a-z]+, and\b/i.test(text)) return 'Avoid commas before "and" unless connecting two independent clauses.';
        if (/\bbecause.*,\s/i.test(text)) return 'Do not use a comma before "because" when it follows the main clause.';
        return null;
    },

    checkWordOrder: function (text) { return null; },
    checkSubjectVerbAgreement: function (text) { return null; },
    hasRequiredElements: function (text) { return true; },
    countStructures: function (text, pattern) { const m = text.match(pattern); return m ? m.length : 0; },
    hasProperUsage: function (text) { return true; }
};