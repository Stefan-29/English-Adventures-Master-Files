export const althoughDespiteChecker = {
    name: "Although & Despite",
    minWords: 20,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ').trim();
        const original = text;

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
        }

        // ══════════════════════════════════════════════════════
        // WRITING-1: Overcame challenge (although + despite)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-1') {
            const hasAlthough = /\balthough\b/i.test(clean);
            const hasDespite = /\bdespite\b/i.test(clean);
            const hasChallengeAccomplishment = /\b(challenge|injury|difficulty|problem|completed|achieved|success|won)\b/i.test(clean);
            
            if (!hasAlthough) {
                return { status: 'missing', title: 'Missing "Although"', message: 'Use <strong>although + subject + verb</strong> to show contrast.' };
            }
            if (!hasDespite) {
                return { status: 'missing', title: 'Missing "Despite"', message: 'Use <strong>despite + noun/gerund</strong> to show what was overcome.' };
            }
            if (!hasChallengeAccomplishment) {
                return { status: 'missing', title: 'Missing Challenge/Accomplishment', message: 'Describe a specific <strong>challenge</strong> and what they <strong>accomplished</strong>.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-2: Ideal weekend (should vs want contrast)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-2') {
            const hasAlthough = /\balthough\b/i.test(clean);
            const hasDespite = /\bdespite\b/i.test(clean);
            const hasShouldWant = /\b(should|must|have to|want|prefer|wish)\b/i.test(clean);
            
            if (!hasAlthough || !hasDespite) {
                return { status: 'missing', title: 'Missing Both Contrast Words', message: 'Use <strong>although</strong> (clause) and <strong>despite</strong> (noun/gerund) to contrast obligations vs desires.' };
            }
            if (!hasShouldWant) {
                return { status: 'missing', title: 'Missing Should/Want Contrast', message: 'Show what you <strong>should do</strong> vs what you <strong>want to do</strong>.' };
            }
        }

        // ══════════════════════════════════════════════════════
        // WRITING-3: Persuasive opportunity (acknowledge & emphasize)
        // ══════════════════════════════════════════════════════
        if (activity.id === 'writing-3') {
            const hasAlthough = /\balthough\b/i.test(clean);
            const hasDespite = /\bdespite\b/i.test(clean);
            const hasStrengthValue = /\b(strength|advantage|skill|value|benefit|experience|learned|proven)\b/i.test(clean);
            
            if (!hasAlthough || !hasDespite) {
                return { status: 'missing', title: 'Missing Contrast Markers', message: 'Acknowledge difficulties with <strong>although/despite</strong> before highlighting strengths.' };
            }
            if (!hasStrengthValue) {
                return { status: 'missing', title: 'Missing Strength/Value Focus', message: 'Emphasize your <strong>skills, experience, or value</strong> despite challenges.' };
            }
        }

        const commonMistake = this.checkCommonMistake(original);
        if (commonMistake) {
            return { status: 'grammar', title: 'Structure Error', message: `Remember: <strong>${commonMistake}</strong>`, icon: 'Prohibited' };
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect Although/Despite usage! 🎉' };
    },

    checkCommonMistake: function (text) {
        if (/\bdespite he\b|\bdespite she\b|\bdespite I\b|\bdespite it\b|\bdespite they\b|\bdespite we\b/i.test(text) && !/\bdespite (being|the|his|her|my|their)\b/i.test(text)) {
            return 'Never follow "despite" directly with a subject + verb. Use a noun/gerund or "despite the fact that".';
        }
        if (/\baltogether\b.*\bcontrast\b/i.test(text)) return null;
        return null;
    },

    checkWordOrder: function (text) { return null; },
    checkSubjectVerbAgreement: function (text) { return null; },
    hasRequiredElements: function (text) { return true; },
    countStructures: function (text, pattern) { const m = text.match(pattern); return m ? m.length : 0; },
    hasProperUsage: function (text) { return true; }
};