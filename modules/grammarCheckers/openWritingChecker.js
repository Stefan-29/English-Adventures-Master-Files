const opinionWords = /\b(beautiful|amazing|lovely|wonderful|interesting|excellent|elegant|comfortable|impressive|delightful|awful|boring|useful|unusual|fantastic|terrible)\b/;
const colourWords = /\b(red|blue|green|yellow|orange|purple|pink|black|white|brown|grey|gray|golden|silver)\b/;
const originMaterialWords = /\b(italian|french|japanese|american|chinese|wooden|leather|silk|cotton|woollen|woolen|metal|plastic|glass|stone|gold|silver)\b/;
const descriptiveWords = /\b(kind|brave|clever|honest|generous|patient|loyal|confident|friendly|caring|thoughtful|ambitious|creative|curious|shy|selfish|arrogant|jealous|anxious|worried|excited|delighted|thrilled|sad|upset|angry|furious|nervous|calm|proud|tall|short|young|old|beautiful|handsome|strong|weak|slim|athletic)\b/g;

const OpenWritingChecker = {
    name: 'Adventure Writing Guide',

    check(text, activity = {}) {
        const answer = String(text || '').trim();
        const normalized = answer.toLowerCase();
        const words = answer.match(/\b[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*\b/gu) || [];
        const prompt = String(activity.question || '');
        const wordRange = prompt.match(/\b(\d+)\s*[-–]\s*(\d+)\s*words?\b/i);
        const minimumWords = wordRange ? Number(wordRange[1]) : 12;

        if (words.length < minimumWords) {
            return {
                status: 'too-short',
                title: 'Add More Detail',
                message: `Write at least ${minimumWords} words so your answer can show the grammar skill.`
            };
        }

        const moduleId = App.currentGrammarModuleId;
        let meetsGoal = true;
        let tip = 'Your answer meets the grammar goal. Great work!';

        if (moduleId === 'adjective-order') {
            const adjectiveCount = (normalized.match(descriptiveWords) || []).length
                + (normalized.match(colourWords) || []).length
                + (normalized.match(originMaterialWords) || []).length;
            if (activity.id === 'writing-1') {
                meetsGoal = opinionWords.test(normalized)
                    && colourWords.test(normalized)
                    && originMaterialWords.test(normalized);
                tip = 'Add an opinion adjective, a colour, and an origin or material before the noun.';
            } else {
                meetsGoal = adjectiveCount >= 3;
                tip = 'Try using at least three descriptive adjectives before the nouns they describe.';
            }
        } else if (moduleId === 'comparatives-superlatives') {
            if (activity.id === 'writing-1') {
                meetsGoal = /\b\w+er\b/.test(normalized)
                    && /\bmore\b/.test(normalized)
                    && /\bthan\b/.test(normalized)
                    && /\b(better|worse|farther|further)\b/.test(normalized);
                tip = 'Include an -er comparative, a more + adjective comparison, than, and an irregular comparative.';
            } else if (activity.id === 'writing-3') {
                meetsGoal = /\b\w+ier\b/.test(normalized)
                    && /\bthe most\b/.test(normalized)
                    && /\b(better|worse)\b/.test(normalized)
                    && /\bas\s+\w+\s+as\b/.test(normalized);
                tip = 'Include an -ier form, the most, better or worse, and an as…as comparison.';
            } else {
                meetsGoal = /\b(the\s+)?\w+(est|most)\b/.test(normalized)
                    && /\b\w+er\b|\bmore\s+\w+\s+than\b/.test(normalized);
                tip = 'Use at least one comparative and two superlatives, each with the.';
            }
        } else if (moduleId === 'compound-adjectives') {
            const compounds = normalized.match(/\b[\p{L}\p{N}]+-[\p{L}\p{N}]+\b/gu) || [];
            meetsGoal = compounds.length >= (activity.id === 'writing-1' ? 3 : 3);
            tip = 'Add at least three hyphenated compound adjectives in your description.';
        } else if (moduleId === 'descriptive-adjectives') {
            const adjectives = normalized.match(descriptiveWords) || [];
            meetsGoal = adjectives.length >= 4;
            tip = 'Use at least four specific appearance, character, or feeling adjectives.';
        } else if (moduleId === 'ing-ed-adjectives') {
            const ingAdjectives = normalized.match(/\b\w+ing\b/g) || [];
            const edAdjectives = normalized.match(/\b\w+ed\b/g) || [];
            meetsGoal = ingAdjectives.length >= 2 && edAdjectives.length >= 1;
            tip = 'Use -ing adjectives for the thing causing a feeling and -ed adjectives for the person feeling it.';
        } else if (moduleId === 'may-might') {
            const hasMay = /\bmay\b/.test(normalized);
            const hasMight = /\bmight\b/.test(normalized);
            switch (activity.id) {
                case 'writing-1':
                case 'writing-6':
                    meetsGoal = hasMay;
                    tip = 'Use may to ask for or give permission politely.';
                    break;
                case 'writing-2':
                case 'writing-7':
                    meetsGoal = hasMight;
                    tip = 'Use might or might not to describe uncertain possibilities.';
                    break;
                case 'writing-3':
                case 'writing-9':
                    meetsGoal = /\b(may|might|could)\s+have\b/.test(normalized);
                    tip = 'Use may have, might have, or could have to speculate about the past.';
                    break;
                case 'writing-4':
                    meetsGoal = /\bif\b/.test(normalized) && (hasMay || hasMight);
                    tip = 'Build an if-clause and use may or might for its possible result.';
                    break;
                case 'writing-5':
                    meetsGoal = /\bmay\s+i\b/.test(normalized) && hasMight;
                    tip = 'Include a May I request and a response mentioning a possible challenge with might.';
                    break;
                case 'writing-8':
                    meetsGoal = hasMay && hasMight;
                    tip = 'Describe the same event with both may and might to show different certainty levels.';
                    break;
                case 'writing-10':
                    meetsGoal = hasMay && hasMight && /\b(may|might)\s+have\b/.test(normalized);
                    tip = 'Combine may, might, and a past possibility form such as may have or might have.';
                    break;
                default:
                    meetsGoal = hasMay || hasMight;
            }
        } else if (moduleId === 'so-such-too-enough') {
            const markers = ['so', 'such', 'too', 'enough'];
            const markerCount = markers.filter(marker => new RegExp(`\\b${marker}\\b`).test(normalized)).length;
            meetsGoal = activity.id === 'writing-1' ? markerCount === markers.length : markerCount >= 2;
            tip = 'Use so, such, too, and enough to express intensity and limits.';
        }

        return meetsGoal
            ? { status: 'correct', title: 'Trail Cleared!', message: tip === 'Your answer meets the grammar goal. Great work!' ? tip : `You used the target grammar. ${tip}` }
            : { status: 'missing', title: 'Keep Exploring', message: tip };
    }
};

export default OpenWritingChecker;
