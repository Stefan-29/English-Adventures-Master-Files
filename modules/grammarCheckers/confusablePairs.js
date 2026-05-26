// checkers/confusablePairs.js

export const confusablePairsChecker = {
  name: "Confusable Verb Pairs",
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

    // WRITING-1: Say/Tell practice
    if (activity.id === 'writing-1') {
      const hasTell = /\b(told|tell)\s+\w+\b/i.test(original);
      const hasSay = /\b(said|say)\s+(that|to|\w+)/i.test(original);
      const hasPersonObject = /\b(told|say to)\s+(me|him|her|us|them|you)\b/i.test(original);

      if (!hasTell && !hasSay) {
        return {
          status: 'missing',
          title: 'Use Say or Tell',
          message: 'Include <strong>said/say</strong> or <strong>told/tell</strong> to report speech.',
          icon: 'Volume2'
        };
      }
      if (hasTell && !hasPersonObject) {
        return {
          status: 'structure',
          title: 'Tell Needs a Person',
          message: '<strong>Tell</strong> requires a person object: told me/him/her/us/them.',
          icon: 'User'
        };
      }
    }

    // WRITING-2: Make/Do collocations
    if (activity.id === 'writing-2') {
      const hasMake = /\b(made|make)\s+(a|an|the|\w+)/i.test(original);
      const hasDo = /\b(did|do)\s+(the|my|your|\w+)/i.test(original);
      const hasCollocation = /\b(make a decision|do homework|make progress|do a favor|make money|do business)\b/i.test(clean);

      if (!hasMake && !hasDo) {
        return {
          status: 'missing',
          title: 'Use Make or Do',
          message: 'Include <strong>made/make</strong> or <strong>did/do</strong> with appropriate collocations.',
          icon: 'Tool'
        };
      }
      if (!hasCollocation) {
        return {
          status: 'missing',
          title: 'Use Common Collocations',
          message: 'Try common phrases: <strong>make a decision</strong>, <strong>do homework</strong>, <strong>make progress</strong>.',
          icon: 'List'
        };
      }
    }

    // WRITING-3: Remember/Remind structures
    if (activity.id === 'writing-3') {
      const hasRemember = /\b(remembered|remember)\s+(to|\w+-ing)/i.test(original);
      const hasRemind = /\b(reminded|remind)\s+(me|him|her|us|them|you)\s+(to|of)/i.test(original);
      const hasBoth = hasRemember && hasRemind;

      if (!hasRemember && !hasRemind) {
        return {
          status: 'missing',
          title: 'Use Remember or Remind',
          message: 'Include <strong>remember</strong> (internal) or <strong>remind</strong> (external prompt).',
          icon: 'Brain'
        };
      }
      if (!hasBoth) {
        return {
          status: 'missing',
          title: 'Use Both Verbs',
          message: 'Include at least one example of <strong>remember</strong> AND one of <strong>remind</strong>.',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-4: Affect/Effect distinction
    if (activity.id === 'writing-4') {
      const hasAffectVerb = /\b(affected|affect)\s+\w+/i.test(original);
      const hasEffectNoun = /\b(effect|effects)\b/i.test(clean) && /\b(have an effect on|the effect|an effect)\b/i.test(clean);
      const hasDistinction = hasAffectVerb && hasEffectNoun;

      if (!hasAffectVerb && !hasEffectNoun) {
        return {
          status: 'missing',
          title: 'Use Affect or Effect',
          message: 'Include <strong>affected/affect</strong> (verb) or <strong>effect</strong> (noun).',
          icon: 'Zap'
        };
      }
      if (!hasDistinction) {
        return {
          status: 'missing',
          title: 'Show the Difference',
          message: 'Use <strong>affect</strong> as a verb (action) and <strong>effect</strong> as a noun (result).',
          icon: 'GitCompare'
        };
      }
    }

    // WRITING-5+: Advanced checks for contrast, register, etc.
    if (activity.id === 'writing-5' || activity.id === 'writing-6' || activity.id === 'writing-7') {
      const hasContrast = /\b(however|although|but|while)\b/i.test(clean);
      const hasFormal = /\b(furthermore|consequently|it is recommended)\b/i.test(clean);
      const hasPreciseVerb = /\b(effected|told|made|affected)\b/i.test(original);

      if (!hasContrast && activity.id === 'writing-5') {
        return {
          status: 'missing',
          title: 'Add Contrast',
          message: 'Use <strong>however/although/but</strong> to show differences between verb pair uses.',
          icon: 'GitCompare'
        };
      }
      if (!hasFormal && activity.id === 'writing-7') {
        return {
          status: 'missing',
          title: 'Use Formal Connectors',
          message: 'In formal writing, use <strong>furthermore/consequently</strong> for transitions.',
          icon: 'Link'
        };
      }
    }

    // WRITING-8: Lay/Lie advanced usage
    if (activity.id === 'writing-8') {
      const hasLayWithObject = /\b(lay|laid)\s+(the|a|my|your|\w+)/i.test(original);
      const hasLieNoObject = /\b(lie|lay|lain)\b(?!\s+(the|a|my|your))/i.test(original);
      const hasBothForms = hasLayWithObject && hasLieNoObject;

      if (!hasLayWithObject && !hasLieNoObject) {
        return {
          status: 'missing',
          title: 'Use Lay or Lie',
          message: 'Include <strong>lay/laid</strong> (with object) or <strong>lie/lay/lain</strong> (no object).',
          icon: 'Bed'
        };
      }
      if (!hasBothForms) {
        return {
          status: 'missing',
          title: 'Use Both Forms',
          message: 'Show both: <strong>lay + object</strong> (place) AND <strong>lie</strong> (rest, no object).',
          icon: 'GitMerge'
        };
      }
    }

    // WRITING-9/10: Formal register & mastery
    if (activity.id === 'writing-9' || activity.id === 'writing-10') {
      const hasFormalStructure = /\b(effect.*change|told.*that|made.*decision)\b/i.test(original);
      const hasPreciseChoice = /\b(effected|affected|told|said)\b/i.test(original);
      const hasMultiplePairs = (original.match(/\b(said|told|made|did|lay|lie|remember|remind|affected|effect)\b/gi) || []).length >= 3;

      if (!hasFormalStructure && activity.id === 'writing-9') {
        return {
          status: 'missing',
          title: 'Use Formal Structures',
          message: 'In formal writing, prefer precise verbs: <strong>effected</strong> (bring about), <strong>told</strong> (clear instruction).',
          icon: 'Briefcase'
        };
      }
      if (!hasMultiplePairs && activity.id === 'writing-10') {
        return {
          status: 'missing',
          title: 'Use Multiple Verb Pairs',
          message: 'Include at least 3 different confusable verb pairs correctly.',
          icon: 'Layers'
        };
      }
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Excellent Verb Pair Usage! ✨',
      message: 'Your sentence correctly uses confusable verb pairs with proper structures and meanings.',
      icon: 'CheckCircle'
    };
  }
};