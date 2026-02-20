# 🔑 API Key Setup Reminder

## For Production/Testing

### Option 1: Browser Console (Temporary)
**When to use**: Testing, one-time setup
**How long it lasts**: Until page refresh

```javascript
// Open DevTools: F12 → Console tab → Paste:
ImageService.setApiKey('YOUR_UNSPLASH_ACCESS_KEY')
localStorage.setItem('unsplash_api_key', 'YOUR_UNSPLASH_ACCESS_KEY')
```

---

### Option 2: LocalStorage (Persistent)
**When to use**: Development
**How long it lasts**: Until you clear localStorage

Already configured! Just get your key:
1. Register: https://unsplash.com/developers
2. Create Application
3. Copy **Access Key**
4. Paste into console (see Option 1)

---

### Option 3: Environment Variable (Production)
**When to use**: Deployment
**How long it lasts**: Permanent (until changed)

Create `.env` file:
```
VITE_UNSPLASH_KEY=YOUR_KEY_HERE
```

Or add to server startup:
```bash
UNSPLASH_API_KEY=YOUR_KEY_HERE npm start
```

---

### Option 4: Admin Panel (Future)
Add settings page where users can:
- Enter their own API key
- Clear cache
- View image stats
- Choose image sources (Unsplash/Pixabay/Pexels)

---

## Current Implementation

✅ **Auto-loads from localStorage** on app startup:
```javascript
const unsplashKey = localStorage.getItem('unsplash_api_key');
if (unsplashKey) {
    ImageService.setApiKey(unsplashKey);
}
```

✅ **Falls back gracefully** if no key:
- Uses canvas placeholders
- Never breaks the app
- Works offline

---

## Testing Without API Key

The app **works perfectly** without Unsplash API:
```javascript
// Test placeholder generation
ImageService.generatePlaceholder({
    id: 'writing-1',
    question: 'Tell a story'
})
// Returns: colorful canvas image data URL
```

---

## Production Checklist

- [ ] Get Unsplash API key
- [ ] Add to localStorage or .env
- [ ] Test in console: `ImageService.UNSPLASH_API_KEY`
- [ ] Verify images load on app refresh
- [ ] Check browser console for "[Image]" logs
- [ ] Monitor API rate limits (50/hour)
