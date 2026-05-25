// checkers/indirectSpeech.js
export const indirectSpeechChecker = {
  name: "Indirect Speech Structures",
  minWords: 20,
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
    }

    // WRITING-1: Reported questions
    if (activity.id === 'writing-1') {
      const hasAsked = /\b(asked|wanted to know|wondered)\b/i.test(clean);
      const hasIfOrQuestionWord = /\b(if|whether|what|where|when|why|how)\b/i.test(clean);
      const hasStatementOrder = !/\b(do|does|did|is|are|was|were)\s+\w+\?\s*$/.test(original);

      if (!hasAsked) {
        return { status: 'missing', title: 'Use "Asked" for Questions', message: 'Report questions with <strong>asked</strong> or <strong>wanted to know</strong>.', icon: 'HelpCircle' };
      }
      if (!hasIfOrQuestionWord) {
        return { status: 'missing', title: 'Include Question Word or "If"', message: 'Use <strong>if/whether</strong> for yes/no questions, or keep the question word.', icon: 'HelpCircle' };
      }
      if (!hasStatementOrder) {
        return { status: 'structure', title: 'Fix Word Order', message: 'Reported questions use statement order (subject + verb), not question order.', icon: 'ArrowRightLeft' };
      }
    }

    // WRITING-2: Reported requests with infinitive
    if (activity.id === 'writing-2') {
      const hasRequestVerb = /\b(asked|requested|told)\b/i.test(clean);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasPerson = /\b(me|him|her|us|them)\b/i.test(clean);

      if (!hasRequestVerb) {
        return { status: 'missing', title: 'Use Request Verb', message: 'Use <strong>asked/requested/told</strong> for reporting requests.', icon: 'Volume2' };
      }
      if (!hasInfinitive) {
        return { status: 'missing', title: 'Add Infinitive', message: 'Requests use <strong>to + verb</strong>: asked me to help.', icon: 'Link' };
      }
      if (!hasPerson) {
        return { status: 'missing', title: 'Specify Person', message: 'Include who was asked: asked <strong>me/him/her</strong> to...', icon: 'User' };
      }
    }

    return { status: 'success', title: 'Excellent Indirect Speech! ✨', message: 'Your sentence correctly uses question structures, infinitives, and proper word order.', icon: 'CheckCircle' };
  }
};