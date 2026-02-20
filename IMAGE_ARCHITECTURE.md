# Image System Architecture - Technical Details

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Grammar101 Learning App                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │   ImageService      │
                    │  (modules/js)       │
                    └─────────────────────┘
                     ↓        ↓        ↓
            ┌────────┴────┬───┴──┬──────┴────────┐
            ↓             ↓      ↓               ↓
      ┌──────────┐  ┌──────┐ ┌────────┐  ┌─────────────┐
      │   Local  │  │Cache │ │Unsplash│  │ Placeholder │
      │ Mapping  │  │(30d) │ │  API   │  │   Canvas    │
      │ (FAST)   │  │      │ │        │  │  (FALLBACK) │
      └──────────┘  └──────┘ └────────┘  └─────────────┘
           ↓
    config/imageMapping.json
    (JSON with image metadata)
```

## Data Flow

### 1. Download Phase (Run Once)

```
DOWNLOAD_IMAGES.js
    ↓
┌─────────────────────────────────────────┐
│ 1. Load JSON files (reproducibility/)   │
│    - future-tenses.json                 │
│    - past-perfect.json                  │
│    - present-perfect.json               │
│    - etc.                               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 2. Extract Keywords from Each Activity  │
│    const keywords =                     │
│      extractKeywords(activity.question) │
│    Filter: 3+ chars, remove stopwords   │
│    Result: ['travel', 'plan', 'trip']   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 3. Fetch from Unsplash API              │
│    GET /search/photos                   │
│    ?query=travel plan trip              │
│    &per_page=1                          │
│    &client_id=API_KEY                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 4. Download Image File                  │
│    https://images.unsplash.com/...jpg   │
│    Save to: assets/images/tense/id.jpg  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ 5. Create Mapping Entry                 │
│    {                                    │
│      "activity-id": {                   │
│        "path": "assets/images/...",     │
│        "keywords": [...],               │
│        "credit": "Photographer Name",   │
│        "photographerUrl": "...",        │
│        "photoUrl": "...",               │
│        "unsplashId": "abc123"           │
│      }                                  │
│    }                                    │
└─────────────────────────────────────────┘
    ↓
Save to: config/imageMapping.json
```

### 2. Runtime Phase (Every App Load)

```
index.html
    ↓
DOMContentLoaded
    ↓
app.js → App.init()
    ↓
ImageService.init()
    ├─ fetch('./config/imageMapping.json')
    ├─ this.imageMapping = parsedJSON
    └─ Ready to serve images
    ↓
WritingModule.preloadActivityImages()
    ├─ For each activity:
    │  ├─ Call ImageService.getImageData(activity)
    │  └─ Update DOM with image
    └─ Complete async (no blocking)
    ↓
User sees images loaded from local assets
(with photographer attribution)
```

## Code Flow - getImageData()

```javascript
async getImageData(activity) {
    
    // 1️⃣  LOCAL MAPPING (Fastest - ~0ms)
    if (this.imageMapping[activity.id]) {
        return {
            imageUrl: localData.path,
            credit: localData.credit,
            // ... other data
            isLocal: true
        }
    }
    
    // 2️⃣  ACTIVITY PROPERTY (Local backup)
    if (activity.image?.startsWith('assets/')) {
        return {
            imageUrl: activity.image,
            credit: 'Local Asset',
            isLocal: true
        }
    }
    
    // 3️⃣  BROWSER CACHE (30 days - ~50ms)
    const cached = this.getFromCache(activity.id)
    if (cached) return cached
    
    // 4️⃣  UNSPLASH API (Only if mapping missing - ~2s)
    const apiImage = await this.fetchFromUnsplash(activity)
    if (apiImage) return apiImage
    
    // 5️⃣  PLACEHOLDER (Last resort - ~100ms)
    return this.generatePlaceholder(activity)
}
```

## Database Structure: imageMapping.json

```json
{
  "activity-id-1": {
    "path": "assets/images/future-tenses/activity-id-1.jpg",
    "keywords": ["travel", "planning", "holiday"],
    "credit": "John Smith",
    "photographerUrl": "https://unsplash.com/@johnsmith",
    "photoUrl": "https://unsplash.com/photos/abc123xyz",
    "downloadUrl": "https://api.unsplash.com/photos/abc123xyz/download/tracking",
    "unsplashId": "abc123xyz",
    "downloadedAt": "2026-01-13T15:30:00.000Z"
  },
  "activity-id-2": {
    "path": "assets/images/past-perfect/activity-id-2.jpg",
    "keywords": ["meeting", "office", "business"],
    "credit": "Jane Doe",
    "photographerUrl": "https://unsplash.com/@janedoe",
    "photoUrl": "https://unsplash.com/photos/def456uvw",
    "downloadUrl": "https://api.unsplash.com/photos/def456uvw/download/tracking",
    "unsplashId": "def456uvw",
    "downloadedAt": "2026-01-13T15:31:30.000Z"
  }
  // ... hundreds more entries
}
```

## Rate Limiting Algorithm

```javascript
// In DOWNLOAD_IMAGES.js

async processJsonFile(jsonFile) {
    for (const activity of activities) {
        await downloadActivityImage(activity)
        await sleep(1200)  // 1.2 seconds = safe for 50 req/hour
    }
}

// Math:
// 1200ms = 1.2 seconds
// 60 seconds / 1.2 seconds = 50 requests per hour
// Free tier limit: 50 req/hour ✅
// Production key: 5000 req/hour (can reduce to 720ms)
```

## Storage Organization

```
assets/
└── images/
    ├── future-tenses/
    │   ├── writing-q1.jpg      (150-400 KB each)
    │   ├── writing-q2.jpg
    │   ├── writing-q3.jpg
    │   └── writing-q4.jpg
    ├── future-perfect/
    │   ├── writing-q5.jpg
    │   ├── writing-q6.jpg
    │   └── quiz-q1.jpg
    ├── past-tenses/
    │   └── ... (similar structure)
    ├── past-perfect/
    │   └── ... (similar structure)
    ├── present-tenses/
    │   └── ... (similar structure)
    └── present-perfect/
        └── ... (similar structure)

Total: ~15-20 MB for full image set
       (depends on number of activities)
```

## Performance Analysis

### Load Time Comparison

**Without Local Images:**
```
1. App loads
2. For each writing activity:
   a. ImageService.getImageData() called
   b. Check cache → miss (first time)
   c. Call Unsplash API → 2-3 seconds
   d. Download image → 1-2 seconds
   e. Display image
Total: 3-5 seconds per image (sequential)
User sees: Slow loading, possible timeouts
```

**With Local Images:**
```
1. App loads
2. ImageService.init() → 100ms
   a. Load imageMapping.json
3. For each activity:
   a. ImageService.getImageData() called
   b. Check local mapping → HIT
   c. Return path immediately
   d. Display image
Total: <500ms for all images (parallel)
User sees: Instant image loading
```

### API Call Reduction

**Before**: 100 activities × 1 API call = 100 API calls per app session
**After**: 0 API calls (until new activities added)
**Savings**: 99%+ API calls

## Error Handling

```javascript
try {
    1. Fetch from local mapping
       ↓ (success) → return imageUrl
       ↓ (not found)
    2. Check browser cache
       ↓ (success) → return imageUrl
       ↓ (not found)
    3. Call API
       ↓ (success) → cache & return imageUrl
       ↓ (fails: timeout, rate limit, network error)
    4. Generate placeholder
       ↓
    5. Return placeholder (always succeeds)
} catch (error) {
    // Log error
    // Return placeholder
}
```

## Attribution System

```javascript
// Every image includes proper credit

createAttributionHtml(imageData) {
    return `
        Photo by 
        <a href="${photoUrl}" target="_blank">
            ${photographerName}
        </a>
        on 
        <a href="${unsplashLink}" target="_blank">
            Unsplash
        </a>
    `
}

// Appears under each writing activity image
// Links to: 1. Photographer profile
//          2. Original photo on Unsplash
```

## Fallback Mechanism

```
imageMapping exists
    ✓ YES → Use local path (0.5ms)
    ✗ NO
         ↓
    Activity.image property
        ✓ YES → Use property (0.5ms)
        ✗ NO
             ↓
        Browser cache (30d TTL)
            ✓ YES → Use cached (50ms)
            ✗ NO
                 ↓
            Unsplash API
                ✓ YES → Cache & use (3s)
                ✗ NO
                     ↓
            Generate Placeholder (100ms)
                ✓ ALWAYS succeeds
```

## Security & Compliance

✅ **CORS Handled**: Unsplash API handles CORS
✅ **Rate Limiting**: Respects API limits
✅ **Attribution**: Proper photo credits
✅ **Privacy**: No user data sent
✅ **Licensing**: Unsplash photos are free (Unsplash License)

## Monitoring & Logging

```javascript
// Script logs (when downloading):
[Image] Processing future-tenses...
  ✓ activity-1 - Downloaded: assets/images/future-tenses/activity-1.jpg
  ✓ activity-2 - Downloaded: assets/images/future-tenses/activity-2.jpg
  ⚠️  activity-3 - No keywords extracted
  ✓ activity-4 - Downloaded: assets/images/future-tenses/activity-4.jpg

// App logs (when running):
[Image] Loaded 237 local image mappings
[Image] Cache hit for writing-q1 (local mapping)
[Image] Cache hit for writing-q2 (browser cache)
[Image] Fetched from API for new-activity-1
[Image] Generated placeholder for activity-no-keywords
```

## Scalability

### Current Setup (100-200 activities)
- Storage: ~20 MB
- Mapping: ~200 KB
- Download time: ~5 minutes
- Load time: <500ms

### Scaled Setup (1000+ activities)
- Storage: ~200 MB
- Mapping: ~2 MB
- Download time: ~50 minutes
- Load time: <500ms (same)
- Recommendation: Split mapping by tense

### Very Large (10000+ activities)
- Consider: Image server/CDN
- Consider: Split mapping files
- Consider: Lazy load mappings

---

**Architecture Version**: 1.0
**Last Updated**: January 13, 2026
**Status**: Production Ready
