// modules/grammarCheckers/otherAnother.js
export const otherAnotherChecker = {
    name: "Other - Another",
    minWords: 10,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');

        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 15 words.', icon: 'Pencil' };
        }

        return { status: 'ok', title: 'Good Job!', message: 'Your determiner usage looks correct!', icon: 'Checkmark' };
    }
};