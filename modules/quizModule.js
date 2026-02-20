const QuizModule = {
    activities: [],
    currentActivity: null,
    hasFailed: {},
    perfectCompletes: {},
    hintCounts: {},
    hintLimits: {}, // Track hint usage limits per activity
    selectedAnswers: {}, // Track selected answers for quiz questions

    init: function (activities) {
        this.activities = activities;
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.hintCounts = {};
        this.hintLimits = {};
        this.selectedAnswers = {};
        this.renderActivities();
    },

    renderActivities: function () {
        const container = document.getElementById('quiz-module-activities');
        if (!container) return;
        container.innerHTML = '';

        this.activities.forEach((activity, index) => {
            const moduleId = App.currentGrammarModuleId;
            const moduleCompletions = App.state.completedActivities[moduleId] || {};
            const completionStatus = moduleCompletions[activity.id];
            const isCompleted = completionStatus === 'completed';
            const isIncorrect = completionStatus === 'incorrect';
            const isAttempted = isCompleted || isIncorrect;
            
            this.hasFailed[activity.id] = this.hasFailed[activity.id] || false;
            this.perfectCompletes[activity.id] = this.perfectCompletes[activity.id] || false;
            this.hintCounts[activity.id] = this.hintCounts[activity.id] || 0;
            this.hintLimits[activity.id] = this.hintLimits[activity.id] || 2; // Max 2 hints per quiz question

            const activityCard = document.createElement('div');
            activityCard.className = 'activity-card';
            activityCard.id = activity.id;

            // Header
            const header = document.createElement('div');
            header.className = 'activity-header';
            const number = document.createElement('div');
            number.className = 'activity-number';
            number.textContent = `Question ${index + 1}`;
            const status = document.createElement('div');
            status.className = 'activity-status';
            
            if (isCompleted) {
                status.textContent = '✓ Completed';
                status.classList.add('completed');
            } else if (isIncorrect) {
                status.textContent = '❌ Incorrect';
                status.classList.add('incorrect');
            } else {
                status.textContent = 'Pending';
            }
            
            header.appendChild(number);
            header.appendChild(status);
            activityCard.appendChild(header);

            // Question
            const questionEl = document.createElement('div');
            questionEl.className = 'quiz-question';
            questionEl.innerHTML = activity.question;
            activityCard.appendChild(questionEl);

            // Sentence with blank
            const sentenceEl = document.createElement('div');
            sentenceEl.className = 'quiz-sentence';
            sentenceEl.innerHTML = activity.sentence;
            activityCard.appendChild(sentenceEl);

            // Options - randomize order
            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'quiz-options';

            // Create shuffled options array
            const shuffledOptions = [...activity.options].sort(() => Math.random() - 0.5);
            const selectedAnswer = this.selectedAnswers[activity.id];

            shuffledOptions.forEach((option, idx) => {
                const optionBtn = document.createElement('button');
                optionBtn.className = 'quiz-option-btn';
                optionBtn.textContent = option;
                optionBtn.dataset.optionIndex = idx;
                optionBtn.dataset.activityId = activity.id;

                // ✅ Re-apply styling for previously answered questions
                if (isAttempted && selectedAnswer) {
                    optionBtn.disabled = true;
                    
                    // Show selected answer (green if correct, red if incorrect)
                    if (option === selectedAnswer) {
                        optionBtn.classList.add(isCompleted ? 'correct' : 'incorrect');
                    }
                    
                    // Show correct answer highlight if they got it wrong
                    if (isIncorrect && option === activity.correctAnswer) {
                        optionBtn.classList.add('correct-highlight');
                    }
                } else if (isAttempted) {
                    optionBtn.disabled = true;
                }

                if (!isAttempted) {
                    optionBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.checkAnswer(activity, option, optionBtn, activity.correctAnswer);
                    });
                }

                optionsContainer.appendChild(optionBtn);
            });

            activityCard.appendChild(optionsContainer);

            // Hint - Only render and show after incorrect answer
            if (activity.hint && isIncorrect) {
                const hintBtn = document.createElement('button');
                hintBtn.className = 'hint-btn';
                const hintCount = this.hintCounts[activity.id] || 0;
                const hintLimit = this.hintLimits[activity.id] || 2;
                hintBtn.textContent = hintCount >= hintLimit ? '💡 Hints Exhausted' : `💡 Show Hint (${hintCount}/${hintLimit})`;
                // Button disabled only if hints are exhausted
                hintBtn.disabled = hintCount >= hintLimit;
                hintBtn.style.background = hintCount >= hintLimit ? '#6c757d' : '#4ecdc4';
                hintBtn.addEventListener('click', () => {
                    this.toggleHint(activity, hintBtn);
                });
                activityCard.appendChild(hintBtn);
            }

            // Reset button for incorrect answers
            if (isIncorrect) {
                const resetBtn = document.createElement('button');
                resetBtn.className = 'btn reset-btn';
                resetBtn.textContent = '🔄 Try Again';
                resetBtn.addEventListener('click', () => {
                    this.resetQuizActivity(activity);
                });
                activityCard.appendChild(resetBtn);
            }

            container.appendChild(activityCard);
        });

        console.log('✅ Quiz activities rendered');
    },

    checkAnswer: function (activity, selectedAnswer, buttonElement, correctAnswer) {
        const moduleId = App.currentGrammarModuleId;
        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        const isAlreadyAttempted = moduleCompletions[activity.id];

        if (isAlreadyAttempted) return;

        // Store selected answer for persistence
        this.selectedAnswers[activity.id] = selectedAnswer;

        // Disable all buttons for this activity
        const activityCard = document.getElementById(activity.id);
        const allButtons = activityCard.querySelectorAll('.quiz-option-btn');
        allButtons.forEach(btn => btn.disabled = true);

        // Check if answer is correct
        const isCorrect = selectedAnswer === correctAnswer;

        if (isCorrect) {
            buttonElement.classList.add('correct');
            App.markActivityCompleted(activity.id, 'completed');
            App.playSound('correctSound');

            const message = `
                <strong>🎉 Correct!</strong><br>
                <em>"${selectedAnswer}"</em> is the right answer!
            `;
            App.showFeedback('Great Job!', message, '⭐');
        } else {
            buttonElement.classList.add('incorrect');
            allButtons.forEach(btn => {
                if (btn.textContent === correctAnswer) {
                    btn.classList.add('correct-highlight');
                }
            });
            this.hasFailed[activity.id] = true;
            App.markActivityCompleted(activity.id, 'incorrect');
            App.playSound('wrongSound');

            const message = `
                <strong>Not quite right!</strong><br>
                Your answer: <em>"${selectedAnswer}"</em><br>
                Correct answer: <em>"${correctAnswer}"</em><br><br>
                <strong>💡 Hint:</strong> ${activity.hint || 'Try again!'}
            `;
            App.showFeedback('Oops!', message, '📚');
        }

        this.perfectCompletes[activity.id] = isCorrect;
        App.updateUI();
    },

    toggleHint: function (activity, hintBtn) {
        const hintCount = this.hintCounts[activity.id] || 0;
        const hintLimit = this.hintLimits[activity.id] || 2;

        // Check if hints are exhausted
        if (hintCount >= hintLimit) {
            App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this question. Try solving it yourself!', '❌');
            App.playSound('wrongSound');
            return;
        }

        // Show hint in a modal instead of alert
        App.showFeedback('💡 Hint', activity.hint || 'No hint available', '💡');
        this.hintCounts[activity.id] = hintCount + 1;
        App.playSound('hintSound');

        // Update button text
        const newCount = this.hintCounts[activity.id];
        hintBtn.textContent = newCount >= hintLimit ? '💡 Hints Exhausted' : `💡 Show Hint (${newCount}/${hintLimit})`;
        if (newCount >= hintLimit) {
            hintBtn.disabled = true;
            hintBtn.style.background = '#6c757d';
        }

        // If this is the last hint, show warning
        if (newCount >= hintLimit) {
            setTimeout(() => {
                App.showFeedback('Last Hint Used', 'This was your final hint. Answer the question carefully!', '⚠️');
            }, 1500);
        }
    },

    resetQuizActivity: function (activity) {
        const moduleId = App.currentGrammarModuleId;
        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        
        // Reset the activity status
        delete moduleCompletions[activity.id];
        App.state.completedActivities[moduleId] = moduleCompletions;
        
        // Reset hint count and selected answer
        this.hintCounts[activity.id] = 0;
        delete this.selectedAnswers[activity.id];
        
        // Save state
        App.saveState();
        
        // Re-render quiz activities
        this.renderActivities();
        
        App.showFeedback('Activity Reset', 'This question has been reset. Try again!', '🔄');
        App.playSound('correctSound');
    },

    reset: function () {
        console.log('🔄 Resetting Quiz Module');
        this.activities.forEach(activity => {
            const activityCard = document.getElementById(activity.id);
            if (activityCard) {
                const buttons = activityCard.querySelectorAll('.quiz-option-btn');
                buttons.forEach(btn => {
                    btn.classList.remove('correct', 'incorrect', 'correct-highlight');
                    btn.disabled = false;
                });
                const status = activityCard.querySelector('.activity-status');
                if (status) {
                    status.textContent = 'Pending';
                    status.classList.remove('completed', 'incorrect');
                }
            }
        });
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.renderActivities();
        console.log('✅ Quiz Module reset');
        return Promise.resolve();
    }
};
