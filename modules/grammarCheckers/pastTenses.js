// checkers/pastTenses.js
export const pastTensesChecker = {
  name: "Past Tenses",
  minWords: 16,

  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
    const original = text;

    // Global minimum length
    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return {
        status: 'too-short',
        title: 'Too Short',
        message: 'Write complete sentences — aim for at least 22 words.',
        icon: 'Pencil'
      };
    }

    // ——————————————————————————————————————
    // WRITING-1: Last night + Past Simple
    // ——————————————————————————————————————
    if (activity.id === 'writing-1') {
      const timeWords = /\b(last night|yesterday|at \d|after dinner|before bed|this morning|tonight)\b/i.test(original);
      const pastSimpleCount = (text.match(/\b(went|watched|played|ate|studied|called|read|slept|met|had|did|cooked|helped|was|were|worked|talked|walked|found)\b/gi) || []).length;

      if (!timeWords) return { status: 'missing', title: 'When?', message: 'Use time words: <strong>last night, yesterday, at 7 PM…</strong>' };
      if (pastSimpleCount < 3) return { status: 'missing', title: 'Need more verbs', message: 'Use at least <strong>3 Past Simple verbs</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-2: Best day ever — 6 Past Simple (3 irregular)
    // ——————————————————————————————————————
    if (activity.id === 'writing-2') {
      const irregular = (text.match(/\b(went|saw|ate|took|met|bought|swam|had|did|gave|ran|sang|wrote|came|found|thought|made|got|felt|told)\b/gi) || []).length;
      const totalPast = (text.match(/\b([a-z]+ed|went|saw|ate|took|met|bought|swam|had|did|gave|ran|sang|wrote|came|found|thought|made|got|felt|told|was|were)\b/gi) || []).length;

      if (totalPast < 4) return { status: 'missing', title: 'Need more actions', message: 'Use at least <strong>4 Past Simple verbs</strong>.' };
      if (irregular < 2) return { status: 'almost', title: 'Good start!', message: 'Try adding a few <strong>irregular verbs</strong> (went, saw, ate, took, met, etc.).' };
    }

    // ——————————————————————————————————————
    // WRITING-3: Sudden interruption (Past Continuous + Past Simple)
    // ——————————————————————————————————————
    if (activity.id === 'writing-3') {
      const cont = /\b(was|were)\s+\w+ing\b/i.test(original);
      const simple = /\b(rang|fell|broke|dropped|shouted|crashed|slipped|tripped|burned|came|went|happened|arrived|saw)\b/i.test(original);
      const connector = /\b(when|while|suddenly|as)\b/i.test(clean);

      if (!cont) return { status: 'missing', title: 'Background scene?', message: 'Describe what was happening: <strong>was/were + -ing</strong>' };
      if (!simple) return { status: 'missing', title: 'Sudden action?', message: 'What happened? Use <strong>Past Simple</strong>.' };
      if (!connector) return { status: 'almost', title: 'Nice story!', message: 'Try connecting with <strong>when / while / suddenly</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-4 & WRITING-9: used to ×3
    // ——————————————————————————————————————
    if (activity.id === 'writing-4' || activity.id === 'writing-9') {
      const usedToCount = (text.match(/\bused\s+to\b|\bdidn'?t\s+use\s+to\b/gi) || []).length;
      if (usedToCount < 2) return { status: 'missing', title: 'Need used to', message: "Use <strong>used to</strong> or <strong>didn't use to</strong> at least <strong>twice</strong>." };
    }

    // ——————————————————————————————————————
    // WRITING-5: While + two Past Continuous at the same time
    // ——————————————————————————————————————
    if (activity.id === 'writing-5') {
      const whileClause = /\bwhile\b/i.test(clean);
      const continuousActions = (original.match(/\b(was|were)\s+\w+ing\b/gi) || []).length >= 1;

      if (!whileClause && !continuousActions) return { status: 'missing', title: 'Show simultaneous actions', message: 'Use <strong>while</strong> or <strong>was/were + -ing</strong> to show two things happening together.' };
      if (!continuousActions) return { status: 'almost', title: 'Try this', message: 'Use <strong>Past Continuous</strong> to describe actions happening at the same time.' };
    }

    // ——————————————————————————————————————
    // WRITING-6: Apology — Past Continuous + Past Simple
    // ——————————————————————————————————————
    if (activity.id === 'writing-6') {
      const sorry = /\b(sorry|apologize|my fault|apologies)\b/i.test(original);
      const cont = /\b(was|were)\s+\w+ing\b/i.test(original);
      const reason = /\b(because|so|that'?s why|when)\b/i.test(clean);

      if (!sorry) return { status: 'missing', title: 'Say sorry!', message: 'Start with <strong>Sorry</strong> or <strong>I apologize</strong>' };
      if (!cont && !reason) return { status: 'almost', title: 'Good apology!', message: 'Consider explaining with <strong>because</strong> or <strong>was + -ing</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-7: Photo description (Past Continuous scene + Past Simple action)
    // ——————————————————————————————————————
    if (activity.id === 'writing-7') {
      const scene = (original.match(/\b(was|were)\s+\w+ing\b/gi) || []).length >= 1;
      const action = /\b(then|suddenly|and then|after that|happened)\b/i.test(clean);

      if (!scene) return { status: 'missing', title: 'Background scene', message: 'Use <strong>Past Continuous</strong>: was/were + -ing' };
      if (!action) return { status: 'almost', title: 'Nice scene!', message: 'Try adding what happened next with <strong>then</strong> or <strong>suddenly</strong>.' };
    }

    // ——————————————————————————————————————
    // WRITING-8: Unforgettable day — mixed
    // ——————————————————————————————————————
    if (activity.id === 'writing-8') {
      const cont = (original.match(/\b(was|were)\s+\w+ing\b/gi) || []).length >= 2;
      const simpleCount = (text.match(/\b(went|met|saw|happened|started|rained|shouted|laughed)\b/gi) || []).length >= 3;

      if (!cont) return { status: 'missing', title: 'Background?', message: 'Use <strong>Past Continuous</strong> at least twice.' };
      if (!simpleCount) return { status: 'missing', title: 'Main events?', message: 'Use <strong>Past Simple</strong> at least three times.' };
    }

    // ——————————————————————————————————————
    // WRITING-10: Scariest/Funniest moment — all structures
    // ——————————————————————————————————————
    if (activity.id === 'writing-10') {
      const usedTo = /\bused\s+to\b/i.test(clean);
      const whileClause = /\bwhile\b/i.test(clean);
      const contCount = (original.match(/\b(was|were)\s+\w+ing\b/gi) || []).length >= 2;
      const simpleCount = (text.match(/\b([a-z]+ed|went|ran|screamed|laughed|cried|fell)\b/gi) || []).length >= 3;

      if (!usedTo) return { status: 'missing', title: 'used to?', message: 'Include <strong>I used to…</strong>' };
      if (!whileClause) return { status: 'missing', title: 'while?', message: 'Use <strong>while</strong> once.' };
      if (contCount < 2) return { status: 'missing', title: '2 Past Continuous', message: 'Use <strong>was/were + -ing</strong> twice.' };
      if (simpleCount < 3) return { status: 'missing', title: '3 main actions', message: 'Use <strong>Past Simple</strong> three times.' };
    }

    // ——————————————————————————————————————
    // GLOBAL: No Present tense for past events!
    // ——————————————————————————————————————
    const presentForPast = /\b(am|is|are|go|watch|play|eat|have|do|like|want|live)\b.*\b(yesterday|last night|when i was|as a child|ago)\b/i.test(clean);
    if (presentForPast) {
      return {
        status: 'grammar',
        title: 'Wrong tense!',
        message: 'Yesterday / last night / when I was little → use <strong>Past tense only</strong>!',
        icon: 'Prohibited'
      };
    }

    return { status: 'correct', title: 'Fantastic storytelling!', message: 'Perfect use of Past Tenses!' };
  }
};