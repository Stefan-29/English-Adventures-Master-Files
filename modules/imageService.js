const ImageService = {
    API_URL: 'https://commons.wikimedia.org/w/api.php',
    CACHE_KEY_PREFIX: 'grammar101_commons_img_v2_',
    CACHE_DURATION: 30 * 24 * 60 * 60 * 1000,
    imageMapping: {},

    async init() {
        try {
            const response = await fetch('./config/imageMapping.json');
            if (!response.ok) {
                throw new Error(`Image mapping request failed: ${response.status}`);
            }
            this.imageMapping = await response.json();
            console.log(`[Image] Loaded ${Object.keys(this.imageMapping).length} local image mappings`);
        } catch (error) {
            console.warn('[Image] Could not load local mappings; remote images and fallback remain available:', error.message);
        }
    },

    async getImageData(activity, moduleId = '') {
        const activeModuleId = moduleId || (typeof App !== 'undefined' ? App.currentGrammarModuleId : '');

        if (activity.image && this.isSafeImageUrl(activity.image)) {
            return this.createLocalImageData(activity.image);
        }

        const cacheId = this.getCacheId(activeModuleId, activity.id, this.getSearchQuery(activity));
        const cached = this.getFromCache(cacheId);
        if (cached) return cached;

        const remoteImage = await this.fetchFromWikimedia(activity, activeModuleId);
        if (remoteImage) return remoteImage;

        const mappedImage = this.getMappedImageData(activity, activeModuleId);
        if (mappedImage) return mappedImage;

        return {
            imageUrl: this.generatePlaceholder(),
            credit: '',
            photographerUrl: null,
            photoUrl: null,
            sourceName: '',
            licenseName: '',
            licenseUrl: null,
            description: '',
            isLocal: true
        };
    },

    async getImageUrl(activity, moduleId) {
        const data = await this.getImageData(activity, moduleId);
        return data.imageUrl;
    },

    getMappedImageData(activity, moduleId) {
        const moduleMapping = this.imageMapping[`${moduleId}:${activity.id}`];
        const legacyMapping = this.imageMapping[activity.id];
        const localData = moduleMapping || legacyMapping;
        if (!localData?.path) return null;

        if (!moduleMapping && moduleId) {
            const pathSegments = localData.path.split('/');
            if (!pathSegments.includes(moduleId)) return null;
        }

        return {
            imageUrl: localData.path,
            credit: localData.credit || 'Local Asset',
            photographerUrl: localData.photographerUrl || null,
            photoUrl: localData.photoUrl || null,
            sourceName: localData.sourceName || (localData.photoUrl?.includes('unsplash.com') ? 'Unsplash' : ''),
            licenseName: localData.licenseName || '',
            licenseUrl: localData.licenseUrl || null,
            description: '',
            isLocal: true
        };
    },

    createLocalImageData(imageUrl) {
        return {
            imageUrl,
            credit: 'Local Asset',
            photographerUrl: null,
            photoUrl: null,
            sourceName: '',
            licenseName: '',
            licenseUrl: null,
            description: '',
            isLocal: true
        };
    },

    getCacheId(moduleId, activityId, searchQuery = '') {
        return encodeURIComponent(`${moduleId || 'default'}:${activityId}:${searchQuery.toLowerCase()}`);
    },

    getSearchQuery(activity) {
        const curatedQuery = activity.imageQuery?.trim();
        if (curatedQuery) return curatedQuery;
        return this.extractKeywords(activity.question || '').join(' ');
    },

    async fetchFromWikimedia(activity, moduleId = '') {
        const query = this.getSearchQuery(activity);
        if (!query) return null;

        const url = new URL(this.API_URL);
        url.search = new URLSearchParams({
            action: 'query',
            format: 'json',
            formatversion: '2',
            origin: '*',
            generator: 'search',
            gsrsearch: `filetype:bitmap ${query}`,
            gsrnamespace: '6',
            gsrlimit: '1',
            prop: 'imageinfo',
            iiprop: 'url|extmetadata',
            iiurlwidth: '1200'
        }).toString();

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`Wikimedia Commons request failed: ${response.status}`);
            }

            const data = await response.json();
            const pages = Array.isArray(data.query?.pages)
                ? data.query.pages
                : Object.values(data.query?.pages || {});
            const imageInfo = pages[0]?.imageinfo?.[0];
            const imageUrl = imageInfo?.thumburl || imageInfo?.url;
            const photoUrl = imageInfo?.descriptionurl;
            if (!this.isSafeImageUrl(imageUrl) || !this.isSafeImageUrl(photoUrl)) return null;

            const metadata = imageInfo.extmetadata || {};
            const imageData = {
                imageUrl,
                credit: this.readMetadataText(metadata.Artist?.value) ||
                    this.readMetadataText(metadata.Credit?.value) ||
                    'Wikimedia Commons contributor',
                photographerUrl: null,
                photoUrl,
                sourceName: 'Wikimedia Commons',
                licenseName: this.readMetadataText(metadata.LicenseShortName?.value),
                licenseUrl: this.getSafeHttpUrl(metadata.LicenseUrl?.value),
                description: this.readMetadataText(metadata.ImageDescription?.value),
                isLocal: false
            };

            this.saveToCache(this.getCacheId(moduleId, activity.id, query), imageData);
            console.log(`[Image] Matched "${query}" to a Wikimedia Commons image for ${activity.id}`);
            return imageData;
        } catch (error) {
            const reason = error.name === 'AbortError' ? 'request timed out' : error.message;
            console.warn(`[Image] Wikimedia Commons image lookup failed for ${activity.id}: ${reason}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    },

    extractKeywords(question) {
        const commonWords = new Set([
            'the', 'and', 'but', 'for', 'with', 'from', 'into', 'about', 'your', 'you', 'are',
            'was', 'were', 'will', 'would', 'could', 'should', 'have', 'has', 'had', 'does',
            'did', 'what', 'when', 'where', 'which', 'who', 'why', 'how', 'write', 'using',
            'use', 'include', 'including', 'describe', 'explain', 'tell', 'create', 'make',
            'complete', 'correct', 'choose', 'select', 'answer', 'question', 'activity',
            'sentences', 'sentence', 'words', 'word', 'grammar', 'grammatical', 'tense',
            'tenses', 'verb', 'verbs', 'past', 'future', 'present', 'simple', 'continuous',
            'perfect', 'modal', 'modals', 'form', 'forms', 'structure', 'structures',
            'beginning', 'short', 'long', 'specific', 'appropriate', 'using', 'must',
            'then', 'that', 'this', 'these', 'those', 'they', 'them', 'their', 'there',
            'after', 'before', 'while', 'until', 'also', 'once', 'twice', 'time',
            'actually', 'imagine', 'first', 'last', 'next', 'more', 'many', 'much',
            'piece', 'pieces', 'using', 'based', 'correctly', 'explain'
        ]);

        const words = question.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
        return [...new Set(words)]
            .filter(word => !commonWords.has(word))
            .slice(0, 4);
    },

    readMetadataText(value) {
        if (typeof value !== 'string') return '';
        if (typeof DOMParser !== 'undefined') {
            const document = new DOMParser().parseFromString(value, 'text/html');
            return document.body.textContent.trim();
        }
        return value
            .replace(/<[^>]*>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/\s+/g, ' ')
            .trim();
    },

    getSafeHttpUrl(value) {
        if (typeof value !== 'string') return null;
        try {
            const url = new URL(value);
            return url.protocol === 'https:' ? url.href : null;
        } catch {
            return null;
        }
    },

    isSafeImageUrl(value) {
        return typeof value === 'string' && (
            value.startsWith('assets/') ||
            value.startsWith('data:image/') ||
            Boolean(this.getSafeHttpUrl(value))
        );
    },

    generatePlaceholder() {
        return 'assets/fallback.jpg';
    },

    saveToCache(cacheId, imageData) {
        try {
            localStorage.setItem(
                this.CACHE_KEY_PREFIX + cacheId,
                JSON.stringify({ ...imageData, timestamp: Date.now() })
            );
        } catch (error) {
            console.warn('[Image] Cache save failed:', error);
        }
    },

    getFromCache(cacheId) {
        try {
            const key = this.CACHE_KEY_PREFIX + cacheId;
            const cached = localStorage.getItem(key);
            if (!cached) return null;

            const data = JSON.parse(cached);
            if (!data.timestamp || Date.now() - data.timestamp > this.CACHE_DURATION) {
                localStorage.removeItem(key);
                return null;
            }
            return data;
        } catch (error) {
            console.warn('[Image] Cache retrieval failed:', error);
            return null;
        }
    },

    clearCache() {
        try {
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.CACHE_KEY_PREFIX))
                .forEach(key => localStorage.removeItem(key));
            console.log('[Image] Image cache cleared');
        } catch (error) {
            console.warn('[Image] Cache clear failed:', error);
        }
    }
};

if (typeof window !== 'undefined') {
    window.ImageService = ImageService;
}
