// Utility functions for working with emotions

/**
 * Get color and description information for an emotion or topic
 */
export function getEmotionInfo(emotion: string): { color: string; description: string } {
  const emotionMap: Record<string, { color: string; description: string }> = {
    // Positive emotions
    "happiness": { color: "bg-yellow-100 border-yellow-300 text-yellow-800", description: "A feeling of joy, pleasure, or contentment" },
    "joy": { color: "bg-yellow-100 border-yellow-300 text-yellow-800", description: "An intense feeling of great happiness" },
    "excited": { color: "bg-yellow-100 border-yellow-300 text-yellow-800", description: "Feeling enthusiastic and eager" },
    "content": { color: "bg-green-100 border-green-300 text-green-800", description: "A state of peaceful happiness and satisfaction" },
    "satisfied": { color: "bg-green-100 border-green-300 text-green-800", description: "Feeling that your needs or desires have been fulfilled" },
    "proud": { color: "bg-purple-100 border-purple-300 text-purple-800", description: "Feeling deep pleasure or satisfaction from achievements" },
    "optimistic": { color: "bg-blue-100 border-blue-300 text-blue-800", description: "Hopeful and confident about the future" },
    "grateful": { color: "bg-green-100 border-green-300 text-green-800", description: "Feeling thankful and appreciative" },
    "relief": { color: "bg-blue-100 border-blue-300 text-blue-800", description: "A feeling of reassurance when anxiety or distress has been reduced" },
    "love": { color: "bg-pink-100 border-pink-300 text-pink-800", description: "A deep feeling of affection, care, and connection" },
    
    // Negative emotions
    "anger": { color: "bg-red-100 border-red-300 text-red-800", description: "A strong feeling of annoyance, displeasure, or hostility" },
    "anxiety": { color: "bg-orange-100 border-orange-300 text-orange-800", description: "Feeling of worry, nervousness, or unease about something" },
    "fear": { color: "bg-purple-100 border-purple-300 text-purple-800", description: "An unpleasant emotion caused by the threat of danger, pain, or harm" },
    "sadness": { color: "bg-blue-100 border-blue-300 text-blue-800", description: "Feeling or showing sorrow; unhappy" },
    "grief": { color: "bg-indigo-100 border-indigo-300 text-indigo-800", description: "Deep sorrow, especially caused by someone's death" },
    "frustration": { color: "bg-amber-100 border-amber-300 text-amber-800", description: "Feeling of being upset or annoyed as a result of being unable to change or achieve something" },
    "disappointment": { color: "bg-stone-100 border-stone-300 text-stone-800", description: "Sadness or displeasure caused by the non-fulfillment of hopes or expectations" },
    "guilt": { color: "bg-slate-100 border-slate-300 text-slate-800", description: "A feeling of having done wrong or failed in an obligation" },
    "shame": { color: "bg-rose-100 border-rose-300 text-rose-800", description: "A painful feeling of humiliation or distress caused by consciousness of wrong or foolish behavior" },
    "jealousy": { color: "bg-lime-100 border-lime-300 text-lime-800", description: "Feeling or showing envy of someone's achievements or advantages" },
    "stress": { color: "bg-orange-100 border-orange-300 text-orange-800", description: "A state of mental or emotional strain or tension" },
    "overwhelmed": { color: "bg-orange-100 border-orange-300 text-orange-800", description: "Feeling buried or drowning beneath a huge weight of emotions or tasks" },
    
    // Neutral emotions
    "surprised": { color: "bg-violet-100 border-violet-300 text-violet-800", description: "Feeling astonished or taken aback by an unexpected event" },
    "confused": { color: "bg-slate-100 border-slate-300 text-slate-800", description: "Unable to think clearly or understand something" },
    "curious": { color: "bg-teal-100 border-teal-300 text-teal-800", description: "Eager to know or learn something" },
    "indifferent": { color: "bg-gray-100 border-gray-300 text-gray-800", description: "Having no particular interest or sympathy; unconcerned" },
    "bored": { color: "bg-gray-100 border-gray-300 text-gray-800", description: "Feeling weary because one is unoccupied or lacks interest" },
    "calm": { color: "bg-teal-100 border-teal-300 text-teal-800", description: "Not showing or feeling nervousness, anger, or other strong emotions" },
    "nostalgic": { color: "bg-amber-100 border-amber-300 text-amber-800", description: "A sentimental longing for the past" },
    
    // Common topics
    "work": { color: "bg-cyan-100 border-cyan-300 text-cyan-800", description: "Professional activities, career, or job-related concerns" },
    "family": { color: "bg-indigo-100 border-indigo-300 text-indigo-800", description: "Relationships with relatives, family dynamics, or home life" },
    "health": { color: "bg-emerald-100 border-emerald-300 text-emerald-800", description: "Physical or mental wellbeing, fitness, or medical concerns" },
    "relationships": { color: "bg-pink-100 border-pink-300 text-pink-800", description: "Connections with others, romantic partnerships, or friendships" },
    "personal growth": { color: "bg-lime-100 border-lime-300 text-lime-800", description: "Self-improvement, learning, or personal development" },
    "goals": { color: "bg-blue-100 border-blue-300 text-blue-800", description: "Objectives, aspirations, or targets you're working towards" },
    "challenges": { color: "bg-orange-100 border-orange-300 text-orange-800", description: "Difficulties, obstacles, or problems to overcome" },
    "success": { color: "bg-green-100 border-green-300 text-green-800", description: "Achievements, accomplishments, or positive outcomes" },
    "failure": { color: "bg-red-100 border-red-300 text-red-800", description: "Setbacks, disappointments, or unsuccessful attempts" },
    "dreams": { color: "bg-purple-100 border-purple-300 text-purple-800", description: "Aspirations, hopes, or literal dreams during sleep" },
    "conflict": { color: "bg-amber-100 border-amber-300 text-amber-800", description: "Disagreements, arguments, or opposing viewpoints" },
    "finances": { color: "bg-green-100 border-green-300 text-green-800", description: "Money matters, budget, income, or expenses" },
    "spirituality": { color: "bg-indigo-100 border-indigo-300 text-indigo-800", description: "Faith, belief systems, or connection to something greater" },
    "creativity": { color: "bg-fuchsia-100 border-fuchsia-300 text-fuchsia-800", description: "Artistic expression, innovation, or imaginative activities" },
    "education": { color: "bg-amber-100 border-amber-300 text-amber-800", description: "Learning, school, university, or academic pursuits" },
    "travel": { color: "bg-blue-100 border-blue-300 text-blue-800", description: "Journeys, trips, or experiences in different places" },
    "hobbies": { color: "bg-teal-100 border-teal-300 text-teal-800", description: "Activities done for pleasure, interests, or pastimes" },
    "decisions": { color: "bg-violet-100 border-violet-300 text-violet-800", description: "Choices, options, or crossroads in life" },
    "memories": { color: "bg-cyan-100 border-cyan-300 text-cyan-800", description: "Past experiences, recollections, or reminiscences" },
    "future": { color: "bg-sky-100 border-sky-300 text-sky-800", description: "What lies ahead, planning, or anticipation of coming events" }
  };

  // Check if the emotion is in our map (case insensitive)
  const emotionKey = Object.keys(emotionMap).find(
    key => key.toLowerCase() === emotion.toLowerCase()
  );
  
  // Return the info if found, otherwise return default values
  return emotionKey ? emotionMap[emotionKey] : {
    color: "bg-gray-100 border-gray-300 text-gray-800",
    description: "An emotional state or feeling"
  };
}