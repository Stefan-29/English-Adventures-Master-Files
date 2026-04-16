// modules/grammarCheckers/ofFromPrepositions.js
export const ofFromPrepositionsChecker = {
    name: "Of and From Prepositions",
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
                const ofUsage = /\bof (the|tea|wood|spiders|traveling)\b/;
                if (!ofUsage.test(clean)) {
                    return { status: 'missing', title: 'Use Of Correctly', message: 'Include <strong>of</strong> for possession or quantity, e.g., <strong>of the car</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-2': {
                const fromUsage = /\bfrom (england|france|the library|the store|9 to 5|2 to 4|plastic|stone)\b/;
                if (!fromUsage.test(clean)) {
                    return { status: 'missing', title: 'Use From Correctly', message: 'Use <strong>from</strong> for origins or sources, e.g., <strong>from England</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-3': {
                const hasOf = /\bof\b/.test(clean);
                const hasFrom = /\bfrom\b/.test(clean);
                if (!hasOf && !hasFrom) {
                    return { status: 'missing', title: 'Use Of or From', message: 'Include either <strong>of</strong> or <strong>from</strong> in your sentence.', icon: 'Pencil' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your of/from usage looks good. Keep practicing!', icon: 'Check' };
    }
};

export default ofFromPrepositionsChecker;