# File Reference & Navigation Guide

## 📍 Directory Structure Overview

The project has been reorganized into a professional framework-like structure for better maintainability:

```
Grammar101/
├── src/                          ⭐ ALL APPLICATION CODE HERE
│   ├── index.html                (Entry point)
│   ├── app.js                    (Core logic)
│   ├── assets/                   (Images, sounds, styles)
│   ├── modules/                  (Feature modules)
│   ├── config/                   (Grammar configurations)
│   └── pages/                    (Legal pages)
│
├── docs/                         📚 All documentation
├── scripts/                      🔧 Utilities & tools
├── public/                       🌐 Static files (if needed)
└── Root config files only        (package.json, README.md, etc.)
```

## 🗂️ File Reference Paths

### From Browser Perspective
When you access `http://localhost:8001`, the server serves files from the `src/` directory:

```
Browser Request          →  File Location
─────────────────────────────────────────
http://localhost:8001/           →  src/index.html
http://localhost:8001/app.js     →  src/app.js
http://localhost:8001/config/... →  src/config/...
http://localhost:8001/modules/.. →  src/modules/...
```

### From JavaScript (Relative Paths)
All JavaScript running in the browser uses **relative paths** from `src/`:

```javascript
// Inside src/index.html or src/app.js:

// ✅ Correct - relative to src/
fetch('config/can-could-be-able-to.json')
<link rel="stylesheet" href="assets/styles/styles.css">
<script src="modules/lessonModule.js"></script>

// ❌ Wrong - would be looking for src/src/...
fetch('./src/config/...')

// ❌ Wrong - would be looking at root/config/...
fetch('/config/...')
```

## 📋 File Reference Map

### Core Application Files
```
LOCATION                          PURPOSE                      ACCESSED BY
──────────────────────────────────────────────────────────────────────────
src/index.html                    App entry point              Browser loads directly
src/app.js                        Core logic & state           index.html <script>
src/config/configManager.js       Config loader               (via index.html <script>)
src/modules/lessonModule.js       Lesson feature              index.html <script>
src/modules/quizModule.js         Quiz feature                index.html <script>
src/modules/spellingHelper.js     Spelling feature            index.html <script>
src/modules/gameModule.js         Game feature                index.html <script>
src/modules/rewardsSystem.js      Rewards system              index.html <script>
src/modules/imageService.js       Image management            index.html <script>
```

### Configuration Files
```
LOCATION                                      LOADED BY
───────────────────────────────────────────────────────────────
src/config/can-could-be-able-to.json         app.js fetch('config/...')
src/config/must-have-to-have-got-to.json     app.js fetch('config/...')
src/config/shall-will-would-had-better.json  app.js fetch('config/...')
src/config/should-ought-to.json              app.js fetch('config/...')
src/config/may-might.json                    app.js fetch('config/...')
```

### Styling
```
LOCATION                              INCLUDED BY
────────────────────────────────────────────────
src/assets/styles/styles.css          src/index.html <link>
src/assets/styles/lesson-module.css   src/index.html <link>
```

### Assets
```
LOCATION                              REFERENCED BY
─────────────────────────────────────────────────────────
src/assets/images/...                 Lesson content, image service
src/assets/sounds/...                 rewardsSystem.js, gameModule.js
src/assets/images/future-tenses/...   Quiz module images
```

### Legal Pages
```
LOCATION                              LINKED FROM
────────────────────────────────────────────────
src/pages/privacy-policy.html         Footer links
src/pages/terms-of-service.html       Footer links
```

## 🔗 How File References Work

### Example 1: Loading a JSON Config
```javascript
// Inside src/app.js (running in browser)
fetch('config/can-could-be-able-to.json')
// Browser converts this to: http://localhost:8001/config/can-could-be-able-to.json
// Which serves: src/config/can-could-be-able-to.json ✅
```

### Example 2: Loading a CSS File
```html
<!-- Inside src/index.html -->
<link rel="stylesheet" href="assets/styles/styles.css">
<!-- Browser loads from: http://localhost:8001/assets/styles/styles.css -->
<!-- Which serves: src/assets/styles/styles.css ✅
```

### Example 3: Loading a JavaScript Module
```html
<!-- Inside src/index.html -->
<script src="modules/lessonModule.js"></script>
<!-- Browser loads from: http://localhost:8001/modules/lessonModule.js -->
<!-- Which serves: src/modules/lessonModule.js ✅
```

## 🚀 Starting the Server Correctly

### Important: Change to src/ Directory
The server **MUST** be started from the `src/` directory as the root:

**✅ Correct:**
```bash
cd Grammar101/src/
python3 -m http.server 8001
# or
bash ../start-dev-server.sh  # Auto-handles this
```

**❌ Wrong (won't work):**
```bash
cd Grammar101/
python3 -m http.server 8001
# URLs like http://localhost:8001/app.js would look for Grammar101/app.js
# But it's actually at Grammar101/src/app.js
```

## 🧭 Navigation for Common Tasks

### Fix a Bug in Quiz Module
1. Open: `src/modules/quizModule.js`
2. Find the issue
3. Reference other modules: Check `src/modules/` for similar patterns
4. Update CSS if needed: `src/assets/styles/styles.css`
5. Test in browser: `http://localhost:8001` → Quiz tab

### Add a New Grammar Topic
1. Create config: `src/config/your-topic.json`
2. Update app.js: Add to `moduleNames` array (around line 93)
3. Create grammar checker: `src/modules/grammarCheckers/yourValidator.js`
4. Reference in config: Point to your validator
5. Restart server for new configs to load

### Update Styling
1. Open: `src/assets/styles/styles.css`
2. Find the relevant CSS section (search with Ctrl+F)
3. Make changes
4. Refresh browser (Ctrl+Shift+R to skip cache)

### Add New Audio File
1. Place file in: `src/assets/sounds/`
2. Update app.js to load it in `createAudio()`
3. Reference in modules as needed

## 🔍 Troubleshooting File References

### "Failed to load config" Error
**Problem**: `fetch()` can't find config files
**Solution**: 
- Make sure server is running FROM `src/` directory
- Check file exists at `src/config/filename.json`
- Verify path in app.js uses `config/` prefix (not `/config/` or `./config/`)

### CSS Not Loading
**Problem**: Styles not applied
**Solution**:
- Check `<link>` path in `src/index.html` 
- Should be: `href="assets/styles/styles.css"`
- Make sure file exists at `src/assets/styles/styles.css`

### Module Functions Undefined
**Problem**: Module scripts not loading
**Solution**:
- Check `<script>` tags in `src/index.html`
- Paths should be relative to src/: `src="modules/moduleName.js"`
- Files must exist in `src/modules/`
- Refresh browser to reload all scripts

### Images Not Displaying
**Problem**: Images from activities not showing
**Solution**:
- Images should be in: `src/assets/images/`
- Paths in JSON configs should be absolute URLs (Unsplash) OR point to `assets/images/`
- Check `imageService.js` for correct mapping

## 📝 File Organization Checklist

When working on the project:

- [ ] All code in `src/` directory
- [ ] Server started FROM `src/` directory
- [ ] Configs in `src/config/`
- [ ] Modules in `src/modules/`
- [ ] Styles in `src/assets/styles/`
- [ ] Images in `src/assets/images/`
- [ ] Sounds in `src/assets/sounds/`
- [ ] All relative paths use no leading slash (`config/`, not `/config/`)
- [ ] All fetch() paths relative to src (e.g., `config/...`)
- [ ] Browser shows correct files when DevTools Network tab checked
- [ ] No 404 errors in Console

## 🗂️ Why This Structure

| Benefit | How It Helps |
|---------|-------------|
| **Centralized `src/`** | Everything in one place - easy to find |
| **Organized modules** | Features grouped logically |
| **Clear assets** | Images, sounds, styles organized |
| **Config separation** | Easy to update grammar content |
| **Docs folder** | All documentation consolidated |
| **Scripts folder** | Utilities kept separate |
| **Relative paths** | Works whether served from `http://localhost` or uploaded to server |

## 🎯 Summary

**Remember:**
1. ✅ **Server root** = `src/` directory
2. ✅ **All JavaScript paths** = relative from `src/`
3. ✅ **All fetch() paths** = relative from `src/`
4. ✅ **All HTML href/src** = relative paths with no leading slash
5. ✅ **Browser URLs start** with `http://localhost:8001`

---

**Need to find a file?** 
- Start in `src/` 
- Check `docs/` for documentation
- Check `scripts/` for utilities

**Having path issues?**
- Open DevTools (F12) → Network tab
- Check what URLs are being requested
- Match them to actual file locations in `src/`

