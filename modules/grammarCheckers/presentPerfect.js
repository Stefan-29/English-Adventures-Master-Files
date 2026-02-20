// checkers/presentPerfect.js
export const presentPerfectChecker = {
  name: "Present Perfect & Stative Verbs",
  minWords: 18,

  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
    const original = text;

    // Global minimum length
    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return {
        status: 'too-short',
        title: 'Too Short',
        message: 'Write full sentences — aim for at least 28 words.',
        icon: 'Pencil'
      };
    }

    // ——————————————————————————————————————
    // WRITING-1: Ever / Never + experiences
    // ——————————————————————————————————————
    if (activity.id === 'writing-1') {
      const hasEver = /\b(ever|have you ever|has he ever|has she ever)\b/i.test(original);
      const hasNever = /\b(never|i'?ve never|he'?s never|she'?s never|we'?ve never|they'?ve never)\b/i.test(original);
      const ppSimple = (original.match(/\b(have|has|I've|you've|he's|she's|we've|they've)\b/gi) || []).length;

      if (!hasEver && !hasNever) {
        return { status: 'missing', title: 'Use ever/never', message: 'Try using <strong>ever</strong> or <strong>never</strong> in your sentences.' };
      }
      if (ppSimple < 2) {
        return { status: 'missing', title: 'Add Present Perfect', message: 'Use <strong>have/has + past participle</strong> for your experiences.' };
      }
    }

    // ——————————————————————————————————————
    // WRITING-2: For / Since + duration
    // ——————————————————————————————————————
    if (activity.id === 'writing-2') {
      const hasFor = /\bfor\b/i.test(clean);
      const hasSince = /\bsince\b/i.test(clean);
      const hasBeenIng = /\b(have|has) been \w+ing\b/i.test(original);
      const sentences = original.split(/[.!?]/).filter(s => s.trim().length > 8).length;

      if (!hasFor && !hasSince) {
        return { status: 'missing', title: 'Add for or since', message: 'Use <strong>for</strong> or <strong>since</strong> to show duration.' };
      }
      if (sentences < 2) {
        return { status: 'missing', title: 'Write more', message: 'Write at least <strong>2-3 complete sentences</strong>.' };
      }
      if (!hasBeenIng) {
        return { status: 'almost', title: 'Nice!', message: 'Consider adding Present Perfect <strong>Continuous</strong> (have been + -ing).' };
      }
    }

    // ——————————————————————————————————————
    // WRITING-3: This week + already/yet/just/still
    // ——————————————————————————————————————
    if (activity.id === 'writing-3') {
      const timePeriod = /\b(this week|this month|so far|lately|recently)\b/i.test(clean);
      const adverbs = {
        already: /\b(already|i'?ve already|has already)\b/i.test(original),
        yet: /\b(yet|haven'?t.*?yet|hasn'?t.*?yet)\b/i.test(original),
        just: /\b(just|i'?ve just|has just)\b/i.test(original),
        still: /\b(still|i'?m still|he'?s still|she'?s still)\b/i.test(original)
      };
      const usedCount = Object.values(adverbs).filter(Boolean).length;

      if (!timePeriod) {
        return { status: 'missing', title: 'Add a time period', message: 'Mention <strong>this week</strong>, <strong>so far</strong>, <strong>lately</strong>, or <strong>recently</strong>.' };
      }
      if (usedCount < 2) {
        return { status: 'missing', title: 'Add an adverb', message: 'Try using <strong>already, yet, just,</strong> or <strong>still</strong>.' };
      }
      if (usedCount >= 3) {
        return { status: 'correct', title: 'Outstanding!', message: 'Great use of Present Perfect with time adverbs!' };
      }
    }

    // ——————————————————————————————————————
    // WRITING-4: Today vs Yesterday
    // ——————————————————————————————————————
    if (activity.id === 'writing-4') {
      const todayPP = /\btoday\b.*?\b(have|has|I've|you've|he's|she's|we've|they've|'ve|'s)\b/i.test(original);
      const yesterdayPast = /\byesterday\b.*?\b(was|were|went|saw|ate|did|bought|watched|met|came|found)\b/i.test(original);
      const wrongTodayPast = /\btoday\b.*?\b(was|were|went|saw|ate)\b/i.test(original);

      if (wrongTodayPast) {
        return { status: 'grammar', title: 'Today = Present Perfect!', message: 'With <strong>today</strong> use Present Perfect, not Past Simple.' };
      }
      if (!todayPP && !yesterdayPast) return { status: 'missing', title: 'Contrast tenses', message: 'Compare <strong>today</strong> (Present Perfect) with <strong>yesterday</strong> (Past Simple).' };
    }

    // ——————————————————————————————————————
    // WRITING-5: Stative verbs (NO continuous!)
    // ——————————————————————————————————————
    if (activity.id === 'writing-5') {
      const stativeContinuous = /\b(am|is|are|have|has|was|were) been (knowing|liking|loving|hating|wanting|needing|belFisher|understanding|remembering|owning|having|belonging|seeming|preferring)\b/i.test(clean);
      const goodStativePP = /\b(have|has|I've|you've|he's|she's|we've|they've) (known|liked|loved|hated|wanted|needed|believed|understood|remembered|owned|had|belonged|seemed|preferred)\b/i.test(original);

      if (stativeContinuous) {
        return { status: 'grammar', title: 'Stative verbs ≠ Continuous!', message: 'Never say <em>have been knowing/liking/wanting</em> — use <strong>Simple</strong> form only!' };
      }
      if (!goodStativePP) {
        return { status: 'missing', title: 'Use real stative verbs', message: 'Use verbs like <strong>known, liked, loved, wanted, had, belonged…</strong>' };
      }
    }

    // ——————————————————————————————————————
    // WRITING-6: Good news & bad news (just/already/still haven’t)
    // ——————————————————————————————————————
    if (activity.id === 'writing-6') {
      const just = /\b(just|i'?ve just|has just)\b/i.test(original);
      const already = /\b(already|i'?ve already|has already)\b/i.test(original);
      const stillHavent = /\b(still haven'?t|still hasn'?t)\b/i.test(original);

      if (!just) return { status: 'missing', title: 'Good news?', message: 'Use <strong>I’ve just…</strong> for good news.' };
      if (!already) return { status: 'missing', title: 'Another good news?', message: 'Use <strong>I’ve already…</strong>.' };
      if (!stillHavent) return { status: 'missing', title: 'Bad news?', message: 'Use <strong>I still haven’t…</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-7: How long + lately/recently + Continuous
    // ——————————————————————————————————————
    if (activity.id === 'writing-7') {
      const forSinceCount = (clean.match(/\b(for|since)\b/gi) || []).length;
      const latelyRecent = /\b(lately|recently)\b/i.test(clean);
      const continuousCount = (original.match(/\b(have|has) been \w+ing\b/gi) || []).length;

      if (forSinceCount < 2) return { status: 'missing', title: 'Duration?', message: 'Use <strong>for</strong> or <strong>since</strong> at least twice.' };
      if (!latelyRecent) return { status: 'missing', title: 'Recent effort?', message: 'Use <strong>lately</strong> or <strong>recently</strong>.' };
      if (continuousCount < 2) return { status: 'missing', title: 'Continuous?', message: 'Use Present Perfect <strong>Continuous</strong> twice.' };
    }

    // ——————————————————————————————————————
    // WRITING-8: Message to old friend + since we last met
    // ——————————————————————————————————————
    if (activity.id === 'writing-8') {
      const sinceWe = /\bsince we (last met|last saw|were|met|saw)\b/i.test(clean);
      const changesPP = (original.match(/\b(have|has|I've|you've|he's|she's|we've|they've)\b/gi) || []).length >= 3;

      if (!sinceWe) return { status: 'missing', title: 'Since we last met?', message: 'Use <strong>since we last met/saw each other</strong>.' };
      if (changesPP < 3) return { status: 'missing', title: 'Life changes?', message: 'Tell at least <strong>3 changes</strong> with Present Perfect.' };
    }

    // ——————————————————————————————————————
    // WRITING-9: Biggest achievements + ever/never/just
    // ——————————————————————————————————————
    if (activity.id === 'writing-9') {
      const everNever = /\b(ever|never)\b/i.test(clean);
      const just = /\b(just|i'?ve just|has just)\b/i.test(original);
      const ppCount = (original.match(/\b(have|has|I've|you've|he's|she's|we've|they've)\b/gi) || []).length;

      if (!everNever) return { status: 'missing', title: 'Ever or never?', message: 'Use <strong>ever</strong> or <strong>never</strong>.' };
      if (!just) return { status: 'missing', title: 'Recent success?', message: 'Use <strong>I’ve just…</strong> for a recent achievement.' };
      if (ppCount < 5) return { status: 'missing', title: 'More achievements!', message: 'Write about at least <strong>5 achievements</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-10: Diary entry — mixed challenge
    // ——————————————————————————————————————
    if (activity.id === 'writing-10') {
      const forSince = (clean.match(/\b(for|since)\b/gi) || []).length >= 2;
      const adverbs = /\b(already|yet|just)\b/i.test(original);
      const continuous = /\b(have|has) been \w+ing\b/i.test(original);
      const stativeGood = /\b(have|has|I've|you've|he's|she's|we've|they've) (known|liked|loved|wanted|had|belonged)\b/i.test(original);

      if (!forSince) return { status: 'missing', title: 'Duration?', message: 'Use <strong>for/since</strong> twice.' };
      if (!adverbs) return { status: 'missing', title: 'Adverbs?', message: 'Use <strong>already</strong>, <strong>yet</strong>, or <strong>just</strong>.' };
      if (!continuous) return { status: 'missing', title: 'Continuous?', message: 'Use Present Perfect <strong>Continuous</strong> once.' };
      if (!stativeGood) return { status: 'missing', title: 'Stative verb?', message: 'Use one stative verb correctly (known, liked, loved, etc.).' };
    }

    // ——————————————————————————————————————
    // GLOBAL: No Past Simple with unfinished time
    // ——————————————————————————————————————
    const pastWithUnfinished = /(today|this week|this month|this year|this morning|lately|recently|so far).*?\b(was|were|went|did|saw|ate|met|wrote|bought|took)\b/i.test(clean);
    if (pastWithUnfinished) {
      return {
        status: 'grammar',
        title: 'Wrong tense!',
        message: 'Today / this week / lately → use <strong>Present Perfect</strong>, not Past Simple!',
        icon: 'Prohibited'
      };
    }

    // ——————————————————————————————————————
    // GLOBAL: No stative verbs in continuous
    // ——————————————————————————————————————
    const stativeContinuous = /\b(am|is|are|have|has|was|were) been (knowing|liking|loving|hating|wanting|needing|believing|understanding|remembering|owning|having|belonging|seeming|preferring)\b/i.test(clean);
    if (stativeContinuous) {
      return {
        status: 'grammar',
        title: 'Stative verbs ≠ Continuous!',
        message: 'Never say <em>have been knowing/liking/wanting</em> — use Simple form only!',
        icon: 'Prohibited'
      };
    }

    return { status: 'correct', title: 'Brilliant!', message: 'Perfect Present Perfect!' };
  }
};