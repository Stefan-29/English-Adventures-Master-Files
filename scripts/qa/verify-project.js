import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
function listFilesRecursively(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? listFilesRecursively(entryPath) : [entry.name];
    });
}

const configDirectory = path.join(root, 'config');
const configs = fs.readdirSync(configDirectory)
    .filter(file => file.endsWith('.json') && file !== 'imageMapping.json');
const checkedCheckers = new Set();
let activityCount = 0;

assert.ok(fs.existsSync(path.join(root, 'index.html')), 'The app entry point must exist.');
const packageManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(packageManifest.main, 'app.js', 'The package entry point must match the root application file.');
assert.ok(fs.existsSync(path.join(root, packageManifest.main)), 'The package entry point must exist.');
assert.match(packageManifest.scripts.dev, /http-server\s+\./, 'The development server must serve the repository root.');
assert.match(packageManifest.scripts.start, /http-server\s+dist/, 'Production preview must serve the static build.');
assert.match(packageManifest.scripts.build, /scripts\/build-static-site\.js/, 'Production build must use the allowlisted static builder.');
assert.ok(fs.existsSync(path.join(root, 'config')), 'Topic configurations must remain at the served root.');
assert.ok(fs.existsSync(path.join(root, 'modules')), 'Application modules must remain at the served root.');
execFileSync(process.execPath, ['scripts/build-static-site.js'], { cwd: root, stdio: 'pipe' });
const staticOutput = path.join(root, 'dist');
assert.ok(fs.existsSync(path.join(staticOutput, 'index.html')), 'The production build must include the main app page.');
assert.deepEqual(
    fs.readdirSync(path.join(staticOutput, 'config')),
    ['imageMapping.json'],
    'The production bundle must exclude all topic config JSON.'
);
assert.ok(!fs.existsSync(path.join(staticOutput, 'reproducibility')), 'Activity JSON must not be copied to the static bundle.');
assert.ok(!fs.existsSync(path.join(staticOutput, 'assets/images/future-tenses')), 'Topic-specific writing images must not be copied to the public bundle.');
const publicImageMapping = JSON.parse(fs.readFileSync(path.join(staticOutput, 'config/imageMapping.json'), 'utf8'));
assert.ok(
    Object.values(publicImageMapping).every(image => !image.path?.startsWith('assets/images/future-tenses/')),
    'Public image mapping must not reveal private topic image paths.'
);
for (const entry of fs.readdirSync(staticOutput, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const files = listFilesRecursively(path.join(staticOutput, entry.name));
    assert.ok(
        !files.some(file => file.endsWith('.json') && !file.endsWith('imageMapping.json')),
        `Static output directory ${entry.name} contains unexpected JSON content.`
    );
}
const authHtml = fs.readFileSync(path.join(root, 'auth.html'), 'utf8');
assert.match(authHtml, /id="login-form"/, 'The auth page must provide email/password login.');
assert.match(authHtml, /id="signup-form"/, 'The auth page must provide email signup.');
assert.match(authHtml, /id="reset-form"/, 'The auth page must provide password recovery.');
assert.match(authHtml, /id="guardian-email"/, 'Minor signup must collect a guardian email.');
assert.match(authHtml, /id="guardian-consent"/, 'Minor signup must require guardian consent attestation.');
assert.match(authHtml, /id="language-toggle"/, 'The auth page must support a language toggle.');
assert.match(
    fs.readFileSync(path.join(root, 'modules/authPage.js'), 'utf8'),
    /signInWithOAuth\(\{\s*provider:\s*'google'/,
    'The auth page must support Google OAuth.'
);
assert.match(
    fs.readFileSync(path.join(root, 'modules/supabaseClient.js'), 'utf8'),
    /flowType:\s*'pkce'/,
    'Supabase browser authentication must use PKCE.'
);
assert.doesNotMatch(
    fs.readFileSync(path.join(root, 'supabase-config.js'), 'utf8').replace(/\/\/.*$/gm, ''),
    /service[_-]?role|secret/i,
    'Browser Supabase configuration must not expose service-role credentials.'
);
for (const [, assetPath] of authHtml.matchAll(/(?:src|href)="(?![a-z][a-z\d+.-]*:|#)([^"]+)"/gi)) {
    assert.ok(
        fs.existsSync(path.join(root, assetPath)),
        `Auth page references missing local asset: ${assetPath}`
    );
}
const schemaMigration = fs.readFileSync(
    path.join(root, 'supabase/migrations/20261023000000_initial_schema.sql'),
    'utf8'
);
const schemaTables = [
    'profiles', 'topics', 'plans', 'enrollments', 'orders', 'payments',
    'progress', 'audit_log', 'student_groups', 'group_members'
];
for (const table of schemaTables) {
    assert.match(schemaMigration, new RegExp(`create table public\\.${table}\\s*\\(`), `${table} must be created by the migration.`);
    assert.match(schemaMigration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must enable RLS.`);
    assert.match(schemaMigration, new RegExp(`alter table public\\.${table} force row level security`), `${table} must force RLS.`);
}
assert.match(schemaMigration, /grant select \(id, display_name, role, status, is_minor, created_at\)\s+on public\.profiles to authenticated/i, 'Guardian contact details must not be directly selectable by clients.');
assert.doesNotMatch(schemaMigration, /grant\s+(?:all|update)\s+on\s+public\.profiles\s+to\s+authenticated/i, 'Clients must not be able to change profile roles or status.');
assert.match(schemaMigration, /auth\.jwt\(\)[\s\S]*?->>\s*'aal'\s*=\s*'aal2'/, 'Owner access must require MFA assurance level aal2.');
assert.match(schemaMigration, /foreign key \(order_id, midtrans_order_id, gross_amount_idr\)\s+references public\.orders \(id, midtrans_order_id, gross_amount_idr\)/i, 'Payments must match their order ID and amount at the database level.');
assert.match(schemaMigration, /progress_insert_own[\s\S]*?user_id = \(select auth\.uid\(\)\)/i, 'Progress writes must be scoped to the authenticated user.');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.match(html, /id="feedback-modal"[^>]*role="dialog"[^>]*aria-modal="true"[^>]*aria-labelledby="feedback-title"[^>]*aria-describedby="feedback-message"/, 'The feedback dialog must expose its title and description.');
assert.match(html, /id="feedback-message" class="feedback-message"/, 'Feedback content must use a valid container for structured results.');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
assert.match(appSource, /ContentService\.listTopics\(\)/, 'The topic list must load from the public database index.');
assert.match(appSource, /this\.contentService\.getLesson\(moduleInfo\.id\)/, 'Topic content must load through the gated service.');
assert.doesNotMatch(appSource, /fetch\(\s*(?:moduleInfo\.configPath|this\.currentDataFile)/, 'The app must not fetch public lesson JSON paths.');
assert.doesNotMatch(appSource, /loadSampleData|sampleData|Introduction to Past Simple Tense/, 'Lesson examples must not be embedded in the app bundle.');
assert.match(appSource, /Hubungi guru untuk daftar/, 'The locked state must offer teacher enrollment contact.');
const contentServiceSource = fs.readFileSync(path.join(root, 'modules/contentService.js'), 'utf8');
assert.match(contentServiceSource, /functions\.invoke\('get-lesson'/, 'ContentService must call the gated Edge Function.');
assert.doesNotMatch(contentServiceSource, /localStorage|sessionStorage|CacheStorage/, 'Lesson JSON must not be cached in browser storage.');
const lessonFunctionSource = fs.readFileSync(
    path.join(root, 'supabase/functions/get-lesson/index.ts'),
    'utf8'
);
assert.match(lessonFunctionSource, /requestSchema\s*=\s*z\.object/, 'The Edge Function must validate its request with a schema.');
assert.match(lessonFunctionSource, /maxRequestBodyBytes\s*=\s*2048/, 'The Edge Function must bound request body size.');
assert.match(lessonFunctionSource, /admin\.auth\.getUser\(token\)/, 'The Edge Function must verify the access token server-side.');
assert.match(lessonFunctionSource, /email_confirmed_at/, 'The Edge Function must require verified email.');
assert.match(lessonFunctionSource, /expires_at\.is\.null,expires_at\.gt\.\$\{now\}/, 'Full-access entitlements must enforce expiry.');
assert.match(lessonFunctionSource, /getUser\(token\)[\s\S]*?getVerifiedTokenAssurance\(token\)[\s\S]*?aal2/, 'Owner lesson access must verify the token before requiring MFA assurance.');
assert.match(lessonFunctionSource, /UPSTASH_REDIS_REST_TOKEN[\s\S]*?rateLimitPerMinute/, 'The Edge Function must rate limit lesson requests.');
assert.match(lessonFunctionSource, /Cache-Control': 'private, no-store/, 'Lesson responses must not be cacheable.');
assert.match(lessonFunctionSource, /getBucket\('lesson-content'\)[\s\S]*?bucket\.public !== false/, 'The Edge Function must fail closed if the content bucket is public.');
assert.ok(
    lessonFunctionSource.indexOf('if (!topic.is_free && !hasFullAccess)')
        < lessonFunctionSource.indexOf('.storage'),
    'Entitlement must be checked before private content is read.'
);
assert.ok(appSource.includes("querySelector('.feedback-modal__backdrop')"), 'The feedback backdrop handler must target the rendered backdrop.');
assert.ok(appSource.includes("e.key === 'Escape'"), 'The feedback dialog must support Escape to close.');
assert.ok(appSource.includes("setAttribute('aria-hidden', 'false')"), 'Opening the dialog must expose it to assistive technology.');
for (const [, assetPath] of html.matchAll(/(?:src|href)="(?![a-z][a-z\d+.-]*:|#)([^"]+)"/gi)) {
    assert.ok(
        fs.existsSync(path.join(root, assetPath)),
        `HTML references missing local asset: ${assetPath}`
    );
}

const styles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
for (const selector of ['.feedback-answer-item', '.drag-container', '.draggable', '.drop-zone']) {
    assert.ok(styles.includes(selector), `Missing separated activity or feedback styling: ${selector}`);
}
const lessonStyles = fs.readFileSync(path.join(root, 'css/lesson-module.css'), 'utf8');
for (const selector of ['.lesson-main-content', '.functions-section', '.tips-section', '.examples-section']) {
    assert.ok(lessonStyles.includes(selector), `Missing lesson reading styles for ${selector}.`);
}
const lessonModuleSource = fs.readFileSync(path.join(root, 'modules/lessonModule.js'), 'utf8');
assert.match(lessonModuleSource, /lesson-voice-select/, 'Lessons must offer a simple voice selector.');
assert.match(lessonModuleSource, /addEventListener\('change', this\._lessonChangeHandler\)/, 'Voice selection must respond to changes.');
assert.match(lessonModuleSource, /pauseLessonAudio|resumeLessonAudio/, 'Lesson playback must support pause and resume.');
assert.doesNotMatch(
    fs.readFileSync(path.join(root, 'modules/textToSpeechService.js'), 'utf8'),
    /ELEVENLABS|api\.elevenlabs\.io|API_KEY/,
    'Lesson speech must not depend on a paid API key or hosted TTS model.'
);

const imageServiceSource = fs.readFileSync(path.join(root, 'modules/imageService.js'), 'utf8');
assert.match(imageServiceSource, /commons\.wikimedia\.org\/w\/api\.php/, 'Writing images must use the free Wikimedia Commons API.');
assert.doesNotMatch(imageServiceSource, /UNSPLASH_API_KEY|client_id=/, 'Image lookup must not require a client API key.');
const futureData = JSON.parse(fs.readFileSync(path.join(root, 'reproducibility/future-tenses.json'), 'utf8'));
assert.ok(
    futureData.writingActivities.every(activity => activity.imageQuery && activity.imageAlt),
    'Future writing activities must specify a related image query and descriptive alt text.'
);

for (const file of configs) {
    const configPath = path.join(configDirectory, file);
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    assert.ok(config.siteSettings?.title, `${file} is missing its title.`);
    assert.ok(config.lesson?.title, `${file} is missing its lesson title.`);
    assert.ok(Array.isArray(config.wordBank?.categories), `${file} is missing its word bank.`);

    const dataPath = path.resolve(root, config.dataFile || '');
    assert.ok(config.dataFile && fs.existsSync(dataPath), `${file} has a missing data file.`);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const activityIds = new Set();

    for (const category of [
        'lessonActivities',
        'writingActivities',
        'gameActivities',
        'quizActivities',
        'spellingActivities'
    ]) {
        const activities = data[category] || [];
        assert.ok(Array.isArray(activities), `${dataPath}: ${category} must be an array.`);
        for (const activity of activities) {
            assert.ok(activity.id, `${dataPath}: ${category} contains an activity without an id.`);
            assert.ok(!activityIds.has(activity.id), `${dataPath}: duplicate activity id ${activity.id}.`);
            activityIds.add(activity.id);
            activityCount++;

            if (category === 'gameActivities') {
                assert.ok(
                    ['drag-drop', 'ordering', 'reorder', 'roleplay', 'simulator', 'writing'].includes(activity.type),
                    `${dataPath}: unsupported game type for ${activity.id}.`
                );
            }
            if (category === 'quizActivities') {
                assert.ok(Array.isArray(activity.options) && activity.options.length > 1, `${activity.id} needs quiz options.`);
                assert.ok(activity.correctAnswer !== undefined, `${activity.id} needs a correct answer.`);
            }
            if (category === 'spellingActivities') {
                assert.ok(activity.word && activity.clue, `${activity.id} needs a spelling word and clue.`);
            }
        }
    }

    if (config.grammarChecker && !checkedCheckers.has(config.grammarChecker)) {
        const checkerPath = path.join(root, 'modules/grammarCheckers', config.grammarChecker);
        assert.ok(fs.existsSync(checkerPath), `${file} references missing checker ${config.grammarChecker}.`);
        const checkerModule = await import(pathToFileURL(checkerPath));
        const checker = checkerModule.default || Object.values(checkerModule).find(value => value && typeof value === 'object');
        assert.ok(
            typeof checker?.check === 'function' || typeof checker?.validateActivity === 'function',
            `${config.grammarChecker} does not expose a writing validation function.`
        );
        checkedCheckers.add(config.grammarChecker);
    }
}

globalThis.window = {};
await import(pathToFileURL(path.join(root, 'modules/gameModule.js')));
const gameModule = window.GameModule;
assert.equal(gameModule.getDropZoneCount({ sentence: 'Choose the correct option:' }), 0);
assert.deepEqual(
    gameModule.getDropAnswerSets({ correctAnswer: ['much', 'a lot of'] }, 1),
    [['much'], ['a lot of']]
);
assert.deepEqual(
    gameModule.getDropAnswerSets({ correctAnswer: ['heat / boils'] }, 2),
    [['heat', 'boils']]
);
assert.equal(
    gameModule.isCombinedDropActivity({
        sentence: 'If you ____ water to 100°C, it ____.',
        options: ['heat / boils', 'heated / boils']
    }),
    true
);
gameModule.selectedAnswers = { choice: 'The correct answer' };
assert.equal(
    gameModule.checkChoiceAnswer({
        id: 'choice',
        correctAnswer: ['The correct answer', 'Another accepted answer']
    }).status,
    'correct'
);
const dropZones = ['got', 'to finish'].map(text => ({
    textContent: text,
    classList: { toggle() {} }
}));
assert.equal(
    gameModule.checkDragDropAnswer(
        { correctAnswer: ['got / to finish'] },
        { querySelectorAll: () => dropZones },
        true
    ).status,
    'correct'
);

const previousFetch = globalThis.fetch;
const cachedImages = new Map();
globalThis.localStorage = {
    getItem: key => cachedImages.get(key) || null,
    setItem: (key, value) => cachedImages.set(key, value),
    removeItem: key => cachedImages.delete(key)
};
await import(pathToFileURL(path.join(root, 'modules/imageService.js')));
const imageService = window.ImageService;
globalThis.ImageService = imageService;
let requestedImageUrl;
globalThis.fetch = async request => {
    requestedImageUrl = new URL(request);
    return {
        ok: true,
        json: async () => ({
            query: {
                pages: [{
                    imageinfo: [{
                        thumburl: 'https://upload.wikimedia.org/example.jpg',
                        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Example.jpg',
                        extmetadata: {
                            Artist: { value: '<a href="/wiki/User:Example">Example artist</a>' },
                            LicenseShortName: { value: 'CC BY-SA 4.0' },
                            LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
                            ImageDescription: { value: 'A sample image' }
                        }
                    }]
                }]
            }
        })
    };
};
const commonsImage = await imageService.fetchFromWikimedia({
    id: 'writing-6',
    question: 'Write about moving to Bali.',
    imageQuery: 'Bali beach tropical island'
}, 'future-tenses');
assert.equal(requestedImageUrl.searchParams.get('origin'), '*');
assert.equal(requestedImageUrl.searchParams.get('gsrsearch'), 'filetype:bitmap Bali beach tropical island');
assert.equal(commonsImage.sourceName, 'Wikimedia Commons');
assert.equal(commonsImage.credit, 'Example artist');
assert.equal(commonsImage.licenseName, 'CC BY-SA 4.0');
assert.ok(cachedImages.has(
    `${imageService.CACHE_KEY_PREFIX}future-tenses%3Awriting-6%3Abali%20beach%20tropical%20island`
));
await import(pathToFileURL(path.join(root, 'modules/writingModule.js')));
const writingModule = window.WritingModule;
const bannerHtml = writingModule.createImageBanner({
    id: 'writing-6',
    imageQuery: 'Bali beach tropical island',
    imageAlt: 'A beach in Bali'
}, commonsImage);
assert.match(bannerHtml, /href="https:\/\/commons\.wikimedia\.org\/wiki\/File:Example\.jpg"/);
assert.match(bannerHtml, /alt="A beach in Bali"/);
assert.match(bannerHtml, /Wikimedia Commons/);

imageService.imageMapping = {
    'writing-2': { path: 'assets/images/future-tenses/writing-2.jpg', credit: 'Local photographer' }
};
globalThis.fetch = async () => ({ ok: true, json: async () => ({ query: { pages: [] } }) });
const moduleImage = await imageService.getImageData(
    { id: 'writing-2', question: 'Describe Jakarta city.' },
    'future-tenses'
);
const otherModuleImage = await imageService.getImageData(
    { id: 'writing-2', question: 'Describe Jakarta city.' },
    'past-tenses'
);
assert.equal(moduleImage.imageUrl, 'assets/images/future-tenses/writing-2.jpg');
assert.equal(otherModuleImage.imageUrl, 'assets/fallback.jpg');
globalThis.fetch = previousFetch;

const makeElement = () => ({
    children: [],
    attributes: {},
    style: {},
    textContent: '',
    setAttribute(name, value) {
        this.attributes[name] = value;
    },
    appendChild(child) {
        this.children.push(child);
        return child;
    },
    append(...children) {
        this.children.push(...children);
    },
    replaceChildren(...children) {
        this.children = children;
    }
});
const rewardElements = {
    'rewards-summary': makeElement(),
    'stars-container': makeElement()
};
globalThis.document = {
    getElementById: id => rewardElements[id] || null,
    createElement: () => makeElement()
};
globalThis.App = {
    currentGrammarModuleId: 'test-module',
    state: {
        moduleStars: {},
        completedActivities: { 'test-module': { first: 'completed' } },
        rewards: { stars: 0, points: 0, badges: [] }
    },
    updateUI() {},
    saveState() {},
    showFeedback() {},
    playSound() {}
};
globalThis.WritingModule = { activities: [{ id: 'writing-1' }] };
globalThis.GameModule = gameModule;
globalThis.GameModule.activities = [{ id: 'game-1' }];
globalThis.SpellingHelper = { activities: [{ id: 'spelling-1' }] };
globalThis.LessonModule = { data: [{ id: 'lesson-1' }] };
globalThis.QuizModule = { activities: [] };
await import(pathToFileURL(path.join(root, 'modules/rewardsSystem.js')));
const rewardSystem = window.RewardSystem;
assert.equal(rewardSystem.calculateModuleStars('test-module'), 1, 'Stars must count all activity categories proportionally.');
rewardSystem.awardStar();
assert.equal(App.state.rewards.points, 10, 'A completed activity must earn learning points.');
assert.equal(App.state.moduleStars['test-module'], 1);
rewardSystem.updateStarsDisplay();
assert.match(rewardElements['rewards-summary'].textContent, /10 learning points/);
assert.equal(rewardElements['stars-container'].children[0].children[0].textContent, '★');
assert.match(rewardElements['stars-container'].children[1].children[0].textContent, /Complete 1 more activity/);
rewardSystem.rewards = { badges: [{ id: 'test-badge', moduleId: 'test-module' }] };
rewardSystem.awardBadge({
    id: 'test-badge',
    name: 'Test badge',
    condition: 'Complete a test',
    points: 15
});
assert.equal(App.state.rewards.points, 25, 'Badge bonus points must be added to the learner total.');
assert.equal(App.state.modulePoints['test-module'], 25, 'Module reward points must be tracked for progress resets.');

const spokenUtterances = [];
const speechEvents = [];
const englishVoices = [
    { name: 'English US Basic', lang: 'en-US', voiceURI: 'basic', default: true },
    { name: 'Microsoft Aria Online (Natural)', lang: 'en-US', voiceURI: 'natural' },
    { name: 'English UK Voice', lang: 'en-GB', voiceURI: 'uk' }
];
globalThis.CustomEvent = class {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
};
globalThis.document.readyState = 'complete';
globalThis.document.dispatchEvent = event => speechEvents.push(event);
globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
        this.text = text;
    }
};
globalThis.window.SpeechSynthesisUtterance = globalThis.SpeechSynthesisUtterance;
globalThis.window.speechSynthesis = {
    addEventListener() {},
    getVoices: () => englishVoices,
    speak: utterance => spokenUtterances.push(utterance),
    cancel() {},
    pause() {},
    resume() {}
};
await import(pathToFileURL(path.join(root, 'modules/textToSpeechService.js')));
const speechService = window.TextToSpeechService;
speechService.init();
assert.equal(speechService.getAvailableVoices().length, 3, 'English voices should be listed.');
assert.equal(speechService.getPreferredVoice().voiceURI, 'natural', 'A natural voice should be preferred when available.');
assert.equal(speechService.setVoice('uk'), true);
assert.equal(speechService.getPreferredVoice().voiceURI, 'uk', 'Learners must be able to choose an English voice.');
assert.equal(speechService.setVoice(''), true);
const speechText = 'A short listening sentence. '.repeat(30);
assert.equal(speechService.speak(speechText), true);
assert.equal(spokenUtterances[0].rate, 0.9, 'The default lesson narration rate should be easy to follow.');
assert.equal(spokenUtterances[0].voice.voiceURI, 'natural');
speechService.pause();
assert.equal(speechService.isPaused, true);
speechService.resume();
assert.equal(speechService.isPaused, false);
let utteranceIndex = 0;
while (speechService.isPlaying) {
    const currentUtterance = spokenUtterances[utteranceIndex++];
    assert.ok(currentUtterance, 'Speech playback must queue all lesson sections.');
    currentUtterance.onend();
}
assert.ok(speechEvents.some(event => event.type === 'tts-ended'), 'Speech completion must notify lesson controls.');

console.log(`QA passed: ${configs.length} grammar topics, ${activityCount} activities, ${checkedCheckers.size} writing checkers, and game-answer behavior.`);
