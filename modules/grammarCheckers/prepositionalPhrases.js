// modules/grammarCheckers/prepositionalPhrases.js
export const prepositionalPhrasesChecker = {
    name: "Prepositional Phrases",
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
                const atByPhrases = /\b(at an advantage|at a disadvantage|at any cost|at a distance|at ease|by accident|by all accounts|by all means|by chance|by hand)\b/;
                if (!atByPhrases.test(clean)) {
                    return { status: 'missing', title: 'Use At/By Phrase', message: 'Include a phrase like <strong>at an advantage</strong> or <strong>by accident</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-2': {
                const inOnPhrases = /\b(in action|in addition|in advance|in agreement|in case|on account of|on average|on behalf of|on display|on edge)\b/;
                if (!inOnPhrases.test(clean)) {
                    return { status: 'missing', title: 'Use In/On Phrase', message: 'Use a phrase like <strong>in action</strong> or <strong>on display</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-3': {
                const outUnderWithinPhrases = /\b(out of bounds|out of breath|out of control|out of danger|under age|under consideration|under control|under discussion|within earshot|within reason|without doubt|without delay)\b/;
                if (!outUnderWithinPhrases.test(clean)) {
                    return { status: 'missing', title: 'Use Out/Under/Within Phrase', message: 'Include a phrase like <strong>out of control</strong> or <strong>under consideration</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-4': {
                const commonPreps = /\b(above|across|after|against|along|among|around|at|before|behind|below|beneath|beside|besides|between|beyond|by|concerning|considering|despite|down|during|except|for|from|in|inside|into|like|near|of|off|on|onto|out|outside|over|past|regarding|round|since|through|throughout|to|toward|towards|under|underneath|until|up|upon|with|within|without)\b/;
                if (!commonPreps.test(clean)) {
                    return { status: 'missing', title: 'Use Prepositions', message: 'Include prepositions from the complete list in your sentence.', icon: 'Pencil' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your prepositional phrase usage looks good. Keep practicing!', icon: 'Check' };
    }
};

export default prepositionalPhrasesChecker;