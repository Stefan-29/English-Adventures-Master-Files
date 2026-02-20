# 🚀 Quick Start Guide - Project Navigation

## ⚡ Start the App (30 seconds)

### Option 1: Automatic Script (Recommended)
```bash
cd /workspaces/Grammar101---English---Modals
bash start-dev-server.sh
# Opens: http://localhost:8001
```

### Option 2: Manual Python
```bash
cd /workspaces/Grammar101---English---Modals/src
python3 -m http.server 8001
# Opens: http://localhost:8001
```

### Option 3: Manual Node/npm
```bash
cd /workspaces/Grammar101---English---Modals/src
npx http-server -p 8001
# Opens: http://localhost:8001
```

## 📂 Project Structure at a Glance

```
Grammar101/
├── src/                    ← ALL CODE HERE
│   ├── index.html         ← Entry point
│   ├── app.js             ← Main logic
│   ├── assets/            ← Images, sounds, styles
│   ├── modules/           ← Features (quiz, spelling, etc)
│   ├── config/            ← Grammar content (.json)
│   └── pages/             ← Legal pages
├── docs/                  ← Guides & documentation  
├── scripts/               ← Utility scripts
├── README.md              ← Main documentation
└── package.json           ← Project config
```

## 🗺️ Finding Files

| I want to... | Location | File |
|---|---|---|
| See the app | Browser | `http://localhost:8001` |
| Edit app layout | `src/` | `index.html` |
| Edit main logic | `src/` | `app.js` |
| Fix quiz bugs | `src/modules/` | `quizModule.js` |
| Fix spelling bugs | `src/modules/` | `spellingHelper.js` |
| Edit styles | `src/assets/styles/` | `styles.css` |
| Add grammar topic | `src/config/` | Create `your-topic.json` |
| Add images | `src/assets/images/` | Place image files |
| Add sounds | `src/assets/sounds/` | Place audio files |
| Read guide | `docs/` | `FILE_REFERENCE_GUIDE.md` |

## 🔧 Quick Tasks

### Fix a Styling Issue
1. Open `src/assets/styles/styles.css`
2. Find the CSS rule (Ctrl+F)
3. Update it
4. Refresh browser (Ctrl+Shift+R)

### Fix Quiz Bug
1. Open `src/modules/quizModule.js`
2. Find the function (Ctrl+F)
3. Update logic
4. Refresh browser

### Add New Audio
1. Save audio to `src/assets/sounds/`
2. Update `src/app.js` function `createAudio()` 
3. Refresh and test

### Add New Grammar Topic
1. Create `src/config/your-topic.json`
2. Edit `src/app.js` line ~93, add name to `moduleNames` array
3. Restart server
4. Refresh browser

## ✅ File Reference Checklist

When you have a problem:

- [ ] Server running FROM `src/` directory?
- [ ] URL is `http://localhost:8001` (not 8000, etc)?
- [ ] Opening DevTools shows no 404 errors?
- [ ] CSS file path in index.html: `assets/styles/styles.css`?
- [ ] Script paths in index.html: `modules/`, `config/`, etc?
- [ ] All fetch() calls in app.js use `config/` prefix?
- [ ] Tried hard refresh (Ctrl+Shift+R)?

## 📞 Getting Help

### Check File Locations
All files follow this pattern:
```
File Reference    →    Actual Location
config/...        →    src/config/...
modules/...       →    src/modules/...
assets/...        →    src/assets/...
```

### Read Documentation
- `FILE_REFERENCE_GUIDE.md` - How paths work
- `PROJECT_STRUCTURE.md` - File organization
- `README.md` - Full documentation

### Debugging Tips
1. Open DevTools (F12)
2. Go to Network tab
3. Look for red (404) errors
4. Check the URL being loaded
5. Verify file exists in that location

## 🎯 Key Takeaways

✅ **Server serves from `src/` directory**
✅ **All paths are relative (no leading slash)**
✅ **Files accessed via `http://localhost:8001`**
✅ **CSS in `assets/styles/`**
✅ **JS modules in `modules/`**
✅ **Config files in `config/`**
✅ **Images in `assets/images/`**

---

**Next Step:** Read `FILE_REFERENCE_GUIDE.md` for detailed path explanation!

