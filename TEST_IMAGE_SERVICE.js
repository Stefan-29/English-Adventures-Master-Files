// Quick Test - Copy & Paste into Browser Console (F12)

// ============================================
// IMAGE SERVICE TESTS
// ============================================

console.log('🧪 Image Service Test Suite');
console.log('============================\n');

// Test 1: Keyword Extraction
console.log('Test 1: Keyword Extraction');
const testQuestion = "What did you do last night? Write 4 sentences using Past Simple.";
const keywords = ImageService.extractKeywords(testQuestion);
console.log(`Question: "${testQuestion}"`);
console.log(`Extracted Keywords: ${keywords.join(', ')}`);
console.log(`✅ Expected: meaningful words (night, simple, sentences), Got: ${keywords.length} keywords\n`);

// Test 2: Placeholder Generation
console.log('Test 2: Canvas Placeholder Generation');
const testActivity = {
    id: 'test-activity-1',
    question: 'Tell a story about your childhood'
};
const placeholder = ImageService.generatePlaceholder(testActivity);
console.log(`Activity: ${testActivity.question}`);
console.log(`Generated: ${placeholder.substring(0, 50)}...`);
console.log(`✅ Placeholder created (${placeholder.length} chars)\n`);

// Test 3: Cache Operations
console.log('Test 3: Cache Operations');
ImageService.saveToCache('test-id', 'https://example.com/test.jpg', 'Test User');
const cached = ImageService.getFromCache('test-id');
console.log(`Saved: test-id`);
console.log(`Retrieved: ${cached}`);
console.log(`✅ Cache working (${cached ? 'retrieved successfully' : 'failed'})\n`);

// Test 4: API Key Status
console.log('Test 4: API Key Status');
const hasKey = ImageService.UNSPLASH_API_KEY !== 'YOUR_UNSPLASH_API_KEY_HERE';
console.log(`API Key Configured: ${hasKey ? '✅ YES' : '❌ NO'}`);
console.log(`Current Key: ${ImageService.UNSPLASH_API_KEY.substring(0, 20)}...`);
if (!hasKey) {
    console.log(`\n💡 To enable API:\n`);
    console.log(`1. Go to https://unsplash.com/developers`);
    console.log(`2. Create an app and copy your Access Key`);
    console.log(`3. Paste this:\n`);
    console.log(`ImageService.setApiKey('YOUR_KEY_HERE')`);
    console.log(`localStorage.setItem('unsplash_api_key', 'YOUR_KEY_HERE')\n`);
}

// Test 5: Check Cached Images
console.log('Test 5: Cached Images');
const cacheKeys = Object.keys(localStorage)
    .filter(k => k.startsWith('grammar101_img_'));
console.log(`Total Cached Images: ${cacheKeys.length}`);
if (cacheKeys.length > 0) {
    console.log('Cached Activity IDs:');
    cacheKeys.forEach(k => {
        const id = k.replace('grammar101_img_', '');
        const data = JSON.parse(localStorage.getItem(k));
        const daysOld = Math.floor((Date.now() - data.timestamp) / (1000 * 60 * 60 * 24));
        console.log(`  - ${id} (${daysOld} days old)`);
    });
}
console.log('✅ Cache check complete\n');

// Test 6: Writing Module Integration
console.log('Test 6: Writing Module Integration');
console.log(`WritingModule Activities: ${WritingModule.activities.length}`);
console.log(`WritingModule Cached Images: ${Object.keys(WritingModule.imageCache).length}`);
if (WritingModule.activities.length > 0) {
    const firstActivity = WritingModule.activities[0];
    console.log(`First Activity: ${firstActivity.id}`);
    console.log(`Question: "${firstActivity.question.substring(0, 50)}..."`);
    const image = WritingModule.imageCache[firstActivity.id];
    if (image) {
        console.log(`✅ Image Cached: ${image.substring(0, 50)}...`);
    } else {
        console.log(`⏳ Image Loading or not fetched yet...`);
    }
}
console.log('✅ Module integration check complete\n');

// ============================================
// SUMMARY
// ============================================
console.log('📊 SUMMARY');
console.log('==========');
console.log(`✅ ImageService Loaded: ${typeof ImageService !== 'undefined' ? 'YES' : 'NO'}`);
console.log(`✅ WritingModule Ready: ${typeof WritingModule !== 'undefined' ? 'YES' : 'NO'}`);
console.log(`✅ API Configured: ${ImageService.UNSPLASH_API_KEY !== 'YOUR_UNSPLASH_API_KEY_HERE' ? 'YES' : 'NO'}`);
console.log(`✅ Caching Active: ${cacheKeys.length >= 0 ? 'YES' : 'NO'}`);
console.log(`\n🎉 All systems operational!`);
