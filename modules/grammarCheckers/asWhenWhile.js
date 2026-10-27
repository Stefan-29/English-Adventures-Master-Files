const asWhenWhileChecker = {
    name: 'As, When, While',

    check(text, activity = {}) {
        const normalized = String(text || '').toLowerCase();
        const wordCount = normalized.match(/\b[\p{L}]+\b/gu)?.length || 0;
        const requirements = activity.id === 'writing-1'
            ? ['when', 'while']
            : ['as', 'when', 'while'];
        const missing = requirements.filter(marker => !new RegExp(`\\b${marker}\\b`).test(normalized));

        if (wordCount < 12) {
            return {
                status: 'too-short',
                title: 'Add More Detail',
                message: 'Write at least 12 words to show how the events relate in time.'
            };
        }
        if (missing.length) {
            return {
                status: 'missing',
                title: 'Use Your Time Markers',
                message: `Add ${missing.map(marker => `"${marker}"`).join(' and ')} to show when events happen.`
            };
        }
        return {
            status: 'correct',
            title: 'Timeline Trail Cleared!',
            message: 'You used the target time markers. Nice work connecting the events.'
        };
    }
};

export default asWhenWhileChecker;