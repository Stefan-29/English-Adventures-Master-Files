// checkers/reportedSpeech.js
export const reportedSpeechChecker = {
  name: "Reported Speech Foundations",
  minWords: 20,
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    // BASIC LENGTH CHECK
    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
    }

    // GLOBAL: Check for direct quotation marks in reported speech activities
    const hasDirectQuote = /["'][^"']+["']/.test(original);
    if (hasDirectQuote && activity.id.startsWith('writing')) {
      return { status: 'format', title: 'Remove Quotation Marks', message: 'Reported speech does not use quotation marks. Report the meaning, not the exact words.', icon: 'Quote' };
    }

    // WRITING-1: Basic reported statement practice
    if (activity.id === 'writing-1') {
      const hasReportingVerb = /\b(said|told|asked|explained)\b/i.test(original);
      const hasPronounShift = /\b(he|she|they|his|her|their|him|them)\b/i.test(clean);
      const hasPastContext = /\b(was|were|had|liked|wanted|did)\b/i.test(clean);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told/asked</strong> to introduce reported speech.', icon: 'Volume2' };
      }
      if (!hasPronounShift) {
        return { status: 'missing', title: 'Update Pronouns', message: 'Change I→he/she, my→his/her, you→I/me when reporting.', icon: 'User' };
      }
      if (!hasPastContext) {
        return { status: 'missing', title: 'Check Tense Context', message: 'When reporting past speech, use past tense verbs: like→liked, am→was.', icon: 'Clock' };
      }
    }

    return { status: 'success', title: 'Great Reported Speech! ✨', message: 'Your sentence correctly uses reporting verbs, pronoun changes, and proper structure.', icon: 'CheckCircle' };
  }
};