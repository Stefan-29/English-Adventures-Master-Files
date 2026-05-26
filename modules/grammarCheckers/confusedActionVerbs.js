// checkers/confusedActionVerbs.js

export const confusedActionVerbsChecker = {
  name: "Confused Action Verbs",
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

    // WRITING-1: Look/See/Watch practice
    if (activity.id === 'writing-1') {
      const hasLook = /\b(looked?|looking)\s+at\b/i.test(original);
      const hasSee = /\b(saw?|seeing)\b/i.test(clean);
      const hasWatch = /\b(watched?|watching)\b/i.test(clean);
      const hasAtLeastTwo = (hasLook ? 1 : 0) + (hasSee ? 1 : 0) + (hasWatch ? 1 : 0) >= 2;

      if (!hasLook && !hasSee && !hasWatch) {
        return {
          status: 'missing',
          title: 'Use Look, See, or Watch',
          message: 'Include <strong>look at</strong>, <strong>see</strong>, or <strong>watch</strong> to describe visual actions.',
          icon: 'Eye'
        };
      }
      if (!hasAtLeastTwo) {
        return {
          status: 'missing',
          title: 'Use at Least Two Verbs',
          message: 'Include at least <strong>two</strong> different verbs from look/see/watch.',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-2: Raise/Rise practice
    if (activity.id === 'writing-2') {
      const hasRaise = /\b(raise|raised|raising)\s+\w+/i.test(original); // raise + object
      const hasRise = /\b(rise|rose|risen)\b(?!\s+(the|a|my|your))/i.test(original); // rise, no object
      const hasCorrectUsage = hasRaise || hasRise;

      if (!hasCorrectUsage) {
        return {
          status: 'missing',
          title: 'Use Raise or Rise',
          message: 'Include <strong>raise</strong> (with object) or <strong>rise</strong> (no object).',
          icon: 'ArrowUp'
        };
      }
      if (hasRaise && !/\b(raise|raised|raising)\s+\w+/i.test(original)) {
        return {
          status: 'structure',
          title: 'Raise Needs an Object',
          message: '<strong>Raise</strong> requires a direct object: raise the flag, raise prices.',
          icon: 'AlertCircle'
        };
      }
    }

    // WRITING-3: Mistake/Error/Fault practice
    if (activity.id === 'writing-3') {
      const hasMistake = /\b(mistake|mistakes)\b/i.test(clean);
      const hasError = /\b(error|errors)\b/i.test(clean);
      const hasFault = /\b(fault)\b/i.test(clean);
      const hasAtLeastOne = hasMistake || hasError || hasFault;

      if (!hasAtLeastOne) {
        return {
          status: 'missing',
          title: 'Use Mistake, Error, or Fault',
          message: 'Include <strong>mistake</strong> (human slip-up), <strong>error</strong> (technical), or <strong>fault</strong> (blame).',
          icon: 'AlertTriangle'
        };
      }
    }

    // WRITING-4: Quit/Quite/Quiet practice
    if (activity.id === 'writing-4') {
      const hasQuit = /\b(quit|quits|quitting|quitted)\b/i.test(clean);
      const hasQuite = /\b(quite)\b/i.test(clean);
      const hasQuiet = /\b(quiet|quieter|quietest)\b/i.test(clean);
      const hasAtLeastOne = hasQuit || hasQuite || hasQuiet;

      if (!hasAtLeastOne) {
        return {
          status: 'missing',
          title: 'Use Quit, Quite, or Quiet',
          message: 'Include <strong>quit</strong> (stop), <strong>quite</strong> (fairly), or <strong>quiet</strong> (not noisy).',
          icon: 'VolumeX'
        };
      }
      // Check for common confusion
      if (/\bquit\s+\w+(cold|good|difficult)\b/i.test(original) && !/\bquite\s+\w+(cold|good|difficult)\b/i.test(original)) {
        return {
          status: 'error',
          title: 'Check Quit vs Quite',
          message: '<strong>Quit</strong> = stop (verb). <strong>Quite</strong> = fairly (adverb). Did you mean <strong>quite</strong>?',
          icon: 'AlertCircle'
        };
      }
    }

    // WRITING-5: Rob/Steal/Burgle practice
    if (activity.id === 'writing-5') {
      const hasRob = /\b(rob|robbed|robbing)\s+(the|a|my|your|\w+)/i.test(original); // rob + place/person
      const hasSteal = /\b(steal|stole|stealing)\s+\w+/i.test(original); // steal + thing
      const hasBurgle = /\b(burgle|burgled|burgling)\s+(the|a|my|your|\w+)/i.test(original); // burgle + building
      const hasAtLeastOne = hasRob || hasSteal || hasBurgle;

      if (!hasAtLeastOne) {
        return {
          status: 'missing',
          title: 'Use Rob, Steal, or Burgle',
          message: 'Include <strong>rob</strong> (person/place), <strong>steal</strong> (thing), or <strong>burgle</strong> (building).',
          icon: 'Lock'
        };
      }
      // Check for common error: steal + place
      if (/\bsteal\s+(the|a)\s+(bank|store|house)\b/i.test(original)) {
        return {
          status: 'error',
          title: 'Check Steal vs Rob',
          message: '<strong>Steal</strong> + thing. <strong>Rob</strong> + place/person. Did you mean <strong>rob the bank</strong>?',
          icon: 'AlertCircle'
        };
      }
    }

    // WRITING-6+: Contrast and advanced checks
    if (activity.id === 'writing-6' || activity.id === 'writing-7') {
      const hasContrast = /\b(however|although|but|while)\b/i.test(clean);
      const hasLookSeeWatch = /\b(look|see|watch)\b/i.test(clean);

      if (!hasContrast && activity.id === 'writing-6') {
        return {
          status: 'missing',
          title: 'Add Contrast',
          message: 'Use <strong>however/although/but</strong> to show differences between verb uses.',
          icon: 'GitCompare'
        };
      }
      if (!hasLookSeeWatch && activity.id === 'writing-7') {
        return {
          status: 'missing',
          title: 'Use Look/See/Watch',
          message: 'Include <strong>look at</strong>, <strong>see</strong>, or <strong>watch</strong> in your instructions.',
          icon: 'Eye'
        };
      }
    }

    // WRITING-8: Advanced raise/rise/arise usage
    if (activity.id === 'writing-8') {
      const hasRaise = /\b(raise|raised|raising)\s+\w+/i.test(original);
      const hasRise = /\b(rise|rose|risen)\b(?!\s+(the|a|my|your))/i.test(original);
      const hasArise = /\b(arise|arose|arisen)\b/i.test(original);
      const hasAllThree = hasRaise && hasRise && hasArise;

      if (!hasRaise && !hasRise && !hasArise) {
        return {
          status: 'missing',
          title: 'Use Raise, Rise, or Arise',
          message: 'Include <strong>raise</strong>, <strong>rise</strong>, or <strong>arise</strong> with correct structures.',
          icon: 'ArrowUp'
        };
      }
      if (!hasAllThree) {
        return {
          status: 'missing',
          title: 'Use All Three Verbs',
          message: 'Include <strong>raise</strong> (with object), <strong>rise</strong> (no object, physical), AND <strong>arise</strong> (no object, abstract).',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-9/10: Formal register & mastery
    if (activity.id === 'writing-9' || activity.id === 'writing-10') {
      const hasFormalStructure = /\b(error|arose|burgled|quite)\b/i.test(original);
      const hasPreciseChoice = /\b(error|arise|burgle|quite|quiet)\b/i.test(original);
      const hasMultipleGroups = (original.match(/\b(look|see|watch|raise|rise|arise|rob|steal|burgle|mistake|error|fault|quit|quite|quiet)\b/gi) || []).length >= 3;

      if (!hasFormalStructure && activity.id === 'writing-9') {
        return {
          status: 'missing',
          title: 'Use Formal Structures',
          message: 'In formal writing, prefer precise verbs: <strong>error</strong> (not mistake), <strong>arise</strong> (not come up).',
          icon: 'Briefcase'
        };
      }
      if (!hasMultipleGroups && activity.id === 'writing-10') {
        return {
          status: 'missing',
          title: 'Use Multiple Verb Groups',
          message: 'Include at least 3 different confused verb groups correctly.',
          icon: 'Layers'
        };
      }
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Excellent Verb Usage! ✨',
      message: 'Your sentence correctly uses confused action verbs with proper structures and meanings.',
      icon: 'CheckCircle'
    };
  }
};