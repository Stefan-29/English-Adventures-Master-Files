// modules/grammarCheckers/causativeVerbs.js
export const causativeVerbsChecker = {
    name: "Causative Verbs",
    minWords: 15,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        const words = clean.split(' ').filter(w => w);

        // BASIC LENGTH CHECK
        if (words.length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 15 words.', icon: 'Pencil' };
        }

        // COMMON STRUCTURE CHECKS
        if (/\bmake\b[^.?!]*\bto\b/i.test(clean)) {
            return { status: 'grammar', title: 'Incorrect Make Structure', message: 'Use <strong>make + person + base verb</strong> without <strong>to</strong>.', icon: 'Prohibited' };
        }

        if (/\blet\b[^.?!]*\bto\b/i.test(clean)) {
            return { status: 'grammar', title: 'Incorrect Let Structure', message: 'Use <strong>let + person + base verb</strong> without <strong>to</strong>.', icon: 'Prohibited' };
        }

        // ACTIVITY-SPECIFIC CHECKS
        switch (activity.id) {
            case 'writing-1': {
                if (!/\bmake\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Make', message: 'Use <strong>make + person + verb</strong> to describe forcing someone to do something.', icon: 'Pencil' };
                }
                if (!/\bmake\s+\w+\s+\w+/.test(clean)) {
                    return { status: 'almost', title: 'Almost there!', message: 'Use <strong>make + person + verb</strong> (example: make her clean).', icon: 'Check' };
                }
                break;
            }
            case 'writing-2': {
                if (!/\bget\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Get', message: 'Use <strong>get + person + to + verb</strong> to show arranging someone to do something.', icon: 'Pencil' };
                }
                if (!/\bget\s+\w+\s+to\s+\w+/.test(clean)) {
                    return { status: 'almost', title: 'Check the structure', message: 'Make sure you use <strong>get + person + to + verb</strong>.', icon: 'Check' };
                }
                break;
            }
            case 'writing-3': {
                if (!/\b(have|had|has)\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Have', message: 'Use <strong>have + person + verb</strong> or <strong>have + thing + past participle</strong>.', icon: 'Pencil' };
                }
                if (!/\b(have|had|has)\s+\w+\s+(?:\w+|\w+ed)\b/.test(clean)) {
                    return { status: 'almost', title: 'Almost there!', message: 'Use a correct have structure like <strong>had my assistant call</strong> or <strong>have it repaired</strong>.', icon: 'Check' };
                }
                break;
            }
            case 'writing-4': {
                const helpCount = (clean.match(/\bhelp\w*\b/g) || []).length;
                const letCount = (clean.match(/\blet\b/g) || []).length;
                if (helpCount < 1 || letCount < 1) {
                    return { status: 'missing', title: 'Use Help and Let', message: 'Write one sentence with <strong>help</strong> and another with <strong>let</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-5': {
                const hasHave = /\b(had|have|has)\b/.test(clean);
                const hasGet = /\bget\b/.test(clean);
                if (!hasHave && !hasGet) {
                    return { status: 'missing', title: 'Use Have or Get', message: 'Rewrite using a causative verb such as <strong>had</strong> or <strong>got</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-6': {
                const letCount = (clean.match(/\blet\b/g) || []).length;
                const allowCount = (clean.match(/\ballow\b/g) || []).length;
                if (letCount < 1 || allowCount < 1) {
                    return { status: 'missing', title: 'Explain Let vs Allow', message: 'Mention both <strong>let</strong> and <strong>allow</strong> in your explanation.', icon: 'Pencil' };
                }
                if (!/\bto\b/.test(clean)) {
                    return { status: 'almost', title: 'Add a structure', message: 'Mention that <strong>allow</strong> and <strong>permit</strong> use <strong>to + verb</strong>.', icon: 'Check' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your writing looks good. Keep practicing!', icon: 'Check' };
    }
};

export default causativeVerbsChecker;
