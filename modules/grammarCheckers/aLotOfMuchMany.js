// modules/grammarCheckers/aLotOfMuchMany.js
export const aLotOfMuchManyChecker = {
    name: "A Lot Of - Much - Many",
    minWords: 10,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 15 words.', icon: 'Pencil' };
        }

        // Check for incorrect usage of much/many with countable/uncountable nouns
        const words = clean.split(' ').filter(w => w);

        for (let i = 0; i < words.length - 1; i++) {
            const current = words[i];
            const next = words[i + 1];

            // Check for "much" with countable nouns (common mistake)
            if (current === 'much' && ['books', 'cars', 'people', 'students', 'questions', 'ideas'].includes(next)) {
                return {
                    status: 'grammar',
                    title: 'Quantifier Error',
                    message: `Use <strong>MANY</strong> with countable nouns like "${next}". Use MUCH with uncountable nouns.`,
                    icon: 'Prohibited'
                };
            }

            // Check for "many" with uncountable nouns (common mistake)
            if (current === 'many' && ['water', 'time', 'money', 'information', 'advice', 'homework'].includes(next)) {
                return {
                    status: 'grammar',
                    title: 'Quantifier Error',
                    message: `Use <strong>MUCH</strong> with uncountable nouns like "${next}". Use MANY with countable nouns.`,
                    icon: 'Prohibited'
                };
            }
        }

        return { status: 'ok', title: 'Good Job!', message: 'Your quantifier usage looks correct!', icon: 'Checkmark' };
    }
};