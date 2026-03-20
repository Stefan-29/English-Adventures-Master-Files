export const gerundInfinitiveChecker = {
    name: "Gerund vs Infinitive",
    minWords: 10,

    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ').trim();

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 10 words to explain your choice.', icon: 'Pencil' };
        }

        switch (activity.id) {
            case 'writing-1':
                if (!/\b(enjoy|love|like|dislike|hate|avoid|mind|"can't stand"|practice)/i.test(clean)) {
                    return { status: 'missing', title: 'Use Gerund Verbs', message: 'Include at least 3 verbs that take gerund in your sentences.', icon: 'Prohibited' };
                }
                break;
            case 'writing-2':
                if (!/\b(want to|plan to|hope to|decide to|need to|agree to|offer to|refuse to)/i.test(clean)) {
                    return { status: 'missing', title: 'Use Infinitive Verbs', message: 'Include at least 3 verbs that take infinitive (to + verb).', icon: 'Prohibited' };
                }
                break;
            case 'writing-3':
                if (!/\b(remember|forget|try|stop|start|continue)\b/i.test(clean)) {
                    return { status: 'missing', title: 'Compare Forms', message: 'Use one of the verbs that can take both gerund and infinitive. Explain meaning difference.', icon: 'Prohibited' };
                }
                break;
            case 'writing-4':
                if (!/\b(let|make|help|see|hear)\b/i.test(clean)) {
                    return { status: 'missing', title: 'Use Bare Infinitive Verbs', message: 'Include a causative or perception verb plus a bare infinitive form.', icon: 'Prohibited' };
                }
                break;
            case 'writing-5':
                if (!/\b(after|before|instead of|good at|interested in|no use|no point in)\b/i.test(clean)) {
                    return { status: 'missing', title: 'Use Preposition Expression', message: 'Include a preposition + gerund expression from the lesson.', icon: 'Prohibited' };
                }
                break;
            default:
                break;
        }

        return { status: 'good', title: 'Well done!', message: 'Your writing demonstrates understanding of gerund/infinitive use.', icon: 'Check' };
    }
};

export default gerundInfinitiveChecker;
