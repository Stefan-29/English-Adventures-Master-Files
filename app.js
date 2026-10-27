"use strict";

import { syncLocalProgressToSupabase } from './modules/progressSync.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing App');
    App.init();
});

const App = {
    state: {
        activeModule: 'learn',
        activeGrammarModule: null,  // Track which grammar module is active
        currentGrammarFilter: 'All', // Track current filter
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
    grammarModules: [],
    contentService: null,
    currentGrammarModuleId: null,  // Tracks current grammar module ID
    feedbackQueue: [],  // Queue for feedback messages
    feedbackActive: false,  // Track if feedback is currently showing
    feedbackReturnFocus: null,

    // ———————————————————— INIT ————————————————————
    init: function () {
        console.log('Initializing App');

        ImageService.init()
            .then(() => {
                console.log('[Image] Image service ready');
                return this.loadGrammarModules();
            })
            .then(modules => {
                this.grammarModules = modules;
                this.renderGrammarSelector();
                this.prepareTopicLanding();
                this.loadState();
                this.loadSoundPreference();
                this.setupEventListeners();
                this.updateUI();
                void syncLocalProgressToSupabase();
            })
            .catch(err => {
                console.error('Topic index initialization failed:', err?.message || 'unknown');
                this.renderTopicIndexError();
            });
    },

    // ———————————————————— GET GROUP FOR MODULE ————————————————————
    // ADD GROUPS HERE TO AUTOMATICALLY ORGANIZE MODULES IN THE UI. NEW MODULES DEFAULT TO "Other" GROUP.
    getGroup: function (moduleName) {
        // Define groups here. Add new groups or modify existing ones as needed.
        // Format: "Group Name": ["module-id-1", "module-id-2", ...]
        const groups = {
            "ARTICLES & DETERMINERS": [
                'a-an-the',
                'a-lot-of-much-many',
                'some-any-a-little-a-few',
                'few-little',
                'each-every',
                'other-another',
                'this-that-these-those',
                'everyone-vs-every-one',
                'each-other-one-another-ourselves',
                'countable-vs-uncountable-nouns'
            ],
            "NOUNS & PLURALS": [
                'adjectives-as-nouns',
                'nouns-countable-plural',
                'nouns-compound-collective'
            ],
            "ADJECTIVES MASTERY": [
                'adjective-order',
                'comparatives-superlatives',
                'compound-adjectives',
                'descriptive-adjectives',
                'ing-ed-adjectives'
            ],
            "ADVERBS & FREQUENCY": [
                'adverbs-formation-position',
                'already-still-yet-always',
                'also-too-as-well'
            ],
            "VERB TENSES – PRESENT": [
                'present-tenses',
                'present-perfect'
            ],
            "VERB TENSES – PAST": [
                'past-tenses',
                'past-perfect'
            ],
            "FUTURE TENSES": [
                'future-tenses',
                'future-perfect'
            ],
            "MODAL VERBS": [
                'can-could-be-able-to',
                'must-have-to-have-got-to',
                'shall-will-would-had-better',
                'should-ought-to',
                'may-might'
            ],
            "CONDITIONALS & WISH": [
                'conditional-structures',
                'wish-if-if-only',
                'if-alternatives',
                'subjunctive-mood'
            ],
            "GERUNDS & INFINITIVES": [
                'gerund-vs-infinitive',
                'after-certain-verbs',
                'bare-infinitive'
            ],
            "PASSIVE VOICE & CAUSATIVE": [
                'passive-voice',
                'causative-verbs'
            ],
            "PREPOSITIONS & PHRASAL EXPRESSIONS": [
                'time-prepositions',
                'position-direction-location-prepositions',
                'prepositional-phrases',
                'of-from-prepositions'
            ],
            "CONNECTORS & LINKING WORDS": [
                'conjunctions',
                'although-despite',
                'as-when-while',
                'linking-words'
            ],
            "RELATIVE CLAUSES & PRONOUNS": [
                'relative-clauses',
                'relative-pronouns',
                'defining-non-defining-clauses',
                'who-whom-which-that'
            ],
            "QUESTION FORMATION": [
                'question-tags',
                'whether-if'
            ],
            "REPORTED SPEECH": [
                'reported-speech',
                'indirect-speech',
                'backshift-tenses',
                'reported-time-place'
            ],
            "CONFUSING WORDS & FALSE FRIENDS": [
                'confusable-pairs',
                'confused-action-verbs',
                'confused-descriptive-words',
                'confused-nouns-phrases'
            ],
            "WORD FORMATION": [
                'prefixes-negative-prefixes',
                'suffixes',
                'compound-words',
                'word-forms'
            ],
            "MISCELLANEOUS GRAMMAR": [
                // 'inversion',
                // 'apostrophes',
                // 'possessives',
                // 'there-their-theyre',
                // 'i-or-me',
                // 'subject-verb-agreement',
                // 'silent-letters'
            ],
            "STYLE & EXPRESSION": [
                // 'double-comparatives',
                // 'similes-metaphors',
                // 'rather-prefer-had-better',
                // 'whatever-whenever-wherever',
                // 'even-though-if-so-when'
            ],
            "SPORTS & ACTIVITIES VERBS": [
                // 'play-go-do'
            ]
        };

        for (const [group, modules] of Object.entries(groups)) {
            if (modules.includes(moduleName)) return group;
        }
        return 'Other'; // Default group for new modules
    },

    // ———————————————————— LOAD PUBLIC TOPIC INDEX ————————————————————
    loadGrammarModules: async function () {
        // Keep the familiar curated topic order; Postgres remains the source of visibility.
        const moduleNames = [
            /* ============ ARTICLES & DETERMINERS ============ */
            'a-an-the',
            'a-lot-of-much-many',
            'some-any-a-little-a-few',
            'few-little',
            'each-every',
            'other-another',
            'this-that-these-those',
            'everyone-vs-every-one',
            'each-other-one-another-ourselves',
            'countable-vs-uncountable-nouns',

            /* ============ NOUNS & PLURALS ============ */
            'adjectives-as-nouns',
            'nouns-countable-plural',
            'nouns-compound-collective',

            /* ============ ADJECTIVES MASTERY ============ */
            'adjective-order',
            'comparatives-superlatives',
            'compound-adjectives',
            'descriptive-adjectives',
            'ing-ed-adjectives',

            /* ============ ADVERBS & FREQUENCY ============ */
            'adverbs-formation-position',
            'already-still-yet-always',
            'also-too-as-well',

            /* ============ VERB TENSES – PRESENT ============ */
            'present-tenses',
            'present-perfect',

            /* ============ VERB TENSES – PAST ============ */
            'past-tenses',
            'past-perfect',

            /* ============ FUTURE TENSES ============ */
            'future-tenses',
            'future-perfect',

            /* ============ MODAL VERBS ============ */
            'can-could-be-able-to',
            'must-have-to-have-got-to',
            'shall-will-would-had-better',
            'should-ought-to',
            'may-might',

            /* ============ CONDITIONALS & WISH ============ */
            'conditional-structures',
            'wish-if-if-only',
            'if-alternatives',
            'subjunctive-mood',

            /* ============ GERUNDS & INFINITIVES ============ */
            'gerund-vs-infinitive',
            'after-certain-verbs',
            'bare-infinitive',

            /* ============ PASSIVE VOICE & CAUSATIVE ============ */
            'passive-voice',
            'causative-verbs',

            /* ============ PREPOSITIONS & PHRASAL EXPRESSIONS ============ */
            'time-prepositions',
            'position-direction-location-prepositions',
            'prepositional-phrases',
            'of-from-prepositions',

            /* ============ NEW MODULES (COMMENTED - NO CONTENT YET) ============ */

            // CONNECTORS & LINKING WORDS
            'conjunctions',
            'although-despite',
            'as-when-while',
            'linking-words',

            // RELATIVE CLAUSES & PRONOUNS
            'relative-clauses',
            'relative-pronouns',
            'defining-non-defining-clauses',
            'who-whom-which-that',

            // QUESTION FORMATION
            'question-tags',
            'whether-if',

            // REPORTED SPEECH
            'reported-speech',
            'indirect-speech',
            'backshift-tenses',
            'reported-time-place',

            // CONFUSING WORDS & FALSE FRIENDS
            'confusable-pairs',
            'confused-action-verbs',
            'confused-descriptive-words',
            'confused-nouns-phrases',

            // WORD FORMATION
            "prefixes-negative-prefixes",            
            'suffixes',
            'compound-words',
            'word-forms'

            // MISCELLANEOUS GRAMMAR
            // 'inversion',
            // 'apostrophes',
            // 'possessives',
            // 'there-their-theyre',
            // 'i-or-me',
            // 'subject-verb-agreement',
            // 'silent-letters',

            // STYLE & EXPRESSION
            // 'double-comparatives',
            // 'similes-metaphors',
            // 'rather-prefer-had-better',
            // 'whatever-whenever-wherever',
            // 'even-though-if-so-when',

            // SPORTS & ACTIVITIES VERBS
            // 'play-go-do'
        ];

        const { ContentService } = await import('./modules/contentService.js');
        const { WHATSAPP_NUMBER } = await import('./supabase-config.js');
        this.contentService = ContentService;
        this.whatsappNumber = WHATSAPP_NUMBER;
        const topics = await ContentService.listTopics();
        const topicOrder = new Map(moduleNames.map((id, index) => [id, index]));
        return topics
            .sort((left, right) => (topicOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER)
                - (topicOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))
            .map(topic => ({
            id: topic.id,
            name: topic.title,
            description: topic.description,
            is_free: topic.is_free,
            group: topic.tense_group && topic.tense_group !== 'other'
                ? topic.tense_group
                : this.getGroup(topic.id)
            }));
    },

    setLearningVisibility: function (visible) {
        for (const selector of [
            '.progress-container',
            '.rewards-wrapper',
            '.module-navigation',
            '.modules-wrapper',
            '.word-bank-container',
            '.control-panel-wrapper'
        ]) {
            const element = document.querySelector(selector);
            if (element) element.hidden = !visible;
        }
        if (!visible) document.getElementById('check-all-button')?.remove();
    },

    prepareTopicLanding: function () {
        this.currentGrammarModuleId = null;
        this.config = null;
        this.setLearningVisibility(false);
        document.getElementById('site-title').textContent = 'English Adventures';
        document.getElementById('lesson-title').textContent = 'Pilih topik untuk melihat akses dan mulai belajar.';
        document.title = 'English Adventures — Pilih topik';
    },

    renderTopicIndexError: function () {
        this.prepareTopicLanding();
        const container = document.getElementById('grammar-buttons');
        if (!container) return;
        container.replaceChildren();
        const message = document.createElement('p');
        message.className = 'topic-state-message';
        message.textContent = 'Daftar topik belum dapat dimuat. Periksa konfigurasi layanan, lalu muat ulang halaman.';
        container.appendChild(message);
    },

    renderTopicAccessState: function (topic, error) {
        this.setLearningVisibility(false);
        document.querySelector('.modules-wrapper').hidden = false;
        const container = document.getElementById('modules-container');
        container.replaceChildren();

        const card = document.createElement('section');
        card.className = 'topic-access-card';
        card.setAttribute('aria-live', 'polite');
        const title = document.createElement('h2');
        title.textContent = topic.name;
        const message = document.createElement('p');
        const code = error?.code;
        let nextAction = 'retry';
        const authenticationRequired = error?.status === 401
            || code === 'VERIFIED_ACCOUNT_REQUIRED'
            || code === 'ACCOUNT_NOT_ACTIVE';

        if (code === 'OWNER_MFA_REQUIRED') {
            message.textContent = 'Akun pemilik harus menyelesaikan verifikasi dua langkah sebelum membuka materi.';
            nextAction = 'login';
        } else if (authenticationRequired && topic.is_free) {
            message.textContent = 'Masuk dengan akun yang aktif dan terverifikasi untuk membuka topik gratis ini.';
            nextAction = 'login';
        } else if (error?.status === 403 || code === 'TOPIC_LOCKED' || (authenticationRequired && !topic.is_free)) {
            message.textContent = 'Topik ini terkunci. Upgrade akses atau hubungi guru untuk daftar.';
            nextAction = 'upgrade';
        } else if (code === 'RATE_LIMITED' || error?.status === 429) {
            message.textContent = 'Terlalu banyak permintaan. Tunggu sebentar, lalu coba lagi.';
        } else {
            message.textContent = 'Materi belum dapat dimuat. Silakan coba lagi nanti.';
        }

        const actions = document.createElement('div');
        actions.className = 'topic-access-card__actions';
        if (nextAction === 'login') {
            const login = document.createElement('a');
            login.className = 'topic-access-card__button';
            login.href = 'auth.html';
            login.textContent = 'Masuk / Daftar';
            actions.appendChild(login);
        } else if (nextAction === 'upgrade') {
            if (authenticationRequired) {
                const login = document.createElement('a');
                login.href = 'auth.html';
                login.textContent = 'Masuk / Daftar';
                actions.appendChild(login);
            }
            const upgrade = document.createElement('a');
            upgrade.className = 'topic-access-card__button';
            upgrade.href = `auth.html?upgrade=${encodeURIComponent(topic.id)}`;
            upgrade.textContent = 'Upgrade';
            actions.appendChild(upgrade);

            const phone = String(this.whatsappNumber || '').replace(/\D/g, '');
            if (phone.length >= 8 && phone.length <= 15) {
                const contact = document.createElement('a');
                contact.href = `https://wa.me/${phone}`;
                contact.target = '_blank';
                contact.rel = 'noopener noreferrer';
                contact.textContent = 'Hubungi guru untuk daftar';
                actions.appendChild(contact);
            } else {
                const contact = document.createElement('span');
                contact.textContent = 'Hubungi guru untuk daftar';
                actions.appendChild(contact);
            }
        } else {
            const retry = document.createElement('button');
            retry.type = 'button';
            retry.className = 'topic-access-card__button';
            retry.textContent = 'Coba lagi';
            retry.addEventListener('click', () => this.switchGrammar(topic));
            actions.appendChild(retry);
        }

        card.append(title, message, actions);
        container.appendChild(card);
    },

    // ———————————————————— RENDER GRAMMAR SELECTOR ————————————————————
    renderGrammarSelector: function () {
        const filtersContainer = document.getElementById('grammar-filters');
        const buttonsContainer = document.getElementById('grammar-buttons');

        if (!filtersContainer || !buttonsContainer) {
            console.error('Grammar selector containers not found!');
            return;
        }

        // Clear existing content
        filtersContainer.innerHTML = '';
        buttonsContainer.innerHTML = '';

        // Group modules by their group
        const grouped = {};
        this.grammarModules.forEach(mod => {
            if (!grouped[mod.group]) grouped[mod.group] = [];
            grouped[mod.group].push(mod);
        });

        // Create filter buttons
        const filterButtons = ['All', ...Object.keys(grouped)];
        filterButtons.forEach((filter, index) => {
            const filterBtn = document.createElement('button');
            filterBtn.className = 'grammar-filter-btn';
            if (filter === this.state.currentGrammarFilter) filterBtn.classList.add('active');
            filterBtn.textContent = filter;
            filterBtn.dataset.filter = filter;

            filterBtn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.setGrammarFilter(filter);
            };

            filtersContainer.appendChild(filterBtn);
        });

        // Render modules based on current filter
        const modulesToShow = this.state.currentGrammarFilter === 'All'
            ? this.grammarModules
            : grouped[this.state.currentGrammarFilter] || [];

        if (modulesToShow.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'topic-state-message';
            empty.textContent = 'Belum ada topik yang tersedia.';
            buttonsContainer.appendChild(empty);
        }

        modulesToShow.forEach((mod, i) => {
            const btn = document.createElement('button');
            btn.className = 'grammar-btn';
            if (mod.id === this.currentGrammarModuleId) btn.classList.add('active');
            btn.dataset.id = mod.id;
            btn.setAttribute('aria-label', `${mod.name}, ${mod.is_free ? 'topik gratis' : 'topik terkunci'}`);

            const title = document.createElement('span');
            title.className = 'topic-card__title';
            title.textContent = mod.name;
            const description = document.createElement('span');
            description.className = 'topic-card__description';
            description.textContent = mod.description;
            const access = document.createElement('span');
            access.className = `topic-card__access${mod.is_free ? ' is-free' : ''}`;
            access.textContent = mod.is_free ? 'Gratis' : 'Terkunci';
            btn.append(title, description, access);

            btn.onclick = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.switchGrammar(mod);
            };

            buttonsContainer.appendChild(btn);
        });

        console.log('Grammar selector rendered with filters');
    },

    // ———————————————————— SET GRAMMAR FILTER ————————————————————
    setGrammarFilter: function (filter) {
        console.log('Setting grammar filter to:', filter);
        this.state.currentGrammarFilter = filter;
        localStorage.setItem('englishAdventuresGrammarFilter', filter);

        // Update active filter button
        document.querySelectorAll('.grammar-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.grammar-filter-btn[data-filter="${filter}"]`)?.classList.add('active');

        // Re-render the grammar selector to show filtered modules
        this.renderGrammarSelector();
    },
    // ———————————————————— SWITCH GRAMMAR ————————————————————
    switchGrammar: function (moduleInfo) {
        // Store the new grammar module ID (persist across refreshes)
        this.currentGrammarModuleId = moduleInfo.id;
        this.state.activeGrammarModule = moduleInfo.id;
        localStorage.setItem('englishAdventuresCurrentGrammarModule', moduleInfo.id);

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
                this.setLearningVisibility(true);
                this.initializePage();
                this.createStickyCheckAllButton();
                this.initSoundControl();
                this.setupNavigationListeners();
                this.setupModeButtons();
                setTimeout(() => this.refreshModules(), 100);
                this.recalculateModuleStars();
                this.updateUI();
                this.renderGrammarSelector(); // Re-render to update active states
            })
            .catch(err => {
                console.error('Topic content request failed:', err?.code || err?.status || 'unknown');
                this.renderTopicAccessState(moduleInfo, err);
            })
            .finally(() => {
                const loading = document.getElementById('loading-screen');
                if (loading) loading.remove();
            });
    },
    // ———————————————————— LOAD CONFIG + DATA ————————————————————
    loadConfigAndData: async function (moduleInfo) {
        const content = await this.contentService.getLesson(moduleInfo.id);
        this.config = content.config;
        document.title = content.config.siteSettings.title;
        document.getElementById('favicon').href = content.config.siteSettings.favicon || 'favicon.ico';
        await this.loadData(content.data);
    },

    // ———————————————————— LOAD ACTUAL ACTIVITIES ————————————————————
    loadData: async function (data) {
        if (!data || typeof data !== 'object') throw new Error('Invalid topic content response.');
        WritingModule.init(data.writingActivities || []);
        GameModule.init(data.gameActivities || []);
        QuizModule.init(data.quizActivities || []);
        SpellingHelper.init(data.spellingActivities || []);
        LessonModule.init(data.lessonActivities || []);
        RewardSystem.init(data.rewards || {});
        this.calculateProgress();
    },

    // ———————————————————— PAGE SETUP ————————————————————
    // Strip emoji characters and tidy whitespace from a string.
    // Used to keep displayed titles clean (lesson data may contain emojis).
    stripEmojis: function (str) {
        if (!str) return str;
        // Remove emoji pictographs, modifiers, variation selectors, and ZWJ sequences
        const cleaned = String(str)
            // Emoji + symbols + pictographs
            .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{1F1E6}-\u{1F1FF}]/gu, '')
            // Variation selectors and ZWJ
            .replace(/[\uFE0F\u200D\uFE0E]/g, '')
            // Collapse double spaces / leading-trailing whitespace
            .replace(/\s+/g, ' ')
            .trim();
        return cleaned;
    },

    initializePage: function () {
        if (!this.config) return console.error('Config missing');

        document.getElementById('site-title').textContent = this.config.siteSettings.title.split(':')[0].trim();
        document.getElementById('lesson-title').textContent = this.stripEmojis(this.config.lesson.title);

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

        // Inline SVG icons (Lucide-style, 1.5px stroke) — no emojis
        const svg = {
            learn: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
            play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.152A4 4 0 0 0 17.32 5z"/></svg>',
            write: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
            quiz: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
            game: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>',
            writing: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a1 1 0 0 1-.326.214L4 20l.6-2.455a1 1 0 0 1 .214-.326z"/></svg>',
            spelling: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>'
        };

        // Create main navigation buttons: Learn, Play, Write
        const mainModules = [
            { id: 'learn', name: 'Learn', icon: svg.learn },
            { id: 'play', name: 'Play', icon: svg.play },
            { id: 'write', name: 'Write', icon: svg.write }
        ];

        mainModules.forEach((m, i) => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn' + (i === 0 ? ' active' : '');
            btn.dataset.section = m.id;
            btn.innerHTML = `<span class="nav-icon" aria-hidden="true">${m.icon}</span><span>${m.name}</span>`;

            btn.addEventListener('click', () => this.switchModule(m.id));
            nav.appendChild(btn);
        });
    },

    createModuleSections: function () {
        const container = document.getElementById('modules-container');
        if (!container) return console.error('modules-container not found');

        container.innerHTML = '';

        // Define simplified module structure: Learn, Play (with sub-modes), Write
        const moduleIcons = {
            learn: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>',
            play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" x2="10" y1="11" y2="11"/><line x1="8" x2="8" y1="9" y2="13"/><line x1="15" x2="15.01" y1="12" y2="12"/><line x1="18" x2="18.01" y1="10" y2="10"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.152A4 4 0 0 0 17.32 5z"/></svg>',
            write: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>',
            quiz: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
            game: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>',
            writing: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a1 1 0 0 1-.326.214L4 20l.6-2.455a1 1 0 0 1 .214-.326z"/></svg>',
            spelling: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>'
        };

        const simplifiedModules = [
            {
                mainId: 'learn',
                mainTitle: 'Learn',
                mainIcon: moduleIcons.learn,
                mainInstructions: 'Master the grammar rules and concepts through clear, structured lessons.',
                subModules: [
                    { id: 'lesson-module', internalTitle: 'Lessons' }
                ]
            },
            {
                mainId: 'play',
                mainTitle: 'Play',
                mainIcon: moduleIcons.play,
                mainInstructions: 'Learn through interactive games and quizzes. Pick a mode to begin.',
                gameModes: [
                    { id: 'quiz', icon: moduleIcons.quiz, label: 'Multiple Choice', description: 'Test your knowledge' },
                    { id: 'game', icon: moduleIcons.game, label: 'Drag & Drop', description: 'Interactive drag activities' }
                ],
                subModules: [
                    { id: 'quiz-module', internalTitle: 'Multiple Choice' },
                    { id: 'game-module', internalTitle: 'Drag & Drop' }
                ]
            },
            {
                mainId: 'write',
                mainTitle: 'Write',
                mainIcon: moduleIcons.write,
                mainInstructions: 'Practice writing with guided activities. Pick a mode to begin.',
                writingModes: [
                    { id: 'writing', icon: moduleIcons.writing, label: 'Sentence Building', description: 'Write complete sentences' },
                    { id: 'spelling', icon: moduleIcons.spelling, label: 'Spelling Practice', description: 'Practice spelling words' }
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
                <div class="module__head">
                    <span class="module__icon" aria-hidden="true">${main.mainIcon}</span>
                    <div class="module__heading">
                        <h3>${main.mainTitle}</h3>
                        <div class="module-instructions">${main.mainInstructions}</div>
                    </div>
                </div>
            `;

            // Add game mode buttons for Play section
            if (main.gameModes) {
                htmlContent += `<div class="module-modes">`;
                main.gameModes.forEach(mode => {
                    htmlContent += `
                        <button class="game-mode-tag" data-game-mode="${mode.id}" title="${mode.description}">
                            <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
                            <span class="mode-label">${mode.label}</span>
                        </button>
                    `;
                });
                htmlContent += `</div>`;
            }

            // Add writing mode buttons for Write section
            if (main.writingModes) {
                htmlContent += `<div class="module-modes">`;
                main.writingModes.forEach(mode => {
                    htmlContent += `
                        <button class="writing-mode-tag" data-writing-mode="${mode.id}" title="${mode.description}">
                            <span class="mode-icon" aria-hidden="true">${mode.icon}</span>
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

    createStickyCheckAllButton: function () {
        document.getElementById('check-all-button')?.remove();
        const checkAllButton = document.createElement('button');
        checkAllButton.id = 'check-all-button';
        checkAllButton.className = 'sticky-check-all-btn';
        checkAllButton.innerHTML = ' Check All Answers';
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
            console.log(' Found reset-progress button, attaching listener');
            resetBtn.replaceWith(resetBtn.cloneNode(true));
            const newResetBtn = document.getElementById('reset-progress');
            newResetBtn.disabled = false;
            newResetBtn.style.pointerEvents = 'auto';
            newResetBtn.addEventListener('click', (e) => {
                console.log('🚨 Reset Progress button clicked:', e.target.outerHTML);
                e.stopPropagation();
                e.preventDefault();
                if (confirm('Are you sure you want to reset ALL progress? This cannot be undone.')) {
                    console.log(' Reset confirmed');
                    this.resetProgress();
                } else {
                    console.log('🚫 Reset cancelled');
                }
            }, { capture: false });
        } else {
            console.error(' Reset Progress button not found in DOM');
        }

        const feedbackModal = document.getElementById('feedback-modal');
        const closeModalBtn = document.querySelector('.modal-close-btn');
        const feedbackContinue = document.getElementById('feedback-continue');
        const modalBackdrop = feedbackModal?.querySelector('.feedback-modal__backdrop');

        if (closeModalBtn) {
            closeModalBtn.removeEventListener('click', this.closeModalHandler);
            closeModalBtn.addEventListener('click', this.closeModalHandler = (e) => {
                console.log('🚪 Closing feedback modal via close button');
                e.stopPropagation();
                this.closeFeedback();
            }, { capture: false });
        }

        if (feedbackContinue) {
            console.log(' Found feedback-continue button, attaching listener');
            feedbackContinue.removeEventListener('click', this.feedbackContinueHandler);
            feedbackContinue.disabled = false;
            feedbackContinue.style.pointerEvents = 'auto';
            feedbackContinue.addEventListener('click', this.feedbackContinueHandler = (e) => {
                console.log('🚪 Closing feedback modal via continue button');
                e.stopPropagation();
                this.closeFeedback();
            }, { capture: false });
        } else {
            console.error(' feedback-continue button not found in DOM');
        }

        if (modalBackdrop) {
            modalBackdrop.removeEventListener('click', this.backdropClickHandler);
            modalBackdrop.addEventListener('click', this.backdropClickHandler = (e) => {
                if (e.target === modalBackdrop) {
                    this.closeFeedback();
                }
            }, { capture: false });
        }

        if (feedbackModal) {
            feedbackModal.removeEventListener('keydown', this.feedbackKeydownHandler);
            feedbackModal.addEventListener('keydown', this.feedbackKeydownHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.closeFeedback();
                    return;
                }

                if (e.key !== 'Tab') return;
                const focusable = Array.from(feedbackModal.querySelectorAll(
                    'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
                )).filter(element => element.getAttribute('aria-hidden') !== 'true');
                if (!focusable.length) {
                    e.preventDefault();
                    feedbackModal.focus();
                    return;
                }

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            });
        }

        const toggleSoundEffectsBtn = document.getElementById('toggleSoundEffects');
        if (toggleSoundEffectsBtn) {
            console.log(' Found toggleSoundEffects button, attaching listener');
            toggleSoundEffectsBtn.removeEventListener('click', this.soundEffectsToggleHandler);
            toggleSoundEffectsBtn.addEventListener('click', this.soundEffectsToggleHandler = (e) => {
                e.stopPropagation();
                console.log('🎛️ toggleSoundEffects clicked:', toggleSoundEffectsBtn.outerHTML);
                this.state.soundEffectsEnabled = !this.state.soundEffectsEnabled;
                console.log(' Sound effects toggle:', this.state.soundEffectsEnabled ? 'Enabled' : 'Disabled');
                const soundEffectIcon = document.getElementById('soundEffectIcon');
                if (soundEffectIcon) {
                    soundEffectIcon.className = this.state.soundEffectsEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';
                    console.log(' Updated soundEffectIcon to:', soundEffectIcon.className);
                } else {
                    console.error(' soundEffectIcon not found');
                }
                this.saveState();
                // Test sound effect on toggle (if enabled)
                if (this.state.soundEffectsEnabled) {
                    console.log(' Testing sound effect on toggle');
                    this.playSound('correctSound');
                }
            }, { capture: false });
        } else {
            // toggleSoundEffects button not present in this build — skipping silently.
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
            console.log(' Elements found, setting up toggle');

            // Load saved state from localStorage
            const rewardsCollapsed = localStorage.getItem('rewardsCollapsed') === 'true';
            if (rewardsCollapsed) {
                rewardsContainer.classList.add('collapsed');
                toggleRewardsBtn.classList.add('collapsed');
                toggleRewardsBtn.setAttribute('aria-expanded', 'false');
                console.log(' Restored collapsed state from localStorage');
            } else {
                toggleRewardsBtn.setAttribute('aria-expanded', 'true');
            }

            // Define the toggle handler function
            const handleToggleClick = (e) => {
                console.log('🖱️ Toggle button clicked');
                console.log('🖱️ Event target:', e.target);
                console.log('🖱️ Event currentTarget:', e.currentTarget);
                const isCollapsed = rewardsContainer.classList.toggle('collapsed');
                toggleRewardsBtn.classList.toggle('collapsed', isCollapsed);
                toggleRewardsBtn.setAttribute('aria-expanded', String(!isCollapsed));
                localStorage.setItem('rewardsCollapsed', isCollapsed);
                console.log(' Rewards toggled. Collapsed:', isCollapsed);
            };

            toggleRewardsBtn.removeEventListener('click', this.toggleRewardsHandler);
            toggleRewardsBtn.addEventListener('click', this.toggleRewardsHandler = handleToggleClick);
        } else {
            console.log(' Elements not found - toggleRewardsBtn:', !!toggleRewardsBtn, 'rewardsContainer:', !!rewardsContainer);
        }

        // Toggle Modules (Learning Activities) - Same pattern as rewards
        const toggleModulesBtn = document.getElementById('toggle-modules');
        const modulesContainer = document.getElementById('modules-container');

        console.log('🔍 DEBUG - toggleModulesBtn:', toggleModulesBtn);
        console.log('🔍 DEBUG - modulesContainer:', modulesContainer);
        console.log('🔍 DEBUG - toggleModulesBtn computed style pointer-events:', toggleModulesBtn ? window.getComputedStyle(toggleModulesBtn).pointerEvents : 'N/A');
        console.log('🔍 DEBUG - toggleModulesBtn z-index:', toggleModulesBtn ? window.getComputedStyle(toggleModulesBtn).zIndex : 'N/A');

        if (toggleModulesBtn && modulesContainer) {
            console.log(' Modules elements found, setting up toggle');

            // Load saved state from localStorage
            const modulesCollapsed = localStorage.getItem('modulesCollapsed') === 'true';
            if (modulesCollapsed) {
                modulesContainer.classList.add('collapsed');
                toggleModulesBtn.classList.add('collapsed');
                toggleModulesBtn.setAttribute('aria-expanded', 'false');
                console.log(' Restored collapsed state for modules from localStorage');
            } else {
                toggleModulesBtn.setAttribute('aria-expanded', 'true');
            }

            // Define the toggle handler function
            const handleModulesToggleClick = (e) => {
                console.log('🖱️ Modules toggle button clicked');
                console.log('🖱️ Event target:', e.target);
                console.log('🖱️ Event currentTarget:', e.currentTarget);
                const isCollapsed = modulesContainer.classList.toggle('collapsed');
                toggleModulesBtn.classList.toggle('collapsed', isCollapsed);
                toggleModulesBtn.setAttribute('aria-expanded', String(!isCollapsed));
                localStorage.setItem('modulesCollapsed', isCollapsed);
                console.log(' Modules toggled. Collapsed:', isCollapsed);
            };

            toggleModulesBtn.removeEventListener('click', this.toggleModulesHandler);
            toggleModulesBtn.addEventListener('click', this.toggleModulesHandler = handleModulesToggleClick);
        } else {
            console.log(' Modules elements not found - toggleModulesBtn:', !!toggleModulesBtn, 'modulesContainer:', !!modulesContainer);
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
        this.updateCheckAllButton();
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
        this.updateCheckAllButton();
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
        localStorage.setItem('englishAdventuresActiveModule', moduleId);

        // Show check-all button only for non-lesson modules
        const checkAllButton = document.getElementById('check-all-button');
        const activeSubModule = section.querySelector('.sub-module.active');
        if (checkAllButton) {
            checkAllButton.style.display = activeSubModule && activeSubModule.id !== 'lesson-module' ? 'flex' : 'none';
        }

        this.saveState();
        this.updateUI();
        this.updateCheckAllButton();
    },

    showFeedback: function (title, message, _icon = null, type = 'info', returnFocus = document.activeElement) {
        // Add to queue
        this.feedbackQueue.push({ title, message, type });

        // Process queue if not already processing
        if (!this.feedbackActive) {
            this.feedbackReturnFocus = returnFocus;
            this.processFeedbackQueue();
        }
    },

    processFeedbackQueue: function () {
        if (this.feedbackQueue.length === 0) {
            this.feedbackActive = false;
            const returnFocus = this.feedbackReturnFocus;
            this.feedbackReturnFocus = null;
            if (returnFocus?.isConnected && !returnFocus.disabled && returnFocus.matches?.('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')) {
                returnFocus.focus();
            } else {
                const activityCard = returnFocus?.matches?.('.activity-card')
                    ? returnFocus
                    : returnFocus?.closest?.('.activity-card');
                if (activityCard?.isConnected) {
                    activityCard.tabIndex = -1;
                    activityCard.focus();
                }
            }
            return;
        }

        this.feedbackActive = true;
        const { title, message, type } = this.feedbackQueue.shift();

        const feedbackModal = document.getElementById('feedback-modal');
        const feedbackTitle = document.getElementById('feedback-title');
        const feedbackMessage = document.getElementById('feedback-message');
        const feedbackStateIcon = document.getElementById('feedback-state-icon');
        const feedbackContinue = document.getElementById('feedback-continue');

        if (!feedbackModal || !feedbackTitle || !feedbackMessage || !feedbackContinue || !feedbackStateIcon) {
            throw new Error('Feedback dialog markup is incomplete.');
        }

        // RENDER HTML (bold, italic, etc.)
        feedbackTitle.innerHTML = title;
        feedbackMessage.innerHTML = message;

        const feedbackType = ['success', 'error', 'info'].includes(type) ? type : 'info';
        feedbackModal.dataset.feedbackType = feedbackType;
        if (feedbackType === 'success') {
            const moduleId = this.currentGrammarModuleId
                || localStorage.getItem('englishAdventuresCurrentGrammarModule')
                || 'legacy';
            const moduleStars = this.state.moduleStars[moduleId] || 0;
            const earnedBadges = (this.state.rewards.badges || []).filter(b => b.moduleId === moduleId);
            feedbackMessage.insertAdjacentHTML('beforeend', `
                <div class="feedback-rewards-info">
                    <div class="feedback-stars">${moduleStars} stars earned</div>
                    <div class="feedback-badges">${earnedBadges.length} badges earned</div>
                </div>
            `);
        }

        // Enable continue
        feedbackContinue.disabled = false;
        feedbackContinue.style.pointerEvents = 'auto';

        // Show modal with animation
        feedbackModal.setAttribute('aria-hidden', 'false');
        feedbackModal.classList.add('show');
        feedbackContinue.focus();
    },

    closeFeedback: function () {
        const feedbackModal = document.getElementById('feedback-modal');
        if (!feedbackModal?.classList.contains('show')) return;
        feedbackModal.classList.remove('show');
        feedbackModal.setAttribute('aria-hidden', 'true');

        if (this.feedbackQueue.length) {
            setTimeout(() => this.processFeedbackQueue(), 300);
        } else {
            this.processFeedbackQueue();
        }
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
        console.log(' Sound control initialized (background music control now integrated in control panel)');
    },

    playSound: function (soundId) {
        console.log(` Attempting to play sound: ${soundId}`);
        if (!this.state.soundEffectsEnabled && soundId !== 'backgroundMusic') {
            console.log(` Sound effect ${soundId} muted`);
            return;
        }
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.currentTime = 0;
            // Set sound effects volume
            sound.volume = (this.state.soundVolume || 70) / 100;
            sound.play().catch(e => {
                console.warn(` Failed to play sound ${soundId}:`, e);
            });
        } else {
            console.error(` Audio element with ID ${soundId} not found`);
        }
    },

    updateHint: function (hintText) {
        const hintElement = document.getElementById('hint-text');
        hintElement.innerHTML = `<strong> Hint:</strong> ${hintText || 'No hint available'}`;
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

        // Prevent duplicate rewards for activities that are already complete.
        if (this.state.completedActivities[moduleId][id] === 'completed') return;

        // Mark as completed in this module with status
        this.state.completedActivities[moduleId][id] = status;
        this.calculateProgress();

        // Only award stars for correct answers
        if (status === 'completed') {
            RewardSystem.awardStar();
        }

        this.updateUI();
        this.updateCheckAllButton();
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
                console.warn(' Attempted to save empty completedActivities, skipping save');
                return;
            }
            console.log('🔍 SAVING - completedActivities:', JSON.stringify(stateToSave.completedActivities));
            localStorage.setItem('englishAdventuresState', JSON.stringify(stateToSave));
            void syncLocalProgressToSupabase();
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

                    // Restore the last active module (lesson/write/play) if saved
                    const savedActiveModule = localStorage.getItem('englishAdventuresActiveModule');
                    if (savedActiveModule) {
                        this.state.activeModule = savedActiveModule;
                        console.log(' Restored active module from localStorage:', savedActiveModule);
                    }

                    if (this.config) this.switchModule(this.state.activeModule || 'writing-module');

                    // Restore the last selected grammar filter (All / Advanced Grammar / etc.)
                    const savedGrammarFilter = localStorage.getItem('englishAdventuresGrammarFilter') || parsedState.currentGrammarFilter;
                    if (savedGrammarFilter) {
                        this.state.currentGrammarFilter = savedGrammarFilter;
                        console.log(' Restored grammar filter from localStorage:', savedGrammarFilter);
                        this.setGrammarFilter(savedGrammarFilter);
                    }

                    // Restore the last selected grammar module if saved
                    const savedGrammarModule = parsedState.activeGrammarModule || localStorage.getItem('englishAdventuresCurrentGrammarModule');
                    if (this.config && savedGrammarModule && savedGrammarModule !== this.currentGrammarModuleId) {
                        const moduleInfo = this.grammarModules.find(m => m.id === savedGrammarModule);
                        if (moduleInfo) {
                            console.log(' Restoring saved grammar module:', savedGrammarModule);
                            this.switchGrammar(moduleInfo);
                        }
                    }

                    if (this.config) {
                        this.calculateProgress();
                        this.refreshModules();
                        RewardSystem.checkAllBadgeConditions();
                    }
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

        // If the user has an active module saved, restore it even if the full state wasn't saved
        const savedActiveModule = localStorage.getItem('englishAdventuresActiveModule');
        if (savedActiveModule) {
            this.state.activeModule = savedActiveModule;
            console.log(' Restoring active module from localStorage (fallback path):', savedActiveModule);
        }

        if (this.config) this.switchModule(this.state.activeModule || 'writing-module');

        // Restore saved grammar module if present (fallback path)
        const savedGrammarModule = localStorage.getItem('englishAdventuresCurrentGrammarModule');
        if (this.config && savedGrammarModule && savedGrammarModule !== this.currentGrammarModuleId) {
            const moduleInfo = this.grammarModules.find(m => m.id === savedGrammarModule);
            if (moduleInfo) {
                console.log(' Restoring saved grammar module (fallback path):', savedGrammarModule);
                this.switchGrammar(moduleInfo);
            }
        }

        this.saveState();
        if (this.config) {
            this.refreshModules();
            RewardSystem.checkAllBadgeConditions();
        }

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

        console.log(' Sound preference loaded:', isSoundEnabled ? 'Enabled' : 'Disabled');

        // Update control panel after preferences are loaded
        setTimeout(() => this.updateControlPanelState(), 100);
    },

    resetProgress: function () {
        console.log(' RESETTING PROGRESS FOR MODULE:', this.currentGrammarModuleId);

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
        const modulePoints = Number(this.state.modulePoints?.[moduleId]) || 0;
        this.state.completedActivities[moduleId] = {};
        this.state.overallProgress = 0;

        // Reset stars for this module
        const moduleStars = this.state.moduleStars[moduleId] || 0;
        this.state.rewards.stars -= moduleStars;  // Deduct module stars from total
        this.state.moduleStars[moduleId] = 0;     // Reset module stars to 0
        this.state.rewards.points = Math.max(0, (Number(this.state.rewards.points) || 0) - modulePoints);
        if (this.state.modulePoints) delete this.state.modulePoints[moduleId];

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
            console.log(' Progress reset complete for module:', moduleId);
            this.showFeedback('Progress Reset', `All progress for this module has been reset successfully.`);
        });
    },

    checkAllAnswers: async function () {
        const activeModule = document.querySelector('.module.active .sub-module.active')?.id;
        const moduleId = this.currentGrammarModuleId;
        const moduleCompletions = this.state.completedActivities[moduleId] || {};
        const results = { correct: [], incorrect: [], incomplete: [] };
        const activitySets = {
            'writing-module': WritingModule.activities,
            'spelling-module': SpellingHelper.activities,
            'game-module': GameModule.activities
        };
        const moduleActivities = activitySets[activeModule];
        if (!moduleActivities) {
            this.showFeedback('One at a Time', 'Choose a writing, spelling, or game trail to check its answers.', '');
            return;
        }

        for (const activity of moduleActivities) {
            if (moduleCompletions[activity.id] === 'completed') continue;
            const card = document.getElementById(activity.id);
            if (!card) {
                results.incomplete.push(activity.id);
                continue;
            }

            let result;
            if (activeModule === 'writing-module') {
                const textarea = card.querySelector('.activity-input');
                if (!textarea?.value.trim()) {
                    results.incomplete.push(activity.id);
                    continue;
                }
                result = await WritingModule.checkAnswer(activity, textarea.value);
            } else if (activeModule === 'spelling-module') {
                result = SpellingHelper.checkSpelling(activity, true);
            } else {
                result = GameModule.checkAnswer(activity, true);
            }

            if (result.status === 'correct') {
                results.correct.push(activity.id);
                this.markActivityCompleted(activity.id);
                const status = card.querySelector('.activity-status');
                if (status) {
                    status.textContent = 'Trail cleared';
                    status.classList.add('completed');
                }
                card.querySelectorAll('.btn').forEach(button => button.disabled = true);
                card.querySelectorAll('.spelling-input').forEach(input => {
                    input.disabled = true;
                    input.style.color = 'green';
                });
                card.querySelectorAll('.draggable').forEach(option => {
                    option.style.pointerEvents = 'none';
                    option.style.opacity = '0.5';
                });
                card.querySelectorAll('.drop-zone').forEach(zone => {
                    zone.style.pointerEvents = 'none';
                });
            } else if (result.status === 'incomplete' || result.status === 'too-short') {
                results.incomplete.push(activity.id);
            } else {
                results.incorrect.push(activity.id);
            }
        }

        let message = '';
        if (results.correct.length > 0) {
            message += `Trail cleared: ${results.correct.length} activities!\n`;
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

        const allCorrect = results.incorrect.length === 0 && results.incomplete.length === 0;
        this.showFeedback(
            allCorrect ? 'Success' : 'Check Results',
            message,
            allCorrect ? '' : ''
        );
        this.playSound(allCorrect ? 'correctSound' : 'wrongSound');
        this.updateUI();
        this.updateCheckAllButton();
    },

    updateCheckAllButton: function () {
        const checkAllButton = document.getElementById('check-all-button');
        if (checkAllButton) {
            const activeModule = document.querySelector('.module.active .sub-module.active')?.id;
            const moduleActivities = activeModule === 'writing-module' ? WritingModule.activities :
                activeModule === 'spelling-module' ? SpellingHelper.activities :
                    activeModule === 'game-module' ? GameModule.activities : [];
            const moduleCompletions = this.state.completedActivities[this.currentGrammarModuleId] || {};
            const allCompleted = moduleActivities.length > 0
                && moduleActivities.every(activity => moduleCompletions[activity.id] === 'completed');
            checkAllButton.style.display = moduleActivities.length ? 'flex' : 'none';
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

        console.log(' Sound effects:', this.state.soundEffectsEnabled ? 'Enabled' : 'Disabled');

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
                console.log(' Settings panel toggled');
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
                console.log(' Text size changed to:', size + 'px');
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
                console.log(' Background music toggled:', e.target.checked ? 'On' : 'Off');

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
                console.log(' Music volume changed to:', volume + '%');
                this.saveState();
            });
        }

        // Sound Effects Toggle
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.removeEventListener('change', this.soundToggleHandler);
            soundToggle.addEventListener('change', this.soundToggleHandler = (e) => {
                this.state.soundEffectsEnabled = e.target.checked;
                console.log(' Sound effects toggled:', e.target.checked ? 'On' : 'Off');

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
                console.log(' Sound effects volume changed to:', volume + '%');
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
                console.log(' Animations toggled:', e.target.checked ? 'On' : 'Off');
                this.saveState();
            });
        }

        // Hints Toggle
        const hintsToggle = document.getElementById('hints-toggle');
        if (hintsToggle) {
            hintsToggle.removeEventListener('change', this.hintsToggleHandler);
            hintsToggle.addEventListener('change', this.hintsToggleHandler = (e) => {
                this.state.autoShowHints = e.target.checked;
                console.log(' Auto-show hints toggled:', e.target.checked ? 'On' : 'Off');
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
                console.log(' High contrast toggled:', e.target.checked ? 'On' : 'Off');
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
                console.log(' Reduce motion toggled:', e.target.checked ? 'On' : 'Off');
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
                    console.log(' Resetting settings to default');
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
                    console.log(' Settings reset to default');
                }
            });
        }

        console.log(' Settings panel initialized successfully');
    },
};

// Start the app
App.init();