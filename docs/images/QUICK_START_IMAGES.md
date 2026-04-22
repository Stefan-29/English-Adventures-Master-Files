# Quick Start: Image Download Guide

## 30-Second Setup

```bash
# 1. Open terminal in project directory
cd /path/to/Grammar101

# 2. Run the downloader
node DOWNLOAD_IMAGES.js

# 3. Wait for completion (~5-10 minutes for 100+ images)
# 4. Done! Images are now cached locally
```

## What Gets Downloaded?

- ✅ Writing activity images
- ✅ Quiz question images  
- ✅ Organized by tense type
- ✅ Proper photographer attribution
- ✅ Automatic mapping created

## File Organization After Download

```
assets/images/
├── future-tenses/
│   ├── writing-q1.jpg
│   ├── writing-q2.jpg
│   └── ... (all future tense images)
├── future-perfect/
│   └── ... (all future perfect images)
├── past-tenses/
│   └── ... (all past tense images)
├── past-perfect/
│   └── ... (all past perfect images)
├── present-tenses/
│   └── ... (all present tense images)
└── present-perfect/
    └── ... (all present perfect images)

config/
└── imageMapping.json  (Auto-generated metadata)
```

## How to Track Progress

The script shows:
- ✓ Directory initialization
- ✓ Tense processing
- ✓ Image download counts
- ✓ Final completion

Example output:
```
📚 Processing future-tenses...
  ✓ writing-q1 - Downloaded: assets/images/future-tenses/writing-q1.jpg
  ✓ writing-q2 - Downloaded: assets/images/future-tenses/writing-q2.jpg
  ⚠️  quiz-q3 - No keywords extracted
  ✓ writing-q4 - Downloaded: assets/images/future-tenses/writing-q4.jpg
```

## What Happens Next?

1. **App Loads** → ImageService initializes
2. **Reads Mapping** → Loads `config/imageMapping.json`
3. **Activity Renders** → Uses local image immediately
4. **Fallback Ready** → API/placeholder if local missing

## Image Quality

- **Resolution**: 600x400px (optimized for web)
- **Format**: JPEG (best compression)
- **Credit**: Automatically included
- **Attribution**: Photographer link + Unsplash link

## Common Scenarios

### Scenario 1: First Time Setup
```
1. Run: node DOWNLOAD_IMAGES.js
2. Wait ~10 minutes
3. App automatically uses downloaded images
```

### Scenario 2: Add More Activities
```
1. Add new activities to JSON files
2. Run: node DOWNLOAD_IMAGES.js (again)
3. Script skips existing images
4. Downloads only new ones
```

### Scenario 3: Reset All Images
```
1. Delete: assets/images/ folder
2. Delete: config/imageMapping.json
3. Run: node DOWNLOAD_IMAGES.js
4. Fresh download with all images
```

## Monitoring

Check the mapping file to see what was downloaded:

```bash
# View summary
wc -l config/imageMapping.json

# View specific tense images
grep "future-tenses" config/imageMapping.json | wc -l

# View all credits (photographers)
grep '"credit"' config/imageMapping.json | sort -u
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Takes too long | It's normal - rate limiting safety |
| "API key" error | Key is valid, wait 1 hour to retry |
| Missing images | Run script again - it's resumable |
| Permission denied | Check folder permissions in assets/ |

## Network Impact

- **Download Size**: ~15-20 MB total for all images
- **Time to Download**: 5-10 minutes (depends on internet)
- **Reusable**: Yes! Once downloaded, no API calls needed
- **Storage**: ~40-50 MB including metadata

## Next Steps

✅ Run image downloader
✅ Verify images download
✅ Open app and test writing module
✅ Images should load from local assets

---

**Questions?** Check [IMAGE_MANAGEMENT.md](./IMAGE_MANAGEMENT.md) for detailed guide
