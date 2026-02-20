const shouldOughtToChecker = {
  name: 'shouldOughtTo',
  minWords: 0,
  check: (text = '', activity = {}) => {
    const clean = (s) => (s || '').toString().toLowerCase().trim();
    const t = clean(text);
    const contains = (pattern) => (t.match(pattern) || []).length;

    const counts = {
      should: contains(/\bshould\b/g),
      'should not': contains(/\bshouldn't\b/g) + contains(/\bshould not\b/g),
      'ought to': contains(/\bought\s+to\b/g),
      'ought not': contains(/\bought\s+not\b/g)
    };

    const id = activity.id || '';

    // Default positive response
    let ok = true;
    let message = 'Well done.';

    // Activity-specific checks
    if (id.startsWith('writing-')) {
      if (id === 'writing-1') {
        ok = counts.should >= 3;
        message = ok ? 'You used "should" effectively for advice.' : 'Try using "should" multiple times to offer recommendations.';
      } else if (id === 'writing-2') {
        ok = counts['ought to'] >= 3;
        message = ok ? 'You used "ought to" appropriately.' : 'Include "ought to" to show what is reasonable or appropriate.';
      } else if (id === 'writing-3') {
        ok = (counts.should >= 2 || counts['ought to'] >= 2) && t.includes('past');
        message = ok ? 'Good use of past obligation forms.' : 'Try "should have" or "ought to have" for past situations.';
      } else if (id === 'writing-4') {
        ok = counts['should not'] >= 2 || counts['ought not'] >= 2;
        message = ok ? 'Negative advice is well expressed.' : 'Use "should not" or "ought not" to advise against actions.';
      } else if (id === 'writing-10') {
        const modalCount = (counts.should ? 1 : 0) + (counts['ought to'] ? 1 : 0);
        ok = modalCount >= 2 && t.split(/\s+/).length >= 80;
        message = ok ? 'Excellent use of both modals with sufficient depth.' : 'Include both "should" and "ought to" and write at least 80 words.';
      }
    }

    // Quiz-specific quick checks
    if (id.startsWith('quiz-')) {
      if (id === 'quiz-4' || id === 'quiz-7') {
        ok = counts['ought to'] >= 1 || counts['ought not'] >= 1;
        message = ok ? 'Correct use of "ought to".' : 'Remember: "ought to" shows what is appropriate or deserved.';
      }
      if (id === 'quiz-8') {
        ok = t.includes('should have') || t.includes('shouldn\'t have');
        message = ok ? 'Correct past form.' : 'Use "should have" or "ought to have" for past situations.';
      }
    }

    return { ok, message, meta: { counts } };
  }
};

module.exports = shouldOughtToChecker;
