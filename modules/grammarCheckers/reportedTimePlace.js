// checkers/reportedTimePlace.js
export const reportedTimePlaceChecker = {
  name: "Time & Place in Reported Speech",
  minWords: 20,
  check: function (text, activity) {
    const clean = text.toLowerCase().replace(/[.,!?;:"'()—]/g, '').replace(/\s+/g, ' ');
    const original = text;

    if (clean.split(' ').filter(w => w).length < this.minWords) {
      return { status: 'too-short', title: 'Too Short', message: 'Write full sentences. Aim for at least 20 words.', icon: 'Pencil' };
    }

    // WRITING-1: Time/place expression changes
    if (activity.id === 'writing-1') {
      const hasTimeChange = /\b(that day|the day before|the next day|then|before|that week)\b/i.test(clean);
      const hasPlaceChange = /\b(there|that|those|in that)\b/i.test(clean);
      const hasReportingVerb = /\b(said|told|mentioned|explained)\b/i.test(original);
      const hasPronounShift = /\b(he|she|they|his|her|their)\b/i.test(clean);

      if (!hasReportingVerb) {
        return { status: 'missing', title: 'Missing Reporting Verb', message: 'Use <strong>said/told/mentioned</strong> to introduce reported speech.', icon: 'Volume2' };
      }
      if (!hasTimeChange) {
        return { status: 'missing', title: 'Adjust Time Expression', message: 'Change time words: today→that day, yesterday→the day before, tomorrow→the next day.', icon: 'Calendar' };
      }
      if (!hasPlaceChange) {
        return { status: 'missing', title: 'Adjust Place Expression', message: 'Change place words: here→there, this→that, these→those.', icon: 'MapPin' };
      }
      if (!hasPronounShift) {
        return { status: 'missing', title: 'Update Pronouns', message: 'Change I→he/she, my→his/her when reporting.', icon: 'User' };
      }
    }

    // Check for contextual exceptions (advanced)
    if (activity.id === 'writing-2') {
      const hasContextMarker = /\b(same day|still|right now|here unchanged)\b/i.test(clean);
      const hasShiftedExpression = /\b(that day|the next day|there|then)\b/i.test(clean);
      
      // If context suggests no change needed but user shifted anyway, warn gently
      if (hasContextMarker && hasShiftedExpression && !/\b(but|however|although)\b/i.test(clean)) {
        return { 
          status: 'warning', 
          title: 'Check Context', 
          message: 'If reporting on the same day/in same place, some expressions may stay unchanged. Example: "She said she is busy today" (if still today).', 
          icon: 'AlertCircle' 
        };
      }
    }

    return { status: 'success', title: 'Perfect Time/Place Shifts! ✨', message: 'Your sentence correctly adjusts time/place expressions for the reporting context.', icon: 'CheckCircle' };
  }
};