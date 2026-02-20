// modules/writingModule.js
const WritingModule = {
    activities: [],
    p5Instances: [],
    currentChecker: null,
    imageCache: {}, // Track loaded images
    imageDataCache: {}, // Track full image data (credit, URLs, etc)
    hintCounts: {}, // Track hint usage per activity
    maxHints: 2, // Maximum hints per writing activity

    init: function (activities) {
        this.activities = activities || [];
        this.p5Instances = [];
        this.imageCache = {};
        this.imageDataCache = {};
        this.hintCounts = {};
        this.loadGrammarChecker();
        this.preloadActivityImages(); // Start loading images async
        setTimeout(() => this.renderActivities(), 50);
    },

    preloadActivityImages: function () {
        // Load images in background without blocking UI
        this.activities.forEach(activity => {
            ImageService.getImageData(activity).then(imageData => {
                this.imageCache[activity.id] = imageData.imageUrl;
                this.imageDataCache[activity.id] = imageData;
                // Update image if card already rendered
                const img = document.querySelector(`#${activity.id} .activity-image`);
                if (img && img.src !== imageData.imageUrl) {
                    img.src = imageData.imageUrl;
                }
                // Update attribution if card already rendered
                const attribution = document.querySelector(`#${activity.id} .image-attribution`);
                if (attribution) {
                    attribution.innerHTML = WritingModule.createAttributionHtml(imageData);
                }
            });
        });
    },

    /**
     * Create HTML for proper Unsplash attribution
     */
    createAttributionHtml: function(imageData) {
        if (!imageData.credit || imageData.credit === 'Generated Placeholder') {
            return '';
        }
        
        if (!imageData.photographerUrl) {
            return `<span class="image-credit">Photo by ${imageData.credit}</span>`;
        }
        
        let html = `<span class="image-credit">Photo by <a href="${imageData.photographerUrl}" target="_blank" rel="noopener noreferrer">${imageData.credit}</a>`;
        if (imageData.photoUrl) {
            html += ` on <a href="${imageData.photoUrl}" target="_blank" rel="noopener noreferrer">Unsplash</a>`;
        }
        html += '</span>';
        return html;
    },

    loadGrammarChecker: async function () {
        const checkerFile = App.config?.grammarChecker;
        if (!checkerFile) return console.warn('No grammarChecker in config');

        try {
            const module = await import(`./grammarCheckers/${checkerFile}`);
            this.currentChecker = Object.values(module)[0];
            console.log(`Checker loaded: ${this.currentChecker?.name || checkerFile}`);
        } catch (e) {
            console.error('Failed to load checker:', checkerFile, e);
            this.currentChecker = null;
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

        // Use cached image or placeholder while loading
        const cachedImage = this.imageCache[activity.id];
        const imageSrc = cachedImage || 'assets/fallback.jpg';
        const imageData = this.imageDataCache[activity.id] || {};
        
        // Create image with hotlink (if available)
        let imageHtml;
        if (imageData.photoUrl) {
            // Hotlink to Unsplash photo
            imageHtml = `
                <a href="${imageData.photoUrl}" target="_blank" rel="noopener noreferrer" class="image-link">
                    <img src="${imageSrc}" alt="Activity" class="activity-image" 
                         data-activity-id="${activity.id}"
                         onerror="this.src='assets/fallback.jpg'">
                </a>
                <div class="image-attribution">${this.createAttributionHtml(imageData)}</div>
            `;
        } else {
            imageHtml = `
                <div class="image-container">
                    <img src="${imageSrc}" alt="Activity" class="activity-image" 
                         data-activity-id="${activity.id}"
                         onerror="this.src='assets/fallback.jpg'">
                    <div class="image-attribution">${this.createAttributionHtml(imageData)}</div>
                </div>
            `;
        }

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

        // Hint button
        const hintBtn = card.querySelector('.hint-btn');
        const hintSec = card.querySelector(`#hint-${activity.id}`);
        if (hintBtn && hintSec) {
            this.hintCounts[activity.id] = this.hintCounts[activity.id] || 0;
            const hintCount = this.hintCounts[activity.id];
            hintBtn.textContent = hintCount >= this.maxHints ? '💡 Hints Exhausted' : `💡 Show Hint (${hintCount}/${this.maxHints})`;
            hintBtn.disabled = hintCount >= this.maxHints;
            hintBtn.style.background = hintCount >= this.maxHints ? '#6c757d' : '#4ecdc4';

            hintBtn.onclick = () => {
                const hintState = this.hintCounts[activity.id] || 0;

                // Check if hints are exhausted
                if (hintState >= this.maxHints) {
                    App.showFeedback('Hints Exhausted', 'You\'ve used all available hints for this activity. Try solving it yourself!', '❌');
                    App.playSound('wrongSound');
                    return;
                }

                const hidden = hintSec.style.display === 'none' || !hintSec.style.display;
                
                if (hidden) {
                    hintSec.style.display = 'block';
                    const newCount = hintState + 1;
                    this.hintCounts[activity.id] = newCount;
                    hintBtn.textContent = newCount >= this.maxHints ? '💡 Hints Exhausted' : `💡 Hide Hint (${newCount}/${this.maxHints})`;
                    hintBtn.style.background = newCount >= this.maxHints ? '#6c757d' : '#ff6b6b';
                    App.playSound('hintSound');

                    // If this is the last hint, show warning
                    if (newCount >= this.maxHints) {
                        setTimeout(() => {
                            App.showFeedback('Last Hint Used', 'This was your final hint. Complete the activity without further help!', '⚠️');
                        }, 1000);
                    }
                } else {
                    hintSec.style.display = 'none';
                    const currentCount = this.hintCounts[activity.id];
                    hintBtn.textContent = currentCount >= this.maxHints ? '💡 Hints Exhausted' : `💡 Show Hint (${currentCount}/${this.maxHints})`;
                    hintBtn.style.background = currentCount >= this.maxHints ? '#6c757d' : '#4ecdc4';
                }
            };
        }

        // Track image download when viewed (Unsplash requirement for production)
        const imageLink = card.querySelector('.image-link');
        const activityImage = card.querySelector('.activity-image');
        if (imageData.downloadUrl) {
            // Track when image is loaded
            if (activityImage) {
                activityImage.addEventListener('load', () => {
                    ImageService.trackDownload(imageData.downloadUrl);
                }, { once: true });
            }
            // Also track when hotlink is clicked
            if (imageLink) {
                imageLink.addEventListener('click', () => {
                    ImageService.trackDownload(imageData.downloadUrl);
                });
            }
        }

        // Sentence starters with p5
        if (activity.sentenceStarters?.length) {
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
                App.showFeedback('Write Something', 'Please write something first!', '✏️');
                submitting = false;
                submitBtn.disabled = false;
                return;
            }

            const result = await this.checkAnswer(activity, text);
            if (result.status === 'correct') {
                this.completeActivity(card, textarea, activity.id, text);
            } else {
                const icon = result.status === 'too-short' ? '✏️' : result.status === 'grammar' ? '❌' : '📝';
                App.showFeedback(result.title || 'Try Again', result.message, icon);
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
        if (!this.currentChecker) {
            return { status: 'error', title: 'Checker Missing', message: 'Grammar checker not loaded.' };
        }
        return this.currentChecker.check(text, activity);
    },

    completeActivity: function (card, textarea, id, answer) {
        card.querySelector('.activity-status').textContent = 'Completed';
        card.querySelector('.activity-status').classList.add('completed');
        textarea.disabled = true;
        textarea.style.backgroundColor = '#f0fff0';
        card.querySelectorAll('.btn').forEach(b => b.disabled = true);
        card.querySelector('.activity-hint')?.remove();

        App.markActivityCompleted(id);
        RewardSystem.awardStar();
        App.showFeedback('Excellent!', 'Great job using the correct tenses!', '🎉');
    },

    reset: function () {
        this.p5Instances.forEach(p => p?.remove());
        this.p5Instances = [];
        this.renderActivities();
    }
};

window.WritingModule = WritingModule;