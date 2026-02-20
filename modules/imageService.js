// modules/imageService.js
const ImageService = {
    UNSPLASH_API_KEY: 'RPN3zTHnp4Y1N6XNuKr15qPLjQYWaeBeS1JNFgt_v1s', // Production access key
    API_URL: 'https://api.unsplash.com/search/photos',
    CACHE_KEY_PREFIX: 'grammar101_img_',
    CACHE_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    imageMapping: {}, // Will be loaded at runtime

    /**
     * Initialize image service and load image mapping
     */
    async init() {
        try {
            const response = await fetch('./config/imageMapping.json');
            if (response.ok) {
                this.imageMapping = await response.json();
                console.log(`[Image] Loaded ${Object.keys(this.imageMapping).length} local image mappings`);
            }
        } catch (error) {
            console.warn('[Image] Could not load image mapping, will use API/placeholders:', error.message);
        }
    },

    /**
     * Get image for activity - tries local first, then cache, then API, then fallback
     * Returns object with imageUrl, credit, photographerUrl, and photoUrl
     */
    async getImageData(activity) {
        // Step 1: Check if local image mapping exists
        if (this.imageMapping[activity.id]) {
            const localData = this.imageMapping[activity.id];
            return {
                imageUrl: localData.path,
                credit: localData.credit || 'Local Asset',
                photographerUrl: localData.photographerUrl || null,
                photoUrl: localData.photoUrl || null,
                downloadUrl: localData.downloadUrl || null,
                isLocal: true
            };
        }

        // Step 2: Check if activity specifies a local image
        if (activity.image && activity.image.startsWith('assets/')) {
            return {
                imageUrl: activity.image,
                credit: 'Local Asset',
                photographerUrl: null,
                photoUrl: null,
                downloadUrl: null,
                isLocal: true
            };
        }

        // Step 3: Check cache
        const cached = this.getFromCache(activity.id);
        if (cached) {
            console.log(`[Image] Cache hit for ${activity.id}`);
            return cached;
        }

        // Step 4: Fetch from API (if key is available)
        if (this.UNSPLASH_API_KEY !== 'YOUR_UNSPLASH_API_KEY_HERE') {
            const apiImage = await this.fetchFromUnsplash(activity);
            if (apiImage) return apiImage;
        }

        // Step 5: Generate placeholder
        const placeholder = this.generatePlaceholder(activity);
        return {
            imageUrl: placeholder,
            credit: 'Generated Placeholder',
            photographerUrl: null,
            photoUrl: null,
            downloadUrl: null,
            isLocal: false
        };
    },

    /**
     * Legacy function for backward compatibility
     */
    async getImageUrl(activity) {
        const data = await this.getImageData(activity);
        return data.imageUrl;
    },

    /**
     * Fetch image from Unsplash API based on question keywords
     * Returns object with full photo data for attribution and download tracking
     */
    async fetchFromUnsplash(activity) {
        try {
            const keywords = this.extractKeywords(activity.question);
            if (keywords.length === 0) return null;

            const query = keywords.join(' ');
            
            const response = await fetch(
                `${this.API_URL}?query=${encodeURIComponent(query)}&per_page=1&client_id=${this.UNSPLASH_API_KEY}`,
                { timeout: 5000 }
            );

            if (!response.ok) throw new Error(`API error: ${response.status}`);

            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const photo = data.results[0];
                const imageUrl = photo.urls.regular;
                const credit = photo.user.name;
                const photographerUrl = photo.user.portfolio_url || photo.user.links.html;
                const photoUrl = photo.links.html; // Link to photo on Unsplash
                const downloadUrl = photo.links.download_location; // Download tracking URL
                
                const imageData = {
                    imageUrl,
                    credit,
                    photographerUrl,
                    photoUrl,
                    downloadUrl,
                    unsplashId: photo.id
                };
                
                // Cache the result
                this.saveToCache(activity.id, imageData);
                
                console.log(`[Image] Fetched from API for ${activity.id}: ${query}`);
                return imageData;
            }
        } catch (error) {
            console.warn(`[Image] Unsplash API failed: ${error.message}`);
        }

        return null;
    },

    /**
     * Extract keywords from question text using simple heuristics
     */
    extractKeywords(question) {
        // Remove common words and extract meaningful terms
        const commonWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'what', 'when', 'where', 'why', 'how', 'is', 'are', 'was', 'were', 'be', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
            'might', 'must', 'can', 'write', 'tell', 'describe', 'explain', 'use', 'using',
            'your', 'you', 'past', 'simple', 'continuous', 'perfect', 'tense', 'verbs', 'verb',
            'sentences', 'sentence', 'story', 'about', 'this', 'that', 'these', 'those'
        ]);

        // Extract words (4+ chars, remove duplicates)
        const words = question
            .toLowerCase()
            .match(/\b[a-z]{4,}\b/g) || [];
        
        const unique = new Set(words);
        const filtered = Array.from(unique)
            .filter(w => !commonWords.has(w))
            .slice(0, 3); // Top 3 keywords

        return filtered.length > 0 ? filtered : ['story']; // Fallback keyword
    },

    /**
     * Generate a canvas-based placeholder image
     */
    generatePlaceholder(activity) {
        try {
            const keywords = this.extractKeywords(activity.question);
            const mainKeyword = keywords[0] || 'learning';
            
            // Use a deterministic color based on activity ID
            const hue = (activity.id.charCodeAt(0) + activity.id.charCodeAt(activity.id.length - 1)) % 360;
            const color = `hsl(${hue}, 70%, 60%)`;

            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;

            const ctx = canvas.getContext('2d');
            
            // Background gradient
            const gradient = ctx.createLinearGradient(0, 0, 400, 300);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, `hsl(${hue}, 70%, 45%)`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 300);

            // Text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Main keyword
            ctx.fillText(mainKeyword.toUpperCase(), 200, 130);
            
            // Subtext
            ctx.font = '14px Arial, sans-serif';
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fillText(`Activity ${activity.id}`, 200, 200);

            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.warn('[Image] Placeholder generation failed:', error);
            return 'assets/fallback.jpg';
        }
    },

    /**
     * Save image data to localStorage cache
     */
    saveToCache(activityId, imageData) {
        try {
            const cache = {
                ...imageData,
                timestamp: Date.now()
            };
            localStorage.setItem(
                this.CACHE_KEY_PREFIX + activityId,
                JSON.stringify(cache)
            );
        } catch (error) {
            console.warn('[Image] Cache save failed:', error);
        }
    },

    /**
     * Retrieve image data from localStorage cache
     */
    getFromCache(activityId) {
        try {
            const cached = localStorage.getItem(this.CACHE_KEY_PREFIX + activityId);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const { timestamp } = data;
            
            // Check if cache is still valid
            if (Date.now() - timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(this.CACHE_KEY_PREFIX + activityId);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('[Image] Cache retrieval failed:', error);
            return null;
        }
    },

    /**
     * Track download on Unsplash (required for production access)
     */
    async trackDownload(downloadUrl) {
        if (!downloadUrl) return;
        
        try {
            // Add client_id to download tracking URL
            const url = new URL(downloadUrl);
            url.searchParams.set('client_id', this.UNSPLASH_API_KEY);
            
            // Fire and forget - no need to wait
            fetch(url, { method: 'GET' }).catch(e => {
                console.warn('[Image] Download tracking failed:', e);
            });
            
            console.log('[Image] Download tracked');
        } catch (error) {
            console.warn('[Image] Download tracking error:', error);
        }
    },

    /**
     * Clear all cached images
     */
    clearCache() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.CACHE_KEY_PREFIX)) {
                    localStorage.removeItem(key);
                }
            });
            console.log('[Image] Cache cleared');
        } catch (error) {
            console.warn('[Image] Cache clear failed:', error);
        }
    },

    /**
     * Set Unsplash API key (call this after initialization)
     */
    setApiKey(key) {
        this.UNSPLASH_API_KEY = key;
        console.log('[Image] API key configured');
    }
};

// Make service available globally
if (typeof window !== 'undefined') {
    window.ImageService = ImageService;
}
