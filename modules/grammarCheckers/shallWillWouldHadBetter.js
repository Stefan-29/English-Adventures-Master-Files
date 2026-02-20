const shallWillWouldHadBetterChecker = {
  name: 'shallWillWouldHadBetter',
  minWords: 0,
  check: (text = '', activity = {}) => {
    const clean = (s) => (s || '').toString().toLowerCase().trim();
    const t = clean(text);
    const contains = (pattern) => (t.match(pattern) || []).length;

    const counts = {
      shall: contains(/\bshall\b/g),
      will: contains(/\bwill\b/g),
      would: contains(/\bwould\b/g),
      'had better': contains(/\bhad better\b/g) + contains(/\bbetter\b(?=\s)/g && t.includes('had') ? 0 : 0)
    };

    const id = activity.id || '';

    // Default positive response
    let ok = true;
    let message = 'Looks good.';

    // Activity-specific checks
    if (id.startsWith('writing-')) {
      if (id === 'writing-1') {
        ok = counts.shall >= 1;
        message = ok ? 'You used "shall" — good.' : 'Try using "shall" in your suggestions.';
      } else if (id === 'writing-2') {
        ok = counts.will >= 1;
        message = ok ? 'You used "will" correctly.' : 'Add a promise or future action with "will".';
      } else if (id === 'writing-3') {
        ok = counts.would >= 1;
        message = ok ? 'Conditional looks good.' : 'Include "would" for hypothetical results.';
      } else if (id === 'writing-4') {
        ok = counts['had better'] >= 1 || t.includes('better') && t.includes('had');
        message = ok ? 'Warning phrasing is present.' : 'Use "had better" to give strong advice or warnings.';
      } else if (id === 'writing-10') {
        const modalCount = (counts.shall?1:0) + (counts.will?1:0) + (counts.would?1:0) + (counts['had better']?1:0);
        ok = modalCount >= 3 && t.split(/\s+/).length >= 80;
        message = ok ? 'Good variety of modals and sufficient length.' : 'Include at least three different modals and reach the word target.';
      }
    }

    // Quiz-specific quick checks
    if (id.startsWith('quiz-')) {
      if (id === 'quiz-4' || id === 'quiz-7') {
        ok = counts['had better'] >= 1 || t.includes('had better');
        message = ok ? 'Correct use of "had better".' : 'Remember: "had better" expresses strong advice or warnings.';
      }
    }

    return { ok, message, meta: { counts } };
  }
};

module.exports = shallWillWouldHadBetterChecker;
