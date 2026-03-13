const wishIfIfOnlyGrammarChecker = {
    name: "Wish / If Only Grammar Checker",
    description: "Validates wish, if only, and conditional if structures for expressing regrets and wishes",

    validateWishSentence: function(sentence) {
        const wishPatterns = [
            // Present regrets: wish + past simple
            /\b(wish(?:es)?)\s+(?:I|you|he|she|it|we|they)\s+(?:were|had|could|would)\b/gi,
            // Past regrets: wish + past perfect
            /\b(wish(?:es)?)\s+(?:I|you|he|she|it|we|they)\s+had\s+\w+(?:ed|en)\b/gi,
            // Actions: wish + would
            /\b(wish(?:es)?)\s+(?:I|you|he|she|it|we|they)\s+would\s+\w+\b/gi
        ];

        return wishPatterns.some(pattern => pattern.test(sentence));
    },

    validateIfOnlySentence: function(sentence) {
        const ifOnlyPatterns = [
            // If only + past simple (present unreal)
            /\bif\s+only\s+(?:I|you|he|she|it|we|they)\s+(?:were|had|could)\b/gi,
            // If only + past perfect (past unreal)
            /\bif\s+only\s+(?:I|you|he|she|it|we|they)\s+had\s+\w+(?:ed|en)\b/gi,
            // If only + would (future wishes)
            /\bif\s+only\s+(?:I|you|he|she|it|we|they)\s+would\s+\w+\b/gi
        ];

        return ifOnlyPatterns.some(pattern => pattern.test(sentence));
    },

    validateConditionalIf: function(sentence) {
        const conditionalIfPatterns = [
            // If + past simple/past perfect for wishes
            /\bif\s+(?:I|you|he|she|it|we|they)\s+(?:were|had|could|would)\b/gi,
            /\bif\s+(?:I|you|he|she|it|we|they)\s+had\s+\w+(?:ed|en)\b/gi
        ];

        return conditionalIfPatterns.some(pattern => pattern.test(sentence));
    },

    checkCommonMistakes: function(sentence) {
        const mistakes = [];

        // Check for "wish I was" instead of "wish I were"
        if (/\bwish(?:es)?\s+I\s+was\b/gi.test(sentence)) {
            mistakes.push({
                type: "subjunctive_error",
                message: "Use 'were' instead of 'was' after wish for all subjects",
                suggestion: sentence.replace(/\bwish(?:es)?\s+I\s+was\b/gi, (match) => match.replace('was', 'were')),
                severity: "high"
            });
        }

        // Check for "wish I would have" instead of "wish I had"
        if (/\bwish(?:es)?\s+(?:I|you|he|she|it|we|they)\s+would\s+have\b/gi.test(sentence)) {
            mistakes.push({
                type: "past_regret_error",
                message: "For past regrets, use 'had' instead of 'would have'",
                suggestion: sentence.replace(/\bwish(?:es)?\s+(?:I|you|he|she|it|we|they)\s+would\s+have\b/gi, (match) => match.replace('would have', 'had')),
                severity: "high"
            });
        }

        // Check for using wish with real future
        if (/\bwish(?:es)?\s+(?:I|you|he|she|it|we|they)\s+will\b/gi.test(sentence)) {
            mistakes.push({
                type: "future_error",
                message: "Don't use 'wish' with real future events. Use 'hope' instead",
                suggestion: sentence.replace(/\bwish(?:es)?/gi, 'hope'),
                severity: "medium"
            });
        }

        // Check for incorrect word order in if only
        if (/\bonly\s+if\b/gi.test(sentence)) {
            mistakes.push({
                type: "word_order_error",
                message: "'If only' should come together, not 'only if'",
                suggestion: sentence.replace(/\bonly\s+if\b/gi, 'if only'),
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
                // Check for proper wish structures in writing
                const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

                sentences.forEach((sentence, index) => {
                    const trimmed = sentence.trim();

                    // Check if sentence contains wish structures
                    if (/\bwish(?:es)?\b/gi.test(trimmed) || /\bif\s+only\b/gi.test(trimmed)) {
                        const mistakes = this.checkCommonMistakes(trimmed);

                        if (mistakes.length > 0) {
                            errors.push({
                                sentence: index + 1,
                                issues: mistakes
                            });
                        }

                        // Validate structure
                        const hasValidWish = this.validateWishSentence(trimmed);
                        const hasValidIfOnly = this.validateIfOnlySentence(trimmed);
                        const hasValidConditionalIf = this.validateConditionalIf(trimmed);

                        if (!hasValidWish && !hasValidIfOnly && !hasValidConditionalIf) {
                            suggestions.push({
                                sentence: index + 1,
                                message: "Consider using proper wish structures: wish + past simple, wish + had + past participle, or if only + same structures",
                                type: "structure_suggestion"
                            });
                        }
                    }
                });
                break;

            case 'quiz':
                // Validate quiz answers contain correct wish grammar
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
            feedback.overall = "Excellent! Your wish and if only structures are grammatically correct.";
            feedback.strengths.push("Proper use of wish/if only grammar");
            feedback.strengths.push("Correct verb forms for regrets");
        } else {
            feedback.overall = "Good effort! Here are some areas to improve with wish and if only structures.";

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
        feedback.tips.push("Remember: wish + past simple = present regrets");
        feedback.tips.push("wish + had + past participle = past regrets");
        feedback.tips.push("If only = wish with more emotion!");
        feedback.tips.push("Always use 'were' after wish (not 'was')");

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
    module.exports = wishIfIfOnlyGrammarChecker;
}