const RewardSystem = {
    rewards: null,

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
awardStar: function (activityId) {
    // ---- ONLY process if we really completed a new activity in this module ----
    const moduleId = App.currentGrammarModuleId;
    const moduleCompletions = App.state.completedActivities[moduleId] || {};
    const alreadyCompleted = moduleCompletions[activityId];
    if (alreadyCompleted) return;               // <-- PREVENT DOUBLE AWARD

    // Ensure moduleStars exists
    if (!App.state.moduleStars) {
        App.state.moduleStars = {};
    }

    // Calculate NEW proportional stars for this module after this activity
    const previousStars = App.state.moduleStars[moduleId] || 0;
    const newProportionalStars = this.calculateModuleStars(moduleId);

    // Award difference in stars (only if increased)
    const starsGained = Math.max(0, newProportionalStars - previousStars);
    if (starsGained > 0) {
        App.state.rewards.stars += starsGained;
        App.state.moduleStars[moduleId] = newProportionalStars;
    }

    // milestone / badge checks (no sound here)
    this.checkStarMilestones();
    this.checkAllBadgeConditions();

    // UI feedback + correct sound
    if (activityId) {
        this.showSuccessConfirmation(activityId);
        App.playSound('correctSound');
    }

    App.updateUI();
    App.saveState();
},

    // Mark activity as completed in state
markActivityCompleted: function(activityId, category) {
    App.state.completedActivities[activityId] = true; // Use flat structure
    App.saveState();
},

    // Show success confirmation for correct answer
    showSuccessConfirmation: function (activityId) {
        const activityElement = document.querySelector(`[data-activity-id="${activityId}"]`);
        if (activityElement) {
            const statusElement = activityElement.querySelector('.activity-status');
            if (statusElement) {
                statusElement.textContent = 'Correct! ✅';
                statusElement.className = 'activity-status completed';
            }
        }
        // Show modal feedback
        App.showFeedback('Correct Answer!', 'Great job! You answered correctly and earned a star!', '⭐');
    },

    // Check for star milestones
    checkStarMilestones: function () {
        if (this.rewards) {
            const { bronze, silver, gold, platinum } = this.rewards.stars;
            const currentStars = App.state.rewards.stars;

            if (currentStars === bronze) {
                this.showAchievement('Bronze Star Achievement', 'You earned your first bronze star milestone!', '🥉');
            } else if (currentStars === silver) {
                this.showAchievement('Silver Star Achievement', 'You reached the silver star milestone!', '🥈');
            } else if (currentStars === gold) {
                this.showAchievement('Gold Star Achievement', 'Congratulations! You reached the gold star milestone!', '🥇');
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
        this.checkSpellingBadge();
        this.checkTimeTravelerBadge();
    },

    // Helper function to check if category is completed
    isCategoryCompleted: function (category, requiredCount) {
        // Get the list of activity IDs for the category
        const categoryActivities = (category === 'writing' ? WritingModule.activities :
            category === 'game' ? GameModule.activities :
                category === 'spelling' ? SpellingHelper.activities :
                    category === 'lesson' ? LessonModule.data || [] : []
        ).map(activity => activity.id);

        // Get completions for current module
        const moduleId = App.currentGrammarModuleId;
        const moduleCompletions = App.state.completedActivities[moduleId] || {};

        // Count how many activities are completed in the current module
        const completedCount = categoryActivities.reduce((count, id) => {
            return count + (moduleCompletions[id] ? 1 : 0);
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
            .filter(badge => badge.moduleId === moduleId && badge.condition.toLowerCase().includes('writing'))
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
            .filter(badge => badge.moduleId === moduleId && badge.condition.toLowerCase().includes('game'))
            .forEach(badge => {
                const alreadyAwarded = App.state.rewards.badges.some(b => b.id === badge.id);
                if (!alreadyAwarded && gameCompleted / gameActivities > 0.5) {
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
            .filter(badge => badge.moduleId === moduleId && (badge.condition.toLowerCase().includes('spelling') || badge.condition.toLowerCase().includes('spell')))
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
            .filter(badge => badge.moduleId === moduleId && (badge.condition.toLowerCase().includes('lesson') || badge.condition.toLowerCase().includes('learn')))
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
                    category === 'lesson' ? LessonModule.data || [] : []
        ).map(activity => activity.id);

        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        return categoryActivities.reduce((count, id) => {
            return count + (moduleCompletions[id] ? 1 : 0);
        }, 0);
    },

    checkTimeTravelerBadge: function () {
        // Award master badges when nearly all activities are completed
        const moduleId = App.currentGrammarModuleId;
        if (!moduleId || !this.rewards?.badges) return;

        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0);

        const totalCompleted = this.getCompletedCount('writing', moduleId) +
            this.getCompletedCount('game', moduleId) +
            this.getCompletedCount('spelling', moduleId) +
            this.getCompletedCount('lesson', moduleId);

        const completionPercentage = totalCompleted / totalActivities;

        // Award completion badges (those for mastering the entire module)
        this.rewards.badges
            .filter(badge => badge.moduleId === moduleId && (badge.condition.toLowerCase().includes('complete') || badge.condition.toLowerCase().includes('master') || badge.condition.toLowerCase().includes('platinum')))
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

        App.state.rewards.badges.push({
            id: badge.id,
            name: badge.name,
            icon: badge.icon,
            moduleId: moduleId,  // Track which module earned this badge
            message: badge.message || badge.condition
        });

        this.showAchievement('New Badge Earned!', `🎉 ${badge.name}\n\n${badge.message || badge.condition}`, badge.icon);

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
            this.showAchievement('Module Mastery! 🏆', `You've unlocked all achievements for this module!`, '🏆');
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

        starsContainer.innerHTML = '';

        const moduleId = App.currentGrammarModuleId;
        if (!moduleId) return;

        // Get module-specific stars
        const moduleStars = App.state.moduleStars[moduleId] || 0;
        
        // Calculate max stars for this module based on total activities
        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0);

        // Max 10 stars per module proportional to activities
        const maxStarsPerModule = Math.min(10, totalActivities);

        // Create stars based on module-specific count
        for (let i = 0; i < moduleStars; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '⭐';
            starsContainer.appendChild(star);
        }

        // Add empty stars for remaining
        for (let i = moduleStars; i < maxStarsPerModule; i++) {
            const star = document.createElement('span');
            star.className = 'star empty';
            star.textContent = '☆';
            starsContainer.appendChild(star);
        }
    },

    // Calculate proportional stars based on module completion
    calculateModuleStars: function (moduleId) {
        if (!moduleId) return 0;

        const moduleCompletions = App.state.completedActivities[moduleId] || {};
        const completedCount = Object.keys(moduleCompletions).length;

        const totalActivities = (WritingModule.activities?.length || 0) +
            (GameModule.activities?.length || 0) +
            (SpellingHelper.activities?.length || 0) +
            (LessonModule.data?.length || 0);

        if (totalActivities === 0) return 0;

        // Award up to 10 stars proportionally
        const completionPercentage = completedCount / totalActivities;
        const starsEarned = Math.floor(completionPercentage * 10);
        
        return starsEarned;
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
                badgeElement.innerHTML = `<span class="badge-icon">🔒</span><span class="badge-label">${rewardBadge.name}</span>`;
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
    console.log('🔄 RewardSystem.resetRewards() - ONLY clearing rewards'); // ADD THIS
    App.state.rewards = {
        stars: 0,
        badges: []
    };
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