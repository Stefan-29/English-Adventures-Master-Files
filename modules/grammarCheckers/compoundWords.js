// checkers/compoundWords.js

export const compoundWordsChecker = {
  name: "Compound Words",
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

    // WRITING-1: Gadget description with compound adjectives & verb
    if (activity.id === 'writing-1') {
      const hasHyphenated = /\b\w+-\w+\b/i.test(original);
      const hasNumberNoun = /\b\d+[-]\w+\b/i.test(original) || /\b(ten|five|three|two|one)[-](minute|hour|day|page|star|way|foot)\b/i.test(original);
      const hasCompoundVerb = /\b(babysit|proofread|sidestep|spring.clean|waterproof|double.click|house.hunt|jump.start)\b/i.test(original);
      
      if (!hasHyphenated) {
        return { status: 'missing', title: 'Add Hyphenated Compound', message: 'Include a hyphenated compound adjective before a noun: <strong>user-friendly</strong>, <strong>long-lasting</strong>.' };
      }
      if (!hasNumberNoun) {
        return { status: 'missing', title: 'Add Number+Noun Compound', message: 'Use a number+noun compound: <strong>ten-minute</strong>, <strong>five-star</strong> (hyphenated, singular noun).' };
      }
      if (!hasCompoundVerb) {
        return { status: 'missing', title: 'Add Compound Verb', message: 'Include a compound verb: <strong>proofread</strong>, <strong>spring-clean</strong>, <strong>sidestep</strong>.' };
      }
    }

    // WRITING-2: Describe person with compound adjectives
    if (activity.id === 'writing-2') {
      const compoundAdjCount = (text.match(/\b\w+-\w+\b/gi) || []).filter(w => !/\b\w+-ly\b/i.test(w)).length;
      const hasDescriptive = /\b(quick.thinking|level.headed|well.prepared|easy.going|far.reaching|good.looking)\b/i.test(original);
      
      if (compoundAdjCount < 2) {
        return { status: 'missing', title: 'Use Two Compound Adjectives', message: 'Include <strong>two compound adjectives</strong> like <em>quick-thinking</em> or <em>level-headed</em>.' };
      }
      if (!hasDescriptive) {
        return { status: 'missing', title: 'Add Descriptive Compounds', message: 'Use vivid compound adjectives from the word bank to describe qualities.' };
      }
    }

    // WRITING-3: Weekend activity with compound verbs
    if (activity.id === 'writing-3') {
      const verbCount = (text.match(/\b(babysit|proofread|sidestep|spring.clean|waterproof|double.click|house.hunt|jump.start|backslide|blackmail)\b/gi) || []).length;
      const hasTimeMarker = /\b(weekend|last|yesterday|then|after|when)\b/i.test(clean);
      
      if (verbCount < 2) {
        return { status: 'missing', title: 'Use Two Compound Verbs', message: 'Include <strong>at least two compound verbs</strong> like <em>spring-clean</em> or <em>proofread</em>.' };
      }
      if (!hasTimeMarker) {
        return { status: 'missing', title: 'Add Time Context', message: 'Use time markers like <strong>last weekend/then/after</strong> to sequence events.' };
      }
    }

    // WRITING-4: Product comparison with compound patterns
    if (activity.id === 'writing-4') {
      const hasAdjNoun = /\b\w+-\w+\b/i.test(original) && /\b(full.length|blue.collar|last.minute|deep.sea|short.term)\b/i.test(original);
      const hasNounAdj = /\b\w+-\w+\b/i.test(original) && /\b(smoke.free|ice.cold|world.famous|user.friendly|water.resistant)\b/i.test(original);
      const hasNumberNoun = /\b\d+[-]\w+\b/i.test(original) || /\b(ten|five|three|two|one)[-](minute|hour|day|page|star|way|foot)\b/i.test(original);
      const hasComparison = /\b(while|whereas|but|however|although)\b/i.test(clean);
      
      if (!hasAdjNoun && !hasNounAdj) {
        return { status: 'missing', title: 'Use Compound Adjective Patterns', message: 'Include compounds like <strong>adj+noun</strong> (full-length) or <strong>noun+adj</strong> (smoke-free).' };
      }
      if (!hasNumberNoun) {
        return { status: 'missing', title: 'Add Number+Noun Compound', message: 'Use a number+noun compound: <strong>ten-minute</strong>, <strong>five-star</strong>.' };
      }
      if (!hasComparison) {
        return { status: 'missing', title: 'Add Comparison Word', message: 'Use <strong>while/whereas/but</strong> to contrast the two products.' };
      }
    }

    // WRITING-5: Challenge with compound verb + adjective + hyphenation
    if (activity.id === 'writing-5') {
      const hasCompoundVerb = /\b(babysit|proofread|sidestep|spring.clean|waterproof|jump.start)\b/i.test(original);
      const hasCompoundAdj = /\b\w+-\w+\b/i.test(original) && !/\b\w+-ly\b/i.test(original);
      const hasHyphenBeforeNoun = /\ba\s+\w+-\w+\s+\w+/i.test(original);
      
      if (!hasCompoundVerb) {
        return { status: 'missing', title: 'Use Compound Verb', message: 'Include a compound verb like <strong>sidestep</strong> or <strong>jump-start</strong> for your action.' };
      }
      if (!hasCompoundAdj) {
        return { status: 'missing', title: 'Add Compound Adjective', message: 'Use a compound adjective like <strong>well-deserved</strong> or <strong>long-awaited</strong> for the outcome.' };
      }
      if (!hasHyphenBeforeNoun) {
        return { status: 'hyphen-error', title: 'Check Hyphenation', message: 'Hyphenate compound adjectives BEFORE nouns: <strong>a well-deserved reward</strong> (not "a well deserved reward").' };
      }
    }

    // WRITING-6: Community project with eco/user-friendly + idiomatic compound
    if (activity.id === 'writing-6') {
      const hasEcoFriendly = /\b(eco.friendly|environmentally.sustainable)\b/i.test(original);
      const hasUserFriendly = /\b(user.friendly|intuitive|accessible)\b/i.test(original);
      const hasIdiomatic = /\b(middle.of.the.road|one.of.a.kind|all.too.common|off.the.rack|over.the.counter)\b/i.test(original);
      const hasCauseEffect = /\b(because|since|as|therefore|so|consequently)\b/i.test(clean);
      
      if (!hasEcoFriendly) {
        return { status: 'missing', title: 'Add Eco-Friendly Term', message: 'Include <strong>eco-friendly</strong> or the formal <strong>environmentally sustainable</strong>.' };
      }
      if (!hasUserFriendly) {
        return { status: 'missing', title: 'Add User-Friendly Term', message: 'Include <strong>user-friendly</strong> or the formal <strong>intuitive/accessible</strong>.' };
      }
      if (!hasIdiomatic) {
        return { status: 'missing', title: 'Add Idiomatic Compound', message: 'Include an idiomatic compound: <strong>one-of-a-kind</strong>, <strong>middle-of-the-road</strong>.' };
      }
    }

    // WRITING-7: Opinion on high-tech tools with compounds + hyphenation
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think)\b/i.test(clean);
      const hasCompoundAdj = /\b\w+-\w+\b/i.test(original) && !/\b\w+-ly\b/i.test(original);
      const hasHighTech = /\b(high.tech|technologically.advanced)\b/i.test(original);
      const hasHyphenCorrect = !/\b\w+-ly\s+\w+\b/i.test(original) || /\b\w+-ly\b/i.test(original); // -ly adverbs not hyphenated
      
      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion</strong> or <strong>I believe</strong>.' };
      }
      if (!hasCompoundAdj) {
        return { status: 'missing', title: 'Use Compound Adjectives', message: 'Include compound adjectives like <strong>time-saving</strong> or <strong>cost-effective</strong>.' };
      }
      if (!hasHighTech) {
        return { status: 'missing', title: 'Address High-Tech Topic', message: 'Discuss <strong>high-tech</strong> tools or their formal alternative <strong>technologically advanced</strong>.' };
      }
    }

    // WRITING-8: Future invention with three compound patterns
    if (activity.id === 'writing-8') {
      const hasAdjIng = /\b\w+-\w+ing\b/i.test(original); // e.g., easy-going
      const hasNounIng = /\b\w+-\w+ing\b/i.test(original) && /\b(mouth.watering|eye.opening|time.saving|record.breaking|coal.mining)\b/i.test(original);
      const hasNumberNoun = /\b\d+[-]\w+\b/i.test(original) || /\b(ten|five|three|two|one)[-](minute|hour|day|page|star|way|foot)\b/i.test(original);
      const hasConditional = /\bif\b/i.test(clean);
      const hasValue = /\b(because|since|valuable|useful|important|beneficial)\b/i.test(clean);
      
      const patternCount = [hasAdjIng, hasNounIng, hasNumberNoun].filter(Boolean).length;
      if (patternCount < 3) {
        return { status: 'missing', title: 'Use Three Compound Patterns', message: 'Include compounds from <strong>three different patterns</strong>: adj+-ing, noun+-ing, and number+noun.' };
      }
      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If</strong> to introduce your hypothetical invention.' };
      }
    }

    // WRITING-9: Formal sustainable planning with formal alternatives
    if (activity.id === 'writing-9') {
      const hasFormalAlt = /\b(environmentally.sustainable|technologically.advanced|modest|understated|intuitive|accessible)\b/i.test(original);
      const hasHedging = /\b(may|might|appears.to|suggests.that|could.enhance)\b/i.test(original);
      const hasFormalConnector = /\b(furthermore|consequently|therefore|thus|moreover)\b/i.test(clean);
      const hasInformalCompound = /\b(eco.friendly|high.tech|user.friendly|super.duper|gut.wrenching)\b/i.test(original) && !/\b(environmentally.sustainable|technologically.advanced|intuitive)\b/i.test(original);
      
      if (!hasFormalAlt) {
        return { status: 'missing', title: 'Use Formal Alternatives', message: 'Replace informal compounds with formal terms: <strong>environmentally sustainable</strong> instead of <em>eco-friendly</em>.' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use cautious language like <strong>may enhance</strong> or <strong>appears to improve</strong>.' };
      }
      if (hasInformalCompound) {
        return { status: 'register-error', title: 'Avoid Informal Compounds', message: 'In formal writing, prefer precise terms over catchy compounds like <strong>eco-friendly</strong>.' };
      }
    }

    // WRITING-10: Product description with professional register
    if (activity.id === 'writing-10') {
      const hasCompoundAdj = /\b\w+-\w+\b/i.test(original) && !/\b\w+-ly\b/i.test(original);
      const hasHedging = /\b(may.enhance|appears.to|is.designed.to|could.improve)\b/i.test(original);
      const hasPoliteClose = /\b(thank.you|we.appreciate|please.consider|best.regards|sincerely)\b/i.test(clean);
      const hasContraction = /\b(can't|don't|won't|it's|that's)\b/i.test(original);
      const hasHyphenBeforeNoun = /\ba\s+\w+-\w+\s+\w+/i.test(original);
      
      if (!hasCompoundAdj) {
        return { status: 'missing', title: 'Use Compound Adjectives', message: 'Include compound adjectives like <strong>user-friendly</strong> or <strong>long-lasting</strong>.' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use cautious language like <strong>may enhance</strong> or <strong>appears to improve</strong>.' };
      }
      if (hasContraction) {
        return { status: 'register-error', title: 'Avoid Contractions', message: 'In professional writing, expand contractions: <strong>cannot</strong> instead of <em>can\'t</em>.' };
      }
      if (!hasHyphenBeforeNoun) {
        return { status: 'hyphen-error', title: 'Hyphenate Before Nouns', message: 'Hyphenate compound adjectives BEFORE nouns: <strong>a user-friendly design</strong> (not "a user friendly design").' };
      }
    }

    // GLOBAL: Hyphenation rule checks
    const hasLyHyphenError = /\b\w+-ly-\w+\b/i.test(original);
    if (hasLyHyphenError) {
      return {
        status: 'hyphen-error',
        title: 'Hyphenation Rule: -ly Adverbs',
        message: 'Adverbs ending in <strong>-ly</strong> are NEVER hyphenated to the adjective they modify: <em>a beautifully written poem</em> (not "beautifully-written").',
        icon: 'Alert'
      };
    }

    const hasNumberPluralError = /\b\d+\s+\w+s\b/i.test(original) && /\b(minute|hour|day|page|star|foot|storey)\b/i.test(original);
    if (hasNumberPluralError) {
      return {
        status: 'spelling-error',
        title: 'Number+Noun Rule: Use Singular',
        message: 'In number+noun compounds, use the <strong>singular noun</strong>: <em>a ten-minute break</em> (not "ten minutes break").',
        icon: 'Alert'
      };
    }

    const hasMissingHyphenBeforeNoun = /\ba\s+\w+\s+\w+\s+(noun|device|app|design|solution|policy|interface|product)/i.test(original) && !/\b\w+-\w+\b/i.test(original);
    if (hasMissingHyphenBeforeNoun) {
      return {
        status: 'hyphen-warning',
        title: 'Consider Hyphenating',
        message: 'If two words work together to describe a following noun, hyphenate them: <strong>a user-friendly app</strong> (not "a user friendly app").',
        icon: 'Info'
      };
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Great Work! ✨',
      message: `Your use of compound words shows strong word-building skills! Keep practicing hyphenation rules and register awareness.`,
      icon: 'Star'
    };
  }
};