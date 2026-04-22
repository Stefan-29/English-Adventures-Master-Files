# 🎓 Grammar101 - Professional English Learning Platform

A comprehensive, interactive web-based learning platform for English grammar with lessons, quizzes, games, and a complete image management system.

## 🚀 Quick Start

### 1. Start the Server
```bash
# Windows
bash scripts/server/start-dev-server.sh
# or
powershell -ExecutionPolicy Bypass -File scripts/server/server.ps1

# Mac/Linux
bash scripts/server/start-dev-server.sh
```

### 2. Open in Browser
```
http://localhost:8001
```

### 3. (Optional) Download Images
```bash
node scripts/utilities/DOWNLOAD_IMAGES.js
```

✅ **Done!** Your app is running.

---

## 📚 Documentation

**All documentation is organized in the `docs/` folder by category.**

- **Quick Start**: [docs/guides/START_HERE.md](docs/guides/START_HERE.md)
- **Documentation Hub**: [docs/README.md](docs/README.md)
- **Setup Guide**: [docs/setup/SERVER.md](docs/setup/SERVER.md)
- **Image System**: [docs/images/QUICK_START_IMAGES.md](docs/images/QUICK_START_IMAGES.md)

---

## 🗂️ Project Structure

```
English-Adventures-Master-Files/
│
├── src/                           ⭐ APPLICATION CODE
│   ├── app.js                     Main application logic
│   ├── index.html                 HTML template
│   ├── modules/                   Feature modules (quizzes, games, etc.)
│   ├── assets/                    Images and sounds
│   │   ├── images/                Grammar topic images (by tense)
│   │   └── sounds/                Audio files
│   ├── config/                    Grammar topic configurations
│   ├── css/                       Application styles
│   └── pages/                     HTML pages (privacy, terms, etc.)
│
├── docs/                          📚 DOCUMENTATION (ORGANIZED BY CATEGORY)
│   ├── guides/                    📖 User guides & tutorials
│   ├── setup/                     ⚙️  Installation & configuration
│   ├── images/                    🎨 Image system documentation
│   ├── technical/                 🔧 Technical & implementation details
│   ├── project-management/        📊 Project planning & deliverables
│   ├── FILE_REFERENCE_GUIDE.md    🔍 Find specific files
│   └── README.md                  📖 Documentation hub
│
├── scripts/                       🔧 UTILITY & SERVER SCRIPTS
│   ├── server/                    Server startup scripts
│   │   ├── start-dev-server.sh    Linux/Mac server starter
│   │   ├── start-server.cmd       Windows batch starter
│   │   └── server.ps1             Windows PowerShell starter
│   └── utilities/                 Helper scripts
│       ├── DOWNLOAD_IMAGES.js     Image downloader
│       ├── TEST_IMAGE_SERVICE.js  Image service tester
│       └── convert_lists_to_tables.py  Data converter
│
├── config/                        ⚙️  CONFIGURATION FILES
│   ├── grammar topic files        JSON files for each grammar topic
│   └── imageMapping.json          Auto-generated image database
│
├── reproducibility/               🔄 DATA REPRODUCIBILITY
│   └── Grammar topic configs      Copy of configurations for reproducibility
│
├── css/                           🎨 STYLESHEETS
│   ├── styles.css                 Main application styles
│   └── lesson-module.css          Lesson-specific styles
│
├── assets/                        📦 MEDIA FILES
│   ├── images/                    Grammar topic images (organized by tense)
│   └── sounds/                    Audio files for lessons
│
├── modules/                       📦 LEGACY FEATURE MODULES
│   └── [various feature modules]  Legacy module organization
│
├── legal/                         ⚖️  LEGAL DOCUMENTS
│   ├── privacy-policy.html        Privacy policy
│   └── terms-of-service.html      Terms of service
│
├── package.json                   📋 NPM dependencies & scripts
├── .gitignore                     Git ignore rules
└── [config files]                 Root-level configuration files
```

---

## 📖 Documentation Categories

### 📚 Guides (docs/guides/)
- **START_HERE.md** - Complete overview and quick start guide
- **VISUAL_GUIDE.md** - Visual explanations with diagrams
- **INDEX.md** - Complete documentation index
- **QUICK_NAVIGATION.md** - Quick file references

### ⚙️ Setup (docs/setup/)
- **SERVER.md** - How to start the development server
- **API_KEY_SETUP.md** - API configuration guide
- **SETTINGS_QUICK_START.md** - Settings panel setup

### 🎨 Images (docs/images/)
- **QUICK_START_IMAGES.md** - Image system quick start
- **IMAGE_SYSTEM_COMPLETE.md** - Complete image system overview
- **IMAGE_MANAGEMENT.md** - Detailed management guide

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

### Download Images
```bash
node scripts/utilities/DOWNLOAD_IMAGES.js
```

### Test Image Service
```bash
node scripts/utilities/TEST_IMAGE_SERVICE.js
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
- Grammar topics are in `config/` and `src/config/` 
- Application code is in `src/` - start here to understand the app
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
