const ifAlternativesGrammarChecker = {
    name: "If Alternatives Grammar Checker",
    description: "Validates conditional alternatives like unless, as long as, provided that, in case, and otherwise",

    validateUnless: function(sentence) {
        // Unless should be followed by positive clause (not negative)
        const unlessPatterns = [
            /\bunless\s+(?:I|you|he|she|it|we|they)\s+(?:am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|must)\s+\w+/gi,
            /\bunless\s+(?:I|you|he|she|it|we|they)\s+(?:go|come|study|work|play|eat|drink|sleep|run|walk|talk|speak|write|read)\w*/gi
        ];

        return unlessPatterns.some(pattern => pattern.test(sentence));
    },

    validateAsLongAs: function(sentence) {
        const asLongAsPatterns = [
            /\bas\s+long\s+as\s+(?:I|you|he|she|it|we|they)\s+(?:am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|must)\s+\w+/gi,
            /\bas\s+long\s+as\s+(?:I|you|he|she|it|we|they)\s+(?:finish|complete|study|work|arrive|leave|call|come)\w*/gi
        ];

        return asLongAsPatterns.some(pattern => pattern.test(sentence));
    },

    validateProvidedThat: function(sentence) {
        const providedPatterns = [
            /\bprovided\s+(?:that\s+)?(?:I|you|he|she|it|we|they)\s+(?:am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|must)\s+\w+/gi,
            /\bprovided\s+(?:that\s+)?(?:I|you|he|she|it|we|they)\s+(?:meet|fulfill|satisfy|complete|finish)\w*/gi
        ];

        return providedPatterns.some(pattern => pattern.test(sentence));
    },

    validateInCase: function(sentence) {
        const inCasePatterns = [
            /\bin\s+case\s+(?:I|you|he|she|it|we|they)\s+(?:am|is|are|was|were|have|has|had|do|does|did|will|would|can|could|should|may|might|must)\s+\w+/gi,
            /\bin\s+case\s+(?:it|there|something|anything)\s+(?:rain|snow|happens|occurs|goes)\w*/gi
        ];

        return inCasePatterns.some(pattern => pattern.test(sentence));
    },

    validateOtherwise: function(sentence) {
        const otherwisePatterns = [
            /\botherwise\s+(?:I|you|he|she|it|we|they)\s+(?:will|would|can|could|should|may|might|must)\s+\w+/gi,
            /\bor\s+else\s+(?:I|you|he|she|it|we|they)\s+(?:will|would|can|could|should|may|might|must)\s+\w+/gi
        ];

        return otherwisePatterns.some(pattern => pattern.test(sentence));
    },

    checkCommonMistakes: function(sentence) {
        const mistakes = [];

        // Check for double negatives with unless
        if (/\bunless\s+(?:I|you|he|she|it|we|they)\s+(?:don't|doesn't|didn't|aren't|isn't|wasn't|weren't|haven't|hasn't|hadn't|won't|wouldn't|can't|couldn't|shouldn't|mayn't|mightn't|mustn't)\s+\w+/gi.test(sentence)) {
            mistakes.push({
                type: "double_negative",
                message: "Avoid double negatives with 'unless'. Use positive verb forms.",
                suggestion: sentence.replace(/\bunless\s+(?:I|you|he|she|it|we|they)\s+(don't|doesn't|didn't|aren't|isn't|wasn't|weren't|haven't|hasn't|hadn't|won't|wouldn't|can't|couldn't|shouldn't|mayn't|mightn't|mustn't)\s+(\w+)/gi, (match, neg, verb) => {
                    // This is a simplified suggestion - in practice, would need more complex logic
                    return match.replace(neg, '');
                }),
                severity: "high"
            });
        }

        // Check for incorrect use of "if not" when "unless" would be better
        if (/\bif\s+(?:I|you|he|she|it|we|they)\s+(?:don't|doesn't|didn't|aren't|isn't|wasn't|weren't)\s+\w+,\s+(?:I|you|he|she|it|we|they)\s+will/gi.test(sentence)) {
            mistakes.push({
                type: "wordy_structure",
                message: "Consider using 'unless' instead of 'if + negative' for more concise conditional expressions.",
                suggestion: "Consider: 'Unless [positive condition], [result]'",
                severity: "medium"
            });
        }

        // Check for missing comma before otherwise
        if (/\s+otherwise\b/gi.test(sentence) && !/,\s+otherwise\b/gi.test(sentence)) {
            mistakes.push({
                type: "punctuation_error",
                message: "Use a comma before 'otherwise' when it introduces a consequence.",
                suggestion: sentence.replace(/\s+otherwise\b/gi, ', otherwise'),
                severity: "low"
            });
        }

        // Check for incorrect tense with in case (should be present for future)
        if (/\bin\s+case\s+(?:I|you|he|she|it|we|they)\s+(?:will|would)\s+\w+/gi.test(sentence)) {
            mistakes.push({
                type: "tense_error",
                message: "With 'in case', use present simple for future possibilities, not 'will/would'.",
                suggestion: sentence.replace(/\bin\s+case\s+(?:I|you|he|she|it|we|they)\s+(will|would)\s+(\w+)/gi, (match, modal, verb) => {
                    return match.replace(modal + ' ' + verb, verb + 's'); // Simplified
                }),
                severity: "medium"
            });
        }

        return mistakes;
    },

    validateActivity: function(activityType, content) {
        let errors = [];
        let suggestions = [];

        switch(activityType) {
            case 'writing':
                // Check for proper use of conditional alternatives in writing
                const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

                sentences.forEach((sentence, index) => {
                    const trimmed = sentence.trim();

                    // Check if sentence contains conditional alternatives
                    if (/\b(unless|as long as|provided that|in case|otherwise|or else)\b/gi.test(trimmed)) {
                        const mistakes = this.checkCommonMistakes(trimmed);

                        if (mistakes.length > 0) {
                            errors.push({
                                sentence: index + 1,
                                issues: mistakes
                            });
                        }

                        // Validate specific structures
                        const hasValidUnless = this.validateUnless(trimmed);
                        const hasValidAsLongAs = this.validateAsLongAs(trimmed);
                        const hasValidProvided = this.validateProvidedThat(trimmed);
                        const hasValidInCase = this.validateInCase(trimmed);
                        const hasValidOtherwise = this.validateOtherwise(trimmed);

                        const hasAnyValid = hasValidUnless || hasValidAsLongAs || hasValidProvided || hasValidInCase || hasValidOtherwise;

                        if (!hasAnyValid) {
                            suggestions.push({
                                sentence: index + 1,
                                message: "Check the structure of your conditional alternative. Ensure proper verb forms and word order.",
                                type: "structure_suggestion"
                            });
                        }
                    }
                });
                break;

            case 'quiz':
                // Validate quiz answers contain correct alternative structures
                if (typeof content === 'string') {
                    const mistakes = this.checkCommonMistakes(content);
                    if (mistakes.length > 0) {
                        errors.push({
                            type: "quiz_answer_error",
                            issues: mistakes
                        });
                    }
                }
                break;

            case 'spelling':
                // Check spelling activity answers
                if (Array.isArray(content)) {
                    content.forEach((answer, index) => {
                        const mistakes = this.checkCommonMistakes(answer);
                        if (mistakes.length > 0) {
                            errors.push({
                                answer: index + 1,
                                issues: mistakes
                            });
                        }
                    });
                }
                break;
        }

        return {
            isValid: errors.length === 0,
            errors: errors,
            suggestions: suggestions,
            score: Math.max(0, 100 - (errors.length * 10) - (suggestions.length * 5))
        };
    },

    getFeedback: function(validationResult) {
        let feedback = {
            overall: "",
            strengths: [],
            improvements: [],
            tips: []
        };

        if (validationResult.isValid) {
            feedback.overall = "Excellent! Your conditional alternatives are used correctly.";
            feedback.strengths.push("Proper use of unless, as long as, provided that");
            feedback.strengths.push("Correct verb forms with conditional alternatives");
        } else {
            feedback.overall = "Good effort! Here are some areas to improve with conditional alternatives.";

            validationResult.errors.forEach(error => {
                if (error.issues) {
                    error.issues.forEach(issue => {
                        feedback.improvements.push(issue.message);
                    });
                }
            });

            validationResult.suggestions.forEach(suggestion => {
                feedback.tips.push(suggestion.message);
            });
        }

        // Add general tips
        feedback.tips.push("💡 Unless = if not (use positive verbs!)");
        feedback.tips.push("💡 As long as / Provided that = if and only if");
        feedback.tips.push("💡 In case = preparing for possibilities");
        feedback.tips.push("💡 Otherwise = shows consequences");

        return feedback;
    },

    // Helper method for game validation
    validateGameAnswer: function(question, answer) {
        // This would be called by the game logic
        const mistakes = this.checkCommonMistakes(answer);
        return {
            correct: mistakes.length === 0,
            feedback: mistakes.length > 0 ? mistakes[0].message : "Correct!",
            suggestion: mistakes.length > 0 ? mistakes[0].suggestion : null
        };
    }
};

// Export for use in the main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ifAlternativesGrammarChecker;
}