// checkers/reportedTimePlace.js

export const reportedTimePlaceChecker = {
  name: "Time & Place in Reported Speech",
  minWords: 20,
  
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
    }

    // WRITING-1: Report yesterday's plans
    if (activity.id === 'writing-1') {
      const hasTimeChange = /\b(that day|the day before|the next day|then|before|that week)\b/i.test(clean);
      const hasPlaceChange = /\b(there|that|those|in that|at that)\b/i.test(clean);
      const hasReporting = /\b(said|told|mentioned|explained)\b/i.test(original);
      const hasPronoun = /\b(he|she|they|his|her|their)\b/i.test(clean);

      if (!hasTimeChange) {
        return { status: 'missing', title: 'Adjust Time Expression', message: 'Change time words: <strong>today→that day, yesterday→the day before, tomorrow→the next day</strong>.', icon: 'Calendar' };
      }
      if (!hasPlaceChange) {
        return { status: 'missing', title: 'Adjust Place Expression', message: 'Change place words: <strong>here→there, this→that, these→those</strong>.', icon: 'MapPin' };
      }
      if (!hasReporting || !hasPronoun) {
        return { status: 'missing', title: 'Use Reporting Verb & Pronouns', message: 'Wrap in <strong>said/told</strong> and shift pronouns appropriately.', icon: 'Volume2' };
      }
    }

    // WRITING-2: Convert with time/place shift
    if (activity.id === 'writing-2') {
      const hasReporting = /\b(said|told)\b/i.test(original);
      const hasBackshift = /\b(was|were|had|would)\b/i.test(clean);
      const hasThere = /\bthere\b/i.test(clean);
      const hasThen = /\bthen\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|I|me|him|her)\b/i.test(clean);

      if (!hasReporting) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told</strong> to introduce the statement.', icon: 'Volume2' };
      }
      if (!hasBackshift) {
        return { status: 'missing', title: 'Apply Tense Backshift', message: 'Shift <strong>am→was, is→was, will→would</strong>.', icon: 'Clock' };
      }
      if (!hasThere || !hasThen || !hasPronoun) {
        return { status: 'missing', title: 'Shift Place, Time & Pronouns', message: 'Include <strong>there, then</strong> and adjust pronouns for reported context.', icon: 'MapPin' };
      }
    }

    // WRITING-3: Short story about past event
    if (activity.id === 'writing-3') {
      const hasTimeShift = /\b(the week before|the day before|two days before|then)\b/i.test(clean);
      const hasPlaceShift = /\b(there|in that room|at that place)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|his|her|their)\b/i.test(clean);
      const hasReporting = /\b(said|told|mentioned)\b/i.test(original);
      const hasBackshift = /\b(was|were|had|had been)\b/i.test(clean);

      if (!hasTimeShift || !hasPlaceShift) {
        return { status: 'missing', title: 'Apply Time & Place Shifts', message: 'Shift <strong>last week→the week before</strong> and <strong>here→there</strong>.', icon: 'Calendar' };
      }
      if (!hasPronoun || !hasReporting) {
        return { status: 'missing', title: 'Add Pronouns & Reporting', message: 'Use third-person pronouns and wrap in <strong>said/told</strong>.', icon: 'User' };
      }
      if (!hasBackshift) {
        return { status: 'missing', title: 'Backshift Tenses', message: 'Shift past events to past perfect if needed: <strong>did→had done</strong>.', icon: 'ArrowDown' };
      }
    }

    // WRITING-4: Future plans with time shifts
    if (activity.id === 'writing-4') {
      const hasNextTime = /\b(the next day|the following week|the following month|in two days' time)\b/i.test(clean);
      const hasWould = /\b(would + \w+)\b/i.test(original);
      const hasPronoun = /\b(he|she|they|I|me|his|her)\b/i.test(clean);
      const hasTransition = /\b(because|so|therefore|as a result)\b/i.test(clean);
      const hasReporting = /\b(said|mentioned|claimed)\b/i.test(original);

      if (!hasNextTime) {
        return { status: 'missing', title: 'Shift Future Time Expression', message: 'Change <strong>next week→the following week, tomorrow→the next day</strong>.', icon: 'Calendar' };
      }
      if (!hasWould) {
        return { status: 'missing', title: 'Backshift Will to Would', message: 'Use <strong>would + base verb</strong> for reported future plans.', icon: 'Clock' };
      }
      if (!hasPronoun || !hasTransition || !hasReporting) {
        return { status: 'missing', title: 'Add Pronoun, Transition & Reporting', message: 'Shift pronouns, connect with <strong>because/so</strong>, and wrap in <strong>said/mentioned</strong>.', icon: 'GitMerge' };
      }
    }

    // WRITING-5: Compare time/place references
    if (activity.id === 'writing-5') {
      const hasContrast = /\b(however|although|but|whereas|differently)\b/i.test(clean);
      const hasComparison = /\b(similarly|both|also|likewise)\b/i.test(clean);
      const hasReporting = /\b(said|told|explained)\b/i.test(original);
      const hasTimePlaceShift = /\b(that day|the day before|there|then|the week before)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|his|her)\b/i.test(clean);

      if (!hasContrast || !hasComparison) {
        return { status: 'missing', title: 'Add Contrast & Comparison', message: 'Use <strong>however/although</strong> and <strong>similarly/both</strong>.', icon: 'GitCompare' };
      }
      if (!hasReporting || !hasTimePlaceShift || !hasPronoun) {
        return { status: 'missing', title: 'Use Reported Speech with Shifts', message: 'Include <strong>said/told</strong>, shifted time/place words, and consistent pronouns.', icon: 'Volume2' };
      }
    }

    // WRITING-6: News announcement with shifts
    if (activity.id === 'writing-6') {
      const hasCause = /\b(because|since|as|due to)\b/i.test(clean);
      const hasEffect = /\b(therefore|so|consequently|as a result)\b/i.test(clean);
      const hasTimePlace = /\b(that day|there|the next day|then)\b/i.test(clean);
      const hasResult = /\b(resulted in|led to|caused)\b/i.test(clean);
      const hasReporting = /\b(announced|stated|declared)\b/i.test(original);

      if (!hasCause || !hasEffect) {
        return { status: 'missing', title: 'State Cause & Effect', message: 'Link with <strong>because/since</strong> and <strong>therefore/consequently</strong>.', icon: 'ArrowLeft' };
      }
      if (!hasTimePlace) {
        return { status: 'missing', title: 'Shift Time/Place', message: 'Adjust expressions: <strong>here→there, today→that day</strong>.', icon: 'MapPin' };
      }
      if (!hasResult || !hasReporting) {
        return { status: 'missing', title: 'Add Result & Reporting', message: 'Show outcome with <strong>led to/resulted in</strong> and wrap in <strong>announced/stated</strong>.', icon: 'ArrowRight' };
      }
    }

    // WRITING-7: Opinion with time/place shifts
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think|from my perspective)\b/i.test(clean);
      const hasEvidence = /\b(for example|this is because|evidence shows|research indicates)\b/i.test(clean);
      const hasReporting = /\b(said|told|explained|stated)\b/i.test(original);
      const hasTimePlaceShift = /\b(then|there|that day|the day before|the week before)\b/i.test(clean);
      const hasSupport = /\b(because|since|as|therefore)\b/i.test(clean);

      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion/I believe</strong>.', icon: 'MessageSquare' };
      }
      if (!hasEvidence) {
        return { status: 'missing', title: 'Add Supporting Evidence', message: 'Support with <strong>for example/because</strong>.', icon: 'FileText' };
      }
      if (!hasReporting || !hasTimePlaceShift) {
        return { status: 'missing', title: 'Include Reported Speech with Shifts', message: 'Report others using <strong>said/told</strong> and shift time/place expressions.', icon: 'Volume2' };
      }
    }

    // WRITING-8: Hypothetical with shifts
    if (activity.id === 'writing-8') {
      const hasConditional = /\b(if|unless|provided that|supposing)\b/i.test(clean);
      const hasHypothetical = /\b(would|could|might|should)\b/i.test(clean);
      const hasConsequence = /\b(then|would|could result in|would mean that)\b/i.test(clean);
      const hasShiftedTime = /\b(the next day|the following week|then|that day|in two days)\b/i.test(clean);
      const hasPronoun = /\b(he|she|they|I|me|him|her)\b/i.test(clean);

      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If/Unless/Supposing</strong> + condition.', icon: 'GitBranch' };
      }
      if (!hasHypothetical || !hasConsequence) {
        return { status: 'missing', title: 'Add Modal & Consequence', message: 'Pair with <strong>would/could</strong> and state the result.', icon: 'Zap' };
      }
      if (!hasShiftedTime || !hasPronoun) {
        return { status: 'missing', title: 'Shift Time & Pronouns', message: 'Adjust <strong>tomorrow→the next day</strong> and pronouns in the hypothetical.', icon: 'Calendar' };
      }
    }

    // WRITING-9: Complex conversation
    if (activity.id === 'writing-9') {
      const hasPastTime = /\b(the day before|the week before|two days before|then)\b/i.test(clean);
      const hasFutureShift = /\b(the next day|the following week|would)\b/i.test(clean);
      const hasPlaceShift = /\b(there|that|in that room)\b/i.test(clean);
      const hasConnecting = /\b(although|when|after|while)\b/i.test(clean);
      const hasComplexVerb = /\b(had been \w+ing|would have been|could have done)\b/i.test(original);

      if (!hasPastTime || !hasFutureShift) {
        return { status: 'missing', title: 'Include Past & Future Shifts', message: 'Show both <strong>the day before</strong> and <strong>the next day/would</strong>.', icon: 'Calendar' };
      }
      if (!hasPlaceShift) {
        return { status: 'missing', title: 'Shift Place Expression', message: 'Include <strong>there/that</strong> for location changes.', icon: 'MapPin' };
      }
      if (!hasConnecting || !hasComplexVerb) {
        return { status: 'missing', title: 'Add Connector & Complex Form', message: 'Link clauses with <strong>when/although</strong> and use a complex verb structure.', icon: 'GitMerge' };
      }
    }

    // WRITING-10: Formal email
    if (activity.id === 'writing-10') {
      const hasFormal = /\b(furthermore|consequently|it is recommended|it was stated)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears to|suggests that|appears that)\b/i.test(clean);
      const hasPassive = /\b(is|are|was|were|has been|have been) \w+ed\b/i.test(original);
      const hasPoliteClosing = /\b(thank you|sincerely|best regards|yours faithfully)\b/i.test(clean);
      const hasConsistentShift = /\b(that day|the next day|there|then|the week before)\b/i.test(clean);

      if (!hasFormal) {
        return { status: 'missing', title: 'Use Formal Connectors', message: 'Replace informal links with <strong>furthermore/consequently</strong>.', icon: 'Link' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use <strong>may/might/appears to</strong> to show academic caution.', icon: 'Shield' };
      }
      if (!hasPassive || !hasPoliteClosing || !hasConsistentShift) {
        return { status: 'missing', title: 'Add Passive, Closing & Consistent Shifts', message: 'Use <strong>is recommended/was conducted</strong>, polite closing, and consistently shift time/place.', icon: 'Briefcase' };
      }
    }

    return {
      status: 'success',
      title: 'Perfect Time/Place Shifts! ✨',
      message: 'Your sentence correctly adjusts time/place expressions, applies backshift, and maintains contextual accuracy.',
      icon: 'CheckCircle'
    };
  }
};