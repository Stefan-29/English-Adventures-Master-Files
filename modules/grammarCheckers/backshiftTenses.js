// checkers/backshiftTenses.js
export const backshiftTensesChecker = {
  name: "Tense Backshift Rules",
  minWords: 20,
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
    }

    // WRITING-1: Basic backshift practice
    if (activity.id === 'writing-1') {
      const hasReportingVerb = /\b(said|told|explained|mentioned)\b/i.test(original);
      const hasBackshiftedVerb = /\b(liked|was|were|had|could|would|did)\b/i.test(clean);
      const hasPronounShift = /\b(he|she|they|his|her|their)\b/i.test(clean);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told/explained</strong> to introduce reported speech.', icon: 'Volume2' };
      }
      if (!hasBackshiftedVerb) {
        return { status: 'missing', title: 'Apply Backshift', message: 'Backshift tenses: like→liked, am→was, can→could.', icon: 'Clock' };
      }
      if (!hasPronounShift) {
        return { status: 'missing', title: 'Update Pronouns', message: 'Change I→he/she, my→his/her when reporting.', icon: 'User' };
      }
    }

    // Check for modal transformations
    if (activity.id === 'writing-2') {
      const hasModalChange = /\b(would|could|might|had to)\b/i.test(clean);
      const hasNoChangeModal = /\b(should|ought to)\b/i.test(clean);
      const hasReportingContext = /\b(said|told|explained)\b/i.test(original);

      if (hasReportingContext && !hasModalChange && !hasNoChangeModal) {
        return { status: 'missing', title: 'Check Modal Transformation', message: 'Modals may change: will→would, can→could, must→had to. Some stay the same: should, could, might.', icon: 'Key' };
      }
    }

    return { status: 'success', title: 'Perfect Backshift! ✨', message: 'Your sentence correctly applies tense backshift rules and modal transformations.', icon: 'CheckCircle' };
  }
};