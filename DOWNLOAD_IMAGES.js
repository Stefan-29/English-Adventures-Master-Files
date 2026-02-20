/**
 * Image Downloader Script for Grammar101
 * Downloads and manages images locally from Unsplash API
 * Organized by tense type with proper file structure
 * 
 * Usage: node DOWNLOAD_IMAGES.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ImageDownloader = {
    UNSPLASH_API_KEY: 'RPN3zTHnp4Y1N6XNuKr15qPLjQYWaeBeS1JNFgt_v1s',
    API_URL: 'https://api.unsplash.com/search/photos',
    ASSETS_BASE: './assets/images',
    CONFIG_FILE: './config/imageMapping.json',
    
    // Tense folder mapping
    TENSE_FOLDERS: {
        'future-tenses': 'future-tenses',
        'future-perfect': 'future-perfect',
        'past-tenses': 'past-tenses',
        'past-perfect': 'past-perfect',
        'present-tenses': 'present-tenses',
        'present-perfect': 'present-perfect'
    },

    // JSON files to process
    JSON_FILES: [
        './reproducibility/future-tenses.json',
        './reproducibility/future-perfect.json',
        './reproducibility/past-tenses.json',
        './reproducibility/past-perfect.json',
        './reproducibility/present-tenses.json',
        './reproducibility/present-perfect.json'
    ],

    /**
     * Initialize directories and start the download process
     */
    async init() {
        console.log('\n🎨 Grammar101 Image Downloader\n');
        console.log('📁 Initializing directories...');
        
        // Create base images directory
        if (!fs.existsSync(this.ASSETS_BASE)) {
            fs.mkdirSync(this.ASSETS_BASE, { recursive: true });
            console.log(`✓ Created ${this.ASSETS_BASE}`);
        }

        // Create tense-specific folders
        for (const [key, folder] of Object.entries(this.TENSE_FOLDERS)) {
            const dirPath = path.join(this.ASSETS_BASE, folder);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✓ Created ${dirPath}`);
            }
        }

        // Load or create image mapping
        this.loadImageMapping();

        // Process each JSON file
        for (const jsonFile of this.JSON_FILES) {
            await this.processJsonFile(jsonFile);
        }

        // Save updated mapping
        this.saveImageMapping();
        console.log('\n✅ Download process complete!\n');
    },

    /**
     * Load existing image mapping from config
     */
    loadImageMapping() {
        if (fs.existsSync(this.CONFIG_FILE)) {
            const data = fs.readFileSync(this.CONFIG_FILE, 'utf-8');
            this.imageMapping = JSON.parse(data);
            console.log(`✓ Loaded existing image mapping (${Object.keys(this.imageMapping).length} entries)`);
        } else {
            this.imageMapping = {};
            console.log('✓ Created new image mapping');
        }
    },

    /**
     * Save image mapping to config
     */
    saveImageMapping() {
        const dir = path.dirname(this.CONFIG_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(this.CONFIG_FILE, JSON.stringify(this.imageMapping, null, 2));
        console.log(`✓ Saved image mapping to ${this.CONFIG_FILE}`);
    },

    /**
     * Process a single JSON file
     */
    async processJsonFile(jsonFilePath) {
        try {
            if (!fs.existsSync(jsonFilePath)) {
                console.warn(`⚠️  File not found: ${jsonFilePath}`);
                return;
            }

            const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));
            const tenseType = this.getTenseType(jsonFilePath);
            const tenseFolderName = this.TENSE_FOLDERS[tenseType];

            console.log(`\n📚 Processing ${tenseType}...`);

            // Process writing activities
            if (jsonData.writingActivities && Array.isArray(jsonData.writingActivities)) {
                for (const activity of jsonData.writingActivities) {
                    await this.downloadActivityImage(activity, tenseFolderName, tenseType);
                }
            }

            // Process quiz questions
            if (jsonData.quizQuestions && Array.isArray(jsonData.quizQuestions)) {
                for (const question of jsonData.quizQuestions) {
                    await this.downloadActivityImage(question, tenseFolderName, tenseType);
                }
            }

        } catch (error) {
            console.error(`❌ Error processing ${jsonFilePath}:`, error.message);
        }
    },

    /**
     * Download image for a single activity
     */
    async downloadActivityImage(activity, folderName, tenseType) {
        try {
            // Skip if already has local image
            if (activity.image && activity.image.startsWith('assets/')) {
                console.log(`  ✓ ${activity.id} - Already has local image`);
                return;
            }

            // Check if already downloaded
            if (this.imageMapping[activity.id]) {
                console.log(`  ✓ ${activity.id} - Already mapped`);
                return;
            }

            // Extract keywords and fetch image
            const keywords = this.extractKeywords(activity.question || activity.description || activity.title || '');
            
            if (keywords.length === 0) {
                console.log(`  ⚠️  ${activity.id} - No keywords extracted`);
                return;
            }

            const imageData = await this.fetchFromUnsplash(keywords);
            
            if (!imageData) {
                console.log(`  ⚠️  ${activity.id} - No image found for keywords: ${keywords.join(', ')}`);
                return;
            }

            // Download and save image
            const filename = `${activity.id}.jpg`;
            const imagePath = path.join(this.ASSETS_BASE, folderName, filename);
            const relativeImagePath = path.join('assets/images', folderName, filename).replace(/\\/g, '/');

            await this.downloadImage(imageData.urls.regular, imagePath);

            // Update mapping
            this.imageMapping[activity.id] = {
                path: relativeImagePath,
                keywords: keywords,
                credit: imageData.user.name,
                photographerUrl: imageData.user.portfolio_url || imageData.user.links.html,
                photoUrl: imageData.links.html,
                downloadUrl: imageData.links.download_location,
                unsplashId: imageData.id,
                downloadedAt: new Date().toISOString()
            };

            console.log(`  ✓ ${activity.id} - Downloaded: ${relativeImagePath}`);
            
            // Rate limiting - Unsplash allows 50 requests/hour for free tier
            await this.sleep(1200); // 1.2 seconds between requests

        } catch (error) {
            console.error(`  ❌ ${activity.id} - Error:`, error.message);
        }
    },

    /**
     * Fetch image from Unsplash API
     */
    async fetchFromUnsplash(keywords) {
        return new Promise((resolve, reject) => {
            const query = keywords.join(' ');
            const url = `${this.API_URL}?query=${encodeURIComponent(query)}&per_page=1&client_id=${this.UNSPLASH_API_KEY}`;

            https.get(url, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (parsed.results && parsed.results.length > 0) {
                            resolve(parsed.results[0]);
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    },

    /**
     * Download image from URL
     */
    async downloadImage(imageUrl, filePath) {
        return new Promise((resolve, reject) => {
            https.get(imageUrl, (res) => {
                const file = fs.createWriteStream(filePath);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve();
                });
                file.on('error', (err) => {
                    fs.unlink(filePath, () => {});
                    reject(err);
                });
            }).on('error', reject);
        });
    },

    /**
     * Extract keywords from text
     */
    extractKeywords(text) {
        // Common words to filter out
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'can', 'must', 'shall',
            'this', 'that', 'these', 'those', 'which', 'who', 'what', 'when',
            'where', 'why', 'how', 'all', 'each', 'every', 'both', 'neither',
            'such', 'so', 'too', 'very', 'just', 'only', 'own', 'same', 'than',
            'then', 'now', 'more', 'most', 'less', 'least', 'if', 'because'
        ]);

        // Extract words (3+ characters, no numbers)
        const words = text
            .toLowerCase()
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[^\w\s]/g, '') // Remove special characters
            .split(/\s+/)
            .filter(word => word.length >= 3 && !stopWords.has(word) && !/\d/.test(word))
            .slice(0, 5); // Limit to 5 keywords

        // Remove duplicates
        return [...new Set(words)];
    },

    /**
     * Get tense type from file path
     */
    getTenseType(filePath) {
        const filename = path.basename(filePath, '.json');
        return filename;
    },

    /**
     * Sleep utility for rate limiting
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// Run if this is the main module
if (require.main === module) {
    ImageDownloader.init().catch(error => {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    });
}

module.exports = ImageDownloader;
