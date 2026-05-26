// checkers/reportedSpeech.js

export const reportedSpeechChecker = {
  name: "Reported Speech",
  minWords: 20,
  
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    // BASIC LENGTH CHECK
    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return {
        status: 'too-short',
        title: 'Too Short',
        message: 'Write full sentences. Aim for at least 20 words.',
        icon: 'Pencil'
      };
    }

    // GLOBAL: Check for direct quotation marks in reported speech activities
    const hasDirectQuote = /["'][^"']+["']/.test(original);
    if (hasDirectQuote && activity.id.startsWith('writing')) {
      return {
        status: 'format',
        title: 'Remove Quotation Marks',
        message: 'Reported speech does not use quotation marks. Report the meaning, not the exact words.',
        icon: 'Quote'
      };
    }

    // WRITING-1: Basic reported statement
    if (activity.id === 'writing-1') {
      const hasReportingVerb = /\b(said|told)\b/i.test(original);
      const hasPronounShift = /\b(he|she|they|his|her|their|him|them)\b/i.test(clean);
      const hasPastContext = /\b(was|were|had|liked|wanted|did|needed)\b/i.test(clean);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said</strong> or <strong>told</strong> to introduce the statement.', icon: 'Volume2' };
      }
      if (!hasPronounShift) {
        return { status: 'missing', title: 'Update Pronouns', message: 'Change <strong>I/my</strong> to <strong>he/she/his/her</strong> to match the reporter\'s perspective.', icon: 'User' };
      }
      if (!hasPastContext) {
        return { status: 'missing', title: 'Check Tense Context', message: 'When the reporting verb is past, backshift the main verb: <strong>am→was, like→liked</strong>.', icon: 'Clock' };
      }
    }

    // WRITING-2: Direct to reported conversion
    if (activity.id === 'writing-2') {
      const hasReportingVerb = /\b(said|told|explained)\b/i.test(original);
      const hasBackshift = /\b(liked|was|were|had|could|would)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|I|me)\b/i.test(clean);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told/explained</strong> to report the statement.', icon: 'Volume2' };
      }
      if (!hasBackshift) {
        return { status: 'missing', title: 'Apply Backshift', message: 'Shift the tense back: <strong>present→past, will→would, can→could</strong>.', icon: 'ArrowDown' };
      }
      if (!hasPronoun) {
        return { status: 'missing', title: 'Shift Pronouns', message: 'Adjust pronouns: <strong>I→he/she, you→I/me</strong>.', icon: 'User' };
      }
    }

    // WRITING-3: Short story (2x reporting verb)
    if (activity.id === 'writing-3') {
      const structureCount = (original.match(/\b(said|told|announced|explained)\b/gi) || []).length;
      const hasTimeMarker = /\b(yesterday|then|after|when|that day|the next day)\b/i.test(clean);
      const hasActionVerb = /\b(went|did|made|said|told|visited|finished|started)\b/i.test(clean);

      if (structureCount < 2) {
        return { status: 'missing', title: 'Use Reported Speech Twice', message: 'Include <strong>said/told/announced</strong> <strong>at least two times</strong>.', icon: 'Repeat' };
      }
      if (!hasTimeMarker) {
        return { status: 'missing', title: 'Add Time Sequence', message: 'Use time markers like <strong>that day/then/after</strong> to order events.', icon: 'Calendar' };
      }
      if (!hasActionVerb) {
        return { status: 'missing', title: 'Include Action Verbs', message: 'Add action words like <strong>went/did/visited</strong> for a dynamic story.', icon: 'Zap' };
      }
    }

    // WRITING-4: Advice with modal verbs
    if (activity.id === 'writing-4') {
      const hasAdviceVerb = /\b(advised|suggested|recommended)\b/i.test(clean);
      const hasModal = /\b(should|could|might|would)\b/i.test(clean);
      const hasInfinitive = /\bto \w+\b/i.test(original);
      const hasPronoun = /\b(he|she|they|I|me|him|her)\b/i.test(clean);

      if (!hasAdviceVerb) {
        return { status: 'missing', title: 'Use Advice Verb', message: 'Use <strong>advised/suggested</strong> to report advice.', icon: 'Lightbulb' };
      }
      if (!hasModal && !hasInfinitive) {
        return { status: 'missing', title: 'Add Modal or Infinitive', message: 'Include <strong>should/could/might</strong> OR <strong>to + verb</strong> for the advice.', icon: 'Key' };
      }
      if (!hasPronoun) {
        return { status: 'missing', title: 'Adjust Pronouns', message: 'Change pronouns to match who received the advice.', icon: 'User' };
      }
    }

    // WRITING-5: Compare/contrast perspectives
    if (activity.id === 'writing-5') {
      const hasContrast = /\b(however|although|but|whereas|on the other hand)\b/i.test(clean);
      const hasComparison = /\b(similarly|likewise|both|also|in the same way)\b/i.test(clean);
      const hasReporting = /\b(said|told|explained|claimed)\b/i.test(original);
      const hasPronounConsistency = /\b(he|she|they|his|her)\b/i.test(clean);

      if (!hasContrast) {
        return { status: 'missing', title: 'Add Contrast', message: 'Use <strong>however/although/but</strong> to show differences.', icon: 'GitCompare' };
      }
      if (!hasComparison) {
        return { status: 'missing', title: 'Add Comparison', message: 'Use <strong>similarly/both/also</strong> to show similarities.', icon: 'GitMerge' };
      }
      if (!hasReporting || !hasPronounConsistency) {
        return { status: 'missing', title: 'Use Reported Speech', message: 'Include <strong>said/told</strong> with consistent third-person pronouns.', icon: 'Volume2' };
      }
    }

    // WRITING-6: Cause-effect news announcement
    if (activity.id === 'writing-6') {
      const hasCause = /\b(because|since|as|due to)\b/i.test(clean);
      const hasEffect = /\b(therefore|so|consequently|as a result|thus)\b/i.test(clean);
      const hasAnnounced = /\b(announced|stated|declared)\b/i.test(original);
      const hasTimeShift = /\b(that day|the next day|then|before)\b/i.test(clean);

      if (!hasCause) {
        return { status: 'missing', title: 'State the Cause', message: 'Begin with <strong>because/since/as</strong> to explain why.', icon: 'ArrowLeft' };
      }
      if (!hasEffect) {
        return { status: 'missing', title: 'Show the Effect', message: 'Use <strong>therefore/so/consequently</strong> to show results.', icon: 'ArrowRight' };
      }
      if (!hasAnnounced || !hasTimeShift) {
        return { status: 'missing', title: 'Apply Announced + Time Shift', message: 'Use <strong>announced/stated</strong> and shift time expressions appropriately.', icon: 'Calendar' };
      }
    }

    // WRITING-7: Opinion with supporting evidence
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think|from my perspective)\b/i.test(clean);
      const hasEvidence = /\b(for example|this is because|evidence shows|research indicates)\b/i.test(clean);
      const hasReported = /\b(said|told|explained|stated)\b/i.test(original);
      const hasBackshift = /\b(was|were|had|would|could)\b/i.test(clean);

      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion/I believe</strong>.', icon: 'MessageSquare' };
      }
      if (!hasEvidence) {
        return { status: 'missing', title: 'Add Supporting Evidence', message: 'Support your view with <strong>for example/because</strong>.', icon: 'FileText' };
      }
      if (!hasReported || !hasBackshift) {
        return { status: 'missing', title: 'Include Backshifted Reported Speech', message: 'Report others using <strong>said/told</strong> with proper tense backshift.', icon: 'ArrowDown' };
      }
    }

    // WRITING-8: Conditional reported speech
    if (activity.id === 'writing-8') {
      const hasConditional = /\b(if|unless|provided that|supposing)\b/i.test(clean);
      const hasHypothetical = /\b(would|could|might|should)\b/i.test(clean);
      const hasConsequence = /\b(then|would|could result in|would mean that)\b/i.test(clean);
      const hasReportedVerb = /\b(said|mentioned|claimed|stated)\b/i.test(original);

      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If/Unless/Supposing</strong> + condition.', icon: 'GitBranch' };
      }
      if (!hasHypothetical) {
        return { status: 'missing', title: 'Use Modal Verb', message: 'Pair conditionals with <strong>would/could/might</strong>.', icon: 'Zap' };
      }
      if (!hasConsequence || !hasReportedVerb) {
        return { status: 'missing', title: 'Add Consequence & Reporting', message: 'Complete the conditional with a consequence and wrap in <strong>said/mentioned</strong>.', icon: 'ArrowRight' };
      }
    }

    // WRITING-9: Complex conversation (statement, negative, general truth)
    if (activity.id === 'writing-9') {
      const hasPastPerfect = /\b(had been|had done|had finished)\b/i.test(clean);
      const hasNegativeBackshift = /\b(didn't|wasn't|hadn't|wouldn't)\b/i.test(original);
      const hasGeneralTruth = /\b(is|are|boils|rises|remains)\b/i.test(clean);
      const hasConnecting = /\b(although|however|while|because|but)\b/i.test(clean);

      if (!hasPastPerfect) {
        return { status: 'missing', title: 'Use Past Perfect', message: 'Include a <strong>had + past participle</strong> structure for earlier past actions.', icon: 'Layers' };
      }
      if (!hasNegativeBackshift) {
        return { status: 'missing', title: 'Add Negative Backshift', message: 'Use backshifted negatives like <strong>didn\'t/wasn\'t/hadn\'t</strong>.', icon: 'XCircle' };
      }
      if (!hasGeneralTruth || !hasConnecting) {
        return { status: 'missing', title: 'Include General Truth & Connector', message: 'Keep present tense for facts and link with <strong>although/however</strong>.', icon: 'GitMerge' };
      }
    }

    // WRITING-10: Formal email with hedging & passive
    if (activity.id === 'writing-10') {
      const hasFormal = /\b(furthermore|consequently|it is recommended|it was stated)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears to|suggests that|appears that)\b/i.test(clean);
      const hasPassive = /\b(is|are|was|were|has been|have been) \w+ed\b/i.test(original);
      const hasPoliteClosing = /\b(thank you|sincerely|best regards|yours faithfully)\b/i.test(clean);
      const hasFormalVerb = /\b(stated|indicated|suggested|noted)\b/i.test(original);

      if (!hasFormal) {
        return { status: 'missing', title: 'Use Formal Connectors', message: 'Replace informal links with <strong>furthermore/consequently</strong>.', icon: 'Link' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use <strong>may/might/appears to</strong> to show academic caution.', icon: 'Shield' };
      }
      if (!hasPassive || !hasPoliteClosing || !hasFormalVerb) {
        return { status: 'missing', title: 'Add Passive, Closing & Formal Verb', message: 'Use <strong>is recommended/was conducted</strong>, polite closing, and <strong>stated/indicated</strong>.', icon: 'Briefcase' };
      }
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Excellent Reported Speech! ✨',
      message: 'Your sentence correctly uses reporting verbs, tense backshift, pronoun changes, and appropriate context markers.',
      icon: 'CheckCircle'
    };
  }
};