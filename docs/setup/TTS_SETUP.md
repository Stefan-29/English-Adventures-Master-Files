# 🎤 Text-to-Speech (TTS) Voice Model Upgrade

## Overview

The lesson audio feature now uses **ElevenLabs AI** for professional-quality neural voices, with automatic fallback to the browser's Web Speech API.

**Quality Comparison:**
- **Old**: Browser built-in voices (limited, robotic)
- **New**: ElevenLabs neural voices (natural, professional, multiple options)

---

## Setup Options

### Option 1: Use Without API Key (Recommended for Testing)
The app automatically falls back to improved Web Speech API voices.

```javascript
// The app automatically uses better system voices:
// - Google US English
// - Microsoft Zira
// - Native voices (varies by OS)
```

**Pros:** No setup required, works immediately
**Cons:** Quality depends on system voice availability

---

### Option 2: Add ElevenLabs API Key (Production)

#### Step 1: Create Free ElevenLabs Account
1. Go to: https://elevenlabs.io
2. Click "Sign Up"
3. Verify email

#### Step 2: Get Your API Key
1. Log in to ElevenLabs
2. Click profile icon → "API Key"
3. Copy your API key
4. **Keep it private!** Never commit to GitHub

#### Step 3: Add Key to App

**Option A: Browser Console (Temporary)**
```javascript
// Open DevTools: F12 → Console → Paste:
TextToSpeechService.setApiKey('your-api-key-here')
```
Lasts until page refresh.

**Option B: LocalStorage (Persistent)**
```javascript
// Open DevTools: F12 → Console → Paste:
localStorage.setItem('elevenlabs_api_key', 'your-api-key-here')
```
Persists until localStorage is cleared.

**Option C: Environment Variable (Production)**
```bash
# Create .env file in project root:
ELEVENLABS_API_KEY=your-api-key-here

# Or start server with:
ELEVENLABS_API_KEY=your-api-key-here npm start
```

---

## Available Voices

### Premium Neural Voices (ElevenLabs)
```javascript
// Default voice - Clear & Professional
TextToSpeechService.setVoice('rachel')
// Output: "Rachel (Female) - Clear, professional female voice"

// Alternative voices available:
TextToSpeechService.setVoice('sam')
// Output: "Sam (Male) - Clear, professional male voice"

TextToSpeechService.setVoice('bella')
// Output: "Bella (Female) - Warm, engaging female voice"
```

### Fallback: System Voices (Web Speech API)
If no ElevenLabs key is set, the app uses the best available system voice:
- Google US English (preferred)
- Microsoft Zira (Windows)
- Native OS voices

---

## Features

✅ **Automatic Fallback**: If ElevenLabs API fails, uses Web Speech API
✅ **Voice Persistence**: Your voice preference is saved
✅ **Better Rate Control**: Adjustable speaking speed (default: 0.95)
✅ **Multiple Models**: Premium ElevenLabs + Free Web Speech API
✅ **Easy Voice Switching**: Change voice anytime
✅ **Error Handling**: Graceful degradation on API errors

---

## Configuration

### Change Speaking Speed
```javascript
// Slower (easier to follow)
TextToSpeechService.speak(text, { rate: 0.8 })

// Faster (advanced learners)
TextToSpeechService.speak(text, { rate: 1.2 })

// Default
TextToSpeechService.speak(text, { rate: 0.95 })
```

### Change Pitch
```javascript
// Lower pitch
TextToSpeechService.speak(text, { pitch: 0.8 })

// Higher pitch
TextToSpeechService.speak(text, { pitch: 1.2 })
```

### Change Volume
```javascript
// Quieter
TextToSpeechService.speak(text, { volume: 0.5 })

// Louder
TextToSpeechService.speak(text, { volume: 1.0 })
```

---

## Usage Examples

### Basic Usage
```javascript
// Speak text with default settings
TextToSpeechService.speak('Hello, welcome to English Adventures!')

// Stop speaking
TextToSpeechService.stop()

// Check if currently playing
if (TextToSpeechService.isCurrentlyPlaying()) {
    console.log('Audio is playing')
}
```

### Custom Settings
```javascript
TextToSpeechService.speak('Learn English with us', {
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0,
    voiceId: 'EXAVITQu4vr4xnSDxMaL' // Rachel
})
```

### Voice Selection
```javascript
// Get available voices
TextToSpeechService.getAvailableVoices()
// Returns:
// [
//   { id: 'rachel', name: 'Rachel (Female)', ... },
//   { id: 'sam', name: 'Sam (Male)', ... },
//   { id: 'bella', name: 'Bella (Female)', ... }
// ]

// Set voice
TextToSpeechService.setVoice('rachel')
```

---

## Troubleshooting

### "Audio doesn't work"
1. Check browser console (F12)
2. Verify API key if using ElevenLabs:
   ```javascript
   console.log(TextToSpeechService.ELEVENLABS_API_KEY)
   ```
3. Test fallback mode: `localStorage.removeItem('elevenlabs_api_key')`
4. Ensure audio isn't muted in browser settings

### "API Key error"
- Check key is valid at https://elevenlabs.io
- Verify it's copied completely (no spaces)
- Check rate limits (50 requests/month on free tier)

### "Voice sounds robotic"
- Using system fallback (add ElevenLabs API key)
- Try different voice: `TextToSpeechService.setVoice('sam')`
- Adjust speed: `TextToSpeechService.speak(text, { rate: 0.85 })`

### "API key not working"
```javascript
// Clear old key and set new one:
localStorage.removeItem('elevenlabs_api_key')
localStorage.setItem('elevenlabs_api_key', 'new-key-here')

// Or reload page after setting in console
```

---

## ElevenLabs Pricing

| Plan | Price | Requests/Month | Best For |
|------|-------|-----------------|----------|
| Free | $0 | 10,000 characters | Learning, testing |
| Starter | $5 | 100,000 characters | Small apps |
| Creator | $99 | 1M characters | Production apps |

→ Check https://elevenlabs.io/pricing for current rates

---

## Advanced Configuration

### Custom Model (if upgrading ElevenLabs)
```javascript
TextToSpeechService.speak(text, {
    modelId: 'eleven_monolingual_v1' // Latest model
})
```

### Voice Stability & Similarity
```javascript
// More consistent (for education)
TextToSpeechService.speak(text, {
    stability: 0.5,
    similarityBoost: 0.75
})

// More expressive (for stories)
TextToSpeechService.speak(text, {
    stability: 0.3,
    similarityBoost: 0.9
})
```

---

## Production Checklist

- [ ] Create ElevenLabs account
- [ ] Get API key from dashboard
- [ ] Test in browser console: `TextToSpeechService.setApiKey('key')`
- [ ] Verify audio plays correctly
- [ ] Check browser console for "[Image]" logs (shouldn't be errors)
- [ ] Set preferred voice: `TextToSpeechService.setVoice('rachel')`
- [ ] Monitor usage in ElevenLabs dashboard
- [ ] (Optional) Add to environment variables for production

---

## Additional Resources

- 📖 ElevenLabs Docs: https://elevenlabs.io/docs
- 🎤 Voice samples: https://elevenlabs.io/voice-library
- 💬 Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- 🔑 API Reference: https://api.elevenlabs.io/v1/docs

---

**Last Updated**: May 26, 2026
**Status**: ✅ Active & Supported
