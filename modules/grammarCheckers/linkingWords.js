export const linkingWordsChecker = {
    name: "Linking Words",
    minWords: 20,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ').trim();
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // ══════════════════════════════════════════════════════
        // WRITING-1: Social media (addition + contrast + conclusion)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-1') {
            const hasAddition = /\b(and|also|moreover|furthermore|in addition)\b/i.test(clean);
            const hasContrast = /\b(however|but|although|yet|on the other hand)\b/i.test(clean);
            const hasConclusion = /\b(in conclusion|therefore|to sum up|in short)\b/i.test(clean);
            
            if (!hasAddition) {
                return { status: 'missing', title: 'Missing Addition Linker', message: 'Add <strong>also/moreover/furthermore</strong> to list multiple benefits.' };
            }
            if (!hasContrast) {
                return { status: 'missing', title: 'Missing Contrast Linker', message: 'Use <strong>however/but</strong> to introduce challenges.' };
            }
            if (!hasConclusion) {
                return { status: 'missing', title: 'Missing Conclusion', message: 'End with <strong>in conclusion/therefore</strong> to summarize.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-2: Learning experience (cause-effect + conditional + summary)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-2') {
            const hasCauseEffect = /\b(because|therefore|as a result|consequently)\b/i.test(clean);
            const hasConditional = /\b(if|unless|supposing)\b/i.test(clean);
            const hasSummary = /\b(in summary|to summarize|briefly|all in all)\b/i.test(clean);
            
            if (!hasCauseEffect) {
                return { status: 'missing', title: 'Missing Cause/Effect', message: 'Use <strong>because/therefore/as a result</strong> to explain why it was memorable.' };
            }
            if (!hasConditional) {
                return { status: 'missing', title: 'Missing Conditional', message: 'Add <strong>if/unless</strong> to discuss hypothetical reflections.' };
            }
            if (!hasSummary) {
                return { status: 'missing', title: 'Missing Summary', message: 'Conclude with <strong>in summary/to summarize</strong>.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-3: Persuasive argument (addition/cause + adversative + conclusion)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-3') {
            const hasAdditionChain = /\b(first|furthermore|additionally|moreover)\b/i.test(clean);
            const hasAdversative = /\b(although|however|nevertheless|yet|despite this)\b/i.test(clean);
            const hasConclusion = /\b(therefore|in conclusion|consequently|hence)\b/i.test(clean);
            const hasEvidenceArg = /\b(evidence|research|data|study|argument|position|support)\b/i.test(clean);
            
            if (!hasAdditionChain) {
                return { status: 'missing', title: 'Missing Addition Chain', message: 'Build your case with <strong>first/furthermore/additionally</strong>.' };
            }
            if (!hasAdversative) {
                return { status: 'missing', title: 'Missing Adversative/Counter', message: 'Acknowledge opposition with <strong>although/nevertheless/however</strong>.' };
            }
            if (!hasConclusion) {
                return { status: 'missing', title: 'Missing Conclusion', message: 'Close logically with <strong>therefore/in conclusion</strong>.' };
            }
            if (!hasEvidenceArg) {
                return { status: 'missing', title: 'Missing Academic Tone', message: 'Use <strong>evidence/research/support</strong> vocabulary for persuasion.' };
            }
        }

        const commonMistake = this.checkCommonMistake(original);
        if (commonMistake) {
            return { status: 'grammar', title: 'Linking Error', message: `Remember: <strong>${commonMistake}</strong>`, icon: 'Prohibited' };
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect Linking Words usage! 🎉' };
    },

    checkCommonMistake: function (text) {
        if (/\bhowever,\s*but\b|\balthough,\s*but\b/i.test(text)) return 'Never use two contrasting linkers together (e.g., "however, but"). Choose one.';
        if (/\btherefore,\s*so\b|\bconsequently,\s*so\b/i.test(text)) return 'Avoid redundancy: "therefore" and "so" mean the same. Use only one.';
        return null;
    },

    checkWordOrder: function (text) { return null; },
    checkSubjectVerbAgreement: function (text) { return null; },
    hasRequiredElements: function (text) { return true; },
    countStructures: function (text, pattern) { const m = text.match(pattern); return m ? m.length : 0; },
    hasProperUsage: function (text) { return true; }
};