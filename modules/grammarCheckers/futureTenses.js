// checkers/futureTenses.js
export const futureTensesChecker = {
    name: "Future Tenses",
    minWords: 15,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;

        // Basic length check
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return {
                status: 'too-short',
                title: 'Too Short',
                message: 'Write full sentences. Aim for at least 20 words.',
                icon: 'Pencil'
            };
        }

        // ——————————————————————————————————————
        // WRITING-1: Café scene (will prediction, be going to evidence, offer, promise)
        // ——————————————————————————————————————
        if (activity.id === 'writing-1') {
            const hasWill = /\b(will|won't|i'?ll|you'?ll|he'?ll|she'?ll|we'?ll|they'?ll)\b/i.test(original);
            const hasGoingTo = /\b(am|is|are|i'?m|he'?s|she'?s|we'?re|they'?re)\s+going\s+to\b/i.test(original);
            const hasOffer = /\bi'?ll\s+(get|give|buy|bring|help|carry|take|pay|lend)\b/i.test(original);
            const hasPromise = /\bi\s+(will|promise\s+i\s+will)\b/i.test(original);

            if (!hasWill) return { status: 'missing', title: 'Missing prediction', message: 'Use <strong>will</strong> for a prediction (e.g. it will rain).' };
            if (!hasGoingTo) return { status: 'missing', title: 'Missing evidence', message: 'Use <strong>be going to</strong> for evidence (clouds → it’s going to rain).' };
            if (!hasOffer) return { status: 'missing', title: 'Missing offer', message: 'Make a spontaneous offer with <strong>I’ll + verb</strong>.' };
            if (!hasPromise) return { status: 'missing', title: 'Missing promise', message: 'Make a promise with <strong>I will + verb</strong>.' };
        }

        // ——————————————————————————————————————
        // WRITING-2: Dream weekend (2× be going to, 2× future continuous, 1 time clause)
        // ——————————————————————————————————————
        if (activity.id === 'writing-2') {
            const goingToCount = (text.match(/\bgoing\s+to\b/gi) || []).length;
            const continuousCount = (text.match(/\bwill\s+be\s+\w+ing\b|\bis\s+\w+ing\b|\bare\s+\w+ing\b/gi) || []).length;
            const timeClause = /\b(when|after|before|as soon as|while|at|during)\b/i.test(clean);

            if (goingToCount < 1) return { status: 'missing', title: 'Need plans', message: 'Use <strong>be going to</strong> at least once for your plans.' };
            if (continuousCount < 1) return { status: 'missing', title: 'Need an action in progress', message: 'Describe something happening at a specific time.' };
            if (!timeClause) return { status: 'almost', title: 'Good writing!', message: 'Consider adding <strong>when / at / while</strong> for better timing.' };
        }

        // ——————————————————————————————————————
        // WRITING-3: Message to teacher (was/were going to ×2 + 1 promise)
        // ——————————————————————————————————————
        if (activity.id === 'writing-3') {
            const wasGoingToCount = (text.match(/\b(was|were)\s+going\s+to\b/gi) || []).length;
            const willPromise = /\bi\s+(will|'ll)\b/i.test(original);

            if (wasGoingToCount < 1) return { status: 'missing', title: 'Need past plans', message: 'Use <strong>was/were going to</strong> to explain past intentions.' };
            if (!willPromise) return { status: 'missing', title: 'Missing future commitment', message: 'End with <strong>I will…</strong> to show your commitment.' };
        }

        // ——————————————————————————————————————
        // WRITING-4: Weather forecast (will, be going to, future continuous)
        // ——————————————————————————————————————
        if (activity.id === 'writing-4') {
            const hasWill = /\b(will|won't)\b/i.test(original);
            const hasGoingTo = /\bgoing\s+to\b/i.test(original);
            const hasContinuous = /\bwill\s+be\s+\w+ing\b/i.test(original);

            if (!hasWill) return { status: 'missing', title: 'Missing general forecast', message: 'Use <strong>will</strong> for general predictions.' };
            if (!hasGoingTo) return { status: 'missing', title: 'Missing evidence', message: 'Use <strong>be going to</strong> for weather signs.' };
            if (!hasContinuous) return { status: 'missing', title: 'Missing specific time', message: 'Use <strong>will be + -ing</strong> at a specific time.' };
        }

        // ——————————————————————————————————————
        // WRITING-5: Diary entry next year (3× be going to, 2× will, 1 after-clause)
        // ——————————————————————————————————————
        if (activity.id === 'writing-5') {
            const goingToCount = (text.match(/\bgoing\s+to\b/gi) || []).length;
            const willCount = (text.match(/\b(will|won't|'ll)\b/gi) || []).length;
            const timeMarker = /\b(after|before|when|later|then|next)\b/i.test(clean);

            if (goingToCount + willCount < 2) return { status: 'missing', title: 'Need future forms', message: 'Use <strong>be going to</strong> or <strong>will</strong> at least twice.' };
            if (!timeMarker) return { status: 'almost', title: 'Nice work!', message: 'Consider adding time markers like <strong>after, when, then</strong> for clarity.' };
        }

        // ——————————————————————————————————————
        // WRITING-6: Goodbye card (2 promises, 1 future continuous, 1 as soon as)
        // ——————————————————————————————————————
        if (activity.id === 'writing-6') {
            const willForm = /\b(will|'ll|won't)\b/i.test(original);
            const futureContent = /\b(promise|will|going to|'ll)\b/i.test(original);
            const connector = /\b(and|then|when|because)\b/i.test(clean);

            if (!willForm && !futureContent) return { status: 'missing', title: 'Need future forms', message: 'Use <strong>will</strong> or <strong>be going to</strong> in your goodbye card.' };
            if (!connector) return { status: 'almost', title: 'Very nice!', message: 'Consider connecting your ideas with <strong>and, when, because</strong>.' };
        }

        // ——————————————————————————————————————
        // WRITING-7: School event (5× future continuous + time clauses)
        // ——————————————————————————————————————
        if (activity.id === 'writing-7') {
            const continuousCount = (text.match(/\bwill\s+be\s+\w+ing\b/gi) || []).length;
            const timeClauses = (clean.match(/\b(when|before|after|while|as soon as)\b/gi) || []).length;

            if (continuousCount < 5) return { status: 'missing', title: 'Need 5 ongoing tasks', message: 'Use <strong>will be + -ing</strong> <strong>five times</strong>.' };
            if (timeClauses < 2) return { status: 'missing', title: 'More time clauses', message: 'Use <strong>when / before / after</strong> at least twice.' };
        }

        // ——————————————————————————————————————
        // WRITING-8: Short story “Tomorrow was the big exam…”
        // ——————————————————————————————————————
        if (activity.id === 'writing-8') {
            const hasWill = /\b(will|won't)\b/i.test(original);
            const hasGoingTo = /\bgoing\s+to\b/i.test(original);
            const hasContinuous = /\bwill\s+be\s+\w+ing\b/i.test(original);
            const hasTimeClause = /\b(before|when|after)\b/i.test(clean);

            if (!hasWill) return { status: 'missing', title: 'Nervous prediction?', message: 'Use <strong>will</strong> for worry.' };
            if (!hasGoingTo) return { status: 'missing', title: 'Study plan?', message: 'Use <strong>be going to</strong> for your plan.' };
            if (!hasContinuous) return { status: 'missing', title: 'Night before?', message: 'Use <strong>will be + -ing</strong> for the night.' };
            if (!hasTimeClause) return { status: 'missing', title: 'Time clause?', message: 'Use <strong>before / when</strong>.' };
        }

        // ——————————————————————————————————————
        // WRITING-9: Flight delayed (2× be going to, 1 future continuous, until)
        // ——————————————————————————————————————
        if (activity.id === 'writing-9') {
            const goingToCount = (text.match(/\bgoing\s+to\b/gi) || []).length;
            const continuous = /\bwill\s+be\s+\w+ing\b/i.test(original);
            const until = /\buntil\b/i.test(clean);

            if (goingToCount < 2) return { status: 'missing', title: 'Need 2 new plans', message: 'Use <strong>be going to</strong> <strong>twice</strong>.' };
            if (!continuous) return { status: 'missing', title: 'During wait?', message: 'Use <strong>will be + -ing</strong>.' };
            if (!until) return { status: 'missing', title: 'Missing until', message: 'Use <strong>until + present</strong>.' };
        }

        // ——————————————————————————————————————
        // WRITING-10: Letter to younger self (will, be going to, was going to)
        // ——————————————————————————————————————
        if (activity.id === 'writing-10') {
            const willCount = (text.match(/\b(will|won't)\b/gi) || []).length;
            const goingToCount = (text.match(/\bgoing\s+to\b/gi) || []).length;
            const wasGoingTo = /\b(was|were)\s+going\s+to\b/i.test(original);

            if (willCount < 1) return { status: 'missing', title: 'Prediction?', message: 'Use <strong>will</strong> for future prediction.' };
            if (goingToCount < 1) return { status: 'missing', title: 'Plan?', message: 'Use <strong>be going to</strong> for advice.' };
            if (!wasGoingTo) return { status: 'missing', title: 'Regret?', message: 'Use <strong>was/were going to</strong> for past regret.' };
        }

        // ——————————————————————————————————————
        // Global error: Time clauses must use PRESENT tense
        // ——————————————————————————————————————
        const timeClauseError = this.checkTimeClauses(original);
        if (timeClauseError) {
            return {
                status: 'grammar',
                title: 'Time Clause Mistake',
                message: `After <strong>${timeClauseError}</strong> use <strong>present tense</strong> — not will / going to!`,
                icon: 'Prohibited'
            };
        }

        return { status: 'correct', title: 'Outstanding!', message: 'Perfect Future Tenses!' };
    },

    // Helper functions (same as your original)
    checkTimeClauses: function (text) {
        const triggers = ['when', 'while', 'before', 'after', 'as soon as', 'until', 'by the time'];
        for (const t of triggers) {
            if (new RegExp(`\\b${t}\\b[^.]*\\b(will|going to)\\b`, 'i').test(text)) return t;
        }
        return null;
    }
};