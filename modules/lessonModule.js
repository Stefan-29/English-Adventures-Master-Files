// modules/lessonModule.js
const LessonModule = {
    data: [],
    currentLessonIndex: 0,
    speechSynthesis: window.speechSynthesis || null,
    currentUtterance: null,

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

                <!-- Audio Controls -->
                <div class="audio-control">
                    <button class="play-audio btn">
                        Listen to Lesson
                    </button>
                    <button class="pause-audio btn" style="display:none">
                        Pause
                    </button>
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
playLessonAudio: function () {
    if (!this.speechSynthesis) return;

    this.stopAudio(); // Cancel any existing

    const lesson = this.data[this.currentLessonIndex];
    if (!lesson) return;

    let text = `${lesson.title}. ${lesson.content.replace(/<\/?[^>]+>/g, ' ')}`;
    if (lesson.functions?.length) text += ' What you can do with this: ' + lesson.functions.join('. ');
    if (lesson.tips) text += ` Pro tip: ${lesson.tips}`;
    if (lesson.examples?.length) text += ' Examples: ' + lesson.examples.map(e => e.replace(/<\/?strong>/g, '')).join('. ');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;

    const voices = this.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
                  voices.find(v => v.lang === 'en-US') ||
                  voices[0];
    if (voice) utterance.voice = voice;

    utterance.onend = () => this.resetAudioButtons();
    utterance.onerror = () => this.resetAudioButtons();

    this.currentUtterance = utterance;
    this.speechSynthesis.speak(utterance);

    // FIXED: Use closest container to find buttons
    const container = document.querySelector('#lesson-module-activities .current-lesson-container');
    if (container) {
        container.querySelector('.play-audio')?.style.setProperty('display', 'none');
        container.querySelector('.pause-audio')?.style.removeProperty('display');
    }
},

stopAudio: function () {
    if (this.speechSynthesis?.speaking || this.speechSynthesis?.pending) {
        this.speechSynthesis.cancel();
    }
    this.resetAudioButtons();
},

resetAudioButtons: function () {
    const container = document.querySelector('#lesson-module-activities .current-lesson-container');
    if (container) {
        container.querySelector('.play-audio')?.style.removeProperty('display');
        container.querySelector('.pause-audio')?.style.setProperty('display', 'none');
    }
    this.currentUtterance = null;
},

    stopAudio: function () {
        if (this.speechSynthesis?.speaking) {
            this.speechSynthesis.cancel();
        }
        document.querySelector('.play-audio')?.style.removeProperty('display');
        document.querySelector('.pause-audio')?.style.setProperty('display', 'none');
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

        App.switchModule?.(target.module);

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
        App.saveState?.();
    },

setupEventListeners: function () {
    // Remove old handler if exists
    if (this._lessonClickHandler) {
        document.removeEventListener('click', this._lessonClickHandler);
    }

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
            this.stopAudio();
        }
        else if (btn('.check-btn')) {
            e.preventDefault();
            const id = btn('.check-btn').dataset.lessonId;
            this.goToPractice(id);
        }
    };

    document.addEventListener('click', this._lessonClickHandler);
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