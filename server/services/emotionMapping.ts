/**
 * Emotion Mapping Service
 * 
 * This service provides functionality for mapping emotions to core categories
 * and finding relationships between different emotion terms.
 */

// Define core emotions
export const CORE_EMOTIONS = [
  "Joy",
  "Sadness",
  "Fear",
  "Disgust",
  "Anger",
  "Love",
  "Surprise"
];

// Map emotions to their core families
export const EMOTION_FAMILIES: Record<string, string[]> = {
  "Joy": [
    "Joy",
    "Happiness",
    "Cheerfulness",
    "Contentment",
    "Delight",
    "Elation",
    "Gladness",
    "Satisfaction",
    "Pleasure",
    "Bliss",
    "Euphoria",
    "Excitement",
    "Exhilaration",
    "Optimism",
    "Pride",
    "Triumph",
    "Enthusiasm",
    "Zeal",
    "Hope",
    "Thrill"
  ],
  "Sadness": [
    "Sadness",
    "Grief",
    "Sorrow",
    "Melancholy",
    "Despair",
    "Depression",
    "Hopelessness",
    "Gloom",
    "Loneliness",
    "Anguish",
    "Dejection",
    "Disappointment",
    "Discontentment",
    "Dismay",
    "Homesickness",
    "Regret",
    "Remorse",
    "Unhappiness",
    "Woe",
    "Misery"
  ],
  "Fear": [
    "Fear",
    "Anxiety",
    "Worry",
    "Nervousness",
    "Concern",
    "Apprehension",
    "Dread",
    "Fright",
    "Horror",
    "Panic",
    "Terror",
    "Alarm",
    "Distress",
    "Paranoia",
    "Hysteria",
    "Insecurity",
    "Tension",
    "Uneasiness",
    "Wariness",
    "Phobia",
    "Stress"
  ],
  "Disgust": [
    "Disgust",
    "Aversion",
    "Dislike",
    "Distaste",
    "Nausea",
    "Repulsion",
    "Revulsion",
    "Contempt",
    "Loathing",
    "Abhorrence",
    "Antipathy",
    "Disdain",
    "Scorn",
    "Derision",
    "Disapproval",
    "Resentment"
  ],
  "Anger": [
    "Anger",
    "Rage",
    "Fury",
    "Irritation",
    "Annoyance",
    "Agitation",
    "Frustration",
    "Hostility",
    "Outrage",
    "Wrath",
    "Bitterness",
    "Exasperation",
    "Indignation",
    "Resentment",
    "Aggravation",
    "Animosity",
    "Displeasure",
    "Grouchiness",
    "Grumpiness",
    "Irritability"
  ],
  "Love": [
    "Love",
    "Affection",
    "Fondness",
    "Adoration",
    "Infatuation",
    "Passion",
    "Desire",
    "Caring",
    "Compassion",
    "Tenderness",
    "Attachment",
    "Devotion",
    "Admiration",
    "Warmth",
    "Kindness",
    "Empathy",
    "Sympathy",
    "Gratitude",
    "Appreciation",
    "Trust"
  ],
  "Surprise": [
    "Surprise",
    "Amazement",
    "Astonishment",
    "Shock",
    "Wonder",
    "Awe",
    "Bewilderment",
    "Confusion",
    "Curiosity",
    "Fascination",
    "Perplexity",
    "Disbelief",
    "Incredulity",
    "Stupefaction",
    "Startlement"
  ]
};

// Create a mapping of each emotion variation to its core emotion
export const EMOTION_MAP: Record<string, string> = {};

// Initialize the emotion map
for (const coreEmotion of CORE_EMOTIONS) {
  const variations = EMOTION_FAMILIES[coreEmotion];
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
  if (!emotion) return "";
  
  const normalizedEmotion = emotion.toLowerCase().trim();
  return EMOTION_MAP[normalizedEmotion] || emotion;
}

/**
 * Checks if two emotions are related (belong to the same core emotion family)
 * 
 * @param emotion1 First emotion to compare
 * @param emotion2 Second emotion to compare
 * @returns True if both emotions map to the same core emotion
 */
export function areRelatedEmotions(emotion1: string, emotion2: string): boolean {
  if (!emotion1 || !emotion2) return false;
  
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
  if (!emotion) return [];
  
  const coreEmotion = normalizeToCoreEmotion(emotion);
  
  // If we found a core emotion, return all emotions in that family
  for (const core of CORE_EMOTIONS) {
    if (coreEmotion === core) {
      return EMOTION_FAMILIES[core].filter(e => e.toLowerCase() !== emotion.toLowerCase());
    }
  }
  
  // If we didn't find a match, try to find partial matches
  const normalizedEmotion = emotion.toLowerCase().trim();
  
  // Look through all emotion families for partial matches
  for (const core of CORE_EMOTIONS) {
    const family = EMOTION_FAMILIES[core];
    // Check if any emotion in the family contains the search term
    for (const familyEmotion of family) {
      if (familyEmotion.toLowerCase().includes(normalizedEmotion) ||
          normalizedEmotion.includes(familyEmotion.toLowerCase())) {
        return family.filter(e => e.toLowerCase() !== normalizedEmotion);
      }
    }
  }
  
  // If no match found, return an empty array
  return [];
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
  if (!wheelEmotion || !journalEmotions || journalEmotions.length === 0) {
    return [];
  }
  
  const relatedEmotions = getRelatedEmotions(wheelEmotion);
  relatedEmotions.push(wheelEmotion); // Include the original emotion
  
  // Find emotions from journal that match any of the related emotions
  const matches: string[] = [];
  
  for (const journalEmotion of journalEmotions) {
    for (const relatedEmotion of relatedEmotions) {
      // Check for exact match or substring match
      if (journalEmotion.toLowerCase() === relatedEmotion.toLowerCase() ||
          journalEmotion.toLowerCase().includes(relatedEmotion.toLowerCase()) ||
          relatedEmotion.toLowerCase().includes(journalEmotion.toLowerCase())) {
        matches.push(journalEmotion);
        break;
      }
    }
  }
  
  return matches;
}

/**
 * Creates a simplified relationship map between core emotions
 * and their variations for frontend display
 * 
 * @returns Map of core emotions and their key variations
 */
export function getEmotionRelationshipMap(): Record<string, string[]> {
  const relationshipMap: Record<string, string[]> = {};
  
  // Create a reduced set of emotions for visualization
  for (const core of CORE_EMOTIONS) {
    // Take up to 8 variations for a more manageable display
    const variations = EMOTION_FAMILIES[core].slice(0, 8);
    relationshipMap[core] = variations;
  }
  
  return relationshipMap;
}