const RewardSystem = {
    rewards: null,
    ACTIVITY_POINTS: 10,

    // Initialize the reward system
    init: function (rewardsConfig) {
        this.rewards = rewardsConfig;
        
        // Add moduleId to all badges if not already present
        const moduleId = App.currentGrammarModuleId;
        if (moduleId && this.rewards?.badges) {
            this.rewards.badges.forEach(badge => {
                if (!badge.moduleId) {
                    badge.moduleId = moduleId;
                }
            });
        }
    },

    // Award stars based on proportional completion of module activities
    awardStar: function () {
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId) return;
        this.awardActivityPoints(this.ACTIVITY_POINTS);

        if (!App.state.moduleStars) {
            App.state.moduleStars = {};
        }

        const previousStars = App.state.moduleStars[moduleId] || 0;
        const newProportionalStars = this.calculateModuleStars(moduleId);
        const starsGained = Math.max(0, newProportionalStars - previousStars);
        if (starsGained > 0) {
            App.state.rewards.stars += starsGained;
            App.state.moduleStars[moduleId] = newProportionalStars;
        }

        this.checkStarMilestones();
        this.checkAllBadgeConditions();

        App.updateUI();
        App.saveState();
    },

    awardActivityPoints: function (points) {
        if (!App.state.rewards) {
            App.state.rewards = { stars: 0, points: 0, badges: [] };
        }
        const amount = Number(points);
        if (!Number.isFinite(amount) || amount <= 0) return;
        App.state.rewards.points = (Number(App.state.rewards.points) || 0) + amount;
        const moduleId = App.currentGrammarModuleId;
        if (moduleId) {
            App.state.modulePoints = App.state.modulePoints || {};
            App.state.modulePoints[moduleId] = (Number(App.state.modulePoints[moduleId]) || 0) + amount;
        }
    },

    markActivityCompleted: function (activityId, category) {
        App.state.completedActivities[activityId] = true;
        App.saveState();
    },

    // Show success confirmation for correct answer
    showSuccessConfirmation: function (activityId) {
        const activityElement = document.querySelector(`[data-activity-id="${activityId}"]`);
        if (activityElement) {
            const statusElement = activityElement.querySelector('.activity-status');
            if (statusElement) {
                statusElement.textContent = 'Correct! ';
                statusElement.className = 'activity-status completed';
            }
        }
        // Show modal feedback
        App.showFeedback('Correct Answer!', `Great job! You earned ${this.ACTIVITY_POINTS} learning points and made progress toward a module star.`, '', 'success');
    },

    // Check for star milestones
    checkStarMilestones: function () {
        if (this.rewards) {
            const { bronze, silver, gold, platinum } = this.rewards.stars;
            const currentStars = App.state.rewards.stars;

            if (currentStars === bronze) {
                this.showAchievement('Bronze Star Achievement', 'You earned your first bronze star milestone!', '');
            } else if (currentStars === silver) {
                this.showAchievement('Silver Star Achievement', 'You reached the silver star milestone!', '');
            } else if (currentStars === gold) {
                this.showAchievement('Gold Star Achievement', 'Congratulations! You reached the gold star milestone!', '');
            } else if (currentStars === platinum) {
                this.showAchievement('Platinum Star Achievement', 'Amazing! You reached the platinum star milestone!', '🏅');
            }
        }
    },

    // Check all badge conditions (NEW METHOD)
    checkAllBadgeConditions: function () {
        this.checkLessonBadge();
        this.checkWritingBadge();
        this.checkGameBadge();
        this.checkQuizBadge();
        this.checkSpellingBadge();
        this.checkTimeTravelerBadge();
    },

    // Safe normalization of badge condition text
    getBadgeCondition: function (badge) {
        if (!badge || typeof badge.condition === 'undefined' || badge.condition === null) {
            return '';
        }

        try {
            return String(badge.condition).toLowerCase();
        } catch (e) {
            console.warn('Invalid badge condition, skipping:', e, badge);
            return '';
        }
    },

    // Helper function to check if category is completed
    isCategoryCompleted: function (category, requiredCount) {
        // Get the list of activity IDs for the category
        const categoryActivities = (category === 'writing' ? WritingModule.activities :
            category === 'game' ? GameModule.activities :
                category === 'spelling' ? SpellingHelper.activities :
                    category === 'lesson' ? LessonModule.data || [] :
                        category === 'quiz' ? QuizModule.activities || [] : []
        ).map(activity => activity.id);

        // Get completions for current module
        const moduleId = App.currentGrammarModuleId;
        const moduleCompletions = App.state.completedActivities[moduleId] || {};

        // Count how many activities are completed in the current module
        const completedCount = categoryActivities.reduce((count, id) => {
            return count + (moduleCompletions[id] === 'completed' ? 1 : 0);
        }, 0);

        return completedCount >= requiredCount;
    },
    checkWritingBadge: function () {
        // Award writing-based badges when writing category is sufficiently completed
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const writingActivities = WritingModule.activities?.length || 0;
        const writingCompleted = this.getCompletedCount('writing', moduleId);
        
        // Check for any writing-related badges (those mentioning writing in condition)
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && this.getBadgeCondition(badge).includes('writing'))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && writingCompleted / writingActivities > 0.5) {
                    this.awardBadge(badge);
                }
            });
    },

    checkGameBadge: function () {
        // Award game-based badges when game category is sufficiently completed
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const gameActivities = GameModule.activities?.length || 0;
        const gameCompleted = this.getCompletedCount('game', moduleId);
        
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && this.getBadgeCondition(badge).includes('game'))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && gameCompleted / gameActivities > 0.5) {
                    this.awardBadge(badge);
                }
            });
    },

    checkQuizBadge: function () {
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges || !QuizModule.activities?.length) return;

        const completed = this.getCompletedCount('quiz', moduleId);
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && this.getBadgeCondition(badge).includes('quiz'))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(earned => earned.id === badge.id);
                if (!alreadyAwarded && completed / QuizModule.activities.length > 0.5) {
                    this.awardBadge(badge);
                }
            });
    },

    checkSpellingBadge: function () {
        // Award spelling-based badges
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const spellingActivities = SpellingHelper.activities?.length || 0;
        const spellingCompleted = this.getCompletedCount('spelling', moduleId);
        
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && (this.getBadgeCondition(badge).includes('spelling') || this.getBadgeCondition(badge).includes('spell')))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && spellingCompleted / spellingActivities > 0.5) {
                    this.awardBadge(badge);
                }
            });
    },

    checkLessonBadge: function () {
        // Award lesson-based badges
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const lessonActivities = LessonModule.data?.length || 0;
        const lessonCompleted = this.getCompletedCount('lesson', moduleId);
        
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && (this.getBadgeCondition(badge).includes('lesson') || this.getBadgeCondition(badge).includes('learn')))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && lessonCompleted / lessonActivities > 0.5) {
                    this.awardBadge(badge);
                }
            });
    },

    // Helper to count completed activities in a category
    getCompletedCount: function (category, moduleId) {
        const categoryActivities = (category === 'writing' ? WritingModule.activities :
            category === 'game' ? GameModule.activities :
                category === 'spelling' ? SpellingHelper.activities :
                    category === 'lesson' ? LessonModule.data || [] :
                        category === 'quiz' ? QuizModule.activities || [] : []
        ).map(activity => activity.id);

        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        return categoryActivities.reduce((count, id) => {
            return count + (moduleCompletions[id] === 'completed' ? 1 : 0);
        }, 0);
    },

    checkTimeTravelerBadge: function () {
        // Award master badges when nearly all activities are completed
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0) +
            (QuizModule.activities?.length || 0);

        const totalCompleted = this.getCompletedCount('writing', moduleId) +
            this.getCompletedCount('game', moduleId) +
            this.getCompletedCount('spelling', moduleId) +
            this.getCompletedCount('lesson', moduleId) +
            this.getCompletedCount('quiz', moduleId);

        const completionPercentage = totalCompleted / totalActivities;

        // Award completion badges (those for mastering the entire module)
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && (this.getBadgeCondition(badge).includes('complete') || this.getBadgeCondition(badge).includes('master') || this.getBadgeCondition(badge).includes('platinum')))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && completionPercentage > 0.8) {
                    this.awardBadge(badge);
                }
            });
    },

    // Award a badge (MODULE SPECIFIC)
    awardBadge: function (badge) {
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId) return;
        const bonusPoints = Number.isFinite(Number(badge.points)) ? Math.max(0, Number(badge.points)) : 0;

        App.state.rewards.badges.push({
            id: badge.id,
            name: badge.name,
            icon: badge.icon,
            moduleId: moduleId,  // Track which module earned this badge
            message: badge.message || badge.condition,
            points: bonusPoints
        });

        this.awardActivityPoints(bonusPoints);
        const pointsMessage = bonusPoints ? ` You also earned ${bonusPoints} bonus points.` : '';
        this.showAchievement('New Badge Earned!', ` ${badge.name}\n\n${badge.message || badge.condition}${pointsMessage}`, badge.icon);

        // Check if all badges are collected for this module
        this.checkModuleBadgeCompletion(moduleId);

        // Update UI
        App.updateUI();
        App.saveState();
    },

    // Check if all badges in this module are collected
    checkModuleBadgeCompletion: function (moduleId) {
        const moduleBadges = (this.rewards?.badges || []).filter(b => b.moduleId === moduleId);
        const earnedModuleBadges = (App.state.rewards.badges || []).filter(b => b.moduleId === moduleId);

        if (moduleBadges.length > 0 && earnedModuleBadges.length === moduleBadges.length) {
            this.showAchievement('Module Mastery! ', `You've unlocked all achievements for this module!`, '');
        }
    },

    // Show achievement notification
showAchievement: function (title, message, icon) {
    App.showFeedback(title, message, icon);
    App.playSound('cheeringSound'); // Only for badges & milestones
},

    // Update the stars display to show MODULE-SPECIFIC stars
    updateStarsDisplay: function () {
        const starsContainer = document.getElementById('stars-container');
        if (!starsContainer) return;

        const moduleId = App.currentGrammarModuleId;
        starsContainer.replaceChildren();
        const summary = document.getElementById('rewards-summary');
        const toggleStats = document.getElementById('rewards-toggle-stats');
        if (!moduleId) {
            if (summary) summary.textContent = 'Choose a learning adventure to see your rewards.';
            if (toggleStats) {
                const points = Number(App.state.rewards?.points) || 0;
                toggleStats.textContent = `${points} pts`;
                toggleStats.setAttribute('aria-label', `${points} learning points`);
            }
            return;
        }

        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0) +
            (QuizModule.activities?.length || 0);
        const maxStarsPerModule = Math.min(10, totalActivities);
        const moduleStars = Math.min(
            maxStarsPerModule,
            Math.max(0, App.state.moduleStars[moduleId] || 0)
        );
        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        const completedCount = Object.values(moduleCompletions)
            .filter(status => status === 'completed').length;
        const totalPoints = Number(App.state.rewards?.points) || 0;

        if (summary) {
            summary.textContent = `${totalPoints} learning points · ${moduleStars} of ${maxStarsPerModule} module stars`;
        }
        if (toggleStats) {
            toggleStats.textContent = `${totalPoints} pts`;
            toggleStats.setAttribute('aria-label', `${totalPoints} learning points`);
        }

        const starList = document.createElement('div');
        starList.className = 'star-list';
        starList.setAttribute('role', 'img');
        starList.setAttribute('aria-label', `${moduleStars} of ${maxStarsPerModule} module stars earned`);

        for (let i = 0; i < maxStarsPerModule; i++) {
            const star = document.createElement('span');
            const earned = i < moduleStars;
            star.className = earned ? 'star' : 'star empty';
            star.textContent = earned ? '★' : '☆';
            star.setAttribute('aria-hidden', 'true');
            starList.appendChild(star);
        }
        starsContainer.appendChild(starList);

        const progress = document.createElement('div');
        progress.className = 'star-progress';
        if (maxStarsPerModule === 0 || moduleStars === maxStarsPerModule) {
            const message = document.createElement('p');
            message.className = 'star-progress__message';
            message.textContent = maxStarsPerModule === 0
                ? 'Activities will appear here as you explore this module.'
                : 'All module stars earned. Keep learning to collect more points.';
            progress.appendChild(message);
        } else {
            const previousThreshold = Math.ceil(moduleStars * totalActivities / maxStarsPerModule);
            const nextThreshold = Math.ceil((moduleStars + 1) * totalActivities / maxStarsPerModule);
            const activitiesToNextStar = Math.max(1, nextThreshold - completedCount);
            const segmentSize = Math.max(1, nextThreshold - previousThreshold);
            const segmentProgress = Math.max(0, Math.min(segmentSize, completedCount - previousThreshold));
            const percent = Math.round((segmentProgress / segmentSize) * 100);
            const message = document.createElement('p');
            message.className = 'star-progress__message';
            message.textContent = `Complete ${activitiesToNextStar} more ${activitiesToNextStar === 1 ? 'activity' : 'activities'} to earn your next star.`;
            const track = document.createElement('div');
            track.className = 'star-progress__track';
            track.setAttribute('role', 'progressbar');
            track.setAttribute('aria-label', 'Progress toward your next star');
            track.setAttribute('aria-valuemin', '0');
            track.setAttribute('aria-valuemax', '100');
            track.setAttribute('aria-valuenow', String(percent));
            const fill = document.createElement('div');
            fill.className = 'star-progress__fill';
            fill.style.width = `${percent}%`;
            track.appendChild(fill);
            progress.append(message, track);
        }
        starsContainer.appendChild(progress);
    },

    // Calculate proportional stars based on module completion
    calculateModuleStars: function (moduleId) {
        if (!moduleId) return 0;

        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        const completedCount = Object.values(moduleCompletions).filter(status => status === 'completed').length;

        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0) +
            (QuizModule.activities?.length || 0);

        if (totalActivities === 0) return 0;

        const maxStars = Math.min(10, totalActivities);
        return Math.floor((completedCount / totalActivities) * maxStars);
    },

    // Update the badges display
    // Update the badges display - MODULE SPECIFIC
    updateBadgesDisplay: function () {
        const badgesContainer = document.getElementById('badges-container');
        if (!badgesContainer) return;

        badgesContainer.innerHTML = '';

        const moduleId = App.currentGrammarModuleId;
        if (!moduleId) return;

        // Get module-specific badges (earned badges include module ID)
        const earnedBadges = App.state.rewards.badges || [];
        const moduleBadges = earnedBadges.filter(b => b.moduleId === moduleId);

        // Get all available badges for this module from config
        const allModuleBadges = (this.rewards?.badges || []).filter(b => b.moduleId === moduleId);

        // Create section for badges
        const badgesHeader = document.createElement('div');
        badgesHeader.className = 'badges-header';
        badgesHeader.textContent = 'Achievements';
        badgesContainer.appendChild(badgesHeader);

        const badgesGrid = document.createElement('div');
        badgesGrid.className = 'badges-grid';

        // Display earned badges
        moduleBadges.forEach(badge => {
            const badgeElement = document.createElement('div');
            badgeElement.className = 'badge earned';
            badgeElement.title = `${badge.name}\n${badge.message || badge.condition}`;
            badgeElement.innerHTML = `<span class="badge-icon">${badge.icon}</span><span class="badge-label">${badge.name}</span>`;
            badgesGrid.appendChild(badgeElement);
        });

        // Display locked badges
        allModuleBadges.forEach(rewardBadge => {
            if (!moduleBadges.some(b => b.id === rewardBadge.id)) {
                const badgeElement = document.createElement('div');
                badgeElement.className = 'badge locked';
                badgeElement.title = `Locked: ${rewardBadge.name}\n${rewardBadge.condition}`;
                badgeElement.innerHTML = `<span class="badge-icon"></span><span class="badge-label">${rewardBadge.name}</span>`;
                badgesGrid.appendChild(badgeElement);
            }
        });

        badgesContainer.appendChild(badgesGrid);

        // Show message if no badges yet
        if (moduleBadges.length === 0 && allModuleBadges.length > 0) {
            const noAchievements = document.createElement('p');
            noAchievements.className = 'no-achievements';
            noAchievements.textContent = 'Complete activities to unlock achievements!';
            badgesContainer.appendChild(noAchievements);
        }
    },

    // Reset all rewards
resetRewards: function() {
    console.log(' RewardSystem.resetRewards() - ONLY clearing rewards'); // ADD THIS
    App.state.rewards = {
        stars: 0,
        points: 0,
        badges: []
    };
    App.state.modulePoints = {};
    // DO NOT clear App.state.completedActivities here!
    App.saveState();
    this.updateStarsDisplay();
    this.updateBadgesDisplay();
}
};

// Export the RewardSystem if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RewardSystem;
} else {
    window.RewardSystem = RewardSystem;
}