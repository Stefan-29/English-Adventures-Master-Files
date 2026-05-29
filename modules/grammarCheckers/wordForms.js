// checkers/wordForms.js

export const wordFormsChecker = {
  name: "Word Forms",
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

    // WRITING-1: 'create' in 3 forms + adverb
    if (activity.id === 'writing-1') {
      const hasVerb = /\bcreate\b/i.test(original);
      const hasNoun = /\bcreation\b/i.test(original);
      const hasAdj = /\bcreative\b/i.test(original);
      const hasAdv = /\bcreatively\b/i.test(original);
      
      if (!hasVerb) {
        return { status: 'missing', title: 'Missing Verb Form', message: 'Use the verb <strong>create</strong> to show the action.' };
      }
      if (!hasNoun) {
        return { status: 'missing', title: 'Missing Noun Form', message: 'Include the noun <strong>creation</strong> to name the result.' };
      }
      if (!hasAdj) {
        return { status: 'missing', title: 'Missing Adjective Form', message: 'Add the adjective <strong>creative</strong> to describe a noun.' };
      }
    }

    // WRITING-2: 'care' in 3 forms
    if (activity.id === 'writing-2') {
      const hasVerb = /\bcare\b/i.test(original) && !/\bcareful\b/i.test(original);
      const hasNoun = /\bcare\b/i.test(original);
      const hasAdj = /\bcareful\b/i.test(original);
      const hasAdv = /\bcarefully\b/i.test(original);
      
      const formCount = [hasVerb, hasNoun, hasAdj, hasAdv].filter(Boolean).length;
      if (formCount < 3) {
        return { status: 'missing', title: 'Use Three Forms of "Care"', message: 'Include at least <strong>three forms</strong>: care (v/n), careful (adj), carefully (adv).' };
      }
    }

    // WRITING-3: 'decide' in 2 forms + adverb
    if (activity.id === 'writing-3') {
      const hasVerb = /\bdecide\b/i.test(original);
      const hasNoun = /\bdecision\b/i.test(original);
      const hasAdv = /\bdecisively\b/i.test(original);
      
      if (!hasVerb && !hasNoun) {
        return { status: 'missing', title: 'Use "Decide" Forms', message: 'Include the verb <strong>decide</strong> or noun <strong>decision</strong>.' };
      }
      if (!hasAdv) {
        return { status: 'missing', title: 'Add Adverb Form', message: 'Include the adverb <strong>decisively</strong> to show how an action was done.' };
      }
    }

    // WRITING-4: 'differ' in multiple forms + comparison
    if (activity.id === 'writing-4') {
      const hasVerb = /\bdiffer\b/i.test(original);
      const hasNoun = /\bdifference\b/i.test(original);
      const hasAdj = /\bdifferent\b/i.test(original);
      const hasAdv = /\bdifferently\b/i.test(original);
      const hasComparison = /\b(while|whereas|but|however|although)\b/i.test(clean);
      
      const formCount = [hasVerb, hasNoun, hasAdj, hasAdv].filter(Boolean).length;
      if (formCount < 2) {
        return { status: 'missing', title: 'Use Multiple Forms of "Differ"', message: 'Include at least <strong>two forms</strong>: differ, difference, different, or differently.' };
      }
      if (!hasComparison) {
        return { status: 'missing', title: 'Add Comparison Word', message: 'Use <strong>while/whereas/but</strong> to contrast the two approaches.' };
      }
    }

    // WRITING-5: 'hope' forms + spelling rule (y→i check)
    if (activity.id === 'writing-5') {
      const hasNoun = /\bhope\b/i.test(original);
      const hasAdj = /\bhopeful\b/i.test(original);
      const hasAdv = /\bhopefully\b/i.test(original);
      const hasCorrectSpelling = !/\bhappyness|beautyful|hopefull\b/i.test(original);
      
      if (!hasNoun || !hasAdj || !hasAdv) {
        return { status: 'missing', title: 'Use Three Forms of "Hope"', message: 'Include <strong>hope</strong> (noun), <strong>hopeful</strong> (adj), and <strong>hopefully</strong> (adv).' };
      }
      if (!hasCorrectSpelling) {
        return { status: 'spelling-error', title: 'Check Spelling Rules', message: 'Remember: consonant+y → change y to i: happy→happiness, beauty→beautiful.' };
      }
    }

    // WRITING-6: 'act' forms + cause-effect
    if (activity.id === 'writing-6') {
      const hasVerb = /\bact\b/i.test(original);
      const hasNoun = /\baction\b/i.test(original);
      const hasAdj = /\bactive\b/i.test(original);
      const hasAdv = /\bactively\b/i.test(original);
      const hasCause = /\b(because|since|as)\b/i.test(clean);
      const hasEffect = /\b(therefore|so|consequently)\b/i.test(clean);
      
      const formCount = [hasVerb, hasNoun, hasAdj, hasAdv].filter(Boolean).length;
      if (formCount < 2) {
        return { status: 'missing', title: 'Use Forms of "Act"', message: 'Include at least <strong>two forms</strong>: act, action, active, or actively.' };
      }
      if (!hasCause || !hasEffect) {
        return { status: 'missing', title: 'Add Cause-Effect Language', message: 'Use <strong>because/since</strong> for cause and <strong>therefore/so</strong> for effect.' };
      }
    }

    // WRITING-7: 'interest' forms + opinion structure
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think)\b/i.test(clean);
      const hasVerb = /\binterest\b/i.test(original);
      const hasNoun = /\binterest\b/i.test(original);
      const hasAdj = /\binteresting\b/i.test(original);
      const hasAdv = /\binterestingly\b/i.test(original);
      
      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion</strong> or <strong>I believe</strong>.' };
      }
      if (!hasAdj) {
        return { status: 'missing', title: 'Use Adjective Form', message: 'Include the adjective <strong>interesting</strong> to describe something.' };
      }
    }

    // WRITING-8: Four forms from one root + conditional
    if (activity.id === 'writing-8') {
      // Check for create family as exemplar
      const hasCreateVerb = /\bcreate\b/i.test(original);
      const hasCreateNoun = /\bcreation\b/i.test(original);
      const hasCreateAdj = /\bcreative\b/i.test(original);
      const hasCreateAdv = /\bcreatively\b/i.test(original);
      const hasConditional = /\bif\b/i.test(clean);
      const hasValue = /\b(because|since|valuable|useful|important)\b/i.test(clean);
      
      const createForms = [hasCreateVerb, hasCreateNoun, hasCreateAdj, hasCreateAdv].filter(Boolean).length;
      if (createForms < 4) {
        return { status: 'missing', title: 'Use Four Forms of One Root', message: 'Transform one root word through all four forms: verb, noun, adjective, adverb (e.g., create/creation/creative/creatively).' };
      }
      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If</strong> to introduce your hypothetical invention.' };
      }
    }

    // WRITING-9: Formal register with nominalization
    if (activity.id === 'writing-9') {
      const hasTionNoun = /\b\w+tion\b/i.test(original);
      const hasMentNoun = /\b\w+ment\b/i.test(original);
      const hasFormalConnector = /\b(furthermore|consequently|therefore|thus)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears.to|suggests.that)\b/i.test(original);
      const hasContraction = /\b(can't|don't|won't|it's)\b/i.test(original);
      
      if (!hasTionNoun && !hasMentNoun) {
        return { status: 'missing', title: 'Use Noun Forms (-tion/-ment)', message: 'Prefer nominalization: <strong>implementation</strong> instead of <em>implement</strong>, <strong>decision</strong> instead of <em>decide</em>.' };
      }
      if (!hasFormalConnector) {
        return { status: 'missing', title: 'Add Formal Connectors', message: 'Use <strong>furthermore/consequently</strong> instead of informal links.' };
      }
      if (hasContraction) {
        return { status: 'register-error', title: 'Avoid Contractions', message: 'In formal writing, expand contractions: <strong>cannot</strong> instead of <em>can\'t</em>.' };
      }
    }

    // WRITING-10: Professional description with precise forms
    if (activity.id === 'writing-10') {
      const hasPreciseAdv = /\b\w+ly\b/i.test(original) && !/\breally|very|so\b/i.test(clean);
      const hasFormalNoun = /\b\w+(tion|ment|ness|ity)\b/i.test(original);
      const hasHedging = /\b(may.enhance|appears.to|is.designed.to)\b/i.test(original);
      const hasPoliteClose = /\b(thank.you|we.appreciate|please.consider)\b/i.test(clean);
      const hasSpellingRule = !/\bhappyness|beautyful|basicly\b/i.test(original);
      
      if (!hasPreciseAdv) {
        return { status: 'missing', title: 'Use Precise Adverbs', message: 'Include precise adverbs like <strong>efficiently</strong> or <strong>effectively</strong> (avoid really/very).' };
      }
      if (!hasFormalNoun) {
        return { status: 'missing', title: 'Use Formal Noun Forms', message: 'Prefer abstract nouns: <strong>implementation</strong>, <strong>enhancement</strong>.' };
      }
      if (!hasSpellingRule) {
        return { status: 'spelling-error', title: 'Apply Spelling Rules', message: 'Check: y→i (happy→happiness), drop -e (create→creation), -ic→-ically (basic→basically).' };
      }
    }

    // GLOBAL: Spelling rule checks
    const hasYtoIError = /\b\w+y(ness|ful|ly)\b/i.test(original) && !/\b(happiness|beautiful|creatively|hopefully)\b/i.test(original);
    if (hasYtoIError) {
      return {
        status: 'spelling-error',
        title: 'Spelling Rule: y → i',
        message: 'When adding a suffix to a word ending in consonant + <strong>y</strong>, change <strong>y → i</strong>: happy → happiness, beauty → beautiful.',
        icon: 'Alert'
      };
    }

    const hasSilentEDropError = /\b\w+e(tion|able|ous)\b/i.test(original) && !/\b(creation|usable|famous)\b/i.test(original);
    if (hasSilentEDropError) {
      return {
        status: 'spelling-error',
        title: 'Spelling Rule: Drop Silent -e',
        message: 'Drop the silent <strong>-e</strong> before vowel-starting suffixes: create + -ion = <strong>creation</strong> (not createion).',
        icon: 'Alert'
      };
    }

    const hasIcToAllyError = /\b\w+icly\b/i.test(original) && !/\b(publicly|slyly)\b/i.test(original);
    if (hasIcToAllyError) {
      return {
        status: 'spelling-error',
        title: 'Spelling Rule: -ic → -ically',
        message: 'Adjectives ending in <strong>-ic</strong> form adverbs with <strong>-ally</strong>: basic → <strong>basically</strong> (not basicly).',
        icon: 'Alert'
      };
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Great Work! ✨',
      message: `Your use of word forms shows strong linguistic flexibility! Keep practicing suffix rules and register awareness.`,
      icon: 'Star'
    };
  }
};