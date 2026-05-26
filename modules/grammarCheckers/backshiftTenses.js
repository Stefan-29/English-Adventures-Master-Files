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
      const hasBackshiftedVerb = /\b(liked|was|were|had|could|would|did|needed)\b/i.test(clean);
      const hasPronounShift = /\b(he|she|they|his|her|their)\b/i.test(clean);
      const hasPattern = /\b(said|told)\s+(that\s+)?(he|she|they|I|we|you)\b/i.test(original);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told/explained</strong> to introduce reported speech.', icon: 'Volume2' };
      }
      if (!hasBackshiftedVerb) {
        return { status: 'missing', title: 'Apply Backshift', message: 'Backshift tenses: <strong>like→liked, am→was, can→could</strong>.', icon: 'Clock' };
      }
      if (!hasPronounShift || !hasPattern) {
        return { status: 'structure', title: 'Shift Pronouns & Structure', message: 'Change <strong>I/you</strong> to <strong>he/she</strong> and follow <strong>said + (that) + clause</strong>.', icon: 'ArrowRightLeft' };
      }
    }

    // WRITING-2: Modal backshift
    if (activity.id === 'writing-2') {
      const hasReporting = /\b(said|told|mentioned)\b/i.test(original);
      const hasModalShift = /\b(could|would|might|had to)\b/i.test(clean);
      const hasTimeShift = /\b(the next day|the following day|the day after)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|I|me|him|her)\b/i.test(clean);

      if (!hasReporting) {
        return { status: 'missing', title: 'Use Reporting Verb', message: 'Include <strong>said/told</strong> to introduce the modal statement.', icon: 'Volume2' };
      }
      if (!hasModalShift) {
        return { status: 'missing', title: 'Backshift Modal', message: 'Change <strong>can→could, will→would, must→had to</strong>.', icon: 'Key' };
      }
      if (!hasTimeShift || !hasPronoun) {
        return { status: 'missing', title: 'Shift Time & Pronouns', message: 'Use <strong>the next day/following day</strong> and adjust pronouns accordingly.', icon: 'Calendar' };
      }
    }

    // WRITING-3: Past perfect story
    if (activity.id === 'writing-3') {
      const hasPastPerfect = /\b(had +\s+\w+ed|had +\w+en)\b/i.test(original);
      const hasPastContPerfect = /\b(had been \w+ing)\b/i.test(original);
      const hasTimeMarker = /\b(before|after|when|by then|earlier)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|I|me|his|her)\b/i.test(clean);
      const hasReporting = /\b(said|told|mentioned)\b/i.test(original);

      if (!hasPastPerfect && !hasPastContPerfect) {
        return { status: 'missing', title: 'Use Past Perfect', message: 'Include <strong>had + past participle</strong> or <strong>had been + -ing</strong>.', icon: 'Layers' };
      }
      if (!hasTimeMarker) {
        return { status: 'missing', title: 'Add Time Sequence', message: 'Use markers like <strong>before/after/when</strong> to show sequence.', icon: 'Calendar' };
      }
      if (!hasPronoun || !hasReporting) {
        return { status: 'missing', title: 'Add Reporting & Pronouns', message: 'Wrap in <strong>said/told</strong> and shift pronouns to third person.', icon: 'User' };
      }
    }

    // WRITING-4: Advice with modal backshift
    if (activity.id === 'writing-4') {
      const hasAdviceVerb = /\b(advised|suggested|recommended)\b/i.test(clean);
      const hasModal = /\b(should|could|might|had to|would)\b/i.test(clean);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasPronoun = /\b(me|him|her|us|them|I)\b/i.test(clean);
      const hasTransition = /\b(because|since|so|therefore|as)\b/i.test(clean);

      if (!hasAdviceVerb) {
        return { status: 'missing', title: 'Use Advice Verb', message: 'Use <strong>advised/suggested</strong> to report the advice.', icon: 'Lightbulb' };
      }
      if (!hasModal && !hasInfinitive) {
        return { status: 'missing', title: 'Add Modal or Infinitive', message: 'Include <strong>should/could/had to</strong> OR <strong>to + verb</strong>.', icon: 'Key' };
      }
      if (!hasPronoun || !hasTransition) {
        return { status: 'missing', title: 'Add Pronoun & Transition', message: 'Specify who was advised and link with <strong>because/so/therefore</strong>.', icon: 'GitMerge' };
      }
    }

    // WRITING-5: Compare past event statements
    if (activity.id === 'writing-5') {
      const hasContrast = /\b(however|although|but|whereas|differently)\b/i.test(clean);
      const hasComparison = /\b(similarly|both|also|likewise)\b/i.test(clean);
      const hasReporting = /\b(said|told|explained|claimed)\b/i.test(original);
      const hasBackshifted = /\b(was|were|had|did|would|could)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|his|her)\b/i.test(clean);

      if (!hasContrast || !hasComparison) {
        return { status: 'missing', title: 'Add Contrast & Comparison', message: 'Use <strong>however/although</strong> and <strong>similarly/both</strong>.', icon: 'GitCompare' };
      }
      if (!hasReporting || !hasBackshifted || !hasPronoun) {
        return { status: 'missing', title: 'Use Backshifted Reported Speech', message: 'Include <strong>said/told</strong> with backshifted verbs and consistent pronouns.', icon: 'Volume2' };
      }
    }

    // WRITING-6: Future backshift in news
    if (activity.id === 'writing-6') {
      const hasCause = /\b(because|since|as|due to)\b/i.test(clean);
      const hasEffect = /\b(therefore|so|consequently|as a result)\b/i.test(clean);
      const hasWould = /\b(would + \w+)\b/i.test(original);
      const hasTimeShift = /\b(the next day|the following week|then|later)\b/i.test(clean);
      const hasReporting = /\b(announced|stated|declared)\b/i.test(original);

      if (!hasCause || !hasEffect) {
        return { status: 'missing', title: 'Add Cause & Effect', message: 'Link ideas with <strong>because/since</strong> and <strong>therefore/so</strong>.', icon: 'ArrowLeft' };
      }
      if (!hasWould) {
        return { status: 'missing', title: 'Backshift Future to Would', message: 'Change <strong>will→would</strong> in the reported clause.', icon: 'Clock' };
      }
      if (!hasTimeShift || !hasReporting) {
        return { status: 'missing', title: 'Add Time Shift & Reporting', message: 'Shift <strong>tomorrow→the next day</strong> and wrap in <strong>announced/stated</strong>.', icon: 'Calendar' };
      }
    }

    // WRITING-7: Opinion with backshift
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think|from my perspective)\b/i.test(clean);
      const hasEvidence = /\b(for example|this is because|evidence shows|research indicates)\b/i.test(clean);
      const hasReporting = /\b(said|told|explained|stated)\b/i.test(original);
      const hasBackshift = /\b(was|were|had|would|could|did)\b/i.test(clean);
      const hasSupport = /\b(since|because|as|therefore|so)\b/i.test(clean);

      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion/I believe</strong>.', icon: 'MessageSquare' };
      }
      if (!hasEvidence) {
        return { status: 'missing', title: 'Add Supporting Evidence', message: 'Support with <strong>for example/because</strong>.', icon: 'FileText' };
      }
      if (!hasReporting || !hasBackshift) {
        return { status: 'missing', title: 'Include Backshifted Reported Speech', message: 'Report others using <strong>said/told</strong> with proper tense backshift.', icon: 'ArrowDown' };
      }
    }

    // WRITING-8: Conditional backshift
    if (activity.id === 'writing-8') {
      const hasConditional = /\b(if|unless|provided that|supposing)\b/i.test(clean);
      const hasHypothetical = /\b(would|could|might|should)\b/i.test(clean);
      const hasConsequence = /\b(then|would|could result in|would mean that)\b/i.test(clean);
      const hasBackshiftedVerb = /\b(was|were|had|would have|could have)\b/i.test(clean);
      const hasReporting = /\b(said|mentioned|claimed|stated)\b/i.test(original);

      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If/Unless/Supposing</strong> + condition.', icon: 'GitBranch' };
      }
      if (!hasHypothetical) {
        return { status: 'missing', title: 'Use Modal Verb', message: 'Pair conditionals with <strong>would/could/might</strong>.', icon: 'Zap' };
      }
      if (!hasConsequence || !hasBackshiftedVerb || !hasReporting) {
        return { status: 'missing', title: 'Add Consequence, Backshift & Reporting', message: 'Complete the conditional, backshift verbs, and wrap in <strong>said/mentioned</strong>.', icon: 'ArrowRight' };
      }
    }

    // WRITING-9: Complex conversation
    if (activity.id === 'writing-9') {
      const hasPastPerfect = /\b(had been|had done|had finished)\b/i.test(clean);
      const hasNegativeBackshift = /\b(didn't|wasn't|hadn't|wouldn't)\b/i.test(original);
      const hasGeneralTruth = /\b(is|are|boils|rises|remains)\b/i.test(clean);
      const hasConnecting = /\b(although|however|while|because|but)\b/i.test(clean);
      const hasComplexForm = /\b(had been \w+ing|would have been|could have done)\b/i.test(original);

      if (!hasPastPerfect || !hasNegativeBackshift) {
        return { status: 'missing', title: 'Use Past Perfect & Negative Backshift', message: 'Include <strong>had + participle</strong> and backshifted negatives like <strong>didn\'t wasn\'t</strong>.', icon: 'Layers' };
      }
      if (!hasGeneralTruth) {
        return { status: 'missing', title: 'Include General Truth', message: 'Keep present tense for timeless facts: <strong>is/are/boils</strong>.', icon: 'CheckCircle' };
      }
      if (!hasConnecting || !hasComplexForm) {
        return { status: 'missing', title: 'Add Connector & Complex Form', message: 'Link with <strong>although/while</strong> and use a complex verb structure.', icon: 'GitMerge' };
      }
    }

    // WRITING-10: Formal email
    if (activity.id === 'writing-10') {
      const hasFormal = /\b(furthermore|consequently|it is recommended|it was stated)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears to|suggests that|appears that)\b/i.test(clean);
      const hasPassive = /\b(is|are|was|were|has been|have been) \w+ed\b/i.test(original);
      const hasPoliteClosing = /\b(thank you|sincerely|best regards|yours faithfully)\b/i.test(clean);
      const hasConsistentBackshift = /\b(would|had|was|were|could)\b/i.test(clean);

      if (!hasFormal) {
        return { status: 'missing', title: 'Use Formal Connectors', message: 'Replace informal links with <strong>furthermore/consequently</strong>.', icon: 'Link' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use <strong>may/might/appears to</strong> to show academic caution.', icon: 'Shield' };
      }
      if (!hasPassive || !hasPoliteClosing || !hasConsistentBackshift) {
        return { status: 'missing', title: 'Add Passive, Closing & Consistent Backshift', message: 'Use <strong>is recommended/was conducted</strong>, polite closing, and maintain backshift consistency.', icon: 'Briefcase' };
      }
    }

    return {
      status: 'success',
      title: 'Perfect Backshift! ✨',
      message: 'Your sentence correctly applies tense backshift rules, modal transformations, and advanced reporting structures.',
      icon: 'CheckCircle'
    };
  }
};