"use strict";

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing App');
    App.init();
});

const App = {
    state: {
        activeModule: 'writing-module',
        activeGrammarModule: null,  // Track which grammar module is active
        overallProgress: 0,
        completedActivities: {},   // Now: { 'past-tenses': {...}, 'future-perfect': {...}, ... }
        moduleStars: {},            // Now: { 'past-tenses': 5, 'future-perfect': 3, ... }
        rewards: { stars: 0, points: 0, badges: [] },
        
        // Audio Settings
        audioEnabled: false,
        soundEffectsEnabled: true,
        musicVolume: 30,
        soundVolume: 70,
        
        // Display Settings
        textSize: '14',
        animationsEnabled: true,
        
        // Learning Preferences
        autoShowHints: true,
        
        // Accessibility Settings
        highContrast: false,
        reduceMotion: false,
    },

    config: null,
    currentDataFile: null,
    grammarModules: [],
    currentGrammarModuleId: null,  // Tracks current grammar module ID
    feedbackQueue: [],  // Queue for feedback messages
    feedbackActive: false,  // Track if feedback is currently showing

    // ———————————————————— INIT ————————————————————
    init: function () {
        console.log('Initializing App');

        // Initialize ImageService with local image mapping
        ImageService.init().then(() => {
            console.log('[Image] ImageService ready with local mappings');
        }).catch(error => {
            console.warn('[Image] Could not initialize image mappings:', error);
        });

        // Initialize API key if available
        const unsplashKey = localStorage.getItem('unsplash_api_key');
        if (unsplashKey) {
            ImageService.setApiKey(unsplashKey);
        }

        this.loadGrammarModules()
            .then(modules => {
                console.log('Grammar modules loaded:', modules);
                this.grammarModules = modules;

                // Set first grammar as active
                const defaultModule = modules[0];
                if (!defaultModule) throw new Error('No grammar modules found');
                
                // Set the current grammar module ID
                this.currentGrammarModuleId = defaultModule.id;

                return this.loadConfigAndData(defaultModule);
            })
            .then(() => {
                this.initializePage();
                this.loadState();
                this.loadSoundPreference();
                this.setupEventListeners();
                this.createStickyCheckAllButton();
                this.initSoundControl();
                this.updateUI();
                this.renderGrammarSelector();

            })
            .catch(err => {
                console.error('Init failed:', err);
                alert('Failed to load app. Check console (F12). Error: ' + err.message);
            });
    },

    // ———————————————————— LOAD ALL GRAMMAR MODULES ————————————————————
    loadGrammarModules: function () {
        const moduleNames = ['can-could-be-able-to','must-have-to-have-got-to','shall-will-would-had-better','should-ought-to','may-might']; // Add new ones here
        const promises = moduleNames.map(name => {
            const configPath = `config/${name}.json`;
            return fetch(configPath)
                .then(res => {
                    if (!res.ok) throw new Error(`Config not found: ${configPath}`);
                    return res.json();
                })
                .then(config => ({
                    id: name,
                    name: config.siteSettings.title.replace('English Adventures: ', ''),
                    configPath,
                    dataFile: config.dataFile,
                    grammarChecker: config.grammarChecker
                }));
        });
        return Promise.all(promises);
    },

    // ———————————————————— RENDER GRAMMAR BUTTONS ————————————————————
    renderGrammarSelector: function () {
        const container = document.getElementById('grammar-buttons');
        if (!container) {
            console.error('grammar-buttons container not found!');
            return;
        }

        container.innerHTML = '';

        this.grammarModules.forEach((mod, i) => {
            const btn = document.createElement('button');
            btn.className = 'grammar-btn';
            if (i === 0) btn.classList.add('active');
            btn.textContent = mod.name;
            btn.dataset.id = mod.id;

            // Use onclick + capture phase = NEVER gets removed
            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                console.log('Grammar button clicked:', mod.name); // ← YOU WILL SEE THIS NOW
                this.switchGrammar(mod);
            };

            container.appendChild(btn);
        });

        console.log('Grammar buttons rendered with permanent listeners');
    },
    // ———————————————————— SWITCH GRAMMAR ————————————————————
    switchGrammar: function (moduleInfo) {
        console.log('switchGrammar called for:', moduleInfo.name); // ← CRITICAL DEBUG LINE

        // Store the new grammar module ID
        this.currentGrammarModuleId = moduleInfo.id;

        // Update active state
        document.querySelectorAll('.grammar-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.grammar-btn[data-id="${moduleInfo.id}"]`)?.classList.add('active');

        // Show loading
        let loading = document.getElementById('loading-screen');
        if (!loading) {
            loading = document.createElement('div');
            loading.id = 'loading-screen';
            loading.innerHTML = '<h2>Loading Grammar...</h2>';
            loading.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:white;display:flex;align-items:center;justify-content:center;z-index:9999;font-size:28px;color:#667eea;';
            document.body.appendChild(loading);
        } else {
            loading.style.display = 'flex';
        }

        this.loadConfigAndData(moduleInfo)
            .then(() => {
                this.initializePage();
                this.setupNavigationListeners();
                this.setupModeButtons();
                setTimeout(() => this.refreshModules(), 100);
                // Recalculate proportional stars for this module
                this.recalculateModuleStars();
                this.updateUI();
                this.initSoundControl();
            })
            .catch(err => {
                console.error('Switch failed:', err);
                alert('Failed to load module: ' + err.message);
            })
            .finally(() => {
                const loading = document.getElementById('loading-screen');
                if (loading) loading.remove();
            });
    },
    // ———————————————————— LOAD CONFIG + DATA ————————————————————
    loadConfigAndData: function (moduleInfo) {
        return fetch(moduleInfo.configPath)
            .then(res => {
                if (!res.ok) throw new Error(`Config not found: ${moduleInfo.configPath}`);
                return res.json();
            })
            .then(config => {
                this.config = config;
                this.currentDataFile = config.dataFile;
                document.title = config.siteSettings.title;
                document.getElementById('favicon').href = config.siteSettings.favicon || 'favicon.ico';
                return this.loadData();
            });
    },

    // ———————————————————— LOAD ACTUAL ACTIVITIES ————————————————————
    loadData: function () {
        if (!this.currentDataFile) {
            console.error('No data file specified');
            return Promise.reject('No data file');
        }

        console.log('Loading data from:', this.currentDataFile);
        return fetch(this.currentDataFile)
            .then(res => {
                if (!res.ok) throw new Error(`Data not found: ${this.currentDataFile}`);
                return res.json();
            })
            .then(data => {
                WritingModule.init(data.writingActivities || []);
                GameModule.init(data.gameActivities || []);
                QuizModule.init(data.quizActivities || []);
                SpellingHelper.init(data.spellingActivities || []);
                LessonModule.init(data.lessonActivities || []);
                RewardSystem.init(data.rewards || {});

                // Reload grammar checker for this topic
                WritingModule.loadGrammarChecker();

                this.calculateProgress();
            })
            .catch(err => {
                console.error('Failed to load data:', err);
                this.loadSampleData();
            });
    },

    loadSampleData: function () {
        console.warn('Using fallback sample data');
        const sample = { /* your sample data here */ };
        WritingModule.init(sample.writingActivities || []);
        GameModule.init(sample.gameActivities || []);
        QuizModule.init(sample.quizActivities || []);
        SpellingHelper.init(sample.spellingActivities || []);
        LessonModule.init(sample.lessonActivities || []);
        RewardSystem.init(sample.rewards || {});
        WritingModule.loadGrammarChecker();
        this.calculateProgress();
    },

    // ———————————————————— PAGE SETUP ————————————————————
    initializePage: function () {
        if (!this.config) return console.error('Config missing');

        document.getElementById('site-title').textContent = this.config.siteSettings.title.split(':')[0].trim();
        document.getElementById('lesson-title').textContent = this.config.lesson.title;

        this.createModuleNavigation();
        this.createModuleSections();
        this.createWordBank();
        this.createAudioElements();

        // FIXED: Was App.refreshModules() → undefined!
        this.refreshModules();
    },

    refreshModules: function () {
        WritingModule.renderActivities?.();
        GameModule.renderActivities?.();
        QuizModule.renderActivities?.();
        SpellingHelper.renderActivities?.();
        LessonModule.loadLessons?.();
    },

    createModuleNavigation: function () {
        const nav = document.getElementById('module-navigation');
        nav.innerHTML = '';

        // Create main navigation buttons: Learn, Play, Write
        const mainModules = [
            { id: 'learn', name: '📖 Learn', icon: '📖' },
            { id: 'play', name: '🎮 Play', icon: '🎮' },
            { id: 'write', name: '✍️ Write', icon: '✍️' }
        ];

        mainModules.forEach((m, i) => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn' + (i === 0 ? ' active' : '');
            btn.dataset.section = m.id;
            btn.textContent = m.name;
            
            btn.addEventListener('click', () => this.switchModule(m.id));
            nav.appendChild(btn);
        });
    },

    createModuleSections: function () {
        const container = document.getElementById('modules-container');
        if (!container) return console.error('modules-container not found');

        container.innerHTML = '';

        // Define simplified module structure: Learn, Play (with sub-modes), Write
        const simplifiedModules = [
            {
                mainId: 'learn',
                mainTitle: '📖 Learn',
                mainInstructions: 'Master the grammar rules and concepts.',
                subModules: [
                    { id: 'lesson-module', internalTitle: 'Lessons' }
                ]
            },
            {
                mainId: 'play',
                mainTitle: '🎮 Play',
                mainInstructions: 'Learn through interactive games and quizzes. Choose your preferred game mode:',
                gameModes: [
                    { id: 'quiz', icon: '❓', label: 'Multiple Choice', description: 'Test your knowledge' },
                    { id: 'game', icon: '🎯', label: 'Drag & Drop', description: 'Interactive drag activities' }
                ],
                subModules: [
                    { id: 'quiz-module', internalTitle: 'Multiple Choice' },
                    { id: 'game-module', internalTitle: 'Drag & Drop' }
                ]
            },
            {
                mainId: 'write',
                mainTitle: '✍️ Write',
                mainInstructions: 'Practice writing with guided activities. Choose your preferred writing mode:',
                writingModes: [
                    { id: 'writing', icon: '📝', label: 'Sentence Building', description: 'Write complete sentences' },
                    { id: 'spelling', icon: '🔤', label: 'Spelling Practice', description: 'Practice spelling words' }
                ],
                subModules: [
                    { id: 'writing-module', internalTitle: 'Sentence Building' },
                    { id: 'spelling-module', internalTitle: 'Spelling Practice' }
                ]
            }
        ];

        // Create section for each simplified module
        simplifiedModules.forEach((main, mainIdx) => {
            const mainSection = document.createElement('section');
            mainSection.id = main.mainId;
            mainSection.className = 'module' + (mainIdx === 0 ? ' active' : '');
            
            let htmlContent = `
                <h3>${main.mainTitle}</h3>
                <div class="module-instructions">${main.mainInstructions}</div>
            `;
            
            // Add game mode buttons for Play section
            if (main.gameModes) {
                htmlContent += `<div class="game-modes-container">`;
                main.gameModes.forEach(mode => {
                    htmlContent += `
                        <button class="game-mode-tag" data-game-mode="${mode.id}" title="${mode.description}">
                            <span class="mode-icon">${mode.icon}</span>
                            <span class="mode-label">${mode.label}</span>
                        </button>
                    `;
                });
                htmlContent += `</div>`;
            }
            
            // Add writing mode buttons for Write section
            if (main.writingModes) {
                htmlContent += `<div class="writing-modes-container">`;
                main.writingModes.forEach(mode => {
                    htmlContent += `
                        <button class="writing-mode-tag" data-writing-mode="${mode.id}" title="${mode.description}">
                            <span class="mode-icon">${mode.icon}</span>
                            <span class="mode-label">${mode.label}</span>
                        </button>
                    `;
                });
                htmlContent += `</div>`;
            }
            
            htmlContent += `<div id="${main.mainId}-activities-wrapper" class="module-activities-wrapper"></div>`;
            mainSection.innerHTML = htmlContent;

            // Set first mode as active by default for game modes
            if (main.gameModes) {
                // Active state will be set by setupModeButtons
            }
            
            // Set first mode as active by default for writing modes
            if (main.writingModes) {
                // Active state will be set by setupModeButtons
            }

            container.appendChild(mainSection);

            // Create activity containers for each sub-module
            const wrapper = mainSection.querySelector(`#${main.mainId}-activities-wrapper`);
            main.subModules.forEach((subMod) => {
                const subSection = document.createElement('div');
                subSection.id = subMod.id;
                subSection.className = `sub-module ${subMod.id === 'lesson-module' || subMod.id === 'writing-module' || subMod.id === 'quiz-module' ? 'active' : ''}`;
                subSection.innerHTML = `<div id="${subMod.id}-activities" class="activities-container"></div>`;
                wrapper.appendChild(subSection);
            });
        });
    },

    createWordBank: function () {
        const wordBank = document.getElementById('word-bank');
        wordBank.innerHTML = '';
        this.config.wordBank.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'word-category';
            const categoryTitle = document.createElement('h5');
            categoryTitle.textContent = category.title;
            categoryDiv.appendChild(categoryTitle);
            const wordsDiv = document.createElement('div');
            wordsDiv.className = 'words';
            category.words.forEach(word => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';
                wordSpan.textContent = word;
                wordsDiv.appendChild(wordSpan);
            });
            categoryDiv.appendChild(wordsDiv);
            wordBank.appendChild(categoryDiv);
        });
    },

    createAudioElements: function () {
        const audioContainer = document.getElementById('audio-container') || (() => {
            const div = document.createElement('div');
            div.id = 'audio-container';
            document.body.appendChild(div);
            return div;
        })();

        audioContainer.innerHTML = '';

        try {
            // Background music — only if file exists
            if (this.config.audio?.backgroundMusic) {
                const backgroundMusic = document.createElement('audio');
                backgroundMusic.id = 'backgroundMusic';
                backgroundMusic.loop = true;
                // Use saved music volume (default 30%)
                backgroundMusic.volume = (this.state.musicVolume || 30) / 100;

                const source = document.createElement('source');
                source.src = this.config.audio.backgroundMusic;
                source.type = 'audio/mp3';
                backgroundMusic.appendChild(source);
                audioContainer.appendChild(backgroundMusic);

                // Test if file exists — if not, remove it so it doesn't break
                backgroundMusic.addEventListener('error', () => {
                    console.warn('Background music file not found:', this.config.audio.backgroundMusic);
                    backgroundMusic.remove();
                });
            }

            // Sound effects — safe loop
            if (this.config.audio?.soundEffects) {
                for (const [key, value] of Object.entries(this.config.audio.soundEffects)) {
                    const sound = document.createElement('audio');
                    sound.id = key;
                    const source = document.createElement('source');
                    source.src = value;
                    source.type = 'audio/mp3';
                    sound.appendChild(source);
                    audioContainer.appendChild(sound);
                }
            }
        } catch (err) {
            console.warn('Audio setup failed (non-blocking):', err);
        }

        console.log('Audio elements created safely');
    },

    loadSampleData: function () {
        const sampleData = {
            lessonActivities: [
                {
                    id: 'lesson-1',
                    title: 'Introduction to Past Simple Tense',
                    content: '<p>The <strong>past simple tense</strong> is used to describe actions or events that started and completed in the past. It helps you share stories, experiences, or facts about past events. Common time expressions include <em>yesterday</em>, <em>last week</em>, <em>two days ago</em>, or specific years like <em>in 2020</em>. This tense is foundational for narrating past experiences clearly.</p>',
                    examples: [
                        'I <strong>walked</strong> to school yesterday.',
                        'She <strong>played</strong> soccer with her friends last Saturday.',
                        'They <strong>visited</strong> the museum two weeks ago.',
                        'We <strong>watched</strong> a movie last night.',
                        'He <strong>finished</strong> his homework before dinner.'
                    ],
                    difficulty: 1,
                    audio: 'introduction.mp3'
                }
            ],
            writingActivities: [
                {
                    id: 'writing-1',
                    question: 'What did you do yesterday after school?',
                    image: 'assets/after_school.jpg',
                    hint: 'Use the <strong>past simple</strong> to describe completed activities you did after school. Include at least two activities for a full response.',
                    expectedKeywords: ['played', 'went', 'did', 'watched', 'ate', 'studied'],
                    sentenceStarters: ['Yesterday after school, I __.', 'After school, I __ and then I __.'],
                    difficulty: 1
                },
                {
                    id: 'writing-2',
                    question: 'Where did you go last weekend?',
                    image: 'assets/weekend_trip.jpg',
                    hint: 'Use the <strong>past simple</strong> to describe places you visited last weekend. Mention who you were with and what you did there.',
                    expectedKeywords: ['went', 'visited', 'saw', 'had', 'enjoyed'],
                    sentenceStarters: ['Last weekend, I went to __.', 'I visited __ with my __ and we __.'],
                    difficulty: 1
                }
            ],
            gameActivities: [
                {
                    id: 'game-1',
                    type: 'drag-drop',
                    question: 'Complete with the correct past simple form:',
                    sentence: 'Yesterday, I ____ to the park with my friends.',
                    options: ['went', 'go', 'going', 'goes'],
                    correctAnswer: ['went'],
                    audio: 'past_simple_go.mp3',
                    hint: 'Use the past simple form of "go". It’s an irregular verb!'
                },
                {
                    id: 'game-2',
                    type: 'drag-drop',
                    question: 'Complete with the correct past simple form:',
                    sentence: 'She ____ her homework last night.',
                    options: ['did', 'do', 'does', 'doing'],
                    correctAnswer: ['did'],
                    audio: 'past_simple_do.mp3',
                    hint: 'Use the past simple form of "do". It’s an irregular verb!'
                }
            ],
            spellingActivities: [
                {
                    id: 'spelling-1',
                    word: 'played',
                    hint: 'Past simple of \'play\', a regular verb formed by adding -ed.',
                    clue: 'p _ a _ e _',
                    audio: 'played.mp3',
                    sentence: 'I ____ football with my friends yesterday.'
                },
                {
                    id: 'spelling-2',
                    word: 'went',
                    hint: 'Past simple of \'go\', an irregular verb with a unique form.',
                    clue: '_ e _ t',
                    audio: 'went.mp3',
                    sentence: 'She ____ to the library last week.'
                }
            ],
            rewards: {
                stars: {
                    bronze: 10,
                    silver: 20,
                    gold: 30
                },
                badges: [
                    {
                        id: 'past-master',
                        name: 'Past Tense Master',
                        condition: 'Complete all learning activities',
                        icon: '📚',
                        points: 10
                    },
                    {
                        id: 'story-writer',
                        name: 'Story Writer',
                        condition: 'Complete all writing activities',
                        icon: '✍️',
                        points: 15
                    },
                    {
                        id: 'grammar-champion',
                        name: 'Grammar Champion',
                        condition: 'Complete all grammar games',
                        icon: '🏆',
                        points: 20
                    },
                    {
                        id: 'spelling-expert',
                        name: 'Spelling Expert',
                        condition: 'Score 100% on all spelling activities',
                        icon: '⭐',
                        points: 25
                    }
                ]
            }
        };
        WritingModule.init(sampleData.writingActivities);
        GameModule.init(sampleData.gameActivities);
        SpellingHelper.init(sampleData.spellingActivities);
        RewardSystem.init(sampleData.rewards);
        LessonModule.init(sampleData.lessonActivities);
    },

    createStickyCheckAllButton: function () {
        const checkAllButton = document.createElement('button');
        checkAllButton.id = 'check-all-button';
        checkAllButton.className = 'sticky-check-all-btn';
        checkAllButton.innerHTML = '✅ Check All Answers';
        checkAllButton.title = 'Check all activities in the current module';
        checkAllButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999;
            background: linear-gradient(135deg, var(--gold-color), var(--accent-color));
            color: white;
            border: 2px solid var(--accent-dark);
            padding: 12px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            display: none;
        `;
        checkAllButton.addEventListener('mouseenter', () => {
            checkAllButton.style.transform = 'translateY(-3px)';
            checkAllButton.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
        });
        checkAllButton.addEventListener('mouseleave', () => {
            checkAllButton.style.transform = 'scale(1)';
            checkAllButton.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
        });
        checkAllButton.addEventListener('click', () => this.checkAllAnswers());
        document.body.appendChild(checkAllButton);
    },

    setupEventListeners: function () {
        console.log('🔧 Setting up event listeners');

        // Only for debugging – remove { capture: true } and don’t stop propagation
        // document.addEventListener('click', (e) => {
        // console.log('Click detected on:', e.target.outerHTML);
        // ← no stopPropagation, no capture → other handlers still fire
        // });
        const resetBtn = document.getElementById('reset-progress');
        if (resetBtn) {
            console.log('✅ Found reset-progress button, attaching listener');
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('reset-progress');
            newResetBtn.disabled = false;
            newResetBtn.style.pointerEvents = 'auto';
            newResetBtn.addEventListener('click', (e) => {
                console.log('🚨 Reset Progress button clicked:', e.target.outerHTML);
                e.stopPropagation();
                e.preventDefault();
                if (confirm('Are you sure you want to reset ALL progress? This cannot be undone.')) {
                    console.log('✅ Reset confirmed');
                    this.resetProgress();
                } else {
                    console.log('🚫 Reset cancelled');
                }
            }, { capture: false });
        } else {
            console.error('❌ Reset Progress button not found in DOM');
        }

        const feedbackModal = document.getElementById('feedback-modal');
        const closeModalBtn = document.querySelector('.modal-close-btn');
        const feedbackContinue = document.getElementById('feedback-continue');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        
        if (closeModalBtn) {
            closeModalBtn.removeEventListener('click', this.closeModalHandler);
            closeModalBtn.addEventListener('click', this.closeModalHandler = (e) => {
                console.log('🚪 Closing feedback modal via close button');
                e.stopPropagation();
                this.closeFeedback();
            }, { capture: false });
        }
        
        if (feedbackContinue) {
            console.log('✅ Found feedback-continue button, attaching listener');
            feedbackContinue.removeEventListener('click', this.feedbackContinueHandler);
            feedbackContinue.disabled = false;
            feedbackContinue.style.pointerEvents = 'auto';
            feedbackContinue.addEventListener('click', this.feedbackContinueHandler = (e) => {
                console.log('🚪 Closing feedback modal via continue button');
                e.stopPropagation();
                this.closeFeedback();
            }, { capture: false });
        } else {
            console.error('❌ feedback-continue button not found in DOM');
        }
        
        if (modalBackdrop) {
            modalBackdrop.removeEventListener('click', this.backdropClickHandler);
            modalBackdrop.addEventListener('click', this.backdropClickHandler = (e) => {
                if (e.target === modalBackdrop) {
                    this.closeFeedback();
                }
            }, { capture: false });
        }

        const toggleSoundEffectsBtn = document.getElementById('toggleSoundEffects');
        if (toggleSoundEffectsBtn) {
            console.log('✅ Found toggleSoundEffects button, attaching listener');
            toggleSoundEffectsBtn.removeEventListener('click', this.soundEffectsToggleHandler);
            toggleSoundEffectsBtn.addEventListener('click', this.soundEffectsToggleHandler = (e) => {
                e.stopPropagation();
                console.log('🎛️ toggleSoundEffects clicked:', toggleSoundEffectsBtn.outerHTML);
                this.state.soundEffectsEnabled = !this.state.soundEffectsEnabled;
                console.log('🔊 Sound effects toggle:', this.state.soundEffectsEnabled ? 'Enabled' : 'Disabled');
                const soundEffectIcon = document.getElementById('soundEffectIcon');
                if (soundEffectIcon) {
                    soundEffectIcon.className = this.state.soundEffectsEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
                    console.log('✅ Updated soundEffectIcon to:', soundEffectIcon.className);
                } else {
                    console.error('❌ soundEffectIcon not found');
                }
                this.saveState();
                // Test sound effect on toggle (if enabled)
                if (this.state.soundEffectsEnabled) {
                    console.log('🎵 Testing sound effect on toggle');
                    this.playSound('correctSound');
                }
            }, { capture: false });
        } else {
            console.error('❌ toggleSoundEffects button not found in DOM');
        }

        // ===== NEW: Control Panel Button & Settings =====
        this.setupSettingsPanel();

        // Re-attach navigation buttons (Lesson / Writing / Games / Spelling)
        this.setupNavigationListeners();

        // Re-attach game mode and writing mode buttons
        this.setupModeButtons();

        const toggleWordBank = document.getElementById('toggle-word-bank');
        const wordBank = document.getElementById('word-bank');
        if (toggleWordBank) {
            toggleWordBank.removeEventListener('click', this.toggleWordBankHandler);
            toggleWordBank.addEventListener('click', this.toggleWordBankHandler = () => {
                wordBank.style.display = wordBank.style.display === 'none' ? 'flex' : 'none';
            }, { capture: false });
        }

        const hintToggle = document.getElementById('hint-toggle');
        const hintText = document.getElementById('hint-text');
        if (hintToggle) {
            hintToggle.removeEventListener('click', this.hintToggleHandler);
            hintToggle.addEventListener('click', this.hintToggleHandler = () => {
                hintText.style.display = hintText.style.display === 'block' ? 'none' : 'block';
            }, { capture: false });
        }

        let currentFocusedTextarea = null;
        document.removeEventListener('focusin', this.focusInHandler);
        document.addEventListener('focusin', this.focusInHandler = (e) => {
            if (e.target.tagName === 'TEXTAREA') {
                currentFocusedTextarea = e.target;
            }
        }, { capture: false });

        const words = document.querySelectorAll('.word');
        words.forEach(word => {
            word.removeEventListener('click', this.wordClickHandler);
            word.addEventListener('click', this.wordClickHandler = () => {
                let targetTextarea = currentFocusedTextarea || document.querySelector('.module.active textarea');
                if (targetTextarea) {
                    const startPos = targetTextarea.selectionStart;
                    const endPos = targetTextarea.selectionEnd;
                    const textBefore = targetTextarea.value.substring(0, startPos);
                    const textAfter = targetTextarea.value.substring(endPos);
                    targetTextarea.value = textBefore + word.textContent + ' ' + textAfter;
                    targetTextarea.focus();
                    const newPosition = startPos + word.textContent.length + 1;
                    targetTextarea.selectionStart = targetTextarea.selectionEnd = newPosition;
                    const event = new Event('input', { bubbles: true });
                    targetTextarea.dispatchEvent(event);
                }
            }, { capture: false });
        });

        setInterval(() => {
            if (this.config && WritingModule.activities?.length && GameModule.activities?.length && SpellingHelper.activities?.length) {
                console.log('⏲️ Periodic save triggered');
                this.saveState();
            } else {
                console.warn('⏲️ Skipping periodic save: modules not fully initialized');
            }
        }, 30000);

        window.removeEventListener('beforeunload', this.beforeUnloadHandler);
        window.addEventListener('beforeunload', this.beforeUnloadHandler = () => {
            console.log('🚪 Beforeunload save triggered');
            this.saveState();
        }, { capture: false });

        const moduleNav = document.getElementById('module-navigation');
        if (moduleNav) {
            moduleNav.removeEventListener('click', this.moduleNavHandler);
            moduleNav.addEventListener('click', this.moduleNavHandler = (e) => {
                if (e.target.classList.contains('module-btn')) {
                    const moduleId = e.target.getAttribute('data-module');
                    this.switchModule(moduleId);
                }
            }, { capture: false });
        }

        const backToTopBtn = document.getElementById('back-to-top');
        if (backToTopBtn) {
            backToTopBtn.removeEventListener('click', this.backToTopHandler);
            backToTopBtn.addEventListener('click', this.backToTopHandler = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, { capture: false });
            window.removeEventListener('scroll', this.scrollHandler);
            window.addEventListener('scroll', this.scrollHandler = () => {
                if (window.scrollY > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
            }, { capture: false });
        }

        // Toggle Rewards (Stars and Badges) - Setup in setupEventListeners so it only runs once
        const toggleRewardsBtn = document.getElementById('toggle-rewards');
        const rewardsContainer = document.getElementById('rewards-container');
        
        console.log('🔍 DEBUG - toggleRewardsBtn:', toggleRewardsBtn);
        console.log('🔍 DEBUG - rewardsContainer:', rewardsContainer);
        console.log('🔍 DEBUG - toggleRewardsBtn computed style pointer-events:', toggleRewardsBtn ? window.getComputedStyle(toggleRewardsBtn).pointerEvents : 'N/A');
        console.log('🔍 DEBUG - toggleRewardsBtn z-index:', toggleRewardsBtn ? window.getComputedStyle(toggleRewardsBtn).zIndex : 'N/A');
        console.log('🔍 DEBUG - toggleRewardsBtn parent z-index:', toggleRewardsBtn?.parentElement ? window.getComputedStyle(toggleRewardsBtn.parentElement).zIndex : 'N/A');
        
        if (toggleRewardsBtn && rewardsContainer) {
            console.log('✅ Elements found, setting up toggle');
            
            // Load saved state from localStorage
            const rewardsCollapsed = localStorage.getItem('rewardsCollapsed') === 'true';
            if (rewardsCollapsed) {
                rewardsContainer.classList.add('collapsed');
                toggleRewardsBtn.classList.add('collapsed');
                console.log('📌 Restored collapsed state from localStorage');
            }
            
            // Define the toggle handler function
            const handleToggleClick = (e) => {
                console.log('🖱️ Toggle button clicked');
                console.log('🖱️ Event target:', e.target);
                console.log('🖱️ Event currentTarget:', e.currentTarget);
                const isCollapsed = rewardsContainer.classList.toggle('collapsed');
                toggleRewardsBtn.classList.toggle('collapsed', isCollapsed);
                localStorage.setItem('rewardsCollapsed', isCollapsed);
                console.log('✨ Rewards toggled. Collapsed:', isCollapsed);
            };
            
            // Use capture phase to ensure we catch the click
            toggleRewardsBtn.addEventListener('click', handleToggleClick, { capture: true });
            console.log('✅ Click listener attached to toggle button (capture phase)');
            
            // Also attach as direct onclick for maximum compatibility
            toggleRewardsBtn.onclick = handleToggleClick;
            console.log('✅ Also attached direct onclick handler');
        } else {
            console.log('❌ Elements not found - toggleRewardsBtn:', !!toggleRewardsBtn, 'rewardsContainer:', !!rewardsContainer);
        }

        // Toggle Modules (Learning Activities) - Same pattern as rewards
        const toggleModulesBtn = document.getElementById('toggle-modules');
        const modulesContainer = document.getElementById('modules-container');
        
        console.log('🔍 DEBUG - toggleModulesBtn:', toggleModulesBtn);
        console.log('🔍 DEBUG - modulesContainer:', modulesContainer);
        console.log('🔍 DEBUG - toggleModulesBtn computed style pointer-events:', toggleModulesBtn ? window.getComputedStyle(toggleModulesBtn).pointerEvents : 'N/A');
        console.log('🔍 DEBUG - toggleModulesBtn z-index:', toggleModulesBtn ? window.getComputedStyle(toggleModulesBtn).zIndex : 'N/A');
        
        if (toggleModulesBtn && modulesContainer) {
            console.log('✅ Modules elements found, setting up toggle');
            
            // Load saved state from localStorage
            const modulesCollapsed = localStorage.getItem('modulesCollapsed') === 'true';
            if (modulesCollapsed) {
                modulesContainer.classList.add('collapsed');
                toggleModulesBtn.classList.add('collapsed');
                console.log('📌 Restored collapsed state for modules from localStorage');
            }
            
            // Define the toggle handler function
            const handleModulesToggleClick = (e) => {
                console.log('🖱️ Modules toggle button clicked');
                console.log('🖱️ Event target:', e.target);
                console.log('🖱️ Event currentTarget:', e.currentTarget);
                const isCollapsed = modulesContainer.classList.toggle('collapsed');
                toggleModulesBtn.classList.toggle('collapsed', isCollapsed);
                localStorage.setItem('modulesCollapsed', isCollapsed);
                console.log('✨ Modules toggled. Collapsed:', isCollapsed);
            };
            
            // Use capture phase to ensure we catch the click
            toggleModulesBtn.addEventListener('click', handleModulesToggleClick, { capture: true });
            console.log('✅ Click listener attached to modules toggle button (capture phase)');
            
            // Also attach as direct onclick for maximum compatibility
            toggleModulesBtn.onclick = handleModulesToggleClick;
            console.log('✅ Also attached direct onclick handler for modules');
        } else {
            console.log('❌ Modules elements not found - toggleModulesBtn:', !!toggleModulesBtn, 'modulesContainer:', !!modulesContainer);
        }

        const checkAllButton = document.getElementById('check-all-button');
        if (checkAllButton) {
            checkAllButton.removeEventListener('click', this.checkAllHandler);
            checkAllButton.addEventListener('click', this.checkAllHandler = () => {
                this.checkAllAnswers();
            }, { capture: false });
        }
    },

    setupNavigationListeners: function () {
        // Remove old listeners by cloning buttons
        const navButtons = document.querySelectorAll('.nav-btn:not(.has-submenu)');
        navButtons.forEach(button => {
            const cloned = button.cloneNode(true);
            button.parentNode.replaceChild(cloned, button);
        });

        // Add new listeners
        document.querySelectorAll('.nav-btn:not(.has-submenu)').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const targetSection = button.dataset.section;
                console.log('Navigation button clicked:', targetSection);
                this.switchModule(targetSection);
            });
        });

        console.log('Navigation listeners re-attached');
    },

    setupModeButtons: function () {
        // Remove old listeners by cloning game mode buttons
        const gameModeButtons = document.querySelectorAll('.game-mode-tag');
        gameModeButtons.forEach(button => {
            const cloned = button.cloneNode(true);
            button.parentNode.replaceChild(cloned, button);
        });

        // Remove old listeners by cloning writing mode buttons
        const writingModeButtons = document.querySelectorAll('.writing-mode-tag');
        writingModeButtons.forEach(button => {
            const cloned = button.cloneNode(true);
            button.parentNode.replaceChild(cloned, button);
        });

        // Add new listeners for game mode buttons
        document.querySelectorAll('.game-mode-tag').forEach((btn, index) => {
            if (index === 0) btn.classList.add('active'); // Set first as active
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const gameMode = btn.dataset.gameMode;
                console.log('Game mode button clicked:', gameMode);
                this.switchGameMode('play', gameMode);
                
                // Update active state
                document.querySelectorAll('.game-mode-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Add new listeners for writing mode buttons
        document.querySelectorAll('.writing-mode-tag').forEach((btn, index) => {
            if (index === 0) btn.classList.add('active'); // Set first as active
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const writingMode = btn.dataset.writingMode;
                console.log('Writing mode button clicked:', writingMode);
                this.switchWritingMode('write', writingMode);
                
                // Update active state
                document.querySelectorAll('.writing-mode-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        console.log('Mode button listeners re-attached');
    },

    switchGameMode: function (moduleId, gameMode) {
        // Show the 'play' main section
        this.switchModule('play');
        
        // Show the appropriate game mode sub-section
        const quizSection = document.getElementById('quiz-module');
        const gameSection = document.getElementById('game-module');
        
        if (gameMode === 'quiz') {
            if (quizSection) quizSection.classList.add('active');
            if (gameSection) gameSection.classList.remove('active');
        } else if (gameMode === 'game') {
            if (gameSection) gameSection.classList.add('active');
            if (quizSection) quizSection.classList.remove('active');
        }
    },

    switchWritingMode: function (moduleId, writingMode) {
        // Show the 'write' main section
        this.switchModule('write');
        
        // Show the appropriate writing mode sub-section
        const writingSection = document.getElementById('writing-module');
        const spellingSection = document.getElementById('spelling-module');
        
        if (writingMode === 'writing') {
            if (writingSection) writingSection.classList.add('active');
            if (spellingSection) spellingSection.classList.remove('active');
        } else if (writingMode === 'spelling') {
            if (spellingSection) spellingSection.classList.add('active');
            if (writingSection) writingSection.classList.remove('active');
        }
    },

    switchModule: function (moduleId) {
        // Safe guard
        const section = document.getElementById(moduleId);
        const btn = document.querySelector(`[data-section="${moduleId}"]`);

        if (!section || !btn) {
            console.warn('Module not found:', moduleId);
            return;
        }

        document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        section.classList.add('active');
        btn.classList.add('active');

        this.state.activeModule = moduleId;
        
        // Show check-all button only for non-lesson modules
        const checkAllButton = document.getElementById('check-all-button');
        if (checkAllButton) {
            const isLessonModule = moduleId === 'lesson-module';
            checkAllButton.style.display = isLessonModule ? 'none' : 'flex';
        }
        
        this.saveState();
        this.updateUI();
    },

    showFeedback: function (title, message, icon = null) {
        // Add to queue
        this.feedbackQueue.push({ title, message, icon });
        
        // Process queue if not already processing
        if (!this.feedbackActive) {
            this.processFeedbackQueue();
        }
    },

    processFeedbackQueue: function () {
        if (this.feedbackQueue.length === 0) {
            this.feedbackActive = false;
            return;
        }

        this.feedbackActive = true;
        const { title, message, icon } = this.feedbackQueue.shift();

        const feedbackModal = document.getElementById('feedback-modal');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackMessage = document.getElementById('feedback-message');
        const feedbackReward = document.getElementById('feedback-reward');
        const feedbackContinue = document.getElementById('feedback-continue');

        // RENDER HTML (bold, italic, etc.)
        feedbackTitle.innerHTML = title;
        feedbackMessage.innerHTML = message;

        // Add current rewards info
        const moduleId = this.currentGrammarModuleId;
        const moduleStars = this.state.moduleStars[moduleId] || 0;
        const earnedBadges = (this.state.rewards.badges || []).filter(b => b.moduleId === moduleId);
        const rewardsInfo = `
            <div class="feedback-rewards-info">
                <div class="feedback-stars">⭐ ${moduleStars} stars earned</div>
                <div class="feedback-badges">🏆 ${earnedBadges.length} badges earned</div>
            </div>
        `;
        feedbackMessage.innerHTML += rewardsInfo;

        // Play sound based on icon (emoji indicates success/failure)
        const successEmojis = ['⭐', '🎉', '✓', '✅', '🏆', '💯', 'Excellent', 'Great', 'Perfect', 'Success'];
        const isSuccess = successEmojis.some(emoji => title.includes(emoji) || message.includes(emoji) || icon === emoji);
        const soundId = isSuccess ? 'correctSound' : 'wrongSound';
        this.playSound(soundId);

        // Show icon (real emoji)
        if (icon) {
            feedbackReward.textContent = icon;
            feedbackReward.style.display = 'block';
        } else {
            feedbackReward.style.display = 'none';
        }

        // Enable continue
        feedbackContinue.disabled = false;
        feedbackContinue.style.pointerEvents = 'auto';

        // Show modal with animation
        feedbackModal.classList.add('show');
    },

    closeFeedback: function () {
        const feedbackModal = document.getElementById('feedback-modal');
        feedbackModal.classList.remove('show');
        
        // Process next feedback in queue after a small delay
        setTimeout(() => {
            this.processFeedbackQueue();
        }, 300);
    },

    updateUI: function () {
        this.calculateProgress();
        const bar = document.getElementById('overall-progress');
        const pct = document.getElementById('progress-percent');
        if (bar) bar.style.width = this.state.overallProgress + '%';
        if (pct) pct.textContent = this.state.overallProgress + '%';
        RewardSystem.updateStarsDisplay?.();
        RewardSystem.updateBadgesDisplay?.();
    },

    initSoundControl: function () {
        console.log('✅ Sound control initialized (background music control now integrated in control panel)');
    },

    playSound: function (soundId) {
        console.log(`🎵 Attempting to play sound: ${soundId}`);
        if (!this.state.soundEffectsEnabled && soundId !== 'backgroundMusic') {
            console.log(`🔇 Sound effect ${soundId} muted`);
            return;
        }
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            // Set sound effects volume
            sound.volume = (this.state.soundVolume || 70) / 100;
            sound.play().catch(e => {
                console.warn(`❌ Failed to play sound ${soundId}:`, e);
            });
        } else {
            console.error(`❌ Audio element with ID ${soundId} not found`);
        }
    },

    updateHint: function (hintText) {
        const hintElement = document.getElementById('hint-text');
        hintElement.innerHTML = `<strong>💡 Hint:</strong> ${hintText || 'No hint available'}`;
    },

    recalculateModuleStars: function () {
        const moduleId = this.currentGrammarModuleId;
        if (!moduleId) return;

        // Calculate current proportional stars for this module based on completion
        if (RewardSystem.calculateModuleStars) {
            const calculatedStars = RewardSystem.calculateModuleStars(moduleId);
            this.state.moduleStars[moduleId] = calculatedStars;
            this.saveState();
        }
    },

    calculateProgress: function () {
        const moduleId = this.currentGrammarModuleId;
        if (!moduleId) return this.state.overallProgress = 0;

        const total = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0) +
            (QuizModule.activities?.length || 0);

        if (total === 0) return this.state.overallProgress = 0;

        // Count ONLY completed activities (not incorrect) in the current module
        const moduleCompletions = this.state.completedActivities[moduleId] || {};
        const completed = Object.keys(moduleCompletions).filter(
            key => moduleCompletions[key] === 'completed'
        ).length;
        this.state.overallProgress = Math.min(100, Math.round((completed / total) * 100));
        this.saveState();
    },

    markActivityCompleted: function (id, status = 'completed') {
        // Get the current module's completion tracker
        const moduleId = this.currentGrammarModuleId;
        if (!moduleId) {
            console.error('No active grammar module');
            return;
        }

        // Initialize module completion object if needed
        if (!this.state.completedActivities[moduleId]) {
            this.state.completedActivities[moduleId] = {};
        }

        // Check if already completed in this module
        if (this.state.completedActivities[moduleId][id]) return;

        // Mark as completed in this module with status
        this.state.completedActivities[moduleId][id] = status;
        this.calculateProgress();
        
        // Only award stars for correct answers
        if (status === 'completed') {
            RewardSystem.awardStar(id);
        }
        
        this.updateUI();
        this.saveState();
    },

    saveState: function () {
        try {
            const stateToSave = {
                ...this.state,
                rewards: {
                    stars: this.state.rewards?.stars || 0,
                    points: this.state.rewards?.points || 0,
                    badges: this.state.rewards?.badges || []
                },
                audioEnabled: this.state.audioEnabled,
                soundEffectsEnabled: this.state.soundEffectsEnabled
            };
            if (Object.keys(stateToSave.completedActivities).length === 0 &&
                (WritingModule.activities?.length || GameModule.activities?.length || SpellingHelper.activities?.length)) {
                console.warn('⚠️ Attempted to save empty completedActivities, skipping save');
                return;
            }
            console.log('🔍 SAVING - completedActivities:', JSON.stringify(stateToSave.completedActivities));
            localStorage.setItem('englishAdventuresState', JSON.stringify(stateToSave));
            console.log('State saved successfully:', stateToSave.overallProgress);
        } catch (e) {
            console.error('Error saving state to localStorage:', e);
        }
    },

    loadState: function () {
        try {
            const savedState = localStorage.getItem('englishAdventuresState');
            console.log('Raw saved state:', savedState);
            if (savedState) {
                const parsedState = JSON.parse(savedState);
                console.log('Parsed state:', parsedState);
                let migratedCompletedActivities = {};
                
                // Handle migration from old flat structure to new module-scoped structure
                if (parsedState.completedActivities) {
                    if (Object.values(parsedState.completedActivities).some(val => typeof val === 'object' && !Array.isArray(val))) {
                        // Already in new format (module-scoped)
                        migratedCompletedActivities = parsedState.completedActivities;
                    } else if (!Object.values(parsedState.completedActivities).some(val => Array.isArray(val))) {
                        // Old flat format - migrate to new structure for current module
                        const moduleId = this.currentGrammarModuleId;
                        migratedCompletedActivities[moduleId] = parsedState.completedActivities;
                    } else {
                        // Array format - migrate to new structure
                        const moduleId = this.currentGrammarModuleId;
                        migratedCompletedActivities[moduleId] = {};
                        for (const category in parsedState.completedActivities) {
                            if (Array.isArray(parsedState.completedActivities[category])) {
                                parsedState.completedActivities[category].forEach(id => {
                                    migratedCompletedActivities[moduleId][id] = true;
                                });
                            }
                        }
                    }
                }
                
                if (parsedState.rewards && typeof parsedState.rewards.stars === 'number' && Array.isArray(parsedState.rewards.badges)) {
                    this.state = {
                        ...parsedState,
                        completedActivities: migratedCompletedActivities,
                        moduleStars: parsedState.moduleStars || {},
                        rewards: {
                            stars: parsedState.rewards.stars || 0,
                            points: parsedState.rewards.points || 0,
                            badges: parsedState.rewards.badges || []
                        },
                        // Audio Settings
                        audioEnabled: parsedState.audioEnabled !== undefined ? parsedState.audioEnabled : false,
                        soundEffectsEnabled: parsedState.soundEffectsEnabled !== undefined ? parsedState.soundEffectsEnabled : true,
                        musicVolume: parsedState.musicVolume !== undefined ? parsedState.musicVolume : 30,
                        soundVolume: parsedState.soundVolume !== undefined ? parsedState.soundVolume : 70,
                        
                        // Display Settings
                        textSize: parsedState.textSize || '14',
                        animationsEnabled: parsedState.animationsEnabled !== undefined ? parsedState.animationsEnabled : true,
                        
                        // Learning Preferences
                        autoShowHints: parsedState.autoShowHints !== undefined ? parsedState.autoShowHints : true,
                        
                        // Accessibility Settings
                        highContrast: parsedState.highContrast === true,
                        reduceMotion: parsedState.reduceMotion === true,
                    };
                    console.log('State loaded successfully:', this.state.overallProgress);
                    this.switchModule(this.state.activeModule || 'writing-module');
                    this.calculateProgress();
                    this.refreshModules();
                    RewardSystem.checkAllBadgeConditions();
                    return;
                } else {
                    console.warn('Invalid rewards data in localStorage, using default state');
                }
            } else {
                console.log('No saved state found in localStorage');
            }
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
        console.log('Falling back to default state');
        this.state.rewards = {
            stars: 0,
            points: 0,
            badges: []
        };
        this.state.completedActivities = {};
        this.state.moduleStars = {};
        this.state.audioEnabled = false;
        this.state.soundEffectsEnabled = true;
        this.state.musicVolume = 30;
        this.state.soundVolume = 70;
        this.state.textSize = '14';
        this.state.animationsEnabled = true;
        this.state.autoShowHints = true;
        this.state.highContrast = false;
        this.state.reduceMotion = false;
        this.switchModule('writing-module');
        this.saveState();
        this.refreshModules();
        RewardSystem.checkAllBadgeConditions();
        
        // Load theme preference
        this.applyThemePreference();
    },

    applyThemePreference: function () {
        const savedTheme = localStorage.getItem('grammar101-theme');
        const isDarkMode = savedTheme === 'dark';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        console.log('🌓 Theme applied:', isDarkMode ? 'Dark Mode' : 'Light Mode');
        
        // Apply text size
        if (this.state.textSize) {
            document.documentElement.style.fontSize = this.state.textSize + 'px';
        }
        
        // Apply accessibility settings
        if (this.state.highContrast) {
            document.body.classList.add('high-contrast');
        }
        
        if (this.state.reduceMotion) {
            document.body.classList.add('reduce-motion');
        }
        
        // Update control panel after theme is applied
        setTimeout(() => this.updateControlPanelState(), 100);
    },

    loadSoundPreference: function () {
        const savedSound = localStorage.getItem('grammar101-sound');
        const isSoundEnabled = savedSound !== 'disabled'; // Default to enabled if not set
        
        this.state.soundEffectsEnabled = isSoundEnabled;
        
        console.log('🔊 Sound preference loaded:', isSoundEnabled ? 'Enabled' : 'Disabled');
        
        // Update control panel after preferences are loaded
        setTimeout(() => this.updateControlPanelState(), 100);
    },

    resetProgress: function () {
        console.log('🔄 RESETTING PROGRESS FOR MODULE:', this.currentGrammarModuleId);
        
        const moduleId = this.currentGrammarModuleId;
        if (!moduleId) {
            console.error('No active module to reset');
            return Promise.reject('No active module');
        }

        // Ensure rewards object exists
        if (!this.state.rewards) {
            this.state.rewards = { stars: 0, points: 0, badges: [] };
        }

        // Only reset progress for the current module, not all modules
        if (!this.state.completedActivities[moduleId]) {
            this.state.completedActivities[moduleId] = {};
        }
        this.state.completedActivities[moduleId] = {};
        this.state.overallProgress = 0;

        // Reset stars for this module
        const moduleStars = this.state.moduleStars[moduleId] || 0;
        this.state.rewards.stars -= moduleStars;  // Deduct module stars from total
        this.state.moduleStars[moduleId] = 0;     // Reset module stars to 0

        // Remove badges earned in this module
        this.state.rewards.badges = this.state.rewards.badges.filter(badge => badge.moduleId !== moduleId);

        // Keep global rewards/badges, just recalculate them
        this.saveState();

        const resetPromises = [];
        if (typeof WritingModule.reset === 'function') resetPromises.push(WritingModule.reset());
        if (typeof GameModule.reset === 'function') resetPromises.push(GameModule.reset());
        if (typeof QuizModule.reset === 'function') resetPromises.push(QuizModule.reset());
        if (typeof SpellingHelper.reset === 'function') resetPromises.push(SpellingHelper.reset());
        if (typeof LessonModule.reset === 'function') resetPromises.push(LessonModule.reset());
        
        return Promise.all(resetPromises).then(() => {
            // Recalculate badges since module progress changed
            if (typeof RewardSystem.checkAllBadgeConditions === 'function') {
                RewardSystem.checkAllBadgeConditions();
            }
            this.updateUI();
            this.refreshModules();
            console.log('✅ Progress reset complete for module:', moduleId);
            this.showFeedback('Progress Reset', `All progress for this module has been reset successfully.`);
        });
    },

    checkAllAnswers: function () {
        const activeModule = this.state.activeModule;
        const moduleId = this.currentGrammarModuleId;
        const moduleCompletions = this.state.completedActivities[moduleId] || {};
        let results = {
            correct: [],
            incorrect: [],
            incomplete: []
        };
        let moduleActivities;

        switch (activeModule) {
            case 'writing-module':
                moduleActivities = WritingModule.activities;
                moduleActivities.forEach(activity => {
                    if (!moduleCompletions[activity.id]) {
                        const activityCard = document.getElementById(activity.id);
                        const textarea = activityCard.querySelector('.activity-input');
                        const result = WritingModule.checkAnswer(activity, textarea.value, true);
                        if (result.status === 'correct') {
                            results.correct.push(activity.id);
                            this.markActivityCompleted(activity.id);
                            activityCard.querySelector('.activity-status').textContent = 'Completed';
                            activityCard.querySelector('.activity-status').classList.add('completed');
                            textarea.disabled = true;
                            activityCard.querySelectorAll('.btn').forEach(button => button.disabled = true);
                        } else if (result.status === 'incomplete') {
                            results.incomplete.push(activity.id);
                        } else {
                            results.incorrect.push(activity.id);
                        }
                    }
                });
                break;
            case 'spelling-module':
                moduleActivities = SpellingHelper.activities;
                moduleActivities.forEach(activity => {
                    if (!moduleCompletions[activity.id]) {
                        const result = SpellingHelper.checkSpelling(activity, true);
                        if (result.status === 'correct') {
                            results.correct.push(activity.id);
                            this.markActivityCompleted(activity.id);
                            const activityCard = document.getElementById(activity.id);
                            activityCard.querySelector('.activity-status').textContent = 'Completed';
                            activityCard.querySelector('.activity-status').classList.add('completed');
                            activityCard.querySelectorAll('.spelling-input').forEach(input => {
                                input.disabled = true;
                                input.style.color = 'green';
                            });
                            activityCard.querySelectorAll('.btn').forEach(button => button.disabled = true);
                        } else if (result.status === 'incomplete') {
                            results.incomplete.push(activity.id);
                        } else {
                            results.incorrect.push(activity.id);
                        }
                    }
                });
                break;
            case 'game-module':
                moduleActivities = GameModule.activities;
                moduleActivities.forEach(activity => {
                    if (!moduleCompletions[activity.id]) {
                        const result = GameModule.checkAnswer(activity, true);
                        if (result.status === 'correct') {
                            results.correct.push(activity.id);
                            this.markActivityCompleted(activity.id);
                            const activityCard = document.getElementById(activity.id);
                            activityCard.querySelector('.activity-status').textContent = 'Completed';
                            activityCard.querySelector('.activity-status').classList.add('completed');
                            activityCard.querySelectorAll('.btn').forEach(button => button.disabled = true);
                            activityCard.querySelectorAll('.draggable').forEach(option => {
                                option.style.pointerEvents = 'none';
                                option.style.opacity = '0.5';
                            });
                            activityCard.querySelectorAll('.drop-zone').forEach(zone => {
                                zone.style.pointerEvents = 'none';
                            });
                        } else if (result.status === 'incomplete') {
                            results.incomplete.push(activity.id);
                        } else {
                            results.incorrect.push(activity.id);
                        }
                    }
                });
                break;
            case 'quiz-module':
                moduleActivities = QuizModule.activities;
                // Quiz activities are already handled individually, no bulk checking needed
                results.incomplete.push(...moduleActivities.filter(activity => !moduleCompletions[activity.id]).map(a => a.id));
                break;
        }

        let message = '';
        if (results.correct.length > 0) {
            message += `Correct: ${results.correct.length} activities completed successfully!\n`;
        }
        if (results.incorrect.length > 0) {
            message += `Incorrect: ${results.incorrect.length} activities need corrections.\n`;
        }
        if (results.incomplete.length > 0) {
            message += `Incomplete: ${results.incomplete.length} activities are not filled out.\n`;
        }
        if (message === '') {
            message = 'All activities in this module are already completed!';
        }

        const allCorrect = results.incorrect.length === 0 && results.incomplete.length === 0 && results.correct.length > 0;
        this.showFeedback(
            allCorrect ? 'Success' : 'Check Results',
            message,
            allCorrect ? '⭐' : '📋'
        );
        this.playSound(allCorrect ? 'correctSound' : 'wrongSound');
        this.updateUI();
    },

    updateCheckAllButton: function () {
        const checkAllButton = document.getElementById('check-all-button');
        if (checkAllButton) {
            const activeModule = this.state.activeModule;
            const moduleActivities = activeModule === 'writing-module' ? WritingModule.activities :
                activeModule === 'spelling-module' ? SpellingHelper.activities :
                    GameModule.activities;
            const allCompleted = moduleActivities.every(activity => this.state.completedActivities[activity.id]);
            checkAllButton.disabled = allCompleted;
            checkAllButton.style.opacity = allCompleted ? '0.5' : '1';
            checkAllButton.title = allCompleted ? 'All activities completed' : 'Check all activities in the current module';
        }
    },

    // ===== THEME TOGGLE FUNCTION =====
    toggleTheme: function () {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        
        console.log('🌓 Theme switched to:', isDarkMode ? 'Dark Mode' : 'Light Mode');
        
        // Save preference
        localStorage.setItem('grammar101-theme', isDarkMode ? 'dark' : 'light');
        this.saveState();
    },

    // ===== SOUND TOGGLE FUNCTION =====
    toggleSound: function () {
        this.state.soundEffectsEnabled = !this.state.soundEffectsEnabled;
        
        console.log('🔊 Sound effects:', this.state.soundEffectsEnabled ? 'Enabled' : 'Disabled');
        
        // Play a test sound if enabling
        if (this.state.soundEffectsEnabled) {
            this.playSound('correctSound');
        }
        
        // Save preference
        localStorage.setItem('grammar101-sound', this.state.soundEffectsEnabled ? 'enabled' : 'disabled');
        this.saveState();
    },

    // ===== UPDATE CONTROL PANEL STATE =====
    updateControlPanelState: function () {
        const isDarkMode = document.body.classList.contains('dark-mode');
        
        // Update theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = isDarkMode;
        
        // Update music toggle and volume
        const musicToggle = document.getElementById('music-toggle');
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeDisplay = document.getElementById('music-volume-display');
        if (musicToggle) musicToggle.checked = this.state.audioEnabled;
        if (musicVolume && musicVolumeDisplay) {
            musicVolume.value = (this.state.musicVolume || 30);
            musicVolumeDisplay.textContent = (this.state.musicVolume || 30) + '%';
        }
        
        // Update sound toggle and volume
        const soundToggle = document.getElementById('sound-toggle');
        const soundVolume = document.getElementById('sound-volume');
        const soundVolumeDisplay = document.getElementById('sound-volume-display');
        if (soundToggle) soundToggle.checked = this.state.soundEffectsEnabled;
        if (soundVolume && soundVolumeDisplay) {
            soundVolume.value = (this.state.soundVolume || 70);
            soundVolumeDisplay.textContent = (this.state.soundVolume || 70) + '%';
        }
        
        // Update other toggles
        const animationToggle = document.getElementById('animation-toggle');
        const hintsToggle = document.getElementById('hints-toggle');
        const focusToggle = document.getElementById('focus-toggle');
        const reduceMotion = document.getElementById('reduce-motion');
        
        if (animationToggle) animationToggle.checked = this.state.animationsEnabled !== false;
        if (hintsToggle) hintsToggle.checked = this.state.autoShowHints !== false;
        if (focusToggle) focusToggle.checked = this.state.highContrast === true;
        if (reduceMotion) reduceMotion.checked = this.state.reduceMotion === true;
    },

    setupSettingsPanel: function () {
        const controlPanelBtn = document.getElementById('control-panel-btn');
        const controlPanelMenu = document.getElementById('control-panel-menu');
        const settingsCloseBtn = document.querySelector('.settings-close-btn');
        
        // Initialize settings on first load
        this.updateControlPanelState();
        
        // Control panel toggle
        if (controlPanelBtn && controlPanelMenu) {
            controlPanelBtn.removeEventListener('click', this.controlPanelHandler);
            controlPanelBtn.addEventListener('click', this.controlPanelHandler = (e) => {
                e.stopPropagation();
                console.log('⚙️ Settings panel toggled');
                controlPanelMenu.classList.toggle('active');
            });
            
            // Close button
            if (settingsCloseBtn) {
                settingsCloseBtn.removeEventListener('click', this.settingsCloseHandler);
                settingsCloseBtn.addEventListener('click', this.settingsCloseHandler = (e) => {
                    e.stopPropagation();
                    controlPanelMenu.classList.remove('active');
                });
            }
            
            // Close when clicking outside
            document.removeEventListener('click', this.closeSettingsHandler);
            document.addEventListener('click', this.closeSettingsHandler = (e) => {
                if (!controlPanelBtn.contains(e.target) && !controlPanelMenu.contains(e.target)) {
                    controlPanelMenu.classList.remove('active');
                }
            });
        }
        
        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.removeEventListener('change', this.themeToggleHandler);
            themeToggle.addEventListener('change', this.themeToggleHandler = (e) => {
                console.log('🌓 Theme toggled:', e.target.checked ? 'Dark' : 'Light');
                if (e.target.checked) {
                    document.body.classList.add('dark-mode');
                } else {
                    document.body.classList.remove('dark-mode');
                }
                localStorage.setItem('grammar101-theme', e.target.checked ? 'dark' : 'light');
                this.saveState();
            });
        }
        
        // Text Size
        const textSizeSlider = document.getElementById('text-size');
        if (textSizeSlider) {
            textSizeSlider.value = this.state.textSize || '14';
            textSizeSlider.removeEventListener('input', this.textSizeHandler);
            textSizeSlider.addEventListener('input', this.textSizeHandler = (e) => {
                const size = e.target.value;
                document.documentElement.style.fontSize = size + 'px';
                this.state.textSize = size;
                console.log('📝 Text size changed to:', size + 'px');
                this.saveState();
            });
            // Apply saved text size
            document.documentElement.style.fontSize = (this.state.textSize || '14') + 'px';
        }
        
        // Music Toggle
        const musicToggle = document.getElementById('music-toggle');
        if (musicToggle) {
            musicToggle.removeEventListener('change', this.musicToggleHandler);
            musicToggle.addEventListener('change', this.musicToggleHandler = (e) => {
                this.state.audioEnabled = e.target.checked;
                console.log('🎵 Background music toggled:', e.target.checked ? 'On' : 'Off');
                
                const backgroundMusic = document.getElementById('backgroundMusic');
                if (backgroundMusic) {
                    if (e.target.checked) {
                        backgroundMusic.volume = (this.state.musicVolume || 30) / 100;
                        backgroundMusic.play().catch(err => console.warn('Music play failed:', err));
                    } else {
                        backgroundMusic.pause();
                    }
                }
                this.saveState();
            });
        }
        
        // Music Volume
        const musicVolume = document.getElementById('music-volume');
        const musicVolumeDisplay = document.getElementById('music-volume-display');
        if (musicVolume && musicVolumeDisplay) {
            musicVolume.removeEventListener('input', this.musicVolumeHandler);
            musicVolume.addEventListener('input', this.musicVolumeHandler = (e) => {
                const volume = e.target.value;
                this.state.musicVolume = volume;
                musicVolumeDisplay.textContent = volume + '%';
                
                const backgroundMusic = document.getElementById('backgroundMusic');
                if (backgroundMusic) {
                    backgroundMusic.volume = volume / 100;
                }
                console.log('🔊 Music volume changed to:', volume + '%');
                this.saveState();
            });
        }
        
        // Sound Effects Toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.removeEventListener('change', this.soundToggleHandler);
            soundToggle.addEventListener('change', this.soundToggleHandler = (e) => {
                this.state.soundEffectsEnabled = e.target.checked;
                console.log('🔔 Sound effects toggled:', e.target.checked ? 'On' : 'Off');
                
                if (e.target.checked) {
                    this.playSound('correctSound');
                }
                this.saveState();
            });
        }
        
        // Sound Volume
        const soundVolume = document.getElementById('sound-volume');
        const soundVolumeDisplay = document.getElementById('sound-volume-display');
        if (soundVolume && soundVolumeDisplay) {
            soundVolume.removeEventListener('input', this.soundVolumeHandler);
            soundVolume.addEventListener('input', this.soundVolumeHandler = (e) => {
                const volume = e.target.value;
                this.state.soundVolume = volume;
                soundVolumeDisplay.textContent = volume + '%';
                console.log('🔊 Sound effects volume changed to:', volume + '%');
                this.saveState();
            });
        }
        
        // Animations Toggle
        const animationToggle = document.getElementById('animation-toggle');
        if (animationToggle) {
            animationToggle.removeEventListener('change', this.animationToggleHandler);
            animationToggle.addEventListener('change', this.animationToggleHandler = (e) => {
                this.state.animationsEnabled = e.target.checked;
                document.body.style.animation = e.target.checked ? 'auto' : 'none';
                console.log('✨ Animations toggled:', e.target.checked ? 'On' : 'Off');
                this.saveState();
            });
        }
        
        // Hints Toggle
        const hintsToggle = document.getElementById('hints-toggle');
        if (hintsToggle) {
            hintsToggle.removeEventListener('change', this.hintsToggleHandler);
            hintsToggle.addEventListener('change', this.hintsToggleHandler = (e) => {
                this.state.autoShowHints = e.target.checked;
                console.log('💡 Auto-show hints toggled:', e.target.checked ? 'On' : 'Off');
                this.saveState();
            });
        }
        
        // High Contrast Toggle
        const focusToggle = document.getElementById('focus-toggle');
        if (focusToggle) {
            focusToggle.removeEventListener('change', this.focusToggleHandler);
            focusToggle.addEventListener('change', this.focusToggleHandler = (e) => {
                this.state.highContrast = e.target.checked;
                if (e.target.checked) {
                    document.body.classList.add('high-contrast');
                } else {
                    document.body.classList.remove('high-contrast');
                }
                console.log('👁️ High contrast toggled:', e.target.checked ? 'On' : 'Off');
                this.saveState();
            });
            // Apply saved high contrast
            if (this.state.highContrast) {
                document.body.classList.add('high-contrast');
            }
        }
        
        // Reduce Motion Toggle
        const reduceMotion = document.getElementById('reduce-motion');
        if (reduceMotion) {
            reduceMotion.removeEventListener('change', this.reduceMotionHandler);
            reduceMotion.addEventListener('change', this.reduceMotionHandler = (e) => {
                this.state.reduceMotion = e.target.checked;
                if (e.target.checked) {
                    document.body.classList.add('reduce-motion');
                } else {
                    document.body.classList.remove('reduce-motion');
                }
                console.log('⚡ Reduce motion toggled:', e.target.checked ? 'On' : 'Off');
                this.saveState();
            });
            // Apply saved reduce motion
            if (this.state.reduceMotion) {
                document.body.classList.add('reduce-motion');
            }
        }
        
        // Reset Settings
        const resetBtn = document.getElementById('reset-settings-btn');
        if (resetBtn) {
            resetBtn.removeEventListener('click', this.resetSettingsHandler);
            resetBtn.addEventListener('click', this.resetSettingsHandler = (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to reset all settings to default?')) {
                    console.log('🔄 Resetting settings to default');
                    // Reset to defaults
                    document.body.classList.remove('dark-mode', 'high-contrast', 'reduce-motion');
                    document.documentElement.style.fontSize = '14px';
                    
                    // Update state
                    this.state.textSize = '14';
                    this.state.audioEnabled = true;
                    this.state.musicVolume = 30;
                    this.state.soundEffectsEnabled = true;
                    this.state.soundVolume = 70;
                    this.state.animationsEnabled = true;
                    this.state.autoShowHints = true;
                    this.state.highContrast = false;
                    this.state.reduceMotion = false;
                    
                    // Update UI
                    this.updateControlPanelState();
                    
                    // Clear localStorage
                    localStorage.setItem('grammar101-theme', 'light');
                    this.saveState();
                    
                    this.playSound('correctSound');
                    console.log('✅ Settings reset to default');
                }
            });
        }
        
        console.log('✅ Settings panel initialized successfully');
    },
};

// Start the app
App.init();