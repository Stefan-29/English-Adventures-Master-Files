# Code Flow: How Production Features Work

## 🔄 Image Loading & Attribution Flow

```
User loads Writing Activity
    ↓
WritingModule.renderActivities()
    ↓
Creates activity card with placeholder image
    ↓
WritingModule.preloadActivityImages()
    ↓
For each activity: ImageService.getImageData(activity)
    ↓
    ├─ Check cache? → Return cached data
    │
    └─ No cache → Fetch from Unsplash API
        ↓
        ├─ Extract keywords from question
        ├─ Query: /search/photos?query=...&client_id=KEY
        │
        └─ Response includes:
            ├─ photo.urls.regular (image URL)
            ├─ photo.user.name (photographer)
            ├─ photo.user.portfolio_url (photographer link)
            ├─ photo.links.html (hotlink to photo)
            ├─ photo.links.download_location (tracking URL)
            └─ photo.id (for reference)
        ↓
        Save to cache (localStorage)
        ↓
        Return imageData object:
        {
          imageUrl: "https://images.unsplash.com/photo-...",
          credit: "John Smith",
          photographerUrl: "https://unsplash.com/@johnsmith",
          photoUrl: "https://unsplash.com/photos/abc123",
          downloadUrl: "https://api.unsplash.com/downloads/abc123",
          unsplashId: "abc123"
        }
    ↓
WritingModule updates card with real image
    ↓
HTML rendered:
<a href="https://unsplash.com/photos/abc123" target="_blank">
  <img src="https://images.unsplash.com/photo-..." 
       class="activity-image">
</a>
<div class="image-attribution">
  Photo by <a href="https://unsplash.com/@johnsmith">John Smith</a> 
  on <a href="https://unsplash.com/photos/abc123">Unsplash</a>
</div>
    ↓
✅ Image is hotlinked
✅ Photographer is credited with working link
✅ "Unsplash" links to original photo
```

---

## 📥 Download Tracking Flow

```
Image loads on page
    ↓
Image 'load' event fires
    ↓
ImageService.trackDownload(downloadUrl)
    ↓
Build URL: https://api.unsplash.com/downloads/photo-id?client_id=KEY
    ↓
fetch(url) — Fire and forget (non-blocking)
    ↓
Unsplash registers 1 download
    ↓
✅ Download count incremented
✅ Quota usage tracked


Alternative trigger: User clicks hotlink
    ↓
'click' event on image link
    ↓
ImageService.trackDownload(downloadUrl)
    ↓
[Same as above]
    ↓
✅ Download tracked again
```

---

## 🎨 Styling & Visual Hierarchy

```
Activity Card
├─ Header (Activity 1, Status)
├─ Question Text
├─ [IMAGE SECTION] ← NEW: Wrapped in hotlink
│  ├─ <a href="unsplash-photo">
│  │  └─ <img class="activity-image">
│  └─ </a>
│  └─ <div class="image-attribution">
│     └─ Photo by <a>Name</a> on <a>Unsplash</a>
├─ Textarea (user writes answer)
├─ Show Hint button
└─ Check / Skip buttons
```

CSS applied:
- `.image-link` - Hover effect on image
- `.image-attribution` - Small gray text below image
- `.activity-image` - Max height 250px, responsive
- Links styled as primary color with underline on hover

---

## 💾 Data Persistence

### LocalStorage Structure

**Key**: `grammar101_img_[activity-id]`
**Value**: JSON object
```json
{
  "imageUrl": "https://images.unsplash.com/...",
  "credit": "Jane Photographer",
  "photographerUrl": "https://unsplash.com/@janephoto",
  "photoUrl": "https://unsplash.com/photos/xyz789",
  "downloadUrl": "https://api.unsplash.com/downloads/xyz789",
  "unsplashId": "xyz789",
  "timestamp": 1673456789000
}
```

**Duration**: 30 days
- After 30 days: Cache expires, new fetch from API
- Benefit: Save API quota for repeat users

---

## 🔐 Security Measures

1. **Link Security**
   - `target="_blank"` - Opens in new tab
   - `rel="noopener noreferrer"` - Prevents security exploits
   - Photographer URLs validated by Unsplash API

2. **API Key**
   - Public key (not secret) - safe to expose
   - Can only read public photos
   - Secret key never exposed in client code

3. **CORS**
   - Unsplash API allows direct client-side requests
   - No backend proxy needed
   - Rate limits per client_id (your API key)

---

## 📊 Quota Usage

### Per-hour Requests

Each activity card that loads makes requests:
1. Image fetch from Unsplash (cached, only first load)
2. Download tracking (lightweight, cached)

**Example**: 
- 10 students viewing 5 activities = 50 requests
- Current limit: 50/hour ✓ (tight fit)
- **After production**: 5,000/hour (100x more capacity!)

---

## 🧬 Backward Compatibility

### Old Code (still works!)
```javascript
// This still works - returns just the image URL
const imageUrl = await ImageService.getImageUrl(activity);
// Returns: "https://images.unsplash.com/..."
```

### New Code (enhanced!)
```javascript
// New method - returns full photo data
const imageData = await ImageService.getImageData(activity);
// Returns: { imageUrl, credit, photographerUrl, photoUrl, downloadUrl }
```

Both work together - no breaking changes!

---

## 🚨 Error Handling

If Unsplash API fails:
1. Returns cached image (if available)
2. Falls back to generated placeholder (colorful canvas)
3. Console warning logged
4. User still gets content (no broken page)
5. Can retry on next page load

---

## ✅ Unsplash Compliance Checklist

| Requirement | Implementation | Status |
|---|---|---|
| Hotlink photos | `<a href="photoUrl">` wrapper | ✅ |
| Trigger downloads | `trackDownload()` on load & click | ✅ |
| Proper attribution | "Photo by X on Unsplash" with links | ✅ |
| Visual distinction | "Fetch Auto Images" not "Unsplash" | ✅ |
| Photographer credit | Links to `photographer.portfolio_url` | ✅ |
| Credit to Unsplash | Links to photo on `unsplash.com` | ✅ |

All requirements met! 🎉

