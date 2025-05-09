// Emotion data structure for the emotion wheel
// Used in both desktop and mobile emotion wheel components

export interface EmotionGroup {
  core: string;
  primary: string[];
  tertiary: string[][];
}

export const emotionGroups: EmotionGroup[] = [
  {
    core: "Anger",
    primary: ["Enraged", "Frustrated", "Irritable", "Exasperated", "Jealous"],
    tertiary: [
      ["Furious", "Vindictive", "Hateful", "Violent", "Hostile"], // Enraged
      ["Agitated", "Annoyed", "Aggravated", "Restless", "Troubled"], // Frustrated
      ["Aggravated", "Annoyed", "Grouchy", "Grumpy", "Cranky"], // Irritable
      ["Upset", "Distressed", "Troubled", "Dismayed", "Disturbed"], // Exasperated
      ["Resentful", "Envious", "Insecure", "Bitter", "Possessive"] // Jealous
    ]
  },
  {
    core: "Fear",
    primary: ["Terrified", "Anxious", "Insecure", "Worried", "Rejected"],
    tertiary: [
      ["Horrified", "Frightened", "Helpless", "Panicked", "Shocked"], // Terrified
      ["Nervous", "Uneasy", "Stressed", "Overwhelmed", "Apprehensive"], // Anxious
      ["Inadequate", "Inferior", "Vulnerable", "Worthless", "Fragile"], // Insecure
      ["Concerned", "Dreading", "Nervous", "Preoccupied", "Tense"], // Worried
      ["Excluded", "Abandoned", "Unwanted", "Humiliated", "Alienated"] // Rejected
    ]
  },
  {
    core: "Sadness",
    primary: ["Despair", "Grief", "Lonely", "Disappointed", "Shameful"],
    tertiary: [
      ["Hopeless", "Inconsolable", "Depressed", "Miserable", "Powerless"], // Despair
      ["Heartbroken", "Sorrowful", "Devastated", "Mourning", "Bereft"], // Grief
      ["Isolated", "Abandoned", "Forsaken", "Deserted", "Neglected"], // Lonely
      ["Let down", "Dissatisfied", "Disillusioned", "Disheartened", "Regretful"], // Disappointed
      ["Embarrassed", "Guilty", "Humiliated", "Disgraced", "Self-conscious"] // Shameful
    ]
  },
  {
    core: "Joy",
    primary: ["Happy", "Grateful", "Proud", "Optimistic", "Enthusiastic"],
    tertiary: [
      ["Delighted", "Cheerful", "Content", "Pleased", "Satisfied"], // Happy
      ["Thankful", "Appreciative", "Blessed", "Moved", "Touched"], // Grateful
      ["Confident", "Accomplished", "Fulfilled", "Triumphant", "Worthy"], // Proud
      ["Hopeful", "Encouraged", "Positive", "Expectant", "Eager"], // Optimistic
      ["Excited", "Inspired", "Passionate", "Energetic", "Motivated"] // Enthusiastic
    ]
  },
  {
    core: "Love",
    primary: ["Affectionate", "Compassionate", "Peaceful", "Devoted", "Tender"],
    tertiary: [
      ["Caring", "Warm", "Fond", "Adoring", "Amorous"], // Affectionate
      ["Empathetic", "Sympathetic", "Kind", "Supportive", "Understanding"], // Compassionate
      ["Calm", "Tranquil", "Serene", "Relaxed", "Harmonious"], // Peaceful
      ["Committed", "Dedicated", "Loyal", "Faithful", "Protective"], // Devoted
      ["Gentle", "Sensitive", "Romantic", "Thoughtful", "Loving"] // Tender
    ]
  },
  {
    core: "Surprise",
    primary: ["Amazed", "Confused", "Stunned", "Perplexed", "Curious"],
    tertiary: [
      ["Astonished", "Awestruck", "Wonderstruck", "Impressed", "Astounded"], // Amazed
      ["Bewildered", "Baffled", "Disoriented", "Disconcerted", "Puzzled"], // Confused
      ["Shocked", "Dazed", "Speechless", "Dumbfounded", "Taken aback"], // Stunned
      ["Mystified", "Disordered", "Lost", "Uncertain", "Disorganized"], // Perplexed
      ["Inquisitive", "Interested", "Intrigued", "Questioning", "Fascinated"] // Curious
    ]
  }
];