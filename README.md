# 🎓 Grammar101 - Professional English Learning Platform

A comprehensive, interactive web-based learning platform for English grammar with lessons, quizzes, games, and a complete image management system.

## 🚀 Quick Start

### 1. Start the Preview
```bash
npm run dev
```

This serves the app from the repository root on port **8001** (or the port set
in the `PORT` environment variable). This development server exposes source
files and must not be used as the production content boundary. In a Codespace, open the **Ports** panel,
find port **8001**, and choose **Open in Browser** to preview it.

To use the startup script instead:
```bash
bash scripts/server/start-dev-server.sh
```

Stop the server with **Ctrl+C**. Run `npm run dev` again whenever you want to
preview the app.

### 2. Open in Browser
```
http://localhost:8001
```

### 3. Contextual Writing Images

Writing activity banners are matched to each prompt through the free Wikimedia
Commons API. No API key or image-download setup is required. Add an optional
`imageQuery` and descriptive `imageAlt` to a writing activity to tune its image.
Images link to their source page and show available attribution and license
details. See [the image setup guide](docs/setup/API_KEY_SETUP.md).

### 4. Configure account sign-in

See [the Supabase auth setup guide](docs/setup/AUTH_SETUP.md) to configure the
public browser URL/key, verified email sign-up, Google OAuth, and server-side
rate limits. Never publish a Supabase service-role key.

### 5. Build the production static site

```bash
npm run build
```

Deploy **`dist/`**, not the repository root. The build intentionally excludes
topic configuration and activity JSON; private content is uploaded separately
to Supabase Storage. See
[the content access setup guide](docs/setup/CONTENT_ACCESS_SETUP.md).

---

## 📚 Documentation

**All documentation is organized in the `docs/` folder by category.**

- **Quick Start**: [docs/guides/START_HERE.md](docs/guides/START_HERE.md)
- **Documentation Hub**: [docs/README.md](docs/README.md)
- **Setup Guide**: [docs/setup/SERVER.md](docs/setup/SERVER.md)
- **Lesson listening**: [docs/setup/TTS_SETUP.md](docs/setup/TTS_SETUP.md)
- **Private content deployment**: [docs/setup/CONTENT_ACCESS_SETUP.md](docs/setup/CONTENT_ACCESS_SETUP.md)
- **Image System**: [docs/images/README_IMAGES.md](docs/images/README_IMAGES.md)

---

## 🗂️ Project Structure

The static application is served from the repository root. `src/` is not the
web root; it currently contains legacy copies of the legal pages only.

```text
/
├── index.html                  App page and root-relative CSS/script references
├── app.js                      Vanilla JS app entry point
├── config/                     Topic configuration JSON
├── reproducibility/            Activity data referenced by topic configs
├── modules/                    Lesson, quiz, game, spelling, image, and audio code
├── css/                        Application stylesheets
├── assets/                     Public images and sounds
├── legal/                      Privacy and terms pages linked by the app
├── src/pages/                  Legacy copies of the legal pages
├── docs/                       Guides, setup, and technical documentation
└── scripts/                    QA, utilities, and development-server scripts
```

See [the architecture summary](docs/technical/ARCHITECTURE.md) for the static
request flow, canonical paths, and content-visibility constraints.

---

## 📖 Documentation Categories

### 📚 Guides (docs/guides/)
- **START_HERE.md** - Complete overview and quick start guide
- **VISUAL_GUIDE.md** - Visual explanations with diagrams
- **INDEX.md** - Complete documentation index
- **QUICK_NAVIGATION.md** - Quick file references

### ⚙️ Setup (docs/setup/)
- **SERVER.md** - How to start the development server
- **API_KEY_SETUP.md** - Writing image API setup (no key required)
- **SETTINGS_QUICK_START.md** - Settings panel setup

### 🎨 Images (docs/images/)
- **[README_IMAGES.md](docs/images/README_IMAGES.md)** - Current image matching, fallback, and attribution flow

### 🔧 Technical (docs/technical/)
- **CODE_FLOW_EXPLANATION.md** - Code flow and architecture
- **IMPLEMENTATION_COMPLETE.md** - Implementation notes
- **INTEGRATION_CHECKLIST.md** - Integration verification

### 📊 Project Management (docs/project-management/)
- **00_DELIVERABLES.md** - Complete deliverables overview
- **PROJECT_ORGANIZED.md** - Project organization guide

---

## 🎯 Common Tasks

### Start Development
```bash
bash scripts/server/start-dev-server.sh
```

### Verify the Image Service
```bash
npm test
```

### View Documentation
👉 See [docs/README.md](docs/README.md)

---

## 📁 Key Features

✅ **Interactive Grammar Lessons** - Learn with examples and explanations  
✅ **Quiz Module** - Test your knowledge with immediate feedback  
✅ **Image System** - Visual learning with automatically managed images  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  
✅ **Offline Support** - Works with cached or local images  
✅ **Well-Documented** - Comprehensive guides and technical documentation  

---

## 💡 Tips

- All documentation is in `docs/` - organized by category for easy navigation
- All scripts are in `scripts/` - organized for different purposes
- Grammar topics are in `config/`; their activity data is under `reproducibility/`
- Application entry points are `index.html` and `app.js` at the repository root
- Use [docs/guides/START_HERE.md](docs/guides/START_HERE.md) for a complete walkthrough

---

## 📞 Support

For detailed information:
- 📖 Quick Start: [docs/guides/START_HERE.md](docs/guides/START_HERE.md)
- 🔍 File Reference: [docs/FILE_REFERENCE_GUIDE.md](docs/FILE_REFERENCE_GUIDE.md)
- 🏗️ Structure: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)

---

## 📄 License

MIT License - See repository for details.
