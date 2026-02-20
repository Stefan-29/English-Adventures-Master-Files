const SpellingHelper = {
    activities: [],
    hintCounts: {},
    hasFailed: {},
    perfectCompletes: {},
    attemptCounts: {}, // Track number of attempts per activity
    attemptThreshold: 2, // Number of wrong attempts before letter reveal unlocks
    maxHints: 2, // Maximum total hints allowed per activity
    maxRevealLetters: 1, // Maximum letter reveals per activity (only after failures)

    init: function (activities) {
        this.activities = activities;
        this.hintCounts = {};
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.attemptCounts = {};
        this.renderActivities();
    },

    renderActivities: function () {
const container = document.getElementById('spelling-module-activities');
    if (!container) {
        console.warn('Spelling container not found');
        return;
    }        container.innerHTML = '';

        this.activities.forEach((activity, index) => {
            // Get completion status from current module
            const moduleId = App.currentGrammarModuleId;
            const moduleCompletions = App.state.completedActivities[moduleId] || {};
            const isCompleted = moduleCompletions[activity.id] || false;
            this.hintCounts[activity.id] = this.hintCounts[activity.id] || { reveal: 0, hint: 0 };
            this.hasFailed[activity.id] ||= false;
            this.perfectCompletes[activity.id] ||= false;
            this.attemptCounts[activity.id] = this.attemptCounts[activity.id] || 0;

            const activityCard = document.createElement('div');
            activityCard.className = 'activity-card';
            activityCard.id = activity.id;

            const header = document.createElement('div');
            header.className = 'activity-header';
            const activityNumber = document.createElement('div');
            activityNumber.className = 'activity-number';
            activityNumber.textContent = `Activity ${index + 1}`;
            const activityStatus = document.createElement('div');
            activityStatus.className = 'activity-status';
            activityStatus.textContent = isCompleted ? 'Completed' : 'Not completed';
            if (isCompleted) activityStatus.classList.add('completed');
            header.appendChild(activityNumber);
            header.appendChild(activityStatus);

            const questionElement = document.createElement('div');
            questionElement.className = 'activity-question';
            questionElement.textContent = activity.sentence;

            const hintContainer = document.createElement('div');
            hintContainer.className = 'hint-container';
            hintContainer.style.cssText = `
                display: none;
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
                padding: 8px;
                border-radius: 8px;
                margin: 10px 0;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            `;
            const hintText = document.createElement('div');
            hintText.className = 'hint-text';
            hintText.style.cssText = 'color: white; font-size: 1.1rem; background: transparent; display: block; padding: 8px; margin: 5px 0; border-left: 4px solid #ef4444;';
            hintText.innerHTML = `<strong>💡 Hint:</strong> ${activity.hint || 'No hint available'}`;
            hintContainer.appendChild(hintText);
            console.log('Created hintText with content:', hintText.innerHTML);

            const spellingContainer = document.createElement('div');
            spellingContainer.className = 'spelling-word-container';

            const clueLetters = activity.clue.split('');
            clueLetters.forEach((letter, i) => {
                if (letter === '_') {
                    const input = document.createElement('input');
                    input.className = 'spelling-input';
                    input.type = 'text';
                    input.maxLength = 1;
                    input.setAttribute('data-index', i);
                    if (isCompleted) {
                        input.value = activity.word[i];
                        input.disabled = true;
                    }
                    spellingContainer.appendChild(input);
                } else {
                    const span = document.createElement('div');
                    span.className = 'spelling-letter';
                    span.textContent = letter;
                    spellingContainer.appendChild(span);
                }
            });

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'activity-buttons';
            const checkButton = document.createElement('button');
            checkButton.className = 'btn submit-btn';
            checkButton.textContent = 'Check Spelling';
            checkButton.disabled = isCompleted;
            const hintButton = document.createElement('button');
            hintButton.className = 'btn hint-btn';
            hintButton.textContent = 'Show Hint';
            hintButton.classList.add('hidden'); // Hide initially - only appears after attempts
            const hintState = this.hintCounts[activity.id];
            const attempts = this.attemptCounts[activity.id] || 0;
            if (isCompleted) {
                hintButton.classList.add('hidden'); // Keep hidden after completion
            }
            const hintsUsed = hintState.hint || 0;
            hintButton.disabled = hintsUsed >= this.maxHints;
            hintButton.textContent = hintsUsed >= this.maxHints ? '💡 Hints Exhausted' : `💡 Show Hint`;
            hintButton.style.background = hintsUsed >= this.maxHints ? '#6c757d' : '#4ecdc4';
            
            const revealLetterButton = document.createElement('button');
            revealLetterButton.className = 'btn reveal-btn';
            const revealUsed = hintState.reveal || 0;
            // Hide reveal letter button initially - only show after failed attempts
            if (attempts < this.attemptThreshold) {
                revealLetterButton.classList.add('hidden');
                revealLetterButton.textContent = 'Reveal Letter';
            } else {
                revealLetterButton.textContent = revealUsed >= this.maxRevealLetters ? 'Letter Revealed' : `Reveal Letter (${revealUsed}/${this.maxRevealLetters})`;
            }
            revealLetterButton.disabled = isCompleted || revealUsed >= this.maxRevealLetters;
            revealLetterButton.style.background = revealUsed >= this.maxRevealLetters ? '#6c757d' : '#f59e0b';
            buttonsContainer.appendChild(checkButton);
            buttonsContainer.appendChild(hintButton);
            buttonsContainer.appendChild(revealLetterButton);

            checkButton.addEventListener('click', () => {
                this.checkSpelling(activity);
            });

            hintButton.addEventListener('click', () => {
                this.toggleHint(activityCard, hintContainer, activity);
            });

            revealLetterButton.addEventListener('click', () => {
                this.giveHint(activity, hintButton);
            });

            const inputs = spellingContainer.querySelectorAll('input');
            inputs.forEach((input, i) => {
                input.addEventListener('input', function () {
                    if (this.value && i < inputs.length - 1) {
                        inputs[i + 1].focus();
                    }
                });
                input.addEventListener('keydown', function (e) {
                    if (e.key === 'Backspace' && !this.value && i > 0) {
                        inputs[i - 1].focus();
                    }
                });
            });

            activityCard.appendChild(header);
            activityCard.appendChild(questionElement);
            activityCard.appendChild(hintContainer);
            activityCard.appendChild(spellingContainer);
            activityCard.appendChild(buttonsContainer);
            container.appendChild(activityCard);
        });
    },

    toggleHint: function (activityCard, hintContainer, activity) {
        const hintButton = activityCard.querySelector('.hint-btn');
        const hintText = hintContainer.querySelector('.hint-text');
        const hintState = this.hintCounts[activity.id];
        const hintsUsed = hintState.hint || 0;

        // Check if hints are exhausted
        if (hintsUsed >= this.maxHints) {
            App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this activity. Try solving it yourself!', '❌');
            App.playSound('wrongSound');
            return;
        }

        if (!hintText) {
            console.error('Hint text element not found in hint container');
            return;
        }

        console.log('Activity hint:', activity.hint);
        hintText.innerHTML = `<strong>💡 Hint:</strong> ${activity.hint || 'No hint available'}`;
        hintText.style.cssText = 'color: white; font-size: 1.1rem; background: transparent; display: block; padding: 8px; margin: 5px 0; border-left: 4px solid #ef4444;';
        console.log('Updated hintText content:', hintText.innerHTML);

        if (hintContainer.style.display === 'none') {
            console.log('Showing hint container');
            hintContainer.style.display = 'block';
            hintButton.textContent = 'Hide Hint';
            hintButton.style.background = '#ff6b6b';
            this.hintCounts[activity.id].hint = hintsUsed + 1;
            App.playSound('hintSound');

            // If this is the last hint, show warning
            if (hintsUsed + 1 >= this.maxHints) {
                setTimeout(() => {
                    App.showFeedback('Last Hint Used', 'This was your final hint. Complete the activity without further help!', '⚠️');
                }, 1000);
            }
        } else {
            console.log('Hiding hint container');
            hintContainer.style.display = 'none';
            const newCount = this.hintCounts[activity.id].hint || 0;
            hintButton.textContent = newCount >= this.maxHints ? '💡 Hints Exhausted' : `💡 Show Hint (${newCount}/${this.maxHints})`;
            hintButton.style.background = newCount >= this.maxHints ? '#6c757d' : '#4ecdc4';
        }
    },

    giveHint: function (activity, hintButton) {
        const activityCard = document.getElementById(activity.id);
        const inputs = activityCard.querySelectorAll('.spelling-input');
        const hintState = this.hintCounts[activity.id];
        const revealCount = hintState.reveal || 0;

        // Check if reveals are exhausted
        if (revealCount >= this.maxRevealLetters) {
            App.showFeedback('No More Letter Reveals', 'You\'ve used all letter reveals!', '❌');
            App.playSound('wrongSound');
            return;
        }

        const missingLetterIndices = [];
        let letterIndex = 0;

        for (let i = 0; i < activity.clue.length; i++) {
            if (activity.clue[i] === '_') {
                missingLetterIndices.push({ input: inputs[letterIndex], correctLetter: activity.word[i], index: i });
                letterIndex++;
            }
        }

        const nextToHint = missingLetterIndices.find((item, idx) => idx === revealCount && (!item.input.value || item.input.value.toLowerCase() !== item.correctLetter.toLowerCase()));
        if (nextToHint) {
            // REVEAL THE ACTUAL LETTER - fill the input value
            nextToHint.input.value = nextToHint.correctLetter;
            nextToHint.input.style.color = '#10b981';
            nextToHint.input.style.fontWeight = 'bold';
            nextToHint.input.disabled = true;
            this.hintCounts[activity.id].reveal = revealCount + 1;
            const newRevealCount = this.hintCounts[activity.id].reveal;
            App.playSound('hintSound');

            // Update reveal button
            const revealBtn = activityCard.querySelector('.reveal-btn');
            if (newRevealCount >= this.maxRevealLetters) {
                revealBtn.disabled = true;
                revealBtn.textContent = 'Letter Revealed';
                revealBtn.style.background = '#6c757d';
                setTimeout(() => {
                    App.showFeedback('Letter Reveals Done', 'That\'s your only letter reveal. Try to solve it now!', '⚠️');
                }, 500);
            } else {
                revealBtn.textContent = `Reveal Letter (${newRevealCount}/${this.maxRevealLetters})`;
            }

            // Show the hint button only after letter reveal is used
            const hintBtn = activityCard.querySelector('.hint-btn');
            if (hintBtn && hintBtn.classList.contains('hidden')) {
                hintBtn.classList.remove('hidden');
                const hintsUsed = hintState.hint || 0;
                hintBtn.disabled = hintsUsed >= this.maxHints;
                hintBtn.textContent = hintsUsed >= this.maxHints ? '💡 Hints Exhausted' : `💡 Show Hint`;
                hintBtn.style.background = hintsUsed >= this.maxHints ? '#6c757d' : '#4ecdc4';
                App.showFeedback('Hint Available!', 'You\'ve revealed a letter. The hint is now available!', '💡');
            }
        } else {
            App.showFeedback('No More Hints', 'Try checking your answer now!', '❌');
            App.playSound('wrongSound');
        }
    },

    checkSpelling: function (activity, silent = false) {
        const activityCard = document.getElementById(activity.id);
        const inputs = activityCard.querySelectorAll('.spelling-input');
        const hasPreviouslyFailed = this.hasFailed[activity.id] || false;

        let allFilled = true;
        inputs.forEach(input => {
            if (!input.value.trim()) allFilled = false;
        });

        if (!allFilled) {
            if (!silent) {
                App.showFeedback('Incomplete', 'Please fill in all the missing letters.', '✏️');
                App.playSound('wrongSound');
            }
            return { status: 'incomplete', message: 'Not all letters filled' };
        }

        let userAnswer = '';
        let correctAnswer = activity.word;
        let letterIndex = 0;

        for (let i = 0; i < activity.clue.length; i++) {
            if (activity.clue[i] === '_') {
                userAnswer += inputs[letterIndex].value.toLowerCase();
                letterIndex++;
            } else {
                userAnswer += activity.clue[i].toLowerCase();
            }
        }

        if (userAnswer === correctAnswer.toLowerCase()) {
            if (!silent) {
                App.showFeedback('Perfect!', `Correct! The word is "${activity.word}".`, '🎉');
                if (!hasPreviouslyFailed && this.hintCounts[activity.id].reveal === 0) {
                    this.perfectCompletes[activity.id] = true;
                }
                App.markActivityCompleted(activity.id);
                activityCard.querySelector('.activity-status').textContent = 'Completed';
                activityCard.querySelector('.activity-status').classList.add('completed');
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.color = 'green';
                });
                activityCard.querySelectorAll('.btn').forEach(button => button.disabled = true);
                RewardSystem.awardStar(activity.id);
                RewardSystem.checkSpellingBadge();
            }
            return { status: 'correct', message: 'Correct spelling' };
        } else {
            this.hasFailed[activity.id] = true;
            // Increment attempt counter on wrong answer
            const currentAttempts = (this.attemptCounts[activity.id] || 0) + 1;
            this.attemptCounts[activity.id] = currentAttempts;

            let hasError = false;
            letterIndex = 0;
            for (let i = 0; i < correctAnswer.length; i++) {
                if (activity.clue[i] === '_') {
                    if (inputs[letterIndex].value.toLowerCase() !== correctAnswer[i].toLowerCase()) {
                        inputs[letterIndex].style.color = 'red';
                        hasError = true;
                    } else {
                        inputs[letterIndex].style.color = 'green';
                    }
                    letterIndex++;
                }
            }

            // Unlock letter reveal button when attempt threshold is reached
            if (currentAttempts === this.attemptThreshold) {
                const revealBtn = activityCard.querySelector('.reveal-btn');
                if (revealBtn && revealBtn.classList.contains('hidden')) {
                    revealBtn.classList.remove('hidden');
                    revealBtn.textContent = `Reveal Letter (0/${this.maxRevealLetters})`;
                    revealBtn.disabled = false;
                    revealBtn.style.background = '#f59e0b';
                    if (!silent) {
                        setTimeout(() => {
                            App.showFeedback(`Letter Reveal Unlocked!`, `You've made ${this.attemptThreshold} attempts. You can now reveal 1 letter!`, '🔓');
                        }, 500);
                    }
                }
            }

            if (!silent) {
                App.showFeedback('Try Again', 'Some letters are incorrect. Review and try again!', '🔄');
                App.playSound('wrongSound');
            }
            return { status: 'incorrect', message: 'Incorrect spelling' };
        }
    },

    reset: function () {
        console.log('🔄 SpellingHelper.reset() - NOT clearing App.state');
        this.hintCounts = {};
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.attemptCounts = {};
        this.renderActivities();
    },
};