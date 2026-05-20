// checkers/questionTags.js
export const questionTagsChecker = {
    name: "Question Tags",
    minWords: 20,
    check: function (text, activity) {
        const clean = text.toLowerCase().replace(/[.,!?;:'"()–—]/g, ' ').replace(/\s+/g, ' ');
        const original = text;
        
        if (clean.split(' ').filter(w => w).length < this.minWords) {
            return { status: 'too-short', title: 'Too Short', message: 'Write at least 20 words to practice question tags properly.', icon: 'Pencil' };
        }

        // WRITING-1: Positive statements + negative tags
        if (activity.id === 'writing-1') {
            const hasNegativeTag = /(isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|don't|doesn't|didn't|can't|couldn't|won't|wouldn't|shouldn't|mustn't)\s+\w+\?/i.test(original);
            const hasThreeExamples = (original.match(/\?\s*/g) || []).length >= 3;
            
            if (!hasNegativeTag) {
                return { status: 'missing', title: 'Use Negative Tags', message: 'Positive statements need <strong>negative tags</strong>. Example: <em>You\'re coming, aren\'t you?</em>' };
            }
            if (!hasThreeExamples) {
                return { status: 'missing', title: 'Write 3 Examples', message: 'Include <strong>three different statements</strong> with correct tags.' };
            }
        }

        // WRITING-2: Negative statements + positive tags
        if (activity.id === 'writing-2') {
            const hasPositiveTag = /(is|are|was|were|have|has|had|do|does|did|can|could|will|would|should|must)\s+\w+\?/i.test(original);
            const hasNegativeStatement = /(n't|not|never|no)\s+\w+/i.test(original);
            
            if (!hasNegativeStatement) {
                return { status: 'missing', title: 'Use Negative Statements', message: 'Start with statements containing <strong>not/n\'t/never</strong>.' };
            }
            if (!hasPositiveTag) {
                return { status: 'missing', title: 'Use Positive Tags', message: 'Negative statements need <strong>positive tags</strong>. Example: <em>He can\'t drive, can he?</em>' };
            }
        }

        // WRITING-3: Special cases (aren't I?, shall we?, will you?)
        if (activity.id === 'writing-3') {
            const hasArentI = /\baren't I\?/i.test(original);
            const hasShallWe = /\bshall we\?/i.test(original);
            const hasWillYou = /\bwill you\?/i.test(original);
            
            if (!hasArentI && !hasShallWe && !hasWillYou) {
                return { status: 'missing', title: 'Use Special Case Tags', message: 'Include at least one of: <strong>aren\'t I?</strong>, <strong>shall we?</strong>, or <strong>will you?</strong>' };
            }
        }

        // WRITING-4: Negative-meaning words + positive tags
        if (activity.id === 'writing-4') {
            const hasNegativeWord = /\b(never|seldom|rarely|hardly|scarcely|barely|nobody|nothing)\b/i.test(original);
            const hasPositiveTagAfter = /\b(never|seldom|rarely|hardly).*?\b(do|does|did|is|are|can|will)\s+\w+\?/i.test(original);
            
            if (!hasNegativeWord) {
                return { status: 'missing', title: 'Use Negative-Meaning Words', message: 'Include words like <strong>never/seldom/hardly</strong> that have negative meaning.' };
            }
            if (!hasPositiveTagAfter) {
                return { status: 'error', title: 'Use Positive Tag After Negative Word', message: 'After <strong>never/seldom/hardly</strong>, use a <strong>positive tag</strong>. Example: <em>She never calls, does she?</em>' };
            }
        }

        // WRITING-6: Complex sentences - tag matches main clause
        if (activity.id === 'writing-6') {
            const hasComplexStructure = /\b(that|who|which|if|when)\b/i.test(original);
            const hasMainClauseTag = !/(that|who|which)\s+\w+\s+\w+\?/i.test(original); // Tag shouldn't match subordinate clause
            
            if (!hasComplexStructure) {
                return { status: 'missing', title: 'Use Complex Sentences', message: 'Include a sentence with a subordinate clause (that/who/if/when).' };
            }
            // Soft check: warn if tag seems to match subordinate clause
            if (/\b(that|who|which)\s+\w+\s+(isn't|doesn't|didn't)\s+\w+\?/i.test(original)) {
                return { status: 'error', title: 'Tag Matches Wrong Clause', message: 'The tag should match the <strong>main clause</strong>, not the subordinate clause. Example: <em>She said he was late, didn\'t she?</em>' };
            }
        }

        // WRITING-7: Imperative + polite tag
        if (activity.id === 'writing-7') {
            const hasImperative = /^[A-Z][^.]*[,.]\s*(will|would|could)\s+you\?/m.test(original) || /\b(Please\s+)?[A-Z][a-z]+\s+\w+,\s*(will|would|could)\s+you\?/i.test(original);
            const hasPoliteTag = /\b(will you|would you|could you)\?/i.test(original);
            
            if (!hasPoliteTag) {
                return { status: 'missing', title: 'Use Polite Request Tags', message: 'After commands, use <strong>will you? / would you? / could you?</strong> for politeness.' };
            }
            if (!hasImperative) {
                return { status: 'context', title: 'Use Imperative + Tag Structure', message: 'Start with a command, then add the tag: <em>Close the door, would you?</em>' };
            }
        }

        // GLOBAL: Common tag errors
        if (/\bamn't I\?/i.test(original)) {
            return { status: 'error', title: 'Use "aren\'t I?"', message: 'Standard English uses <strong>aren\'t I?</strong>, not "amn\'t I?".' };
        }
        if (/\blet's\b.*?\b(do|don't)\s+we\?/i.test(original)) {
            return { status: 'error', title: 'Use "shall we?" after Let\'s', message: 'After <strong>Let\'s</strong>, use <strong>shall we?</strong>, not "do we?" or "don\'t we?".' };
        }
        if (/\b(never|seldom|hardly).*?\b(doesn't|don't|isn't)\s+\w+\?/i.test(original)) {
            return { status: 'error', title: 'Positive Tag After Negative Word', message: 'After <strong>never/seldom/hardly</strong>, use a <strong>positive tag</strong>. Example: <em>He never calls, does he?</em>' };
        }
        if (/\b(nobody|nothing).*?\b(didn't|doesn't)\s+\w+\?/i.test(original)) {
            return { status: 'error', title: 'Use "they" for Indefinite Subjects', message: 'For <strong>nobody/nothing</strong>, use <strong>they</strong> in the tag: <em>Nobody called, did they?</em>' };
        }

        return { status: 'success', title: 'Tag Mastery! 🎉', message: 'Your question tags are perfectly formed and context-appropriate. You seek agreement like a pro!', icon: 'CheckCircle' };
    }
};