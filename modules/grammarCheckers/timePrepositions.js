// modules/grammarCheckers/timePrepositions.js
export const timePrepositionsChecker = {
    name: "Time Prepositions",
    minWords: 15,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        const words = clean.split(' ').filter(w => w);

        if (words.length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 15 words.', icon: 'Pencil' };
        }

        switch (activity.id) {
            case 'writing-1': {
                const hasAt = /\bat\b/.test(clean);
                const hasOn = /\bon\b/.test(clean);
                const hasIn = /\bin\b/.test(clean);
                if (!hasAt && !hasOn && !hasIn) {
                    return { status: 'missing', title: 'Use Time Preposition', message: 'Include <strong>at</strong>, <strong>on</strong>, or <strong>in</strong> in your sentence.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-2': {
                const hasFor = /\bfor\b/.test(clean);
                const hasSince = /\bsince\b/.test(clean);
                const hasAgo = /\bago\b/.test(clean);
                if (!hasFor && !hasSince && !hasAgo) {
                    return { status: 'missing', title: 'Use Duration Preposition', message: 'Use <strong>for</strong>, <strong>since</strong>, or <strong>ago</strong> to express time.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-3': {
                const hasDuring = /\bduring\b/.test(clean);
                const hasWhile = /\bwhile\b/.test(clean);
                if (!hasDuring && !hasWhile) {
                    return { status: 'missing', title: 'Use Time Relationship Word', message: 'Include <strong>during</strong> or <strong>while</strong> in your sentence.', icon: 'Pencil' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your time preposition usage looks good. Keep practicing!', icon: 'Check' };
    }
};

export default timePrepositionsChecker;