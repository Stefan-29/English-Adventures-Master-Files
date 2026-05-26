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
      const hasAsked = /\b(asked|wanted to know|wondered|inquired)\b/i.test(clean);
      const hasIfOrQuestionWord = /\b(if|whether|what|where|when|why|how|who)\b/i.test(clean);
      const hasBackshiftedVerb = /\b(was|were|had|liked|did|could|would)\b/i.test(clean);
      const hasStatementOrder = !/\b(do|does|did|is|are|was|were|have|has)\s+\w+\?\s*$/.test(original);

      if (!hasAsked) {
        return { status: 'missing', title: 'Use "Asked" for Questions', message: 'Report questions with <strong>asked</strong> or <strong>wanted to know</strong>.', icon: 'HelpCircle' };
      }
      if (!hasIfOrQuestionWord) {
        return { status: 'missing', title: 'Include Question Word or "If"', message: 'Use <strong>if/whether</strong> for yes/no, or keep the wh- word.', icon: 'HelpCircle' };
      }
      if (!hasBackshiftedVerb || !hasStatementOrder) {
        return { status: 'structure', title: 'Fix Tense & Word Order', message: 'Backshift the verb and use statement order: <strong>subject + verb</strong>, not auxiliary + subject.', icon: 'ArrowRightLeft' };
      }
    }

    // WRITING-2: Reported polite request
    if (activity.id === 'writing-2') {
      const hasRequestVerb = /\b(asked|requested|told)\b/i.test(clean);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasPerson = /\b(me|him|her|us|them|you)\b/i.test(clean);
      const hasPoliteContext = /\b(help|please|pass|bring|close)\b/i.test(clean);

      if (!hasRequestVerb) {
        return { status: 'missing', title: 'Use Request Verb', message: 'Use <strong>asked/requested</strong> for polite requests.', icon: 'Volume2' };
      }
      if (!hasInfinitive) {
        return { status: 'missing', title: 'Add Infinitive', message: 'Requests use <strong>to + base verb</strong>: asked me to help.', icon: 'Link' };
      }
      if (!hasPerson || !hasPoliteContext) {
        return { status: 'missing', title: 'Specify Person & Action', message: 'Include who was asked (<strong>me/him/her</strong>) and the polite action.', icon: 'User' };
      }
    }

    // WRITING-3: Short story about orders
    if (activity.id === 'writing-3') {
      const structureCount = (original.match(/\b(told|ordered|instructed)\b/gi) || []).length;
      const hasPositiveInfinitive = /\bto \w+\b/i.test(original);
      const hasNegativeInfinitive = /\bnot to \w+\b/i.test(original);
      const hasTimeMarker = /\b(before|after|then|when|later)\b/i.test(clean);

      if (structureCount < 2) {
        return { status: 'missing', title: 'Use Orders Twice', message: 'Include <strong>told/ordered</strong> <strong>at least two times</strong>.', icon: 'Repeat' };
      }
      if (!hasPositiveInfinitive || !hasNegativeInfinitive) {
        return { status: 'missing', title: 'Include Positive & Negative Infinitives', message: 'Show both <strong>to + verb</strong> and <strong>not to + verb</strong> structures.', icon: 'GitMerge' };
      }
      if (!hasTimeMarker) {
        return { status: 'missing', title: 'Add Time Sequence', message: 'Use time markers like <strong>before/then/after</strong> to order instructions.', icon: 'Calendar' };
      }
    }

    // WRITING-4: Question + advice conversation
    if (activity.id === 'writing-4') {
      const hasAsked = /\b(asked|wanted to know|inquired)\b/i.test(clean);
      const hasAdvised = /\b(advised|suggested|recommended)\b/i.test(clean);
      const hasIfOrWh = /\b(if|whether|what|how|why|when)\b/i.test(clean);
      const hasInfinitiveAdvice = /\bto \w+\b/i.test(original);
      const hasPronoun = /\b(me|him|her|us|them|I)\b/i.test(clean);

      if (!hasAsked || !hasAdvised) {
        return { status: 'missing', title: 'Include Question & Advice', message: 'Use <strong>asked</strong> for the question and <strong>advised</strong> for the advice.', icon: 'GitMerge' };
      }
      if (!hasIfOrWh || !hasInfinitiveAdvice) {
        return { status: 'structure', title: 'Fix Question & Advice Structures', message: 'Use <strong>if/wh-</strong> for the question, and <strong>to + verb</strong> for the advice.', icon: 'ArrowRightLeft' };
      }
      if (!hasPronoun) {
        return { status: 'missing', title: 'Adjust Pronouns', message: 'Ensure pronouns shift correctly between speakers.', icon: 'User' };
      }
    }

    // WRITING-5: Compare questions asked
    if (activity.id === 'writing-5') {
      const hasContrast = /\b(however|although|but|whereas|differently)\b/i.test(clean);
      const hasComparison = /\b(similarly|both|also|likewise)\b/i.test(clean);
      const hasAsked = /\b(asked|wanted to know|inquired)\b/i.test(clean);
      const hasQuestionStruct = /\b(if|whether|what|where|when|why)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|his|her)\b/i.test(clean);

      if (!hasContrast || !hasComparison) {
        return { status: 'missing', title: 'Add Contrast & Comparison', message: 'Use <strong>however/although</strong> and <strong>similarly/both</strong>.', icon: 'GitCompare' };
      }
      if (!hasAsked || !hasQuestionStruct) {
        return { status: 'missing', title: 'Use Reported Questions', message: 'Include <strong>asked</strong> with <strong>if/whether</strong> or a wh- word.', icon: 'HelpCircle' };
      }
      if (!hasPronoun) {
        return { status: 'missing', title: 'Maintain Pronoun Consistency', message: 'Use consistent third-person pronouns for both speakers.', icon: 'User' };
      }
    }

    // WRITING-6: Requests with cause-effect
    if (activity.id === 'writing-6') {
      const hasCause = /\b(because|since|as|due to)\b/i.test(clean);
      const hasAsked = /\b(asked|told|requested)\b/i.test(original);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasResult = /\b(so|therefore|consequently|as a result)\b/i.test(clean);

      if (!hasCause) {
        return { status: 'missing', title: 'State the Cause', message: 'Begin with <strong>because/since/as</strong> to explain the reason.', icon: 'ArrowLeft' };
      }
      if (!hasAsked || !hasInfinitive) {
        return { status: 'missing', title: 'Use Request Structure', message: 'Use <strong>asked/told + person + to + verb</strong>.', icon: 'Volume2' };
      }
      if (!hasResult) {
        return { status: 'missing', title: 'Show the Result', message: 'Connect with <strong>so/therefore/consequently</strong>.', icon: 'ArrowRight' };
      }
    }

    // WRITING-7: Opinion with reported questions
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think|from my perspective)\b/i.test(clean);
      const hasEvidence = /\b(for example|this is because|evidence shows|as shown by)\b/i.test(clean);
      const hasAsked = /\b(asked|wanted to know|wondered)\b/i.test(clean);
      const hasQuestionStruct = /\b(if|whether|what|where|how)\b/i.test(clean);
      const hasBackshift = /\b(was|were|had|would|could|did)\b/i.test(clean);

      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion/I believe</strong>.', icon: 'MessageSquare' };
      }
      if (!hasEvidence) {
        return { status: 'missing', title: 'Add Supporting Evidence', message: 'Support with <strong>for example/because</strong>.', icon: 'FileText' };
      }
      if (!hasAsked || !hasQuestionStruct || !hasBackshift) {
        return { status: 'missing', title: 'Use Backshifted Reported Question', message: 'Report questions with <strong>asked + if/wh-</strong> and backshifted verbs.', icon: 'HelpCircle' };
      }
    }

    // WRITING-8: Hypothetical reported questions
    if (activity.id === 'writing-8') {
      const hasAsked = /\b(asked|wanted to know)\b/i.test(clean);
      const hasConditional = /\b(if|whether|unless|supposing)\b/i.test(clean);
      const hasHypothetical = /\b(would|could|might|should)\b/i.test(clean);
      const hasConsequence = /\b(happen|result|occur|mean)\b/i.test(clean);
      const hasReportedForm = /\b(asked|wanted to know)\b.*\b(would|could)\b/i.test(original);

      if (!hasAsked) {
        return { status: 'missing', title: 'Use Reported Question Verb', message: 'Start the reported part with <strong>asked/wanted to know</strong>.', icon: 'HelpCircle' };
      }
      if (!hasConditional || !hasHypothetical) {
        return { status: 'missing', title: 'Add Conditional & Modal', message: 'Use <strong>if/whether</strong> + <strong>would/could/might</strong>.', icon: 'GitBranch' };
      }
      if (!hasConsequence || !hasReportedForm) {
        return { status: 'missing', title: 'Add Consequence & Combine', message: 'State the consequence and ensure <strong>asked</strong> precedes the conditional clause.', icon: 'ArrowRight' };
      }
    }

    // WRITING-9: Complex conversation (question, order, advice)
    if (activity.id === 'writing-9') {
      const hasAsked = /\b(asked|wanted to know)\b/i.test(clean);
      const hasTold = /\b(told|ordered)\b/i.test(clean);
      const hasAdvised = /\b(advised|suggested)\b/i.test(clean);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasComplexVerb = /\b(had been|would have|could have|been \w+ing)\b/i.test(original);
      const hasConnecting = /\b(although|when|after|while)\b/i.test(clean);

      if (!hasAsked || !hasTold || !hasAdvised) {
        return { status: 'missing', title: 'Include All Three Structures', message: 'Use <strong>asked</strong> (question), <strong>told</strong> (order), and <strong>advised</strong> (advice).', icon: 'GitMerge' };
      }
      if (!hasInfinitive) {
        return { status: 'missing', title: 'Use Infinitive for Orders/Advice', message: 'Ensure orders/advice use <strong>to + verb</strong> or <strong>not to + verb</strong>.', icon: 'Link' };
      }
      if (!hasComplexVerb || !hasConnecting) {
        return { status: 'missing', title: 'Add Complexity & Connector', message: 'Include a complex verb form and link clauses with <strong>although/when/while</strong>.', icon: 'Layers' };
      }
    }

    // WRITING-10: Formal email
    if (activity.id === 'writing-10') {
      const hasFormal = /\b(furthermore|consequently|it is recommended|it was inquired)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears to|suggests that|appears that)\b/i.test(clean);
      const hasPassive = /\b(is|are|was|were|has been|have been) \w+ed\b/i.test(original);
      const hasPoliteClosing = /\b(thank you|sincerely|best regards|yours faithfully)\b/i.test(clean);
      const hasFormalVerb = /\b(inquired|requested|suggested|noted)\b/i.test(original);

      if (!hasFormal) {
        return { status: 'missing', title: 'Use Formal Connectors', message: 'Replace informal links with <strong>furthermore/consequently</strong>.', icon: 'Link' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use <strong>may/might/appears to</strong> to show academic caution.', icon: 'Shield' };
      }
      if (!hasPassive || !hasPoliteClosing || !hasFormalVerb) {
        return { status: 'missing', title: 'Add Passive, Closing & Formal Verb', message: 'Use <strong>is requested/was noted</strong>, polite closing, and <strong>inquired/suggested</strong>.', icon: 'Briefcase' };
      }
    }

    return {
      status: 'success',
      title: 'Excellent Indirect Speech! ✨',
      message: 'Your sentence correctly uses question structures, infinitives, reporting verbs, and proper word order.',
      icon: 'CheckCircle'
    };
  }
};