# Project Structure Guide

## 📁 Directory Organization

```
Grammar101/
├── src/                           # ⭐ Main application directory
│   ├── index.html                # Entry point HTML
│   ├── app.js                    # Core application logic
│   ├── assets/
│   │   ├── images/               # Lesson imagery & backgrounds
│   │   ├── sounds/               # Audio feedback files
│   │   └── styles/
│   │       ├── styles.css        # Main application stylesheet
│   │       └── lesson-module.css # Lesson-specific styles
│   ├── modules/                  # Feature modules
│   │   ├── lessonModule.js                # Lesson content delivery system
│   │   ├── quizModule.js                  # Quiz system with hint logic
│   │   ├── spellingHelper.js              # Spelling challenges
│   │   ├── gameModule.js                  # Gamified learning
│   │   ├── writingModule.js               # Writing exercises
│   │   ├── imageService.js                # Image management
│   │   ├── rewardsSystem.js               # Achievement tracking
│   │   └── grammarCheckers/
│   │       ├── canCouldBeAbleTo.js
│   │       ├── futureTenses.js
│   │       ├── futurePerfect.js
│   │       ├── mustHaveToHaveGotTo.js
│   │       ├── pastPerfect.js
│   │       ├── pastTenses.js
│   │       ├── presentPerfect.js
│   │       ├── presentSimpleContinuous.js
│   │       └── shallWillWouldHadBetter.js
│   ├── config/                   # Grammar module configurations
│   │   ├── configManager.js      # Configuration loader
│   │   ├── can-could-be-able-to.json
│   │   ├── may-might.json
│   │   ├── must-have-to-have-got-to.json
│   │   ├── shall-will-would-had-better.json
│   │   └── should-ought-to.json
│   └── pages/                    # Static HTML pages
│       ├── privacy-policy.html
│       └── terms-of-service.html
│
├── docs/                         # 📚 Documentation
│   ├── ARCHITECTURE.md           # System design
│   ├── API_SETUP.md              # API configuration
│   ├── DEPLOYMENT.md             # Production guide
│   └── [archived dev docs]       # Historical documentation
│
├── scripts/                      # 🔧 Utility scripts
│   ├── DOWNLOAD_IMAGES.js        # Image downloader
│   ├── TEST_IMAGE_SERVICE.js     # Service testing
│   ├── server.ps1                # Windows server startup
│   └── start-server.cmd          # Windows command
│
├── public/                       # 🌐 Static files (if needed)
│
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies & scripts
├── .gitignore                    # Git ignore rules
└── README.md                     # Main documentation
```

## 🔑 Key Files Explained

### Core Application Files

**`src/app.js`** (1800+ lines)
- Central state management object
- Module initialization and switching
- Event listeners and UI coordination
- Settings panel management
- Audio and theme control
- Activity completion tracking

**`src/index.html`** (270+ lines)
- Main HTML structure
- Settings panel markup
- Module containers
- Script references
- Accessibility attributes

### Module System

Each module handles a specific learning feature:

**`lessonModule.js`**
- Renders lesson content with images
- Handles lesson progression
- Tracks completion status
- Manages activity navigation

**`quizModule.js`** (280+ lines)
- Multiple-choice quiz rendering
- Answer validation
- Hint system (appears only after incorrect attempt)
- Optional reveals correct answer

**`spellingHelper.js`** (380+ lines)
- Interactive spelling challenges
- Letter-by-letter validation
- Letter reveal system (after 2 attempts)
- Hint system (2 hints available)
- Visual feedback for errors

**`gameModule.js`**
- Gamified learning experience
- Interactive challenges
- Points and streak tracking

**`rewardsSystem.js`**
- Star collection and display
- Badge unlocking logic
- Achievement animations
- Progress visualization

### Configuration System

**`config/configManager.js`**
- Loads JSON grammar configurations
- Initializes module with activities
- Manages grammar topic switching

**`config/*.json`** files
- Structured lesson/quiz/activity data
- Modal verb examples and rules
- Hints and feedback messages

### Styling Architecture

**`src/assets/styles/styles.css`** (3800+ lines)
- Main application stylesheet
- Component styles (buttons, cards, modals)
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Accessibility modes (high contrast, reduce motion)
- Professional animations and transitions

**`src/assets/styles/lesson-module.css`**
- Lesson-specific typography
- Content formatting
- Print-friendly styles

## 📊 Data Flow

```
User Action
    ↓
HTML Event Listener
    ↓
Module Handler (e.g., quizModule.checkAnswer())
    ↓
App.state Updated
    ↓
App.saveState() → localStorage
    ↓
UI Updated (renderActivities, updateUI)
    ↓
Visual Feedback (animations, sounds, messages)
```

## 🎨 Component Architecture

### Settings Panel Components
- Volume sliders (0-100%)
- Toggle switches
- Slider controls
- Reset button
- Professional styling with animations

### Quiz Components
- Question display
- Multiple choice buttons
- Hint button (conditional)
- Feedback modal
- Progress indicator

### Spelling Components
- Input fields for letters
- "Check Spelling" button
- "Reveal Letter" button (after 2 attempts)
- "Show Hint" button (after letter reveals)
- Visual error indicators

### Shared Components
- Activity cards
- Modal dialogs
- Progress bar
- Rewards showcase
- Navigation buttons

## 🔄 State Management

The `App.state` object manages:
```javascript
{
  // UI Settings
  darkMode: boolean,
  audioEnabled: boolean,
  soundEffectsEnabled: boolean,
  textSize: string (px),
  animationsEnabled: boolean,
  
  // Audio Levels
  musicVolume: number (0-100),
  soundVolume: number (0-100),
  
  // Accessibility
  highContrast: boolean,
  reduceMotion: boolean,
  
  // Learning Preferences
  autoShowHints: boolean,
  
  // Progress Tracking
  completedActivities: {
    [moduleId]: {
      [activityId]: 'completed'|'incorrect'
    }
  },
  
  // Rewards
  stars: number,
  badges: [...]
}
```

All state is automatically persisted to localStorage.

## 🛠 Development Workflow

1. **Understanding the Flow**
   - Start with `src/app.js` - main logic
   - Review module you're working with
   - Check corresponding HTML elements
   - Review styling in CSS files

2. **Adding a Feature**
   - Add HTML markup in `index.html`
   - Create event listener in `app.js`
   - Handle logic in appropriate module
   - Add styling to CSS
   - Test in browser

3. **Debugging**
   - Open browser DevTools (F12)
   - Check Console for errors
   - Use localStorage inspection
   - Review Network tab for assets

4. **Testing Changes**
   - Hard refresh (Ctrl+Shift+R)
   - Test all modules
   - Check mobile responsive
   - Verify accessibility

## 📦 Dependencies

**None required** - Pure vanilla JavaScript
- No framework dependencies
- No jQuery
- No build tools needed
- All modern browser APIs used

**Optional (for development)**
- Node.js + npm (for http-server)
- ESLint (for code quality)

## 🚀 Deployment

1. **Development**
   ```bash
   python3 -m http.server 8001
   ```

2. **Production**
   - Copy `src/` contents to web server
   - Update `UNSPLASH_API_KEY` in config
   - Set up HTTPS
   - Configure caching headers
   - Monitor performance

## ✅ Code Quality Standards

- **Consistency**: Follow existing naming conventions
- **Documentation**: Add comments for complex logic
- **Performance**: Minimize DOM manipulation
- **Accessibility**: Test keyboard navigation
- **Responsive**: Test on multiple screen sizes
- **Maintainability**: Keep modules focused on single responsibility

## 🔐 Security Considerations

- All data stored locally (no server needed)
- HTTPS recommended for production
- Sanitize any user-generated content
- API keys should be environment variables
- Review privacy policy compliance

