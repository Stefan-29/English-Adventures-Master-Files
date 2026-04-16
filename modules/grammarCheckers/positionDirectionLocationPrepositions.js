// modules/grammarCheckers/positionDirectionLocationPrepositions.js
export const positionDirectionLocationPrepositionsChecker = {
    name: "Position, Direction & Location Prepositions",
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
                const positionPreps = /\b(above|across|against|among|around|behind|below|beneath|beside|between|by|in front of|inside|near|next to|on|outside|over|through|under|underneath)\b/;
                if (!positionPreps.test(clean)) {
                    return { status: 'missing', title: 'Use Position Preposition', message: 'Include a position preposition like <strong>above</strong>, <strong>behind</strong>, or <strong>beside</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-2': {
                const directionPreps = /\b(across|against|along|around|away from|down|from|into|off of|onto|out of|over|through|to|towards|under|up)\b/;
                if (!directionPreps.test(clean)) {
                    return { status: 'missing', title: 'Use Direction Preposition', message: 'Use a direction preposition like <strong>into</strong>, <strong>onto</strong>, or <strong>through</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-3': {
                const locationPreps = /\b(at|in|on|aboard)\b/;
                if (!locationPreps.test(clean)) {
                    return { status: 'missing', title: 'Use Location Preposition', message: 'Include <strong>at</strong>, <strong>in</strong>, <strong>on</strong>, or <strong>aboard</strong>.', icon: 'Pencil' };
                }
                break;
            }
            case 'writing-4': {
                const confusingPairs = /\b(between|among|beside|besides)\b/;
                if (!confusingPairs.test(clean)) {
                    return { status: 'missing', title: 'Use Confusing Pair', message: 'Use <strong>between</strong>/<strong>among</strong> or <strong>beside</strong>/<strong>besides</strong>.', icon: 'Pencil' };
                }
                break;
            }
            default:
                break;
        }

        return { status: 'good', title: 'Great!', message: 'Your preposition usage looks good. Keep practicing!', icon: 'Check' };
    }
};

export default positionDirectionLocationPrepositionsChecker;