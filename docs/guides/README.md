# Grammar101 - English Modal Verbs Learning Platform

**A professional, interactive web-based educational platform for mastering English modal verbs through multiple learning modules, engaging activities, and real-time feedback.**

## 🎯 Overview

Grammar101 is a comprehensive web application designed to help English language learners master modal verbs through an integrated system of:
- 📖 Interactive lessons with real-world examples
- 🎮 Engaging game-based learning
- ✍️ Spelling challenges and writing exercises
- 🧪 Comprehensive quiz modules
- 📊 Progress tracking with rewards system
- 🎨 Customizable user interface with accessibility features

## 📁 Project Structure

```
Grammar101/
├── src/                              # Main application source code
│   ├── index.html                   # Main application entry point
│   ├── app.js                       # Core application logic & state management
│   ├── assets/                      # Static assets
│   │   ├── images/                  # Image files for lessons
│   │   ├── sounds/                  # Audio files for interactive feedback
│   │   └── styles/                  # Stylesheets
│   │       ├── styles.css           # Main application styles
│   │       └── lesson-module.css    # Lesson-specific styling
│   ├── modules/                     # Feature modules
│   │   ├── lessonModule.js          # Lesson content delivery
│   │   ├── quizModule.js            # Quiz functionality with hints
│   │   ├── spellingHelper.js        # Spelling challenge system
│   │   ├── gameModule.js            # Interactive game mode
│   │   ├── writingModule.js         # Writing exercises
│   │   ├── imageService.js          # Image management & Unsplash integration
│   │   ├── rewardsSystem.js         # Stars, badges, and achievement tracking
│   │   └── grammarCheckers/         # Grammar validation modules
│   │       ├── canCouldBeAbleTo.js
│   │       ├── futureTenses.js
│   │       ├── mustHaveToHaveGotTo.js
│   │       └── [other grammar checkers...]
│   ├── config/                      # Configuration files
│   │   ├── configManager.js         # Configuration loader
│   │   ├── can-could-be-able-to.json
│   │   ├── must-have-to-have-got-to.json
│   │   ├── shall-will-would-had-better.json
│   │   └── [other modal verb configs...]
│   └── pages/                       # Static pages
│       ├── privacy-policy.html
│       └── terms-of-service.html
├── docs/                            # Documentation
│   ├── ARCHITECTURE.md              # System architecture
│   ├── API_SETUP.md                # API configuration guide
│   ├── DEPLOYMENT.md               # Production deployment guide
│   └── [other documentation files...]
├── scripts/                         # Utility and build scripts
│   ├── DOWNLOAD_IMAGES.js          # Image download utility
│   ├── TEST_IMAGE_SERVICE.js       # Image service testing
│   └── server.ps1, start-server.cmd # Development server scripts
├── public/                          # Static files served directly
├── .env.example                     # Environment variables template
├── package.json                     # Project dependencies & scripts
└── README.md                        # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+) or Python 3
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Stefan-29/Grammar101---English---Modals.git
cd Grammar101---English---Modals
```

2. **Start development server**

**With Python (built-in, no dependencies):**
```bash
python3 -m http.server 8001
```

**With Node.js:**
```bash
npm start
```

3. **Open in browser**
```
http://localhost:8001
```

## ✨ Key Features

### 📚 Learning Modules
- **Lesson Module**: Structured lessons on specific modal verbs
- **Quiz Module**: Multiple-choice questions with hint system (context-aware hints after incorrect answers)
- **Spelling Module**: Interactive spelling challenges with letter reveals
- **Game Module**: Gamified learning experience
- **Writing Module**: Compositional exercises

### 🎯 Student Engagement
- **Progress Tracking**: Real-time progress percentage
- **Rewards System**: Collect stars and unlock badges
- **Hints & Help**: Context-sensitive hints available after incorrect attempts
- **Accessibility**: High contrast mode, reduce motion option, adjustable text size
- **Audio Control**: Separate volume controls for background music and sound effects

### ⚙️ Settings & Personalization
- 🎵 **Audio Settings**: Independent volume control for music and effects (0-100%)
- 🎨 **Display**: Dark mode, text size adjustment (12-18px)
- ♿ **Accessibility**: High contrast mode, reduce motion support
- 💡 **Learning**: Auto-show hints toggle, animation preferences
- 💾 **Auto-save**: All preferences stored locally in browser

### 🎨 Professional UI/UX
- Responsive design (mobile, tablet, desktop)
- WCAG 2.1 AA accessibility compliant
- Smooth animations and transitions
- Professional button and control styles
- Real-time visual feedback

## 🛠 Technical Stack

- **Frontend**: HTML5, CSS3 (with custom properties), Vanilla JavaScript
- **Architecture**: Modular event-driven design
- **State Management**: localStorage for persistence
- **External APIs**: Unsplash API for image sourcing
- **Styling**: CSS3 with responsive media queries

## 📖 Module Documentation

### Core Modules
- **lessonModule.js**: Renders interactive lessons with image support
- **quizModule.js**: Quiz rendering with answer validation and hint system
- **spellingHelper.js**: Spelling challenges with progressive letter reveals
- **rewardsSystem.js**: Achievement tracking and badge management

### Grammar Validators
Specialized modules for validating and explaining specific modal verb uses:
- `canCouldBeAbleTo.js` - Can/Could/Be Able To
- `futureTenses.js` - Future tense modals
- `mustHaveToHaveGotTo.js` - Obligation modals
- `shall-will-would-had-better.js` - Future and conditional modals

## 🎁 Settings System

The application provides a comprehensive settings panel with the following options:

| Setting | Type | Range | Default |
|---------|------|-------|---------|
| Dark Mode | Toggle | On/Off | Off |
| Music Volume | Slider | 0-100% | 30% |
| Sound Effects | Slider | 0-100% | 70% |
| Text Size | Slider | 12-18px | 14px |
| Enable Animations | Toggle | On/Off | On |
| Auto-show Hints | Toggle | On/Off | On |
| High Contrast | Toggle | On/Off | Off |
| Reduce Motion | Toggle | On/Off | Off |

## 🔧 Development

### Extending the Application

**Add a new grammar module:**
1. Create new file in `src/config/your-module.json`
2. Add validator in `src/modules/grammarCheckers/yourValidator.js`
3. Update `src/index.html` with script reference
4. Import and register in main app

**Customize Quiz Hint Behavior:**
Edit `src/modules/quizModule.js`:
- Line 121: Controls when hints appear (currently: after incorrect answer only)
- Adjust hint limits in `hintLimits` object

**Customize Spelling Module:**
Edit `src/modules/spellingHelper.js`:
- Line 7: `attemptThreshold = 2` (attempts before letter reveal unlocks)
- Line 8: `maxHints = 2` (total hints allowed)
- Line 9: `maxRevealLetters = 1` (letter reveal limit)

### Build & Deployment

Development server:
```bash
python3 -m http.server 8001
# or
npm start
```

For production, use a proper web server (Apache, Nginx, Node.js Express).

## 📱 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Fully Supported |
| Firefox | Latest | ✅ Fully Supported |
| Safari | Latest | ✅ Fully Supported |
| Edge | Latest | ✅ Fully Supported |
| Mobile Safari (iOS) | Latest | ✅ Responsive |
| Chrome Mobile | Latest | ✅ Responsive |

## ♿ Accessibility

Grammar101 complies with WCAG 2.1 Level AA standards:
- ✅ Keyboard navigation support
- ✅ High-contrast mode for visually impaired users
- ✅ Reduce motion support for motion-sensitive users
- ✅ Screen reader compatible markup
- ✅ Color-independent information display
- ✅ Minimum 7:1 contrast ratio for text

## 📊 Performance

- **Page Load**: < 2 seconds
- **Module Switch**: < 500ms
- **Quiz Render**: < 300ms
- **File Size**: ~150KB (HTML + CSS + JS)
- **Audio Files**: ~2MB total (optional/streaming recommended)

## 🔐 Privacy & Security

- ✅ No server-side data collection
- ✅ All learner progress stored locally in browser
- ✅ No authentication required
- ✅ GDPR compliant (no personal data processing)
- ✅ Unsplash images sourced with proper attribution

## 📄 Legal

- [Privacy Policy](src/pages/privacy-policy.html)
- [Terms of Service](src/pages/terms-of-service.html)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Submit a Pull Request

## 📝 License

This project is provided as-is for educational purposes.

## 📞 Support & Feedback

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the documentation in `/docs`
- Review the CODE_FLOW_EXPLANATION for architecture details

## 🎓 Educational Value

This project demonstrates:
- **Modern Web Development**: Vanilla JS architecture, responsive design
- **State Management**: localStorage persistence, centralized App state
- **Modular Design**: Feature-based module structure
- **Accessibility**: WCAG compliance implementation
- **User Experience**: Settings system, visual feedback, progress tracking
- **Educational Technology**: Interactive learning systems, gamification

---

**Version**: 2.0 (Restructured)  
**Last Updated**: February 2026  
**Status**: Production Ready ✅

