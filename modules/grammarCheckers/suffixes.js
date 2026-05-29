// checkers/suffixes.js

export const suffixesChecker = {
  name: "Suffixes",
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

    // WRITING-1: -ful/-less contrast practice
    if (activity.id === 'writing-1') {
      const hasFul = /\b\w+ful\b/i.test(original);
      const hasLess = /\b\w+less\b/i.test(original);
      const hasCompound = /\b\w+[-]\w+(free|proof|friendly|worthy|like)\b/i.test(original);
      
      if (!hasFul) {
        return { status: 'missing', title: 'Missing -ful Word', message: 'Use a word ending in <strong>-ful</strong> (e.g., helpful, beautiful) to show "full of".' };
      }
      if (!hasLess) {
        return { status: 'missing', title: 'Missing -less Word', message: 'Include a word ending in <strong>-less</strong> (e.g., hopeless, fearless) to show "without".' };
      }
      if (!hasCompound) {
        return { status: 'missing', title: 'Add Compound Adjective', message: 'Use a hyphenated compound like <strong>-free</strong>, <strong>-proof</strong>, or <strong>-friendly</strong>.' };
      }
    }

    // WRITING-2: -ful adjectives + -ly adverb
    if (activity.id === 'writing-2') {
      const fulCount = (text.match(/\b\w+ful\b/gi) || []).length;
      const hasLy = /\b\w+ly\b/i.test(clean);
      
      if (fulCount < 2) {
        return { status: 'missing', title: 'Use Two -ful Words', message: 'Include <strong>two adjectives</strong> ending in -ful (e.g., thoughtful, careful).' };
      }
      if (!hasLy) {
        return { status: 'missing', title: 'Add -ly Adverb', message: 'Include an adverb ending in <strong>-ly</strong> (e.g., carefully, kindly) to show how they help.' };
      }
    }

    // WRITING-3: -hood/-ship nouns
    if (activity.id === 'writing-3') {
      const hasHood = /\b\w+hood\b/i.test(clean);
      const hasShip = /\b\w+ship\b/i.test(clean);
      const hasChildhood = /\bchildhood\b/i.test(clean);
      
      if (!hasHood && !hasShip && !hasChildhood) {
        return { status: 'missing', title: 'Missing -hood/-ship Word', message: 'Use a word with <strong>-hood</strong> (childhood) or <strong>-ship</strong> (friendship) to describe a state or relationship.' };
      }
    }

    // WRITING-4: Compound suffixes comparison
    if (activity.id === 'writing-4') {
      const hasFriendly = /\b\w+-friendly\b/i.test(original);
      const hasProof = /\b\w+-proof\b/i.test(original);
      const hasFree = /\b\w+-free\b/i.test(original);
      const hasComparison = /\b(while|whereas|but|however|although)\b/i.test(clean);
      
      if (!hasFriendly && !hasProof && !hasFree) {
        return { status: 'missing', title: 'Use Compound Suffixes', message: 'Include at least one compound suffix: <strong>-friendly</strong>, <strong>-proof</strong>, or <strong>-free</strong>.' };
      }
      if (!hasComparison) {
        return { status: 'missing', title: 'Add Comparison Word', message: 'Use <strong>while/whereas/but</strong> to contrast the two products.' };
      }
    }

    // WRITING-5: -less problem + -ful solution + -ly
    if (activity.id === 'writing-5') {
      const hasLess = /\b\w+less\b/i.test(clean);
      const hasFul = /\b\w+ful\b/i.test(clean);
      const hasLy = /\b\w+ly\b/i.test(clean);
      
      if (!hasLess) {
        return { status: 'missing', title: 'Describe Problem with -less', message: 'Use a word like <strong>hopeless</strong> or <strong>helpless</strong> to describe the challenge.' };
      }
      if (!hasFul) {
        return { status: 'missing', title: 'Describe Solution with -ful', message: 'Use a word like <strong>hopeful</strong> or <strong>successful</strong> for the positive outcome.' };
      }
      if (!hasLy) {
        return { status: 'missing', title: 'Add -ly Adverb', message: 'Include an adverb like <strong>carefully</strong> or <strong>successfully</strong> to show how you acted.' };
      }
    }

    // WRITING-6: Cause-effect with -friendly + -ly
    if (activity.id === 'writing-6') {
      const hasFriendly = /\b\w+-friendly\b/i.test(original);
      const hasCause = /\b(because|since|as)\b/i.test(clean);
      const hasEffect = /\b(therefore|so|consequently)\b/i.test(clean);
      const hasLy = /\b\w+ly\b/i.test(clean);
      
      if (!hasFriendly) {
        return { status: 'missing', title: 'Use -friendly Suffix', message: 'Include a compound adjective like <strong>family-friendly</strong> or <strong>eco-friendly</strong>.' };
      }
      if (!hasCause || !hasEffect) {
        return { status: 'missing', title: 'Add Cause-Effect Language', message: 'Use <strong>because/since</strong> for cause and <strong>therefore/so</strong> for effect.' };
      }
    }

    // WRITING-7: Opinion with -wise perspectives
    if (activity.id === 'writing-7') {
      const hasOpinion = /\b(in my opinion|i believe|i think)\b/i.test(clean);
      const hasWise = /\b\w+-wise\b/i.test(original);
      const hasPerspective = /\b(education|cost|health|time|price)\b/i.test(clean);
      
      if (!hasOpinion) {
        return { status: 'missing', title: 'State Your Opinion', message: 'Begin with <strong>In my opinion</strong> or <strong>I believe</strong>.' };
      }
      if (!hasWise) {
        return { status: 'missing', title: 'Use -wise for Perspectives', message: 'Include a <strong>-wise</strong> phrase like <em>education-wise</em> or <em>cost-wise</em> to show different angles.' };
      }
    }

    // WRITING-8: Future invention with compound suffixes
    if (activity.id === 'writing-8') {
      const compoundCount = (text.match(/\b\w+-(friendly|proof|free|worthy|like|ridden|stricken)\b/gi) || []).length;
      const hasConditional = /\bif\b/i.test(clean);
      const hasValue = /\b(because|since|valuable|useful|important)\b/i.test(clean);
      
      if (compoundCount < 3) {
        return { status: 'missing', title: 'Use Three Compound Suffixes', message: 'Include at least <strong>three compound suffixes</strong> (e.g., -proof, -friendly, -worthy).' };
      }
      if (!hasConditional) {
        return { status: 'missing', title: 'Add Conditional Clause', message: 'Start with <strong>If</strong> to introduce your hypothetical invention.' };
      }
    }

    // WRITING-9: Formal register with -ity/-ness nouns
    if (activity.id === 'writing-9') {
      const hasIty = /\b\w+ity\b/i.test(clean);
      const hasNess = /\b\w+ness\b/i.test(clean);
      const hasFormalConnector = /\b(furthermore|consequently|therefore|thus)\b/i.test(clean);
      const hasHedging = /\b(may|might|appears to|suggests that)\b/i.test(clean);
      const hasInformal = /\b\w+-wise\b/i.test(original);
      
      if (!hasIty && !hasNess) {
        return { status: 'missing', title: 'Use Abstract Nouns', message: 'Include nouns ending in <strong>-ity</strong> (validity) or <strong>-ness</strong> (awareness) for formal precision.' };
      }
      if (!hasFormalConnector) {
        return { status: 'missing', title: 'Add Formal Connectors', message: 'Use <strong>furthermore/consequently</strong> instead of informal links.' };
      }
      if (hasInformal) {
        return { status: 'register-error', title: 'Avoid Informal -wise', message: 'In formal writing, replace <strong>-wise</strong> phrases with <em>regarding/concerning</em>.' };
      }
    }

    // WRITING-10: Product description with professional register
    if (activity.id === 'writing-10') {
      const hasCompound = /\b\w+-(friendly|proof|worthy)\b/i.test(original);
      const hasHedging = /\b(may enhance|appears to|is designed to)\b/i.test(original);
      const hasPoliteClose = /\b(thank you|we appreciate|please consider)\b/i.test(clean);
      const hasContraction = /\b(can't|don't|won't|it's)\b/i.test(original);
      
      if (!hasCompound) {
        return { status: 'missing', title: 'Use Compound Suffixes', message: 'Include <strong>-friendly</strong>, <strong>-proof</strong>, or <strong>-worthy</strong> to describe product features.' };
      }
      if (!hasHedging) {
        return { status: 'missing', title: 'Add Hedging Language', message: 'Use cautious language like <strong>may enhance</strong> or <strong>appears to improve</strong>.' };
      }
      if (hasContraction) {
        return { status: 'register-error', title: 'Avoid Contractions', message: 'In professional writing, expand contractions: <strong>cannot</strong> instead of <em>can\'t</em>.' };
      }
    }

    // GLOBAL: Spelling rule checks
    const hasYtoIError = /\b\w+y(ness|ful|ly)\b/i.test(original) && !/\b(happyiness|happyness|beautyness)\b/i.test(original);
    if (hasYtoIError) {
      return {
        status: 'spelling-error',
        title: 'Spelling Rule: y → i',
        message: 'When adding a suffix to a word ending in consonant + <strong>y</strong>, change <strong>y → i</strong>: happy → happiness, beauty → beautiful.',
        icon: 'Alert'
      };
    }

    const hasSilentEDropError = /\b\w+e(ful|ly|ness)\b/i.test(original) && !/\b(hopefull|hopefulness)\b/i.test(original);
    if (hasSilentEDropError) {
      return {
        status: 'spelling-error',
        title: 'Spelling Rule: Drop Silent -e',
        message: 'Drop the silent <strong>-e</strong> before vowel-starting suffixes: hope + -ful = <strong>hopeful</strong> (not hopefull).',
        icon: 'Alert'
      };
    }

    // SUCCESS
    return {
      status: 'success',
      title: 'Great Work! ✨',
      message: `Your use of suffixes shows strong word-building skills! Keep practicing to master register and nuance.`,
      icon: 'Star'
    };
  }
};