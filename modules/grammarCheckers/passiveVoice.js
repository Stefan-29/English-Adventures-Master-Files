// modules/grammarCheckers/passiveVoice.js
export const passiveVoiceChecker = {
    name: "Passive Voice",
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
                if (!/\b(is|are)\s+\w+ed\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Present Passive', message: 'Write a present simple passive sentence such as <strong>Food is cooked</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-2': {
                if (!/\bwill be\s+\w+ed\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Future Passive', message: 'Use <strong>will be + past participle</strong> for future passive.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-3': {
                if (!/\b(has|have|had) been\s+\w+ed\b/.test(clean) && !/\bwas\s+\w+ed\b/.test(clean) && !/\bwere\s+\w+ed\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Passive Without Agent', message: 'Use the passive without the agent, for example <strong>My bike has been stolen</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-4': {
                if (!/\bgot\s+(?:\w+ed|hurt|run over)\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Get Passive', message: 'Use <strong>got + past participle</strong> or <strong>got hurt</strong> for informal passive.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-5': {
                const hasBy = /\bby\b/.test(clean);
                const hasPassive = /\b(is|are|was|were|has been|have been|will be)\s+\w+ed\b/.test(clean);
                if (!hasPassive) {
                    return { status: 'missing', title: 'Write a Passive Sentence', message: 'Use a passive form such as <strong>The report was written</strong>.', icon: 'Pencil' };
                }
                if (!hasBy) {
                    return { status: 'almost', title: 'Add an Agent', message: 'Include <strong>by</strong> in one sentence to identify the agent.', icon: 'Check' };
                }
                break;
            }
            case 'writing-6': {
                if (!/\b(is placed|are placed|has been recorded|is being|are being|has been)\s+\w+ed\b/.test(clean)) {
                    return { status: 'missing', title: 'Use Scientific Passive', message: 'Write a scientific passive sentence using <strong>is</strong>, <strong>are</strong>, or <strong>has been</strong> plus a past participle.', icon: 'Pencil' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your passive writing looks good. Keep practicing!', icon: 'Check' };
    }
};

export default passiveVoiceChecker;
