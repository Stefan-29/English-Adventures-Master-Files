// checkers/confusedDescriptiveWords.js

export const confusedDescriptiveWordsChecker = {
  name: "Confused Descriptive Words",
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

    // WRITING-1: Like/As/Look like/Be like practice
    if (activity.id === 'writing-1') {
      const hasLike = /\b(like|looks like|look like)\b/i.test(original);
      const hasAs = /\b(as)\b/i.test(clean);
      const hasLookLike = /\b(look like)\b/i.test(original);
      const hasBeLike = /\b(be like|is like|are like)\b/i.test(original);
      const hasAtLeastTwo = (hasLike ? 1 : 0) + (hasAs ? 1 : 0) + (hasLookLike ? 1 : 0) + (hasBeLike ? 1 : 0) >= 2;

      if (!hasLike && !hasAs && !hasLookLike && !hasBeLike) {
        return {
          status: 'missing',
          title: 'Use Like, As, Look Like, or Be Like',
          message: 'Include <strong>like</strong>, <strong>as</strong>, <strong>look like</strong>, or <strong>be like</strong> to describe similarity, role, appearance, or character.',
          icon: 'Search'
        };
      }
      if (!hasAtLeastTwo) {
        return {
          status: 'missing',
          title: 'Use at Least Two Different Words',
          message: 'Include at least <strong>two</strong> different words from like/as/look like/be like.',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-2: Job/Work practice
    if (activity.id === 'writing-2') {
      const hasJob = /\b(job|jobs|a job)\b/i.test(clean);
      const hasWorkNoun = /\b(work)\b(?!\s+(as|for|with))\b/i.test(original); // work as noun, not verb
      const hasWorkVerb = /\b(works?|working|worked)\b/i.test(original);
      const hasAtLeastThree = (hasJob ? 1 : 0) + (hasWorkNoun ? 1 : 0) + (hasWorkVerb ? 1 : 0) >= 3;

      if (!hasJob && !hasWorkNoun && !hasWorkVerb) {
        return {
          status: 'missing',
          title: 'Use Job or Work',
          message: 'Include <strong>job</strong> (countable), <strong>work</strong> (uncountable noun), or <strong>work</strong> (verb).',
          icon: 'Briefcase'
        };
      }
      if (!hasAtLeastThree) {
        return {
          status: 'missing',
          title: 'Use at Least Three Instances',
          message: 'Include <strong>job</strong> and/or <strong>work</strong> at least three times.',
          icon: 'Hash'
        };
      }
      // Check for common error: 'much jobs' or 'many work'
      if (/\b(much|many)\s+(jobs?|works?)\b/i.test(original)) {
        return {
          status: 'error',
          title: 'Check Countable/Uncountable Quantifiers',
          message: '<strong>Job</strong> is countable: many jobs, a job. <strong>Work</strong> is uncountable: much work, a lot of work.',
          icon: 'AlertCircle'
        };
      }
    }

    // WRITING-3: Trip/Journey/Travel practice
    if (activity.id === 'writing-3') {
      const hasTrip = /\b(trip|trips|a trip)\b/i.test(clean);
      const hasJourney = /\b(journey|journeys|the journey)\b/i.test(clean);
      const hasTravel = /\b(travel)\b(?!\s+(as|for|with))\b/i.test(original); // travel as noun/verb
      const hasAtLeastTwo = (hasTrip ? 1 : 0) + (hasJourney ? 1 : 0) + (hasTravel ? 1 : 0) >= 2;

      if (!hasTrip && !hasJourney && !hasTravel) {
        return {
          status: 'missing',
          title: 'Use Trip, Journey, or Travel',
          message: 'Include <strong>trip</strong> (short outing), <strong>journey</strong> (distance/time), or <strong>travel</strong> (general concept).',
          icon: 'Map'
        };
      }
      if (!hasAtLeastTwo) {
        return {
          status: 'missing',
          title: 'Use at Least Two Different Words',
          message: 'Include at least <strong>two</strong> different words from trip/journey/travel.',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-4: Tour/Voyage practice
    if (activity.id === 'writing-4') {
      const hasTour = /\b(tour|tours|toured|a tour)\b/i.test(clean);
      const hasVoyage = /\b(voyage|voyages|a voyage)\b/i.test(clean);
      const hasContextClue = /\b(multiple places|sea|ocean|guided|historical|literary)\b/i.test(clean);

      if (!hasTour && !hasVoyage) {
        return {
          status: 'missing',
          title: 'Use Tour or Voyage',
          message: 'Include <strong>tour</strong> (visiting multiple places) or <strong>voyage</strong> (long sea/space journey).',
          icon: 'Globe'
        };
      }
      if (!hasContextClue) {
        return {
          status: 'missing',
          title: 'Add Context Clues',
          message: 'Include context clues like <strong>multiple places</strong> (for tour) or <strong>sea/ocean</strong> (for voyage).',
          icon: 'Tag'
        };
      }
    }

    // WRITING-5: False friends practice
    if (activity.id === 'writing-5') {
      const hasActually = /\b(actually)\b/i.test(clean);
      const hasCurrently = /\b(currently)\b/i.test(clean);
      const hasAttend = /\b(attend|attended|attending)\b/i.test(original);
      const hasAssist = /\b(assist|assisted|assisting)\b/i.test(original);
      const hasAtLeastOne = hasActually || hasCurrently || hasAttend || hasAssist;

      if (!hasAtLeastOne) {
        return {
          status: 'missing',
          title: 'Use Actually, Currently, Attend, or Assist',
          message: 'Include <strong>actually</strong> (in fact), <strong>currently</strong> (now), <strong>attend</strong> (be present), or <strong>assist</strong> (help).',
          icon: 'AlertTriangle'
        };
      }
      // Check for false friend confusion: 'actually' meaning 'currently'
      if (/\b(actually)\b.*\b(now|currently|at the moment)\b/i.test(original) && !/\b(in fact|really)\b/i.test(original)) {
        return {
          status: 'error',
          title: 'Check False Friend: Actually vs Currently',
          message: '<strong>Actually</strong> = in fact/really. <strong>Currently</strong> = now/at the moment. Did you mean <strong>currently</strong>?',
          icon: 'AlertCircle'
        };
      }
    }

    // WRITING-6+: Contrast and advanced checks
    if (activity.id === 'writing-6' || activity.id === 'writing-7') {
      const hasContrast = /\b(however|although|but|while)\b/i.test(clean);
      const hasDescriptiveWords = /\b(like|as|job|work|trip|journey|travel)\b/i.test(clean);

      if (!hasContrast && activity.id === 'writing-6') {
        return {
          status: 'missing',
          title: 'Add Contrast',
          message: 'Use <strong>however/although/but</strong> to show differences between word uses.',
          icon: 'GitCompare'
        };
      }
      if (!hasDescriptiveWords && activity.id === 'writing-7') {
        return {
          status: 'missing',
          title: 'Use Descriptive Words',
          message: 'Include <strong>trip</strong>, <strong>journey</strong>, and/or <strong>travel</strong> in your instructions.',
          icon: 'Map'
        };
      }
    }

    // WRITING-8: Countable/uncountable advanced usage
    if (activity.id === 'writing-8') {
      const hasCountable = /\b(a job|jobs|a trip|trips|a tour|tours)\b/i.test(original);
      const hasUncountable = /\b(much work|much travel|a lot of work|a lot of travel)\b/i.test(clean);
      const hasBoth = hasCountable && hasUncountable;

      if (!hasCountable && !hasUncountable) {
        return {
          status: 'missing',
          title: 'Use Countable or Uncountable Forms',
          message: 'Include countable forms (<strong>a job, trips</strong>) or uncountable forms (<strong>much work, travel</strong>).',
          icon: 'Hash'
        };
      }
      if (!hasBoth) {
        return {
          status: 'missing',
          title: 'Use Both Countable and Uncountable',
          message: 'Include both countable (<strong>job, trip</strong>) AND uncountable (<strong>work, travel</strong>) forms.',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-9/10: Formal register & mastery
    if (activity.id === 'writing-9' || activity.id === 'writing-10') {
      const hasFormalStructure = /\b(currently|journey|attend|as a)\b/i.test(original);
      const hasPreciseChoice = /\b(currently|journey|attend|as a|tour|voyage)\b/i.test(original);
      const hasMultipleGroups = (original.match(/\b(like|as|look like|be like|job|work|trip|journey|travel|tour|voyage|actually|currently|attend|assist)\b/gi) || []).length >= 3;

      if (!hasFormalStructure && activity.id === 'writing-9') {
        return {
          status: 'missing',
          title: 'Use Formal Structures',
          message: 'In formal writing, prefer precise words: <strong>currently</strong> (not actually), <strong>journey</strong> (not trip).',
          icon: 'Briefcase'
        };
      }
      if (!hasMultipleGroups && activity.id === 'writing-10') {
        return {
          status: 'missing',
          title: 'Use Multiple Word Groups',
          message: 'Include at least 3 different confused descriptive word groups correctly.',
          icon: 'Layers'
        };
      }
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Excellent Word Usage! ✨',
      message: 'Your sentence correctly uses confused descriptive words with proper structures and meanings.',
      icon: 'CheckCircle'
    };
  }
};