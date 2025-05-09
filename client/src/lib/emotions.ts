/**
 * This file contains the emotion data structures used throughout the application
 */

export interface EmotionGroup {
  core: string;
  primary: string[];
  tertiary: string[][];
}

/**
 * Emotion wheel data structure based on Plutchik's emotion wheel
 * Organized as core emotions → primary emotions → tertiary emotions
 */
export const emotionGroups: EmotionGroup[] = [
  {
    core: "Joy",
    primary: ["Cheerfulness", "Contentment", "Pride", "Optimism", "Enthusiasm", "Love"],
    tertiary: [
      ["Amusement", "Bliss", "Delight", "Elation", "Happiness", "Jubilation"],
      ["Calmness", "Comfort", "Relaxation", "Relief", "Satisfaction", "Serenity"],
      ["Achievement", "Confidence", "Dignity", "Fulfillment", "Success", "Triumph"],
      ["Eagerness", "Hope", "Inspiration", "Motivation", "Positivity", "Trust"],
      ["Excitement", "Exhilaration", "Passion", "Pleasure", "Thrill", "Zeal"],
      ["Adoration", "Affection", "Attraction", "Caring", "Compassion", "Tenderness"]
    ]
  },
  {
    core: "Sadness",
    primary: ["Neglect", "Loneliness", "Disappointment", "Shame", "Suffering", "Sadness"],
    tertiary: [
      ["Abandonment", "Alienation", "Exclusion", "Isolation", "Rejection", "Unwanted"],
      ["Defeat", "Dejection", "Gloom", "Hopelessness", "Hurt", "Unhappiness"],
      ["Embarrassment", "Guilt", "Humiliation", "Insecurity", "Regret", "Self-consciousness"],
      ["Agony", "Anguish", "Despair", "Grief", "Misery", "Pain"],
      ["Depression", "Despair", "Melancholy", "Sorrow", "Unhappiness", "Woe"],
      ["Disconnection", "Emptiness", "Homesickness", "Longing", "Missing", "Nostalgia"]
    ]
  },
  {
    core: "Fear",
    primary: ["Horror", "Nervousness", "Insecurity", "Terror", "Worry", "Fear"],
    tertiary: [
      ["Alarm", "Dread", "Fright", "Panic", "Shock", "Startled"],
      ["Anxiety", "Apprehension", "Discomfort", "Edginess", "Restlessness", "Tension"],
      ["Distrust", "Helplessness", "Inadequacy", "Self-doubt", "Uncertainty", "Vulnerability"],
      ["Dread", "Horror", "Hysteria", "Mortification", "Panic", "Paralysis"],
      ["Apprehension", "Concern", "Distress", "Foreboding", "Nervousness", "Uneasiness"],
      ["Angst", "Disquiet", "Dread", "Nervousness", "Tenseness", "Unease"]
    ]
  },
  {
    core: "Anger",
    primary: ["Rage", "Exasperation", "Irritability", "Envy", "Disgust", "Anger"],
    tertiary: [
      ["Bitterness", "Ferocity", "Fury", "Hate", "Outrage", "Wrath"],
      ["Frustration", "Agitation", "Distress", "Impatience", "Stress", "Tension"],
      ["Aggravation", "Annoyance", "Contempt", "Grouchiness", "Grumpiness", "Irritation"],
      ["Covetousness", "Discontentment", "Jealousy", "Longing", "Resentment", "Rivalry"],
      ["Abhorrence", "Aversion", "Distaste", "Nausea", "Repugnance", "Revulsion"],
      ["Aggression", "Betrayal", "Hostility", "Indignation", "Offense", "Vengefulness"]
    ]
  },
  {
    core: "Surprise",
    primary: ["Amazement", "Confusion", "Excitement", "Awe", "Shock", "Surprise"],
    tertiary: [
      ["Astonishment", "Bewilderment", "Fascination", "Intrigue", "Wonder", "Wow"],
      ["Bewilderment", "Disorientation", "Perplexity", "Puzzlement", "Uncertainty", "Unclarity"],
      ["Eagerness", "Elation", "Enthusiasm", "Exhilaration", "Stimulation", "Thrill"],
      ["Admiration", "Appreciation", "Esteem", "Regard", "Respect", "Reverence"],
      ["Disbelief", "Disturbance", "Jolted", "Stunned", "Stupefaction", "Unsettled"],
      ["Astonishment", "Disbelief", "Distraction", "Impressed", "Startled", "Wonder"]
    ]
  },
  {
    core: "Love",
    primary: ["Acceptance", "Trust", "Admiration", "Adoration", "Desire", "Peace"],
    tertiary: [
      ["Acknowledgment", "Appreciation", "Empathy", "Kindness", "Tolerance", "Understanding"],
      ["Assurance", "Belief", "Certainty", "Confidence", "Faith", "Reliability"],
      ["Approval", "Esteem", "Regard", "Respect", "Reverence", "Worship"],
      ["Affection", "Devotion", "Fondness", "Infatuation", "Liking", "Passion"],
      ["Attraction", "Craving", "Infatuation", "Longing", "Lust", "Yearning"],
      ["Bliss", "Contentment", "Harmony", "Serenity", "Tranquility", "Well-being"]
    ]
  }
];

/**
 * Get all emotion terms in a flat array
 */
export function getAllEmotions(): string[] {
  const emotions: string[] = [];
  
  // Add all core emotions
  emotionGroups.forEach(group => {
    emotions.push(group.core);
    
    // Add all primary emotions
    group.primary.forEach(primary => {
      emotions.push(primary);
      
      // Find the tertiary emotions for this primary
      const primaryIndex = group.primary.indexOf(primary);
      if (primaryIndex >= 0 && group.tertiary[primaryIndex]) {
        // Add all tertiary emotions for this primary
        group.tertiary[primaryIndex].forEach(tertiary => {
          emotions.push(tertiary);
        });
      }
    });
  });
  
  // Remove duplicates and return
  return [...new Set(emotions)];
}

/**
 * Get the color for a specific emotion
 */
export function getEmotionColor(emotion: string): string {
  // Default colors for the core emotions
  const coreColors: Record<string, string> = {
    "Joy": "#FFD700", // gold
    "Sadness": "#4682B4", // steel blue
    "Fear": "#228B22", // forest green
    "Anger": "#FF4500", // red orange
    "Surprise": "#9932CC", // dark orchid
    "Love": "#FF69B4", // hot pink
  };
  
  // Find which core emotion group this emotion belongs to
  for (const group of emotionGroups) {
    // If it's a core emotion, return its color
    if (group.core === emotion) {
      return coreColors[group.core];
    }
    
    // If it's a primary emotion, return a slightly lighter version of the core color
    const primaryIndex = group.primary.indexOf(emotion);
    if (primaryIndex >= 0) {
      return coreColors[group.core] + "CC"; // Add 80% opacity
    }
    
    // Check if it's a tertiary emotion
    for (let i = 0; i < group.primary.length; i++) {
      const tertiaryIndex = group.tertiary[i]?.indexOf(emotion);
      if (tertiaryIndex >= 0) {
        return coreColors[group.core] + "99"; // Add 60% opacity
      }
    }
  }
  
  // If not found, return a default color
  return "#808080"; // gray
}

/**
 * Get various emotion stats for a given set of emotion records
 */
export function getEmotionStats(records: any[]): {
  mostCommon: { emotion: string, count: number }[];
  averageIntensity: number;
  totalCount: number;
  uniqueCount: number;
} {
  if (!records || records.length === 0) {
    return {
      mostCommon: [],
      averageIntensity: 0,
      totalCount: 0,
      uniqueCount: 0
    };
  }
  
  // Count occurrences of each emotion
  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;
  
  records.forEach(record => {
    // Count core emotions
    const emotion = record.tertiaryEmotion || record.primaryEmotion || record.coreEmotion;
    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    
    // Add to total intensity
    totalIntensity += record.intensity || 0;
  });
  
  // Sort emotions by count
  const mostCommon = Object.entries(emotionCounts)
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 emotions
  
  return {
    mostCommon,
    averageIntensity: totalIntensity / records.length,
    totalCount: records.length,
    uniqueCount: Object.keys(emotionCounts).length
  };
}