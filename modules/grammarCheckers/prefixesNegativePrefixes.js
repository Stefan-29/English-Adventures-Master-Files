// checkers/prefixesNegativePrefixes.js

export const prefixesNegativePrefixesChecker = {
  name: "Prefixes & Negative Prefixes",
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
    
    // WRITING-1: Basic prefix practice
    // Required: 1× common prefix, 1× time marker, basic vocabulary
    if (activity.id === 'writing-1') {
      const hasPrefix1 = /\b(pre-|re-|un-|dis-)\b/i.test(original);
      const hasPrefix2 = /\b(pre-|re-|un-|dis-)\b/i.test(original);
      const hasTimeMarker = /\b(before|after|again|daily|morning|yesterday|today|now)\b/i.test(clean);
      const hasBasicVocab = /\b(routine|schedule|breakfast|activity|task)\b/i.test(clean);
      
      if (!hasPrefix1) {
        return {
          status: 'missing',
          title: 'Missing Prefix',
          message: 'Use a prefix like <strong>pre-, re-, un-, or dis-</strong> to modify a word. Example: <em>preview, undo, disagree</em>.'
        };
      }
      if (!hasTimeMarker) {
        return {
          status: 'missing',
          title: 'Add Time Context',
          message: 'Include a time marker like <strong>before, after, daily, or yesterday</strong>.'
        };
      }
      if (!hasBasicVocab) {
        return {
          status: 'missing',
          title: 'Expand Vocabulary',
          return: 'Add descriptive words related to routines or daily activities.'
        };
      }
    }
    
    // WRITING-2: Quantity prefixes
    if (activity.id === 'writing-2') {
      const hasQuantityPrefix = /\b(multi-|uni-|semi-|mono-)\b/i.test(original);
      const hasExplanation = /\b(mean|means|meaning|refers to|is)\b/i.test(clean);
      const hasHobbyWord = /\b(hobby|activity|sport|game|music|art)\b/i.test(clean);
      
      if (!hasQuantityPrefix) {
        return {
          status: 'missing',
          title: 'Missing Quantity Prefix',
          message: 'Use <strong>multi-, uni-, semi-, or mono-</strong> to describe your hobby. Example: <em>multilingual, unicycle, semicircle</em>.'
        };
      }
      if (!hasExplanation) {
        return {
          status: 'missing',
          title: 'Explain the Prefix',
          message: 'Add a phrase like <strong>"which means..."</strong> to show you understand the prefix.'
        };
      }
    }
    
    // WRITING-3: Negative prefixes in narrative
    if (activity.id === 'writing-3') {
      const negativePrefixCount = (original.match(/\b(un-|dis-|mis-|non-|im-|in-|il-|ir-)\w+\b/gi) || []).length;
      const hasStoryElement = /\b(started|when|because|then|finally|unfortunately)\b/i.test(clean);
      const hasProblemWord = /\b(mistake|confusion|misunderstanding|problem|error)\b/i.test(clean);
      
      if (negativePrefixCount < 2) {
        return {
          status: 'missing',
          title: 'Use Negative Prefixes Twice',
          message: 'Include negative prefixes like <strong>un-, dis-, or mis-</strong> <strong>at least two times</strong> to show the misunderstanding.'
        };
      }
      if (!hasStoryElement) {
        return {
          status: 'missing',
          title: 'Add Narrative Flow',
          message: 'Use story connectors like <strong>when, because, then, or unfortunately</strong> to order events.'
        };
      }
    }
    
    // WRITING-4: Position prefixes comparison
    if (activity.id === 'writing-4') {
      const hasInter = /\binter-\w+\b/i.test(original);
      const hasIntra = /\bintra-\w+\b/i.test(original);
      const hasPositionPrefix = /\b(inter-|intra-|sub-|super-)\b/i.test(original);
      const hasCompareWord = /\b(while|whereas|but|difference|compare|contrast)\b/i.test(clean);
      
      if (!hasPositionPrefix) {
        return {
          status: 'missing',
          title: 'Missing Position Prefix',
          message: 'Use <strong>inter-, intra-, sub-, or super-</strong> to describe location or relationship.'
        };
      }
      if (!hasCompareWord) {
        return {
          status: 'missing',
          title: 'Add Comparison Language',
          message: 'Connect ideas with <strong>while, whereas, or the difference is</strong> to show contrast.'
        };
      }
    }
    
    // WRITING-5: Attitude prefixes
    if (activity.id === 'writing-5') {
      const hasAttitudePrefix = /\b(pro-|anti-|auto-)\b/i.test(original);
      const hasProductWord = /\b(product|feature|software|system|tool)\b/i.test(clean);
      const hasPurposeWord = /\b(purpose|goal|aim|function|protect|support)\b/i.test(clean);
      
      if (!hasAttitudePrefix) {
        return {
          status: 'missing',
          title: 'Missing Attitude Prefix',
          message: 'Use <strong>pro-, anti-, or auto-</strong> to describe the product\'s stance. Example: <em>pro-environment, anti-virus, auto-save</em>.'
        };
      }
      if (!hasPurposeWord) {
        return {
          status: 'missing',
          title: 'Explain the Purpose',
          message: 'Add words like <strong>purpose, goal, or protect</strong> to show how the prefix relates to function.'
        };
      }
    }
    
    // WRITING-6: Size prefixes in science
    if (activity.id === 'writing-6') {
      const hasSizePrefix = /\b(micro-|macro-|mega-|mini-)\b/i.test(original);
      const hasScaleWord = /\b(scale|size|tiny|small|large|huge|enormous)\b/i.test(clean);
      const hasScienceWord = /\b(science|biology|economics|organism|system)\b/i.test(clean);
      
      if (!hasSizePrefix) {
        return {
          status: 'missing',
          title: 'Missing Size Prefix',
          message: 'Use <strong>micro-, macro-, mega-, or mini-</strong> to describe scale. Example: <em>microscope, macroeconomics</em>.'
        };
      }
      if (!hasScaleWord) {
        return {
          status: 'missing',
          title: 'Clarify the Scale',
          message: 'Include words like <strong>tiny, small, large, or huge</strong> to explain the prefix meaning.'
        };
      }
    }
    
    // WRITING-7: Time prefixes in opinion
    if (activity.id === 'writing-7') {
      const hasTimePrefix = /\b(pre-|post-|ante-)\b/i.test(original);
      const hasOpinionMarker = /\b(in my opinion|i believe|i think|from my perspective)\b/i.test(clean);
      const hasSupportWord = /\b(because|since|for example|evidence|research)\b/i.test(clean);
      
      if (!hasTimePrefix) {
        return {
          status: 'missing',
          title: 'Missing Time Prefix',
          message: 'Use <strong>pre-, post-, or ante-</strong> to discuss time perspectives. Example: <em>preview, postgraduate, antecedent</em>.'
        };
      }
      if (!hasOpinionMarker) {
        return {
          status: 'missing',
          title: 'State Your Opinion',
          message: 'Begin with <strong>In my opinion</strong> or <strong>I believe</strong> to frame your argument.'
        };
      }
    }
    
    // WRITING-8: Multiple negative prefixes in hypotheticals
    if (activity.id === 'writing-8') {
      const hasConditional = /\b(if|unless|supposing|provided that)\b/i.test(clean);
      const hasNegativePrefix = /\b(un-|dis-|mis-|non-|im-|in-)\b/i.test(original);
      const hasConsequence = /\b(then|would|could|result|lead to)\b/i.test(clean);
      const hasHypotheticalVerb = /\b(would|could|might|should)\b/i.test(clean);
      
      if (!hasConditional) {
        return {
          status: 'missing',
          title: 'Add Conditional Clause',
          message: 'Start with <strong>If/Unless/Supposing</strong> + condition to set up the scenario.'
        };
      }
      if (!hasNegativePrefix) {
        return {
          status: 'missing',
          title: 'Use Negative Prefix',
          message: 'Include a negative prefix like <strong>un-, dis-, or mis-</strong> to show the hypothetical problem.'
        };
      }
      if (!hasHypotheticalVerb) {
        return {
          status: 'missing',
          title: 'Use Modal Verb',
          message: 'Pair conditionals with <strong>would/could/might</strong> to show hypothetical outcomes.'
        };
      }
    }
    
    // WRITING-9: Complex multi-prefix analysis
    if (activity.id === 'writing-9') {
      const hasMultiPrefixWord = /\b\w+-\w+-\w+\b/i.test(original) || /\b(unpre|interde|recon)\w+\b/i.test(original);
      const hasBreakdownWord = /\b(break down|contains|prefix|root|meaning|combine)\b/i.test(clean);
      const hasCumulativeWord = /\b(cumulative|together|combined|result|final)\b/i.test(clean);
      const hasExampleWord = /\b(example|like|such as|for instance)\b/i.test(clean);
      
      if (!hasMultiPrefixWord) {
        return {
          status: 'missing',
          title: 'Analyze a Multi-Prefix Word',
          message: 'Choose a word with 2+ prefixes like <strong>unpredictable, interdependent, or reconstruct</strong>.'
        };
      }
      if (!hasBreakdownWord) {
        return {
          status: 'missing',
          title: 'Break Down the Word',
          message: 'Use phrases like <strong>"contains", "break down", or "prefix"</strong> to analyze structure.'
        };
      }
      if (!hasCumulativeWord) {
        return {
          status: 'missing',
          title: 'Explain Cumulative Meaning',
          message: 'Add words like <strong>together, combined, or result</strong> to show how prefixes interact.'
        };
      }
    }
    
    // WRITING-10: Formal academic register
    if (activity.id === 'writing-10') {
      const hasFormalPrefix = /\b(non-|in-|ex-|pre-)\b/i.test(original);
      const hasHedging = /\b(may|might|appears to|suggests that|potentially)\b/i.test(clean);
      const hasPassive = /\b(is \w+ed|are \w+ed|was \w+ed|has been|have been)\b/i.test(original);
      const hasAcademicWord = /\b(prefixation|morphological|terminology|evolution|standardized)\b/i.test(clean);
      
      if (!hasFormalPrefix) {
        return {
          status: 'missing',
          title: 'Use Formal Prefixes',
          message: 'Prefer <strong>non-, in-, or ex-</strong> for academic neutrality over informal un-.'
        };
      }
      if (!hasHedging) {
        return {
          status: 'missing',
          title: 'Add Hedging Language',
          message: 'Use <strong>may, might, or appears to</strong> to show academic caution with claims.'
        };
      }
      if (!hasPassive) {
        return {
          status: 'missing',
          title: 'Include Passive Voice',
          message: 'Use passive constructions like <strong>is formed, has been adopted</strong> for formal tone.'
        };
      }
    }
    
    // GLOBAL CHECKS: Common prefix errors
    const hasHyphenBeforeCapital = /\b\w+-[A-Z]/.test(original);
    const hasDoubleVowelNoHyphen = /\b(cooperate|reenter|preempt)\b/i.test(original);
    
    if (hasDoubleVowelNoHyphen && !/\b(cooperate|reenter)\b/i.test(original)) {
      return {
        status: 'hyphen-suggestion',
        title: 'Hyphenation Tip',
        message: 'Consider hyphenating words with double vowels for clarity: <strong>co-operate, re-enter</strong>.',
        icon: 'Link'
      };
    }
    
    // SUCCESS
    return {
      status: 'success',
      title: 'Great Work!',
      message: 'Your use of prefixes shows strong vocabulary skills! 🎉 Keep building words!',
      icon: 'Star'
    };
  }
};