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
        this.orderedAnswers = {};
        this.selectedAnswers = {};
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
                    if (this.getDropZoneCount(activity) > 0) {
                        this.renderDragDropActivity(gameContent, activity, isCompleted);
                    } else {
                        this.renderChoiceActivity(gameContent, activity, isCompleted);
                    }
                    break;
                case 'ordering':
                case 'reorder':
                    this.renderOrderingActivity(gameContent, activity, isCompleted);
                    break;
                case 'roleplay':
                case 'simulator':
                    this.renderChoiceActivity(gameContent, activity, isCompleted);
                    break;
                case 'writing':
                    this.renderWritingActivity(gameContent, activity, isCompleted);
                    break;
                default:
                    gameContent.textContent = 'Unsupported activity type';
            }

            /* ----- buttons ----- */
            const btns = document.createElement('div');
            btns.className = 'activity-buttons';
            const checkBtn = document.createElement('button');
            checkBtn.type = 'button';
            checkBtn.className = 'btn btn--primary submit-btn';
            checkBtn.textContent = 'Check Answer';
            checkBtn.disabled = isCompleted;
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn--secondary skip-btn';
            resetBtn.textContent = 'Reset';
            resetBtn.disabled = isCompleted;
            const hintBtn = document.createElement('button');
            hintBtn.type = 'button';
            hintBtn.className = 'btn hint-btn';
            const hintCount = this.hintCounts[activity.id] || 0;
            const hintLimit = this.hintLimits[activity.id] || 3;
            hintBtn.textContent = hintCount >= hintLimit ? 'Hints Exhausted' : `Show Hint (${hintCount}/${hintLimit})`;
            hintBtn.disabled = isCompleted || hintCount >= hintLimit;
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
            App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this activity. Try solving it yourself!', '');
            App.playSound('wrongSound');
            return;
        }

        if (container.style.display === 'none') {
            container.style.display = 'block';
            btn.textContent = `Hide Hint (${hintCount + 1}/${hintLimit})`;
            this.hintCounts[activity.id] = hintCount + 1;
            App.playSound('hintSound');

            // If this is the last hint, show warning
            if (hintCount + 1 >= hintLimit) {
                setTimeout(() => {
                    App.showFeedback('Last Hint Used', 'This was your final hint. Complete the activity without further help!', '');
                }, 1000);
            }
        } else {
            container.style.display = 'none';
            btn.textContent = `Show Hint (${hintCount}/${hintLimit})`;
        }
    },

    /* ------------------------------------------------------------------ */
    /*  DRAG-DROP (now supports N blanks)                               */
    /* ------------------------------------------------------------------ */
    renderDragDropActivity: function (container, activity, isCompleted) {
        const sentenceWrap = document.createElement('div');
        sentenceWrap.className = 'sentence-container';
        const instructions = document.createElement('p');
        instructions.className = 'game-instructions';
        instructions.textContent = 'Select a blank, then select a word to fill it. Use Enter or Space.';
        sentenceWrap.appendChild(instructions);
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
                const zone = document.createElement('button');
                zone.type = 'button';
                zone.className = 'drop-zone';
                zone.dataset.index = i;
                zone.setAttribute('aria-pressed', 'false');
                if (isCompleted) {
                    const answers = this.getDropAnswerSets(activity, parts.length - 1)[0] || [];
                    zone.textContent = answers[i] || '';
                    zone.setAttribute('aria-label', `Blank ${i + 1}: ${answers[i] || ''}`);
                    zone.classList.add('correct');
                    zone.disabled = true;
                } else {
                    zone.textContent = 'Click to fill';
                    zone.setAttribute('aria-label', `Blank ${i + 1}: unfilled`);
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
        optsWrap.setAttribute('role', 'group');
        optsWrap.setAttribute('aria-label', 'Word bank');
        const shuffled = [...(activity.options || [])];
        this.shuffleArray(shuffled);
        shuffled.forEach(opt => {
            const el = document.createElement('button');
            el.type = 'button';
            el.className = 'draggable';
            el.textContent = opt;
            el.disabled = isCompleted;
            if (!isCompleted) {
                el.addEventListener('click', e => this.handleOptionClick(e, activity));
            }
            optsWrap.appendChild(el);
        });
        container.appendChild(optsWrap);
    },

    renderOrderingActivity: function (container, activity, isCompleted) {
        const words = activity.options?.length
            ? [...activity.options]
            : String(activity.sentence || '').split('/').map(word => word.trim()).filter(Boolean);
        const selected = this.orderedAnswers?.[activity.id] || [];
        const answer = Array.isArray(activity.correctAnswer) ? activity.correctAnswer[0] : activity.correctAnswer;

        const sequence = document.createElement('div');
        sequence.className = 'ordering-sequence';
        sequence.setAttribute('role', 'status');
        sequence.setAttribute('aria-live', 'polite');
        sequence.textContent = isCompleted ? answer : selected.join(' ');
        container.appendChild(sequence);

        const wordButtons = document.createElement('div');
        wordButtons.className = 'drag-container';
        wordButtons.setAttribute('role', 'group');
        wordButtons.setAttribute('aria-label', 'Words to build the sentence');
        words.forEach((word, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'draggable';
            button.textContent = word;
            button.disabled = isCompleted || selected.includes(word);
            button.addEventListener('click', () => {
                this.orderedAnswers ||= {};
                this.orderedAnswers[activity.id] ||= [];
                this.orderedAnswers[activity.id].push(word);
                sequence.textContent = this.orderedAnswers[activity.id].join(' ');
                button.disabled = true;
            });
            button.dataset.index = String(index);
            wordButtons.appendChild(button);
        });
        container.appendChild(wordButtons);
    },

    renderChoiceActivity: function (container, activity, isCompleted) {
        const choices = document.createElement('div');
        choices.className = 'quiz-options';
        choices.setAttribute('role', 'group');
        choices.setAttribute('aria-label', 'Choose a response');
        (activity.options || []).forEach(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option-btn game-choice';
            button.textContent = option;
            button.disabled = isCompleted;
            button.addEventListener('click', () => {
                choices.querySelectorAll('.game-choice').forEach(choice => choice.classList.remove('selected'));
                button.classList.add('selected');
                this.selectedAnswers ||= {};
                this.selectedAnswers[activity.id] = option;
            });
            choices.appendChild(button);
        });
        container.appendChild(choices);
    },

    renderWritingActivity: function (container, activity, isCompleted) {
        const sentence = document.createElement('p');
        sentence.className = 'game-writing-prompt';
        sentence.textContent = String(activity.sentence || '').replace(/_+/g, '_____');
        container.appendChild(sentence);

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'game-writing-answer';
        input.setAttribute('aria-label', 'Your answer');
        input.disabled = isCompleted;
        input.value = this.selectedAnswers?.[activity.id] || '';
        input.addEventListener('input', () => {
            this.selectedAnswers ||= {};
            this.selectedAnswers[activity.id] = input.value;
        });
        container.appendChild(input);
    },

    handleDropZoneClick: function (e, activity) {
        const zone = e.target;
        const card = zone.closest('.activity-card');
        const previousOption = Array.from(card.querySelectorAll('.draggable'))
            .find(option => option.textContent === zone.textContent);
        if (previousOption) previousOption.style.display = 'block';
        zone.classList.remove('correct', 'incorrect');
        card.querySelectorAll('.drop-zone').forEach(z => {
            z.classList.remove('selected');
            z.setAttribute('aria-pressed', 'false');
        });
        zone.classList.add('selected');
        zone.setAttribute('aria-pressed', 'true');
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
        if (this.isCombinedDropActivity(activity)) {
            const zones = Array.from(card.querySelectorAll('.drop-zone'));
            const values = this.splitDropSequence(opt.textContent, zones.length);
            if (!values) {
                App.showFeedback('Try another choice', 'This choice does not fit every blank.', '');
                return;
            }
            zones.forEach((zone, index) => {
                zone.textContent = values[index];
                zone.classList.remove('selected', 'correct', 'incorrect');
                zone.setAttribute('aria-pressed', 'false');
                zone.setAttribute('aria-label', `Blank ${index + 1}: ${values[index]}`);
            });
            card.querySelectorAll('.draggable').forEach(option => option.classList.remove('selected'));
            opt.classList.add('selected');
            const instructions = card.querySelector('.click-instructions');
            if (instructions) instructions.remove();
            this.selectedDropZone = null;
            return;
        }
        if (this.selectedDropZone && this.selectedDropZone.closest('.activity-card') === card) {
            this.selectedDropZone.textContent = opt.textContent;
            this.selectedDropZone.setAttribute('aria-label', `Blank ${this.selectedDropZone.dataset.index * 1 + 1}: ${opt.textContent}`);
            this.selectedDropZone.setAttribute('aria-pressed', 'false');
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
                result = this.getDropZoneCount(activity) > 0
                    ? this.checkDragDropAnswer(activity, card, silent)
                    : this.checkChoiceAnswer(activity, card);
                break;
            case 'ordering':
            case 'reorder':
                result = this.checkOrderingAnswer(activity, card, silent);
                break;
            case 'roleplay':
            case 'simulator':
                result = this.checkChoiceAnswer(activity, card);
                break;
            case 'writing':
                result = this.checkWritingAnswer(activity, card);
                break;
            default:
                if (!silent) App.showFeedback('Error', 'Unsupported activity type', '');
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
            App.showFeedback(
                result.status === 'incomplete' ? 'Complete the activity' : 'Not quite yet',
                result.message,
                '',
                result.status === 'incomplete' ? 'info' : 'error'
            );
            App.playSound('wrongSound');
        }
        return result;
    },

    /***  DRAG-DROP CHECK – MULTI-BLANK ***/
    checkDragDropAnswer: function (activity, card, silent = false) {
        const zones = Array.from(card.querySelectorAll('.drop-zone'));

        // ---- all filled? ----
        let allFilled = true;
        zones.forEach(z => {
            if (!z.textContent.trim() || z.textContent === 'Click to fill') allFilled = false;
        });
        if (!allFilled) {
            return { status: 'incomplete', message: 'Fill every blank first.' };
        }

        // ---- compare each zone with its correct answer ----
        const normalize = value => String(value).trim().replace(/\s+/g, ' ').toLowerCase();
        const answerSets = this.getDropAnswerSets(activity, zones.length);
        const allCorrect = answerSets.some(answers =>
            zones.every((zone, index) => normalize(zone.textContent) === normalize(answers[index] || ''))
        );
        zones.forEach((zone, index) => {
            const correctAtPosition = answerSets.some(answers =>
                normalize(zone.textContent) === normalize(answers[index] || '')
            );
            zone.classList.toggle('correct', correctAtPosition);
            zone.classList.toggle('incorrect', !correctAtPosition);
        });

        return {
            status: allCorrect ? 'correct' : 'incorrect',
            message: allCorrect ? 'All blanks are correct.' : 'Some answers are not quite right yet. Try again.'
        };
    },

    checkChoiceAnswer: function (activity, card) {
        const selected = this.selectedAnswers?.[activity.id];
        if (!selected) return { status: 'incomplete', message: 'Choose a response first.' };
        const expectedAnswers = Array.isArray(activity.correctAnswer) ? activity.correctAnswer : [activity.correctAnswer];
        const correct = expectedAnswers.some(answer => String(answer).trim().toLowerCase() === selected.trim().toLowerCase());
        return { status: correct ? 'correct' : 'incorrect', message: correct ? 'That is the best response.' : 'Choose the response that best fits the situation.' };
    },

    getDropZoneCount: function (activity) {
        return typeof activity.sentence === 'string' ? (activity.sentence.match(/____/g) || []).length : 0;
    },

    splitDropSequence: function (value, zoneCount) {
        const parts = String(value).split(/\s*[,/]\s*/).map(part => part.trim()).filter(Boolean);
        return parts.length === zoneCount ? parts : null;
    },

    isCombinedDropActivity: function (activity) {
        const zoneCount = this.getDropZoneCount(activity);
        return zoneCount > 1 &&
            Array.isArray(activity.options) &&
            activity.options.length > 0 &&
            activity.options.every(option => this.splitDropSequence(option, zoneCount));
    },

    getDropAnswerSets: function (activity, zoneCount) {
        const answers = Array.isArray(activity.correctAnswer) ? activity.correctAnswer : [activity.correctAnswer];
        if (zoneCount === 1) return answers.map(answer => [String(answer ?? '')]);

        const sequences = answers
            .map(answer => this.splitDropSequence(answer, zoneCount))
            .filter(Boolean);
        if (sequences.length) return sequences;
        if (answers.length === zoneCount) return [answers.map(answer => String(answer ?? ''))];

        if (answers.length === 1) {
            const words = String(answers[0] ?? '').trim().split(/\s+/);
            if (words.length === zoneCount) return [words];
        }
        return [answers.map(answer => String(answer ?? ''))];
    },

    checkWritingAnswer: function (activity, card) {
        const input = card.querySelector('.game-writing-answer');
        const answer = input?.value.trim();
        if (!answer) return { status: 'incomplete', message: 'Type an answer first.' };
        const expectedAnswers = Array.isArray(activity.correctAnswer) ? activity.correctAnswer : [activity.correctAnswer];
        const normalize = value => String(value).trim().replace(/[.!?]+$/, '').toLowerCase();
        const correct = expectedAnswers.some(expected => normalize(expected) === normalize(answer));
        return { status: correct ? 'correct' : 'incorrect', message: correct ? 'You filled the blank correctly.' : 'Try another answer for the blank.' };
    },

    checkOrderingAnswer: function (activity, card) {
        const selected = this.orderedAnswers?.[activity.id] || [];
        if (!selected.length) return { status: 'incomplete', message: 'Put the words in order first.' };
        const expected = Array.isArray(activity.correctAnswer) ? activity.correctAnswer[0] : activity.correctAnswer;
        const normalize = value => String(value).replace(/[.!?]+$/, '').trim().replace(/\s+/g, ' ').toLowerCase();
        const correct = normalize(selected.join(' ')) === normalize(expected);
        return { status: correct ? 'correct' : 'incorrect', message: correct ? 'Your sentence is in the right order.' : 'Rearrange the words and try again.' };
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
            card.querySelector('.hint-btn').disabled = false;
        }

        // Reset hint count on reset
        this.hintCounts[activity.id] = 0;

        switch (activity.type) {
            case 'drag-drop':
                this.resetDragDropActivity(activity, card);
                break;
            case 'ordering':
            case 'reorder':
                delete this.orderedAnswers?.[activity.id];
                this.renderActivities();
                break;
            case 'roleplay':
            case 'simulator':
            case 'writing':
                delete this.selectedAnswers?.[activity.id];
                this.renderActivities();
                break;
        }
    },

    resetDragDropActivity: function (activity, card) {
        const zones = card.querySelectorAll('.drop-zone');
        const opts  = card.querySelectorAll('.draggable');

        zones.forEach(z => {
            z.textContent = 'Click to fill';
            z.setAttribute('aria-label', `Blank ${Number(z.dataset.index) + 1}: unfilled`);
            z.setAttribute('aria-pressed', 'false');
            z.classList.remove('correct', 'incorrect', 'selected');
            z.style.pointerEvents = 'auto';
        });
        opts.forEach(o => {
            o.style.display = 'block';
            o.style.opacity = '1';
            o.style.pointerEvents = 'auto';
            o.classList.remove('selected');
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
            RewardSystem.checkGameBadge();
            App.showFeedback('Challenge cleared!', 'Correct! You completed this grammar challenge.', '', 'success', card);
        }
    },

    /* ------------------------------------------------------------------ */
    /*  PUBLIC RESET (called from UI)                                    */
    /* ------------------------------------------------------------------ */
    reset: function () {
        this.currentActivity = null;
        this.selectedDropZone = null;
        this.hasFailed = {};
        this.perfectCompletes = {};
        this.orderedAnswers = {};
        this.selectedAnswers = {};
        this.hintCounts = {};
        this.renderActivities();
        return Promise.resolve();
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