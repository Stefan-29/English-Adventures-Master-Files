const subjunctiveMoodGrammarChecker = {
    name: "Subjunctive Mood Grammar Checker",
    description: "Validates subjunctive mood usage including were for all subjects, base verbs in mandative subjunctive, and special structures",

    validatePresentSubjunctive: function(sentence) {
        // Present subjunctive: were for all subjects
        const presentPatterns = [
            /\b(?:I|you|he|she|it|we|they)\s+were\b/gi,
            /\bwish(?:es)?\s+(?:I|you|he|she|it|we|they)\s+were\b/gi,
            /\bif\s+(?:I|you|he|she|it|we|they)\s+were\b/gi
        ];

        return presentPatterns.some(pattern => pattern.test(sentence));
    },

    validateMandativeSubjunctive: function(sentence) {
        // Mandative subjunctive: base verbs after demand/insist/require/suggest + that
        const mandativeVerbs = /\b(?:demand|insist|require|recommend|suggest|propose)\s+(?:that\s+)?(?:I|you|he|she|it|we|they)\s+(\w+)/gi;
        const match = mandativeVerbs.exec(sentence);

        if (match) {
            const verb = match[2];
            // Check if it's a base form (no -s, -es, -ies for third person)
            return !verb.match(/(?:s|es|ies)$/i) || verb.match(/\b(?:be|have|do|go|see|come|take|make|get|know|think|say|tell|work|play|live|love|help|need|want|use|find|give|keep|leave|feel|put|bring|begin|seem|help|talk|turn|start|run|move|like|hold|show|hear|write|sit|stand|lie|lead|understand|watch|follow|stop|create|spend|grow|open|walk|win|lose|offer|remember|consider|appear|buy|serve|send|expect|build|stay|fall|cut|reach|kill|remain|suggest|raise|pass|sell|require|report|decide|pull|return|explain|hope|develop|carry|break|receive|agree|support|hit|produce|eat|cover|place|close|plan|control|ask|call|pay|read|allow|add|spend|offer|continue|protect|include|set|learn|change|lead|understand|watch|follow|stop|create|spend|grow|open|walk|win|lose|offer|remember|consider|appear|buy|serve|send|expect|build|stay|fall|cut|reach|kill|remain|suggest|raise|pass|sell|require|report|decide|pull|return|explain|hope|develop|carry|break|receive|agree|support|hit|produce|eat|cover|place|close|plan|control|ask|call|pay|read|allow|add)$/i);
        }

        return false;
    },

    validateAsIfSubjunctive: function(sentence) {
        // As if/as though + were (past subjunctive)
        const asIfPatterns = [
            /\bas\s+(?:if|though)\s+(?:I|you|he|she|it|we|they)\s+were\b/gi,
            /\bas\s+(?:if|though)\s+(?:I|you|he|she|it|we|they)\s+had\s+\w+(?:ed|en)\b/gi
        ];

        return asIfPatterns.some(pattern => pattern.test(sentence));
    },

    validatePastSubjunctive: function(sentence) {
        // Past subjunctive: were to, had been
        const pastPatterns = [
            /\b(?:I|you|he|she|it|we|they)\s+were\s+to\b/gi,
            /\b(?:I|you|he|she|it|we|they)\s+had\s+been\b/gi
        ];

        return pastPatterns.some(pattern => pattern.test(sentence));
    },

    validateFormulaicSubjunctive: function(sentence) {
        // Formulaic expressions
        const formulaicPatterns = [
            /\bbe\s+that\s+as\s+it\s+may\b/gi,
            /\bcome\s+what\s+may\b/gi,
            /\bsuffice\s+it\s+to\s+say\b/gi,
            /\bfar\s+be\s+it\s+from\s+me\b/gi,
            /\bso\s+be\s+it\b/gi,
            /\bheaven\s+forbid\b/gi
        ];

        return formulaicPatterns.some(pattern => pattern.test(sentence));
    },

    checkCommonMistakes: function(sentence) {
        const mistakes = [];

        // Check for "was" instead of "were" in subjunctive
        if (/\b(?:I|you|he|she|it|we|they)\s+was\b/gi.test(sentence) &&
            /\b(?:wish|if|as\s+if|as\s+though)\b/gi.test(sentence)) {
            mistakes.push({
                type: "was_were_error",
                message: "Use 'were' for all subjects in subjunctive mood, not 'was'",
                suggestion: sentence.replace(/\b(I|you|he|she|it|we|they)\s+was\b/gi, '$1 were'),
                severity: "high"
            });
        }

        // Check for -s ending on base verbs in mandative subjunctive
        const mandativeMatch = /\b(?:demand|insist|require|recommend|suggest|propose)\s+(?:that\s+)?(?:he|she|it)\s+(\w+s)\b/gi.exec(sentence);
        if (mandativeMatch) {
            const verb = mandativeMatch[1];
            if (verb.endsWith('s') && !verb.endsWith('ss')) {
                mistakes.push({
                    type: "base_verb_error",
                    message: "Use base verb form (no -s) in mandative subjunctive",
                    suggestion: sentence.replace(/\b(he|she|it)\s+(\w+)s\b/gi, '$1 $2'),
                    severity: "high"
                });
            }
        }

        // Check for incorrect indicative mood when subjunctive is needed
        if (/\b(?:demand|insist|require|recommend|suggest|propose)\s+(?:that\s+)?(?:he|she|it)\s+(?:is|has|does|goes)\b/gi.test(sentence)) {
            mistakes.push({
                type: "mood_error",
                message: "Use subjunctive mood (base verbs) after mandative verbs, not indicative",
                suggestion: "Use base verb form instead of conjugated verb",
                severity: "high"
            });
        }

        // Check for "were to" misuse
        if (/\bwere\s+to\s+(?:be|have|do)\b/gi.test(sentence)) {
            mistakes.push({
                type: "structure_error",
                message: "'Were to' should be followed by base verb, not 'be/have/do'",
                suggestion: sentence.replace(/\bwere\s+to\s+(be|have|do)\b/gi, 'were to [base verb]'),
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
                // Check for proper subjunctive usage in writing
                const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

                sentences.forEach((sentence, index) => {
                    const trimmed = sentence.trim();

                    // Check if sentence contains subjunctive structures
                    if (/\b(?:were|wish|if|as\s+if|as\s+though|demand|insist|require|recommend|suggest)\b/gi.test(trimmed)) {
                        const mistakes = this.checkCommonMistakes(trimmed);

                        if (mistakes.length > 0) {
                            errors.push({
                                sentence: index + 1,
                                issues: mistakes
                            });
                        }

                        // Validate specific subjunctive types
                        const hasValidPresent = this.validatePresentSubjunctive(trimmed);
                        const hasValidMandative = this.validateMandativeSubjunctive(trimmed);
                        const hasValidAsIf = this.validateAsIfSubjunctive(trimmed);
                        const hasValidPast = this.validatePastSubjunctive(trimmed);
                        const hasValidFormulaic = this.validateFormulaicSubjunctive(trimmed);

                        const hasAnyValid = hasValidPresent || hasValidMandative || hasValidAsIf || hasValidPast || hasValidFormulaic;

                        if (!hasAnyValid) {
                            suggestions.push({
                                sentence: index + 1,
                                message: "Check your subjunctive structure. Remember: were for all subjects, base verbs in mandative, proper as if/as though forms.",
                                type: "structure_suggestion"
                            });
                        }
                    }
                });
                break;

            case 'quiz':
                // Validate quiz answers contain correct subjunctive forms
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
            feedback.overall = "Excellent! Your subjunctive mood usage is correct.";
            feedback.strengths.push("Proper use of 'were' for all subjects");
            feedback.strengths.push("Correct base verbs in mandative subjunctive");
        } else {
            feedback.overall = "Good effort! Here are some areas to improve with subjunctive mood.";

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
        feedback.tips.push("💡 Subjunctive: Always 'were', never 'was'!");
        feedback.tips.push("💡 Mandative: demand/insist/require + that + subject + base verb");
        feedback.tips.push("💡 As if/as though: for unreal comparisons");
        feedback.tips.push("💡 Formulaic: learn fixed expressions as units");

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
    module.exports = subjunctiveMoodGrammarChecker;
}