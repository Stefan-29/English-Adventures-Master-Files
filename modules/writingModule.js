// modules/writingModule.js
const WritingModule = {
    activities: [],
    p5Instances: [],
    currentChecker: null,
    checkerLoad: Promise.resolve(),
    imageDataCache: {}, // Track full image data (credit, URLs, etc)
    hintCounts: {}, // Track hint usage per activity
    maxHints: 2, // Maximum hints per writing activity

    init: function (activities) {
        this.activities = activities || [];
        this.p5Instances = [];
        this.imageDataCache = {};
        this.hintCounts = {};
        this.checkerLoad = this.loadGrammarChecker();
        this.preloadActivityImages(); // Start loading images async
        setTimeout(() => this.renderActivities(), 50);
    },

    preloadActivityImages: function () {
        const moduleId = App.currentGrammarModuleId;
        this.activities.forEach(activity => {
            ImageService.getImageData(activity, moduleId).then(imageData => {
                this.imageDataCache[activity.id] = imageData;
                const card = document.getElementById(activity.id);
                const banner = card?.querySelector('.activity-banner');
                if (banner) {
                    banner.outerHTML = this.createImageBanner(activity, imageData);
                    this.bindImageFallback(card.querySelector('.activity-image'));
                }
            }).catch(error => {
                console.error(`[Writing] Could not load image for ${activity.id}:`, error);
            });
        });
    },

    escapeHtml: function (value) {
        return String(value || '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    },

    createAttributionHtml: function (imageData) {
        if (!imageData.credit && !imageData.licenseName) {
            return '';
        }

        const escape = this.escapeHtml;
        const safeUrl = value => ImageService.getSafeHttpUrl(value);
        const credit = escape(imageData.credit || 'Image contributor');
        const photographerUrl = safeUrl(imageData.photographerUrl);
        const photoUrl = safeUrl(imageData.photoUrl);
        const licenseUrl = safeUrl(imageData.licenseUrl);
        const sourceName = imageData.sourceName ||
            (photoUrl?.includes('unsplash.com') ? 'Unsplash' : 'Image source');
        const author = photographerUrl
            ? `<a href="${escape(photographerUrl)}" target="_blank" rel="noopener noreferrer">${credit}</a>`
            : credit;
        let html = `<span class="image-credit">Photo by ${author}`;
        if (photoUrl) {
            html += ` · <a href="${escape(photoUrl)}" target="_blank" rel="noopener noreferrer">${escape(sourceName)}</a>`;
        }
        if (imageData.licenseName) {
            const license = escape(imageData.licenseName);
            html += licenseUrl
                ? ` · <a href="${escape(licenseUrl)}" target="_blank" rel="noopener noreferrer">${license}</a>`
                : ` · ${license}`;
        }
        html += '</span>';
        return html;
    },

    createImageBanner: function (activity, imageData = {}) {
        const imageUrl = ImageService.isSafeImageUrl(imageData.imageUrl)
            ? imageData.imageUrl
            : 'assets/fallback.jpg';
        const photoUrl = ImageService.getSafeHttpUrl(imageData.photoUrl);
        const alt = imageUrl === 'assets/fallback.jpg'
            ? 'Image placeholder for this writing activity'
            : activity.imageAlt || imageData.description ||
                `Image related to ${activity.imageQuery || activity.question}`;
        const image = `<img src="${this.escapeHtml(imageUrl)}" alt="${this.escapeHtml(alt)}" class="activity-image" data-activity-id="${this.escapeHtml(activity.id)}" loading="lazy" decoding="async">`;
        const linkedImage = photoUrl
            ? `<a href="${this.escapeHtml(photoUrl)}" target="_blank" rel="noopener noreferrer" class="image-link" aria-label="View image source for this writing activity">${image}</a>`
            : image;
        const attribution = this.createAttributionHtml(imageData);
        const caption = attribution
            ? `<figcaption class="image-attribution">${attribution}</figcaption>`
            : '';

        return `
            <figure class="activity-banner">
                ${linkedImage}
                ${caption}
            </figure>
        `;
    },

    bindImageFallback: function (image) {
        if (!image) return;
        image.addEventListener('error', () => {
            if (image.dataset.fallbackApplied) return;
            image.dataset.fallbackApplied = 'true';
            image.src = 'assets/fallback.jpg';
        });
    },

    loadGrammarChecker: async function () {
        const checkerFile = App.config?.grammarChecker;
        this.currentChecker = null;
        if (!checkerFile) {
            console.warn('No grammarChecker in config');
            return;
        }

        try {
            const module = await import(`./grammarCheckers/${checkerFile}`);
            let checker = module.default?.check
                ? module.default
                : Object.values(module).find(value => typeof value?.check === 'function');
            if (!checker && typeof module.default?.validateActivity === 'function') {
                const validator = module.default;
                checker = {
                    name: validator.name,
                    check: (text) => {
                        const validation = validator.validateActivity('writing', text);
                        return {
                            status: validation.isValid ? 'correct' : 'missing',
                            title: validation.isValid ? 'Trail Cleared!' : 'Keep Exploring',
                            message: validation.isValid
                                ? validator.getFeedback?.(validation).overall || 'Your grammar looks good!'
                                : validator.getFeedback?.(validation).overall || 'Review the prompt and try again.'
                        };
                    }
                };
            }
            if (!checker) {
                throw new Error(`No checker export found in ${checkerFile}`);
            }
            if (App.config?.grammarChecker === checkerFile) {
                this.currentChecker = checker;
            }
            console.log(`Checker loaded: ${this.currentChecker?.name || checkerFile}`);
        } catch (e) {
            console.error('Failed to load checker:', checkerFile, e);
            if (App.config?.grammarChecker === checkerFile) this.currentChecker = null;
        }
    },

    renderActivities: function () {
        const container = document.getElementById('writing-module-activities');
        if (!container) {
            console.warn('Writing container not ready');
            setTimeout(() => this.renderActivities(), 100);
            return;
        }
        container.innerHTML = '';
        this.p5Instances.forEach(p => p?.remove());
        this.p5Instances = [];

        this.activities.forEach((act, i) => {
            // Get completion status from current module
            const moduleId = App.currentGrammarModuleId;
            const moduleCompletions = App.state.completedActivities[moduleId] || {};
            const isCompleted = moduleCompletions[act.id] || false;
            const card = this.createActivityCard(act, i, isCompleted);
            container.appendChild(card);
        });
    },

    createActivityCard: function (activity, index, isCompleted) {
        const card = document.createElement('div');
        card.className = 'activity-card';
        card.id = activity.id;

        const header = `
            <div class="activity-header">
                <div class="activity-number">Activity ${index + 1}</div>
                <div class="activity-status ${isCompleted ? 'completed' : ''}">
                    ${isCompleted ? 'Completed' : 'Not started'}
                </div>
            </div>
        `;

        const imageData = this.imageDataCache[activity.id] || {};
        const imageHtml = this.createImageBanner(activity, imageData);

        const hintHtml = activity.hint ? `
            <div class="activity-hint" id="hint-${activity.id}" style="display:none">
                <strong>Hint:</strong> ${activity.hint}
            </div>
        ` : '';

        const startersCanvas = activity.sentenceStarters?.length ? `
            <div class="sentence-starters">
                <h5>Sentence Starters:</h5>
                <div id="canvas-${activity.id}" class="starters-canvas"></div>
            </div>
        ` : '';

        card.innerHTML = `
            ${header}
            <div class="activity-question">${activity.question}</div>
            ${imageHtml}
            <div class="input-row">
                <textarea class="activity-input" rows="5" placeholder="Write your answer here..." 
                    ${isCompleted ? 'disabled' : ''}>${isCompleted ? activity.lastAnswer || '' : ''}</textarea>
                <button class="btn hint-btn">Show Hint</button>
            </div>
            ${hintHtml}
            ${startersCanvas}
            <div class="activity-buttons">
                <button class="btn submit-btn">Check My Writing</button>
                <button class="btn skip-btn">Skip</button>
            </div>
        `;
        this.bindImageFallback(card.querySelector('.activity-image'));

        // Hint button
        const hintBtn = card.querySelector('.hint-btn');
        const hintSec = card.querySelector(`#hint-${activity.id}`);
        if (hintBtn && hintSec) {
            this.hintCounts[activity.id] = this.hintCounts[activity.id] || 0;
            const hintCount = this.hintCounts[activity.id];
            hintBtn.textContent = hintCount >= this.maxHints ? ' Hints Exhausted' : ` Show Hint (${hintCount}/${this.maxHints})`;
            hintBtn.disabled = hintCount >= this.maxHints;
            hintBtn.style.background = hintCount >= this.maxHints ? '#6c757d' : '#4ecdc4';

            hintBtn.onclick = () => {
                const hintState = this.hintCounts[activity.id] || 0;

                // Check if hints are exhausted
                if (hintState >= this.maxHints) {
                    App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this activity. Try solving it yourself!', '');
                    App.playSound('wrongSound');
                    return;
                }

                const hidden = hintSec.style.display === 'none' || !hintSec.style.display;
                
                if (hidden) {
                    hintSec.style.display = 'block';
                    const newCount = hintState + 1;
                    this.hintCounts[activity.id] = newCount;
                    hintBtn.textContent = newCount >= this.maxHints ? ' Hints Exhausted' : ` Hide Hint (${newCount}/${this.maxHints})`;
                    hintBtn.style.background = newCount >= this.maxHints ? '#6c757d' : '#ff6b6b';
                    App.playSound('hintSound');

                    // If this is the last hint, show warning
                    if (newCount >= this.maxHints) {
                        setTimeout(() => {
                            App.showFeedback('Last Hint Used', 'This was your final hint. Complete the activity without further help!', '');
                        }, 1000);
                    }
                } else {
                    hintSec.style.display = 'none';
                    const currentCount = this.hintCounts[activity.id];
                    hintBtn.textContent = currentCount >= this.maxHints ? ' Hints Exhausted' : ` Show Hint (${currentCount}/${this.maxHints})`;
                    hintBtn.style.background = currentCount >= this.maxHints ? '#6c757d' : '#4ecdc4';
                }
            };
        }

        // Sentence starters with p5
        if (activity.sentenceStarters?.length && typeof window.p5 === 'function') {
            const canvasDiv = card.querySelector(`#canvas-${activity.id}`);
            const sketch = (p) => {
                p.setup = () => {
                    const w = canvasDiv.offsetWidth || 500;
                    const h = activity.sentenceStarters.length * 32 + 20;
                    p.createCanvas(w, h).parent(canvasDiv);
                    p.textFont('Arial');
                    p.textSize(16);
                    p.noLoop();
                };
                p.draw = () => {
                    p.background(250);
                    p.fill(50);
                    activity.sentenceStarters.forEach((s, i) => {
                        p.text('• ' + s, 15, 30 + i * 32);
                    });
                };
                p.windowResized = () => {
                    const w = canvasDiv.offsetWidth || 500;
                    p.resizeCanvas(w, activity.sentenceStarters.length * 32 + 20);
                    p.draw();
                };
            };
            this.p5Instances.push(new p5(sketch));
        } else if (activity.sentenceStarters?.length) {
            const canvasDiv = card.querySelector(`#canvas-${activity.id}`);
            const list = document.createElement('ul');
            list.className = 'sentence-starters__list';
            activity.sentenceStarters.forEach(starter => {
                const item = document.createElement('li');
                item.textContent = starter;
                list.appendChild(item);
            });
            canvasDiv.replaceWith(list);
        }

        // Submit
        const submitBtn = card.querySelector('.submit-btn');
        const textarea = card.querySelector('.activity-input');
        let submitting = false;

        submitBtn.onclick = async () => {
            if (submitting || isCompleted) return;
            submitting = true;
            submitBtn.disabled = true;

            const text = textarea.value.trim();
            if (!text) {
                App.showFeedback('Write Something', 'Please write something first!', '');
                submitting = false;
                submitBtn.disabled = false;
                return;
            }

            const result = await this.checkAnswer(activity, text);
            if (result.status === 'correct') {
                this.completeActivity(card, textarea, activity.id, text);
            } else {
                const icon = result.status === 'too-short' ? '' : result.status === 'grammar' ? '' : '';
                App.showFeedback(result.title || 'Try Again', result.message, icon, 'error', submitBtn);
            }

            submitting = false;
            submitBtn.disabled = false;
        };

        // Skip
        card.querySelector('.skip-btn').onclick = () => {
            App.showFeedback('Come Back Later', 'You can return to this activity anytime!', '⏭️');
        };

        return card;
    },

    checkAnswer: async function (activity, text) {
        await this.checkerLoad;
        if (!this.currentChecker) {
            return { status: 'error', title: 'Checker Missing', message: 'Grammar checker not loaded.' };
        }
        const result = this.currentChecker.check(text, activity);
        if (!result || typeof result !== 'object') {
            return { status: 'error', title: 'Review Unavailable', message: 'The writing checker returned an invalid result. Please try again.' };
        }

        if (result.ok === true || ['correct', 'good', 'ok', 'success'].includes(result.status)) {
            return { ...result, status: 'correct' };
        }
        return {
            ...result,
            status: result.status || 'incorrect',
            title: result.title || 'Keep Exploring',
            message: result.message || 'Review the prompt and try another sentence.'
        };
    },

    completeActivity: function (card, textarea, id, answer) {
        card.querySelector('.activity-status').textContent = 'Completed';
        card.querySelector('.activity-status').classList.add('completed');
        textarea.disabled = true;
        textarea.style.backgroundColor = '#f0fff0';
        card.querySelectorAll('.btn').forEach(b => b.disabled = true);
        card.querySelector('.activity-hint')?.remove();

        App.markActivityCompleted(id);
        App.showFeedback('Excellent!', 'Great job using the correct tenses!', '', 'success', card);
    },

    reset: function () {
        this.p5Instances.forEach(p => p?.remove());
        this.p5Instances = [];
        this.renderActivities();
    }
};

window.WritingModule = WritingModule;