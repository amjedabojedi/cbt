/**
 * Emotion Mapping Service
 * 
 * This service provides a standardized way to map different emotion terms
 * to their core emotions as defined in the emotion wheel. It helps connect
 * emotions recorded through different interfaces (journal entries, emotion wheel)
 * to enable cross-component data integration.
 */

// Core emotions from our emotion wheel
export const CORE_EMOTIONS = [
  "Anger",
  "Sadness", 
  "Surprise", 
  "Joy", 
  "Love", 
  "Fear"
];

// Define emotion families based on the emotion wheel
export const EMOTION_FAMILIES: Record<string, string[]> = {
  "Anger": [
    // Core
    "anger", "angry",
    // Secondary
    "rage", "exasperated", "irritable", "envy", "disgust",
    // Tertiary
    "hate", "hostile", "agitated", "frustrated", "annoyed", "aggravated",
    "resentful", "jealous", "contempt", "revolted",
    // Common variations
    "mad", "furious", "irritated", "outraged", "resentment"
  ],
  
  "Sadness": [
    // Core
    "sadness", "sad",
    // Secondary
    "suffering", "disappointed", "shameful", "neglected", "despair",
    // Tertiary
    "agony", "hurt", "depressed", "depression", "sorrow", "dismayed", 
    "displeased", "regretful", "guilty", "isolated", "lonely", 
    "grief", "powerless",
    // Common variations
    "unhappy", "miserable", "gloomy", "heartbroken", "melancholy", "blue"
  ],
  
  "Surprise": [
    // Core
    "surprise", "surprised",
    // Secondary
    "stunned", "confused", "amazed", "overcome", "moved",
    // Tertiary
    "shocked", "dismayed", "disillusioned", "perplexed", 
    "astonished", "awe-struck", "awestruck", "speechless", 
    "astounded", "stimulated", "touched",
    // Common variations
    "startled", "taken aback", "bewildered", "dumbfounded"
  ],
  
  "Joy": [
    // Core
    "joy", "joyful",
    // Secondary
    "content", "happy", "cheerful", "proud", "optimistic", 
    "enthusiastic", "elation", "enthralled",
    // Tertiary
    "pleased", "satisfied", "amused", "delighted", "jovial", 
    "blissful", "triumphant", "illustrious", "eager", 
    "hopeful", "excited", "zeal", "euphoric", "jubilation", 
    "enchanted", "rapture",
    // Common variations
    "glad", "ecstatic", "thrilled", "merry", "jovial", "gleeful"
  ],
  
  "Love": [
    // Core
    "love", "loving",
    // Secondary
    "affectionate", "longing", "desire", "tenderness", "peaceful",
    // Tertiary
    "romantic", "fondness", "sentimental", "attracted", 
    "passion", "infatuation", "caring", "compassionate", "relieved",
    // Common variations
    "adoration", "devotion", "warmth", "attachment", "affection"
  ],
  
  "Fear": [
    // Core
    "fear", "fearful",
    // Secondary
    "scared", "terror", "insecure", "nervous", "horror",
    // Tertiary
    "frightened", "helpless", "panic", "hysterical", "inferior", 
    "inadequate", "worried", "anxious", "anxiety", "mortified", "dread",
    // Common variations
    "afraid", "terrified", "alarmed", "phobia", "apprehensive", "worried",
    "uneasy", "stressed", "distressed", "tense"
  ]
};

// Direct mapping for quick lookups
export const EMOTION_MAP: Record<string, string> = {};

// Initialize the direct mapping
for (const [coreEmotion, variations] of Object.entries(EMOTION_FAMILIES)) {
  for (const variation of variations) {
    EMOTION_MAP[variation.toLowerCase()] = coreEmotion;
  }
}

/**
 * Normalizes an emotion term to its core emotion
 * 
 * @param emotion The emotion term to normalize
 * @returns The core emotion, or the original term if no mapping exists
 */
export function normalizeToCoreEmotion(emotion: string): string {
  const lowerEmotion = emotion.toLowerCase();
  return EMOTION_MAP[lowerEmotion] || emotion;
}

/**
 * Checks if two emotions are related (belong to the same core emotion family)
 * 
 * @param emotion1 First emotion to compare
 * @param emotion2 Second emotion to compare
 * @returns True if both emotions map to the same core emotion
 */
export function areRelatedEmotions(emotion1: string, emotion2: string): boolean {
  const core1 = normalizeToCoreEmotion(emotion1);
  const core2 = normalizeToCoreEmotion(emotion2);
  
  return core1 === core2;
}

/**
 * Gets all emotions related to a specific emotion
 * 
 * @param emotion The source emotion
 * @returns Array of emotions in the same family
 */
export function getRelatedEmotions(emotion: string): string[] {
  const coreEmotion = normalizeToCoreEmotion(emotion);
  
  // If we found a core emotion, return all emotions in that family
  if (CORE_EMOTIONS.includes(coreEmotion)) {
    return EMOTION_FAMILIES[coreEmotion];
  }
  
  // If we couldn't map to a core emotion, check each family
  for (const [core, variations] of Object.entries(EMOTION_FAMILIES)) {
    if (variations.includes(emotion.toLowerCase())) {
      return variations;
    }
  }
  
  // If no match found, return just the original emotion
  return [emotion];
}

/**
 * Finds journal entries related to emotions from the emotion wheel
 * 
 * @param wheelEmotion The emotion from the emotion wheel
 * @param journalEmotions List of emotions from journal entries
 * @returns Array of matching journal emotions
 */
export function findMatchingJournalEmotions(
  wheelEmotion: string, 
  journalEmotions: string[]
): string[] {
  const relatedEmotions = getRelatedEmotions(wheelEmotion);
  
  return journalEmotions.filter(journalEmotion => {
    // Direct match
    if (journalEmotion.toLowerCase() === wheelEmotion.toLowerCase()) {
      return true;
    }
    
    // Check if journal emotion is in the related emotions list
    return relatedEmotions.some(relatedEmotion => 
      relatedEmotion.toLowerCase() === journalEmotion.toLowerCase()
    );
  });
}

/**
 * Creates a simplified relationship map between core emotions
 * and their variations for frontend display
 * 
 * @returns Map of core emotions and their key variations
 */
export function getEmotionRelationshipMap(): Record<string, string[]> {
  const displayMap: Record<string, string[]> = {};
  
  for (const [core, emotions] of Object.entries(EMOTION_FAMILIES)) {
    // Select representative emotions (first 5-7 variations) for display
    displayMap[core] = emotions.slice(0, 6);
  }
  
  return displayMap;
}