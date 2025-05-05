/**
 * Centralized color management for consistent chart and UI colors across components
 */

// Color mapping for emotions
export const EMOTION_COLORS = {
  Joy: "hsl(47, 95%, 55%)",        // Vibrant yellow
  Sadness: "hsl(215, 100%, 65%)",  // Blue
  Anger: "hsl(0, 100%, 60%)",      // Red
  Fear: "hsl(265, 95%, 70%)",      // Purple
  Anxiety: "hsl(265, 95%, 70%)",   // Same as Fear (they're related)
  Disgust: "hsl(120, 75%, 40%)",   // Green
  Surprise: "hsl(30, 100%, 65%)",  // Orange
  Love: "hsl(350, 90%, 65%)",      // Pink
  Trust: "hsl(180, 75%, 40%)",     // Teal
  
  // Secondary emotions with related colors
  Content: "hsl(47, 95%, 65%)",    // Lighter Joy
  Peaceful: "hsl(180, 75%, 50%)",  // Lighter Trust
  Relieved: "hsl(215, 90%, 75%)",  // Lighter Sadness
  Tenderness: "hsl(350, 90%, 75%)", // Lighter Love
  Caring: "hsl(350, 80%, 70%)",    // Variation of Love
  Enthusiastic: "hsl(47, 100%, 50%)", // Brighter Joy
  Excited: "hsl(30, 100%, 60%)",   // Similar to Surprise
  Pleased: "hsl(47, 85%, 60%)",    // Variation of Joy
  Satisfied: "hsl(47, 80%, 65%)",  // Variation of Joy
  Enthralled: "hsl(300, 90%, 65%)", // Purple-pink
  Enchanted: "hsl(320, 90%, 65%)"  // Variation of Love
};

// Status colors for goals
export const STATUS_COLORS = {
  pending: "hsl(48, 96%, 53%)",     // Yellow
  inprogress: "hsl(214, 100%, 50%)", // Blue
  approved: "hsl(262, 100%, 60%)",   // Purple
  completed: "hsl(142, 70%, 45%)",   // Green
  cancelled: "hsl(0, 70%, 60%)"      // Red
};

// Chart color sets for consistent data visualization
export const CHART_COLORS = [
  "hsl(47, 95%, 55%)",  // Joy
  "hsl(215, 100%, 65%)", // Sadness
  "hsl(0, 100%, 60%)",   // Anger
  "hsl(265, 95%, 70%)",  // Fear
  "hsl(120, 75%, 40%)",  // Disgust
  "hsl(30, 100%, 65%)",  // Surprise
  "hsl(350, 90%, 65%)",  // Love
  "hsl(180, 75%, 40%)",  // Trust
];

// Chart color sets with lighter hues for better contrast
export const CHART_PASTEL_COLORS = [
  "hsl(47, 90%, 70%)",  // Joy
  "hsl(215, 90%, 75%)", // Sadness
  "hsl(0, 85%, 75%)",   // Anger
  "hsl(265, 85%, 80%)", // Fear
  "hsl(120, 65%, 60%)", // Disgust
  "hsl(30, 90%, 75%)",  // Surprise
  "hsl(350, 80%, 75%)", // Love
  "hsl(180, 65%, 60%)", // Trust
];

// Semantic colors for cognitive distortions
export const COGNITIVE_DISTORTION_COLOR = "hsl(30, 100%, 65%)"; // Orange

/**
 * Gets a color for an emotion, falling back to a default if not found
 */
export function getEmotionColor(emotion: string): string {
  // Normalize the emotion name (lowercase for case-insensitive comparison)
  const normalizedEmotion = emotion.toLowerCase();
  
  // Check exact match first
  if (EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS]) {
    return EMOTION_COLORS[emotion as keyof typeof EMOTION_COLORS];
  }
  
  // Check case-insensitive match
  const exactMatch = Object.keys(EMOTION_COLORS).find(
    key => key.toLowerCase() === normalizedEmotion
  );
  
  if (exactMatch) {
    return EMOTION_COLORS[exactMatch as keyof typeof EMOTION_COLORS];
  }
  
  // Map common variations to core emotions
  if (normalizedEmotion.includes('joy') || 
      normalizedEmotion.includes('happy') || 
      normalizedEmotion.includes('content')) {
    return EMOTION_COLORS.Joy;
  }
  
  if (normalizedEmotion.includes('sad') || 
      normalizedEmotion.includes('depress') || 
      normalizedEmotion.includes('grief')) {
    return EMOTION_COLORS.Sadness;
  }
  
  if (normalizedEmotion.includes('anger') || 
      normalizedEmotion.includes('mad') || 
      normalizedEmotion.includes('frustrat')) {
    return EMOTION_COLORS.Anger;
  }
  
  if (normalizedEmotion.includes('fear') || 
      normalizedEmotion.includes('scar') || 
      normalizedEmotion.includes('worr') || 
      normalizedEmotion.includes('anxie') || 
      normalizedEmotion.includes('anxious')) {
    return EMOTION_COLORS.Fear;
  }
  
  if (normalizedEmotion.includes('disgust') || 
      normalizedEmotion.includes('sick') || 
      normalizedEmotion.includes('nause')) {
    return EMOTION_COLORS.Disgust;
  }
  
  if (normalizedEmotion.includes('surprise') || 
      normalizedEmotion.includes('shock') || 
      normalizedEmotion.includes('astonish')) {
    return EMOTION_COLORS.Surprise;
  }
  
  if (normalizedEmotion.includes('love') || 
      normalizedEmotion.includes('affection') || 
      normalizedEmotion.includes('adore') ||
      normalizedEmotion.includes('passion')) {
    return EMOTION_COLORS.Love;
  }
  
  // Default color for unknown emotions
  return "hsl(210, 20%, 50%)"; // Neutral gray-blue
}

/**
 * Gets a color for a status, falling back to a default if not found
 */
export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/[-_\s]/g, '');
  
  // Direct matches
  if (normalizedStatus === 'pending') return STATUS_COLORS.pending;
  if (normalizedStatus === 'inprogress') return STATUS_COLORS.inprogress;
  if (normalizedStatus === 'approved') return STATUS_COLORS.approved;
  if (normalizedStatus === 'completed') return STATUS_COLORS.completed;
  if (normalizedStatus === 'cancelled') return STATUS_COLORS.cancelled;
  
  // Fuzzy matches
  if (normalizedStatus.includes('pend')) return STATUS_COLORS.pending;
  if (normalizedStatus.includes('progress') || normalizedStatus.includes('start')) return STATUS_COLORS.inprogress;
  if (normalizedStatus.includes('approv') || normalizedStatus.includes('accept')) return STATUS_COLORS.approved;
  if (normalizedStatus.includes('complet') || normalizedStatus.includes('done') || normalizedStatus.includes('finish')) return STATUS_COLORS.completed;
  if (normalizedStatus.includes('cancel') || normalizedStatus.includes('abandon') || normalizedStatus.includes('drop')) return STATUS_COLORS.cancelled;
  
  // Default status color
  return "hsl(214, 20%, 50%)"; // Neutral blue-gray
}

/**
 * Generates a color from a string (consistent color for the same string)
 */
export function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to HSL for more pleasing colors
  const h = Math.abs(hash) % 360;
  const s = 70 + (Math.abs(hash) % 20); // Between 70-90% saturation
  const l = 45 + (Math.abs(hash) % 15); // Between 45-60% lightness
  
  return `hsl(${h}, ${s}%, ${l}%)`;
}