const GameModule = {
    activities: [],
    currentActivity: null,
    selectedDropZone: null,
    hasFailed: {},
    perfectCompletes: {},
    hintCounts: {},
    hintLimits: {}, // Track hint usage limits per activity

    init: function (activities) {
        this.activities = activities;
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.hintCounts = {};
        this.hintLimits = {};
        this.renderActivities();
    },

    /* ------------------------------------------------------------------ */
    /*  RENDERING                                                       */
    /* ------------------------------------------------------------------ */
    renderActivities: function () {
        const container = document.getElementById('game-module-activities');
        if (!container) return;
        container.innerHTML = '';

        this.activities.forEach((activity, index) => {
            // Get completion status from current module
            const moduleId = App.currentGrammarModuleId;
            const moduleCompletions = App.state.completedActivities[moduleId] || {};
            const isCompleted = moduleCompletions[activity.id] || false;
            this.hasFailed[activity.id] = this.hasFailed[activity.id] || false;
            this.perfectCompletes[activity.id] = this.perfectCompletes[activity.id] || false;
            this.hintCounts[activity.id] = this.hintCounts[activity.id] || 0;
            this.hintLimits[activity.id] = this.hintLimits[activity.id] || 3; // Max 3 hints per activity

            const activityCard = document.createElement('div');
            activityCard.className = 'activity-card';
            activityCard.id = activity.id;

            /* ----- header ----- */
            const header = document.createElement('div');
            header.className = 'activity-header';
            const number = document.createElement('div');
            number.className = 'activity-number';
            number.textContent = `Activity ${index + 1}`;
            const status = document.createElement('div');
            status.className = 'activity-status';
            status.textContent = isCompleted ? 'Completed' : 'Not completed';
            if (isCompleted) status.classList.add('completed');
            header.appendChild(number);
            header.appendChild(status);

            /* ----- question ----- */
            const questionEl = document.createElement('div');
            questionEl.className = 'activity-question';
            questionEl.textContent = activity.question;

            /* ----- hint ----- */
            const hintContainer = document.createElement('div');
            hintContainer.className = 'hint-container';
            hintContainer.style.display = 'none';
            const hintText = document.createElement('div');
            hintText.className = 'hint-text';
            hintText.innerHTML = `<strong>Hint:</strong> ${activity.hint || 'No hint available'}`;
            hintContainer.appendChild(hintText);

            /* ----- game content ----- */
            const gameContent = document.createElement('div');
            gameContent.className = 'game-content';
            switch (activity.type) {
                case 'drag-drop':
                    this.renderDragDropActivity(gameContent, activity, isCompleted);
                    break;
                case 'matching':
                    this.renderMatchingActivity(gameContent, activity, isCompleted);
                    break;
                case 'ordering':
                    this.renderOrderingActivity(gameContent, activity, isCompleted);
                    break;
                default:
                    gameContent.textContent = 'Unsupported activity type';
            }

            /* ----- buttons ----- */
            const btns = document.createElement('div');
            btns.className = 'activity-buttons';
            const checkBtn = document.createElement('button');
            checkBtn.className = 'btn submit-btn';
            checkBtn.textContent = 'Check Answer';
            checkBtn.disabled = isCompleted;
            const resetBtn = document.createElement('button');
            resetBtn.className = 'btn skip-btn';
            resetBtn.textContent = 'Reset';
            resetBtn.disabled = isCompleted;
            const hintBtn = document.createElement('button');
            hintBtn.className = 'btn hint-btn';
            const hintCount = this.hintCounts[activity.id] || 0;
            const hintLimit = this.hintLimits[activity.id] || 3;
            hintBtn.textContent = hintCount >= hintLimit ? 'Hints Exhausted' : `Show Hint (${hintCount}/${hintLimit})`;
            hintBtn.disabled = isCompleted || hintCount >= hintLimit;
            hintBtn.style.background = hintCount >= hintLimit ? '#6c757d' : '#4ecdc4';
            btns.append(checkBtn, resetBtn, hintBtn);

            checkBtn.onclick = () => this.checkAnswer(activity);
            resetBtn.onclick = () => this.resetActivity(activity);
            hintBtn.onclick = () => this.toggleHint(activityCard, hintContainer, activity);

            /* ----- assemble ----- */
            activityCard.append(header, questionEl, hintContainer, gameContent, btns);
            container.appendChild(activityCard);
        });
    },

    toggleHint: function (card, container, activity) {
        const btn = card.querySelector('.hint-btn');
        const hintCount = this.hintCounts[activity.id] || 0;
        const hintLimit = this.hintLimits[activity.id] || 3;

        // Check if hints are exhausted
        if (hintCount >= hintLimit) {
            App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this activity. Try solving it yourself!', '❌');
            App.playSound('wrongSound');
            return;
        }

        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.textContent = `Hide Hint (${hintCount + 1}/${hintLimit})`;
            btn.style.background = '#ff6b6b';
            this.hintCounts[activity.id] = hintCount + 1;
            App.playSound('hintSound');

            // If this is the last hint, show warning
            if (hintCount + 1 >= hintLimit) {
                setTimeout(() => {
                    App.showFeedback('Last Hint Used', 'This was your final hint. Complete the activity without further help!', '⚠️');
                }, 1000);
            }
        } else {
            container.style.display = 'none';
            btn.textContent = `Show Hint (${hintCount}/${hintLimit})`;
            btn.style.background = '#4ecdc4';
        }
    },

    /* ------------------------------------------------------------------ */
    /*  DRAG-DROP (now supports N blanks)                               */
    /* ------------------------------------------------------------------ */
    renderDragDropActivity: function (container, activity, isCompleted) {
        const sentenceWrap = document.createElement('div');
        sentenceWrap.className = 'sentence-container';
        const sentenceEl = document.createElement('div');
        sentenceEl.className = 'sentence';

        // Split on every ____ → we may have many blanks
        const parts = activity.sentence.split('____');
        const dropZones = [];

        parts.forEach((text, i) => {
            const txtSpan = document.createElement('span');
            txtSpan.textContent = text;
            sentenceEl.appendChild(txtSpan);

            if (i < parts.length - 1) {               // blank needed
                const zone = document.createElement('div');
                zone.className = 'drop-zone';
                zone.dataset.index = i;
                if (isCompleted) {
                    zone.textContent = activity.correctAnswer[i] || '';
                    zone.classList.add('correct');
                } else {
                    zone.textContent = 'Click to fill';
                    zone.addEventListener('click', e => this.handleDropZoneClick(e, activity));
                }
                dropZones.push(zone);
                sentenceEl.appendChild(zone);
            }
        });

        sentenceWrap.appendChild(sentenceEl);
        container.appendChild(sentenceWrap);

        /* ----- options ----- */
        const optsWrap = document.createElement('div');
        optsWrap.className = 'drag-container';
        const shuffled = [...activity.options];
        this.shuffleArray(shuffled);
        shuffled.forEach(opt => {
            const el = document.createElement('div');
            el.className = 'draggable';
            el.textContent = opt;
            if (!isCompleted) {
                el.addEventListener('click', e => this.handleOptionClick(e, activity));
            } else {
                el.style.opacity = '0.5';
                el.style.pointerEvents = 'none';
            }
            optsWrap.appendChild(el);
        });
        container.appendChild(optsWrap);
    },

    handleDropZoneClick: function (e, activity) {
        const zone = e.target;
        const card = zone.closest('.activity-card');
        card.querySelectorAll('.drop-zone').forEach(z => z.classList.remove('selected'));
        zone.classList.add('selected');
        this.selectedDropZone = zone;

        let instr = card.querySelector('.click-instructions');
        if (!instr) {
            instr = document.createElement('div');
            instr.className = 'click-instructions';
            card.querySelector('.sentence-container').insertBefore(instr, card.querySelector('.sentence'));
        }
        instr.textContent = 'Now click a word below to fill this blank';
    },

    handleOptionClick: function (e, activity) {
        const opt = e.target;
        const card = opt.closest('.activity-card');
        if (this.selectedDropZone && this.selectedDropZone.closest('.activity-card') === card) {
            this.selectedDropZone.textContent = opt.textContent;
            this.selectedDropZone.classList.remove('selected');
            opt.style.display = 'none';
            this.selectedDropZone = null;
            const instr = card.querySelector('.click-instructions');
            if (instr) instr.remove();
        } else {
            let instr = card.querySelector('.click-instructions');
            if (!instr) {
                instr = document.createElement('div');
                instr.className = 'click-instructions';
                card.querySelector('.sentence-container').insertBefore(instr, card.querySelector('.sentence'));
            }
            instr.textContent = 'First click a blank, then a word';
        }
    },

    /* ------------------------------------------------------------------ */
    /*  CHECK ANSWERS                                                    */
    /* ------------------------------------------------------------------ */
    checkAnswer: function (activity, silent = false) {
        const card = document.getElementById(activity.id);
        const previouslyFailed = this.hasFailed[activity.id] || false;
        let result;

        switch (activity.type) {
            case 'drag-drop':
                result = this.checkDragDropAnswer(activity, card, silent);
                break;
            case 'matching':
                result = this.checkMatchingAnswer(activity, card, silent);
                break;
            case 'ordering':
                result = this.checkOrderingAnswer(activity, card, silent);
                break;
            default:
                if (!silent) App.showFeedback('Error', 'Unsupported activity type', '❌');
                return { status: 'error' };
        }

        if (result.status === 'correct' && !previouslyFailed) {
            this.perfectCompletes[activity.id] = true;
        } else if (result.status === 'incorrect') {
            this.hasFailed[activity.id] = true;
        }

        if (!silent && result.status === 'correct') {
            this.handleActivityCompletion(activity, card, true);
        } else if (!silent) {
            App.showFeedback('Oops!', result.message, '❌');
            App.playSound('wrongSound');
        }
        return result;
    },

    /***  DRAG-DROP CHECK – MULTI-BLANK ***/
    checkDragDropAnswer: function (activity, card, silent = false) {
        const zones = card.querySelectorAll('.drop-zone');
        const blanksCount = activity.correctAnswer.length;

        // ---- all filled? ----
        let allFilled = true;
        zones.forEach(z => {
            if (!z.textContent.trim() || z.textContent === 'Click to fill') allFilled = false;
        });
        if (!allFilled) {
            if (!silent) App.showFeedback('Oops!', 'Fill every blank first.', '✏️');
            return { status: 'incomplete', message: 'Missing answers' };
        }

        // ---- compare each zone with its correct answer ----
        let allCorrect = true;
        zones.forEach((zone, i) => {
            const user = zone.textContent.trim();
            const correct = (activity.correctAnswer[i] || '').trim();
            if (user.toLowerCase() === correct.toLowerCase()) {
                zone.classList.add('correct');
            } else {
                zone.classList.add('incorrect');
                allCorrect = false;
            }
        });

        if (!silent) {
            if (allCorrect) {
                const correctAnswers = activity.correctAnswer.join(', ');
                App.showFeedback('Excellent!', `Perfect! All blanks are correct: <em>"${correctAnswers}"</em>`, '🎉');
                App.playSound('correctSound');
            } else {
                // Show which ones are wrong
                let wrongAnswers = [];
                zones.forEach((zone, i) => {
                    const user = zone.textContent.trim();
                    const correct = (activity.correctAnswer[i] || '').trim();
                    if (user.toLowerCase() !== correct.toLowerCase()) {
                        wrongAnswers.push(`"${user}" should be "${correct}"`);
                    }
                });
                const message = `Some blanks are wrong: ${wrongAnswers.join(', ')}. Try again!`;
                App.showFeedback('Not Yet!', message, '🔄');
                App.playSound('wrongSound');
            }
        }
        return { status: allCorrect ? 'correct' : 'incorrect', message: allCorrect ? 'All correct' : 'Some wrong' };
    },

    /* ------------------------------------------------------------------ */
    /*  RESET                                                            */
    /* ------------------------------------------------------------------ */
    resetActivity: function (activity) {
        const card = document.getElementById(activity.id);
        const hint = card.querySelector('.hint-container');
        if (hint) {
            hint.style.display = 'none';
            const hintCount = this.hintCounts[activity.id] || 0;
            const hintLimit = this.hintLimits[activity.id] || 3;
            card.querySelector('.hint-btn').textContent = `Show Hint (${hintCount}/${hintLimit})`;
            card.querySelector('.hint-btn').style.background = '#4ecdc4';
            card.querySelector('.hint-btn').disabled = false;
        }

        // Reset hint count on reset
        this.hintCounts[activity.id] = 0;

        switch (activity.type) {
            case 'drag-drop':
                this.resetDragDropActivity(activity, card);
                break;
            case 'matching':
                this.resetMatchingActivity(activity, card);
                break;
            case 'ordering':
                this.resetOrderingActivity(activity, card);
                break;
        }
    },

    resetDragDropActivity: function (activity, card) {
        const zones = card.querySelectorAll('.drop-zone');
        const opts  = card.querySelectorAll('.draggable');

        zones.forEach(z => {
            z.textContent = 'Click to fill';
            z.classList.remove('correct', 'incorrect', 'selected');
            z.style.pointerEvents = 'auto';
        });
        opts.forEach(o => {
            o.style.display = 'block';
            o.style.opacity = '1';
            o.style.pointerEvents = 'auto';
        });
        this.selectedDropZone = null;
        const instr = card.querySelector('.click-instructions');
        if (instr) instr.remove();
    },

    /* ------------------------------------------------------------------ */
    /*  UTILS                                                            */
    /* ------------------------------------------------------------------ */
    shuffleArray: function (arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    /* ------------------------------------------------------------------ */
    /*  COMPLETION & REWARDS                                            */
    /* ------------------------------------------------------------------ */
    handleActivityCompletion: function (activity, card, isCorrect) {
        if (isCorrect) {
            App.markActivityCompleted(activity.id);
            const status = card.querySelector('.activity-status');
            status.textContent = 'Completed';
            status.classList.add('completed');
            card.querySelectorAll('.btn').forEach(b => b.disabled = true);
            card.querySelectorAll('.draggable').forEach(o => {
                o.style.pointerEvents = 'none';
                o.style.opacity = '0.5';
            });
            card.querySelectorAll('.drop-zone').forEach(z => z.style.pointerEvents = 'none');
            const hint = card.querySelector('.hint-container');
            if (hint) hint.style.display = 'none';
            RewardSystem.awardStar();
            RewardSystem.checkGameBadge();
        }
    },

    /* ------------------------------------------------------------------ */
    /*  PUBLIC RESET (called from UI)                                    */
    /* ------------------------------------------------------------------ */
    reset: function () {
        console.log('GameModule.reset()');
        this.currentActivity = null;
        this.selectedDropZone = null;
        this.hasFailed = {};
        this.perfectCompletes = {};

        fetch('reproducibility/data.json')
            .then(r => r.json())
            .then(data => data.gameActivities)
            .catch(() => [] )
            .then(acts => {
                this.activities = acts;
                this.renderActivities();
            });
    }
};

/* ---------------------------------------------------------------------- */
/*  EXPORT                                                               */
/* ---------------------------------------------------------------------- */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameModule;
} else {
    window.GameModule = GameModule;
}