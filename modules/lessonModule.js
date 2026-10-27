// modules/lessonModule.js
const LessonModule = {
    data: [],
    currentLessonIndex: 0,
    speechSynthesis: window.speechSynthesis || null, // Legacy, kept for compatibility
    currentUtterance: null, // Legacy, kept for compatibility

    init: function (lessonData) {
        this.data = lessonData || [];
        this.currentLessonIndex = 0;
        this.loadLessons();
        this.setupEventListeners();
    },

    loadLessons: function () {
        const container = document.getElementById('lesson-module-activities');
        if (!container) {
            console.warn('Lesson container not found');
            return;
        }
        if (!App || !App.state || !App.currentGrammarModuleId) return; // Safety check

        container.innerHTML = `
            <div class="lesson-navigation">
                <button id="prev-lesson" class="lesson-nav-btn">
                    Previous
                </button>
                <div id="lesson-progress" class="lesson-progress">
                    Lesson 1 of ${this.data.length}
                </div>
                <button id="next-lesson" class="lesson-nav-btn">
                    Next
                </button>
            </div>
            <div class="current-lesson-container"></div>
        `;

        this.updateNavigationButtons();
        this.renderCurrentLesson();
    },

    renderCurrentLesson: function () {
        const container = document.querySelector('#lesson-module-activities .current-lesson-container');
        if (!container) return;

        const lesson = this.data[this.currentLessonIndex];
        if (!lesson) {
            container.innerHTML = '<p>No lesson data.</p>';
            return;
        }

        // Update progress text
        document.getElementById('lesson-progress').textContent = 
            `Lesson ${this.currentLessonIndex + 1} of ${this.data.length}`;

        container.innerHTML = `
            <div class="lesson-card active-lesson">
                <h3 class="lesson-title">${lesson.title}</h3>

                <div class="audio-control">
                    <label class="lesson-voice-control">
                        <span>Listening voice</span>
                        <select class="lesson-voice-select" aria-label="Choose an English lesson voice">
                            <option value="">Best available voice</option>
                        </select>
                    </label>
                    <div class="lesson-audio-buttons">
                        <button class="play-audio btn btn--secondary" type="button">
                            Listen to Lesson
                        </button>
                        <button class="pause-audio btn btn--secondary" type="button" hidden>
                            Pause
                        </button>
                        <button class="resume-audio btn btn--secondary" type="button" hidden>
                            Resume
                        </button>
                        <button class="stop-audio btn btn--ghost" type="button" hidden>
                            Stop
                        </button>
                    </div>
                    <p class="lesson-audio-status" role="status" aria-live="polite"></p>
                </div>

                <!-- Main Content -->
                <div class="lesson-main-content">
                    ${lesson.content}
                </div>

                <!-- Functions -->
                ${lesson.functions?.length ? `
                <div class="functions-section">
                    <h4>What You Can Do With This:</h4>
                    <ul class="functions-list">
                        ${lesson.functions.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                </div>` : ''}

                <!-- Pro Tip -->
                ${lesson.tips ? `
                <div class="tips-section">
                    <h4>Pro Tip!</h4>
                    <p>${lesson.tips}</p>
                </div>` : ''}

                <!-- Examples -->
                <div class="examples-section">
                    <h4>Examples:</h4>
                    <ul class="examples-list">
                        ${lesson.examples?.length ? lesson.examples.map(ex => {
                            const clean = ex.replace(/<\/?strong>/g, '');
                            return `<li>${clean}</li>`;
                        }).join('') : '<li>No examples available</li>'}
                    </ul>
                </div>

                <!-- Practice Button -->
                <div class="check-understanding">
                    <h4>Ready to Practice?</h4>
                    <button class="btn check-btn primary-btn" data-lesson-id="${lesson.id}">
                        Practice Now
                    </button>
                </div>
            </div>
        `;

        this.markLessonSeen(lesson.id);
        this.updateNavigationButtons();
        this.updateVoiceSelector();
    },

    updateNavigationButtons: function () {
        const prev = document.getElementById('prev-lesson');
        const next = document.getElementById('next-lesson');
        if (prev) prev.disabled = this.currentLessonIndex === 0;
        if (next) next.disabled = this.currentLessonIndex === this.data.length - 1;
    },

    prevLesson: function () {
        if (this.currentLessonIndex > 0) {
            this.currentLessonIndex--;
            this.renderCurrentLesson();
            App.playSound?.('clickSound');
            this.stopAudio();
        }
    },

    nextLesson: function () {
        if (this.currentLessonIndex < this.data.length - 1) {
            this.currentLessonIndex++;
            this.renderCurrentLesson();
            App.playSound?.('clickSound');
            this.stopAudio();
        }
    },
    getLessonSpeechText: function (lesson) {
        const content = new DOMParser().parseFromString(lesson.content || '', 'text/html').body.textContent;
        const sections = [lesson.title, content];
        if (lesson.functions?.length) sections.push(`What you can do with this: ${lesson.functions.join('. ')}`);
        if (lesson.tips) {
            const tip = new DOMParser().parseFromString(lesson.tips, 'text/html').body.textContent;
            sections.push(`Pro tip: ${tip}`);
        }
        if (lesson.examples?.length) {
            const examples = lesson.examples.map(example =>
                new DOMParser().parseFromString(example, 'text/html').body.textContent
            );
            sections.push(`Examples: ${examples.join('. ')}`);
        }
        return sections.filter(Boolean).join('. ').replace(/\s+/g, ' ').trim();
    },

    updateVoiceSelector: function () {
        const selector = document.querySelector('#lesson-module-activities .lesson-voice-select');
        if (!selector) return;

        const voices = TextToSpeechService.getAvailableVoices();
        const preferredVoice = TextToSpeechService.getPreferredVoice();
        const selectedVoiceURI = TextToSpeechService.selectedVoiceURI;
        selector.replaceChildren();
        const automaticOption = document.createElement('option');
        automaticOption.value = '';
        automaticOption.textContent = 'Best available voice';
        selector.appendChild(automaticOption);

        voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.voiceURI;
            option.textContent = `${voice.name} (${voice.lang})`;
            selector.appendChild(option);
        });

        selector.value = selectedVoiceURI || '';
        selector.disabled = voices.length === 0;
        this.setAudioStatus(voices.length
            ? `Using ${selectedVoiceURI
                ? voices.find(voice => voice.voiceURI === selectedVoiceURI)?.name || 'selected voice'
                : preferredVoice?.name || 'your browser voice'}.`
            : 'Speech voices are not available in this browser.');
    },

    setAudioStatus: function (message) {
        const status = document.querySelector('#lesson-module-activities .lesson-audio-status');
        if (status) status.textContent = message;
    },

    updateAudioControls: function (state) {
        const container = document.querySelector('#lesson-module-activities .current-lesson-container');
        if (!container) return;
        const isPlaying = state === 'playing';
        const isPaused = state === 'paused';
        container.querySelector('.play-audio').hidden = isPlaying || isPaused;
        container.querySelector('.pause-audio').hidden = !isPlaying;
        container.querySelector('.resume-audio').hidden = !isPaused;
        container.querySelector('.stop-audio').hidden = !isPlaying && !isPaused;
    },

    playLessonAudio: function () {
        const lesson = this.data[this.currentLessonIndex];
        if (!lesson) return;

        const started = TextToSpeechService.speak(this.getLessonSpeechText(lesson), {
            rate: 0.9,
            pitch: 1,
            volume: 1
        });
        if (!started) return;

        this.updateAudioControls('playing');
        const voice = TextToSpeechService.getPreferredVoice();
        this.setAudioStatus(`Playing lesson with ${voice?.name || 'your browser voice'}.`);
    },

    pauseLessonAudio: function () {
        TextToSpeechService.pause();
        this.updateAudioControls('paused');
        this.setAudioStatus('Lesson paused.');
    },

    resumeLessonAudio: function () {
        TextToSpeechService.resume();
        this.updateAudioControls('playing');
        this.setAudioStatus('Lesson resumed.');
    },

    resetAudioButtons: function () {
        this.updateAudioControls('stopped');
        this.currentUtterance = null;
    },

    stopAudio: function () {
        TextToSpeechService.stop();
        this.resetAudioButtons();
        this.setAudioStatus('');
    },

    goToPractice: function (lessonId) {
        const map = {
            'lesson-1': { module: 'writing-module', activity: 'writing-1' },
            'lesson-2': { module: 'writing-module', activity: 'writing-2' },
            'lesson-3': { module: 'game-module', activity: 'game-1' },
            'lesson-4': { module: 'game-module', activity: 'game-2' },
            'lesson-5': { module: 'spelling-module', activity: 'spelling-1' },
            'lesson-6': { module: 'writing-module', activity: 'writing-3' }
        };

        const target = map[lessonId] || { module: 'writing-module' };

        if (target.module === 'game-module') {
            App.switchGameMode?.('play', 'game');
        } else if (target.module === 'spelling-module') {
            App.switchWritingMode?.('write', 'spelling');
        } else {
            App.switchWritingMode?.('write', 'writing');
        }

        if (target.activity) {
            setTimeout(() => {
                const el = document.getElementById(target.activity);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add('highlight-activity');
                    setTimeout(() => el.classList.remove('highlight-activity'), 4000);
                }
            }, 400);
        }

        App.playSound?.('successSound');
    },

    markLessonSeen: function (lessonId) {
        if (!App.state.seenLessons) App.state.seenLessons = {};
        App.state.seenLessons[lessonId] = true;
        App.markActivityCompleted?.(lessonId);
    },

setupEventListeners: function () {
    // Remove old handler if exists
    if (this._lessonClickHandler) {
        document.removeEventListener('click', this._lessonClickHandler);
    }
    if (this._lessonChangeHandler) {
        document.removeEventListener('change', this._lessonChangeHandler);
    }

    if (this._ttsEndedHandler) {
        document.removeEventListener('tts-ended', this._ttsEndedHandler);
        document.removeEventListener('tts-error', this._ttsErrorHandler);
        document.removeEventListener('tts-voices-changed', this._ttsVoicesChangedHandler);
    }
    this._ttsEndedHandler = () => {
        this.resetAudioButtons();
        this.setAudioStatus('Lesson finished.');
    };
    this._ttsErrorHandler = event => {
        this.resetAudioButtons();
        this.setAudioStatus(event.detail?.message || 'Speech could not start. Try another voice or browser.');
    };
    this._ttsVoicesChangedHandler = () => this.updateVoiceSelector();
    document.addEventListener('tts-ended', this._ttsEndedHandler);
    document.addEventListener('tts-error', this._ttsErrorHandler);
    document.addEventListener('tts-voices-changed', this._ttsVoicesChangedHandler);

    this._lessonClickHandler = (e) => {
        const btn = e.target.closest.bind(e.target);

        if (btn('#prev-lesson')) {
            e.preventDefault();
            e.stopPropagation();
            this.prevLesson();
        }
        else if (btn('#next-lesson')) {
            e.preventDefault();
            e.stopPropagation();
            this.nextLesson();
        }
        else if (btn('.play-audio')) {
            e.preventDefault();
            this.playLessonAudio();
        }
        else if (btn('.pause-audio')) {
            e.preventDefault();
            this.pauseLessonAudio();
        }
        else if (btn('.resume-audio')) {
            e.preventDefault();
            this.resumeLessonAudio();
        }
        else if (btn('.stop-audio')) {
            e.preventDefault();
            this.stopAudio();
        }
        else if (btn('.check-btn')) {
            e.preventDefault();
            const id = btn('.check-btn').dataset.lessonId;
            this.goToPractice(id);
        }
    };

    this._lessonChangeHandler = event => {
        const selector = event.target.closest?.('.lesson-voice-select');
        if (!selector) return;
        const voiceURI = selector.value;
        if (TextToSpeechService.setVoice(voiceURI)) {
            this.stopAudio();
            this.setAudioStatus(voiceURI ? 'Listening voice updated.' : 'Using the best available voice.');
        }
    };

    document.addEventListener('click', this._lessonClickHandler);
    document.addEventListener('change', this._lessonChangeHandler);
},

    reset: function () {
        this.currentLessonIndex = 0;
        App.state.seenLessons = {};
        App.saveState?.();
        this.stopAudio();
        this.loadLessons();
    }
};

window.LessonModule = LessonModule;