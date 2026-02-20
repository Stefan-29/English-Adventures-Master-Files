// checkers/pastPerfect.js
export const pastPerfectChecker = {
  name: "Past Perfect & Used to / Would",
  minWords: 25,

  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
    const original = text;

    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short!', message: 'Write a real story — at least 35 words!' };
    }

    const hadSimple = (original.match(/\b(had|I'd|you'd|he'd|she'd|we'd|they'd)\b(?![^']*been)/gi) || []).length;
    const hadCont   = (original.match(/\b(had been \w+ing|I'd been|he'd been|she'd been|we'd been|they'd been)\b/gi) || []).length;
    const usedTo    = (clean.match(/\bused to\b/gi) || []).length;
    const would     = (original.match(/\bwould\b/gi) || []).length;
    const neverBefore = /\b(never|not).*?before\b/i.test(clean);
    const already   = /\b(already|had already)\b/i.test(original);
    const wishHad   = /\b(wish|i wish|if only).{0,20}had\b/i.test(original);
    const byTheTime = /\bby the time\b/i.test(clean);

    // GLOBAL fatal errors
    const timelineError = /(by the time|when i (arrived|got home|reached)|after.{0,30})\b(went|saw|ate|did|left|came|was|were|bought|finished)[ \.,]/i.test(clean) &&
                          !/\bhad\b.{0,15}(went|saw|ate|did|left|came|was|were|bought|finished)/i.test(original);
    if (timelineError) {
      return { status: 'grammar', title: 'Timeline Disaster!', message: 'The EARLIER action MUST be Past Perfect → <strong>had + past participle</strong>!' };
    }

    const wrongWouldState = /\bwould (be|have|like|hate|know|live|own|belong|want|need|believe)\b/i.test(clean);
    if (wrongWouldState) {
      return { status: 'grammar', title: 'Would ≠ States!', message: 'Never say “would be/like/live”. Use <strong>used to</strong> for past states!' };
    }

    // ACTIVITY-SPECIFIC CHECKS
    if (activity.id === "writing-1") {
      if (hadSimple < 2 && (clean.match(/\bnever.*before\b/gi) || []).length < 2)
        return { status: 'missing', title: 'Use Past Perfect', message: 'Use <strong>had + past participle</strong> or <strong>had never</strong> at least a couple times.' };
    }
    if (activity.id === "writing-2") {
      if (!byTheTime && !already) return { status: 'missing', title: 'Add timing markers', message: 'Use <strong>by the time</strong> or <strong>already</strong>.' };
      if (hadSimple < 2) return { status: 'missing', title: 'Use Past Perfect', message: 'Use <strong>had + past participle</strong> at least twice.' };
    }
    if (activity.id === "writing-3") {
      if (!wishHad) return { status: 'missing', title: 'Regrets?', message: 'Start sentences with <strong>I wish I had …</strong> or <strong>If only I hadn’t …</strong>' };
    }
    if (activity.id === "writing-4") {
      if (usedTo < 3) return { status: 'missing', title: 'Used to?', message: 'You need at least 3 “used to”.' };
      if (would < 3) return { status: 'missing', title: 'Would?', message: 'You need at least 3 “would” for repeated actions.' };
    }
    if (activity.id === "writing-5") {
      if (hadCont < 4) return { status: 'missing', title: 'Past Perfect Continuous?', message: 'Explain why someone was tired/dirty using <strong>had been + -ing</strong> at least 4 times!' };
    }
    if (activity.id === "writing-6") {
      if ((clean.match(/\b(for|since)\b/gi) || []).length < 3) return { status: 'missing', title: 'For / Since?', message: 'Use <strong>for</strong> or <strong>since</strong> at least 3 times with duration verbs.' };
    }
    if (activity.id === "writing-7") {
      if (hadSimple < 3 || hadCont < 2 || !already)
        return { status: 'missing', title: 'Mix everything!', message: 'You need: 3 Past Perfect Simple ✓ 2 Continuous ✓ 1 “already” ✓' };
    }
    if (activity.id === "writing-9" || activity.id === "writing-10") {
      const totalHad = hadSimple + hadCont;
      if (totalHad < 2) return { status: 'missing', title: 'Use Past Perfect', message: 'Use <strong>had</strong> at least a couple times to show past events.' };
      if ((usedTo + would) < 1) return { status: 'almost', title: 'Great story!', message: 'Try adding <strong>used to</strong> or <strong>would</strong> for repeated past actions.' };
    }

    return { status: 'correct', title: 'TIME LORD ACHIEVED!', message: 'Your English timeline is absolutely PERFECT!' };
  }
};