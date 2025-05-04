import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type definitions for journal analysis results
export interface JournalAnalysisResult {
  suggestedTags: string[];
  analysis: string;
  emotions: string[];
  topics: string[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

/**
 * Analyzes a journal entry to extract emotions, topics, and suggested tags
 * @param title Journal entry title
 * @param content Journal entry content
 * @returns Analysis result with suggested tags and summary
 */
export async function analyzeJournalEntry(
  title: string,
  content: string
): Promise<JournalAnalysisResult> {
  try {
    const prompt = `
    Please analyze the following journal entry in the context of cognitive behavioral therapy. 
    The entry title is: "${title}"
    
    Journal content:
    "${content}"
    
    Provide the following in JSON format:
    1. suggestedTags: Extract 3-8 most relevant tags that would help categorize this journal entry
    2. analysis: A brief (2-3 sentences) summary of the main themes and emotional content
    3. emotions: Up to 5 emotions expressed in the entry
    4. topics: Up to 5 main topics or themes discussed
    5. sentiment: Score the overall emotional tone with percentages for positive, negative, and neutral (totaling 100%)
    
    Your response should be a valid JSON object with these fields.
    `;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Parse the response
    const responseContent = response.choices[0]?.message?.content || "";
    
    try {
      const parsedResponse = JSON.parse(responseContent) as JournalAnalysisResult;
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      // Return a default response structure with error information
      return generateFallbackAnalysis();
    }
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);
    
    // Check if it's an object with an error property
    if (typeof error === 'object' && error !== null) {
      // Check for quota errors in various possible structures
      const errorObj = error as any;
      
      if (
        errorObj.error?.type === 'insufficient_quota' || 
        errorObj.error?.code === 'insufficient_quota' ||
        errorObj.statusCode === 429 ||
        errorObj.status === 429 ||
        (errorObj.message && errorObj.message.includes('quota'))
      ) {
        console.log("Quota exceeded, using fallback analysis");
      }
    }
    
    // For any API error, use fallback analysis
    return generateFallbackAnalysis();
  }
}

// Fallback analysis function to handle API errors
function generateFallbackAnalysis(title = "", content = ""): JournalAnalysisResult {
  console.log("Using fallback analysis");
  
  // Generate basic fallback tags from the title and content
  const combinedText = `${title} ${content}`.toLowerCase();
  const fallbackTags: string[] = [];
  
  // Check for common emotions in the text - expanded and categorized list
  const emotionKeywords = [
    'happy', 'sad', 'angry', 'anxious', 'stressed', 
    'worried', 'excited', 'calm', 'frustrated', 'confident',
    'fear', 'joy', 'love', 'trust', 'pride', 'hopeful',
    'nervous', 'confused', 'overwhelmed', 'peaceful', 'grateful',
    'motivated', 'disappointed', 'content', 'lonely', 'guilty',
    'ashamed', 'embarrassed', 'surprised', 'jealous', 'hopeless',
    'satisfied', 'hurt', 'insecure', 'regretful', 'optimistic',
    'pessimistic', 'apathetic', 'bored', 'enthusiastic', 'determined',
    'discouraged', 'vulnerable', 'resentful', 'compassionate',
    'depressed', 'numb', 'empty', 'exhausted', 'tired', 'drained',
    'helpless', 'struggling', 'grief', 'grieving', 'hope', 'despair', 
    'meaningless', 'lost', 'distressed', 'miserable', 'relief', 'relieved',
    'alone', 'isolated', 'distant', 'disconnected', 'detached',
    'heavy', 'hollow', 'void', 'abandoned', 'suffocating',
    'tense', 'uneasy', 'restless', 'unsettled', 'apprehensive'
  ];
  
  // Check for common topics
  const topicKeywords = [
    'work', 'family', 'relationship', 'health', 'sleep',
    'exercise', 'friends', 'challenge', 'success', 'failure',
    'conflict', 'achievement', 'goal', 'worry', 'progress',
    'therapy', 'recovery', 'career', 'education', 'finances',
    'hobby', 'self-care', 'mindfulness', 'meditation', 'spirituality',
    'communication', 'boundaries', 'leisure', 'trauma', 'coping',
    'personal growth', 'responsibility', 'self-esteem', 'identity',
    'productivity', 'relaxation', 'habits', 'learning', 'time management',
    'mental health', 'physical health', 'social life', 'home'
  ];
  
  // Build basic fallback tags from the content
  // Collect found emotions and topics separately
  const foundEmotions: string[] = [];
  const foundTopics: string[] = [];
  
  // First, check for exact word matches using word boundaries
  for (const keyword of emotionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText)) {
      foundEmotions.push(keyword);
      fallbackTags.push(keyword);
    }
  }
  
  for (const keyword of topicKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText)) {
      foundTopics.push(keyword);
      fallbackTags.push(keyword);
    }
  }
  
  // If we don't have enough emotions, try a more contextual approach
  if (foundEmotions.length < 3) {
    // Look for emotional phrases that don't directly mention emotion words
    const emotionalPhrases = [
      // Sadness indicators
      { pattern: /hollow\s+ache|heavy\s+heart|heart\s+aches|chest\s+tight/i, emotion: 'sad' },
      { pattern: /tears|cry|sobbing|weeping/i, emotion: 'sad' },
      { pattern: /sinking feeling|pit of my stomach/i, emotion: 'sad' },
      { pattern: /can'?t stop thinking about|keep remembering/i, emotion: 'sad' },
      
      // Anxiety indicators
      { pattern: /dark\s+corners|dark\s+thoughts|restless|uninvited\s+thoughts/i, emotion: 'anxious' },
      { pattern: /racing\s+heart|racing\s+mind|racing\s+thoughts|heart\s+pounds/i, emotion: 'anxious' },
      { pattern: /can'?t\s+sleep|insomnia|awake\s+at\s+night|tossing\s+turning/i, emotion: 'anxious' },
      { pattern: /pacing|fidgeting|nail biting|restless/i, emotion: 'anxious' },
      { pattern: /worried|overthinking|ruminating|what if/i, emotion: 'anxious' },
      
      // Fear indicators
      { pattern: /trembling|shaking|tremors|freeze/i, emotion: 'fearful' },
      { pattern: /terror|scared|frightened|panic/i, emotion: 'fearful' },
      
      // Hiding/Concealing emotions
      { pattern: /hide\s+struggle|hiding\s+pain|conceal\s+feelings|mask|facade/i, emotion: 'struggling' },
      { pattern: /pretend|fake smile|act like|putting on a face/i, emotion: 'struggling' },
      
      // Overwhelm indicators
      { pattern: /weight\s+on|burden|shoulders|carrying/i, emotion: 'overwhelmed' },
      { pattern: /too much|can'?t handle|drowning|sinking/i, emotion: 'overwhelmed' },
      
      // Isolation indicators
      { pattern: /alone|lonely|isolated|no\s+one|by myself/i, emotion: 'lonely' },
      { pattern: /disconnected|cut off|abandoned|no one understands/i, emotion: 'lonely' },
      
      // Fatigue indicators
      { pattern: /exhausted|drained|no\s+energy|tired|fatigue/i, emotion: 'exhausted' },
      { pattern: /can'?t focus|brain fog|difficult to concentrate/i, emotion: 'exhausted' },
      
      // Frustration indicators
      { pattern: /irritated|annoyed|bothered|agitated/i, emotion: 'frustrated' },
      { pattern: /unfair|stuck|trapped|no way out/i, emotion: 'frustrated' },
      
      // Emptiness indicators
      { pattern: /numb|nothing|emptiness|void|hollow/i, emotion: 'numb' },
      { pattern: /can'?t feel|emotionless|blank|empty inside/i, emotion: 'numb' },
      
      // Empty/meaninglessness
      { pattern: /empty|meaningless|pointless|purposeless/i, emotion: 'empty' },
      { pattern: /why bother|what'?s the point|going through motions/i, emotion: 'empty' },
      { pattern: /floating in a void|distant|far from|absent|not present/i, emotion: 'empty' },
      
      // Happiness indicators
      { pattern: /smile|grin|laugh|chuckle|joy/i, emotion: 'happy' },
      { pattern: /feeling good|great day|positive|cheerful/i, emotion: 'happy' },
      
      // Other positive emotions
      { pattern: /grateful|thankful|appreciate|blessed/i, emotion: 'grateful' },
      { pattern: /hopeful|looking\s+forward|optimistic|better\s+days/i, emotion: 'hopeful' },
      { pattern: /quiet|silence|peaceful|tranquil/i, emotion: 'calm' },
      
      // Body-related signals
      { pattern: /knot in (my|the) throat|lump in (my|the) throat/i, emotion: 'sad' },
      { pattern: /stomach (in|into) knots|butterflies|churning/i, emotion: 'anxious' }
    ];

    // Check for contextual emotional phrases
    for (const { pattern, emotion } of emotionalPhrases) {
      if (pattern.test(combinedText) && !foundEmotions.includes(emotion)) {
        foundEmotions.push(emotion);
        fallbackTags.push(emotion);
        if (foundEmotions.length >= 3) break;
      }
    }
    
    // If still not enough emotions, fall back to keyword searching
    if (foundEmotions.length < 2) {
      for (const keyword of emotionKeywords) {
        // If we haven't already found this emotion and it's contained in the text
        if (!foundEmotions.includes(keyword) && combinedText.includes(keyword)) {
          foundEmotions.push(keyword);
          fallbackTags.push(keyword);
          // Stop after finding 3 emotions
          if (foundEmotions.length >= 3) break;
        }
      }
    }
  }
  
  // If we don't have enough topics, try a more flexible approach
  if (foundTopics.length < 2) {
    for (const keyword of topicKeywords) {
      // If we haven't already found this topic and it's contained in the text
      if (!foundTopics.includes(keyword) && combinedText.includes(keyword)) {
        foundTopics.push(keyword);
        fallbackTags.push(keyword);
        // Stop after finding 3 topics
        if (foundTopics.length >= 3) break;
      }
    }
  }
  
  // Ensure we have at least a few tags
  if (fallbackTags.length < 3) {
    // Add some general tags
    fallbackTags.push('journal', 'reflection');
    
    // Add a general emotion if we found none
    if (foundEmotions.length === 0) {
      // Pick default emotions based on title/content keywords
      if (combinedText.includes('problem') || combinedText.includes('difficult') || 
          combinedText.includes('bad') || combinedText.includes('hard') ||
          combinedText.includes('trouble') || combinedText.includes('issue')) {
        fallbackTags.push('concerned');
        foundEmotions.push('concerned');
      } else {
        fallbackTags.push('reflective');
        foundEmotions.push('reflective');
      }
    }
    
    // Add a general topic if we found none
    if (foundTopics.length === 0) {
      fallbackTags.push('personal development');
      foundTopics.push('personal development');
    }
    
    // Add a tag based on content length
    if (content.length > 500) {
      fallbackTags.push('detailed');
    } else {
      fallbackTags.push('brief');
    }
  }
  
  // Limit to 8 tags maximum
  const limitedTags = fallbackTags.slice(0, 8);
  
  // Create a more meaningful analysis based on found emotions and topics
  let analysisText = "";
  
  // Generate analysis text based on found emotions and topics
  if (foundEmotions.length > 0 && foundTopics.length > 0) {
    analysisText = `This entry reflects ${foundEmotions.join(', ')} emotions in relation to ${foundTopics.join(', ')}. `;
    
    // Add a second sentence with a general insight
    analysisText += `Consider how these feelings influence your approach to these areas of your life.`;
  } else if (foundEmotions.length > 0) {
    analysisText = `This entry primarily expresses ${foundEmotions.join(', ')} emotions. `;
    analysisText += `Reflecting on the sources of these feelings may provide additional insights.`;
  } else if (foundTopics.length > 0) {
    analysisText = `This entry focuses on ${foundTopics.join(', ')}. `;
    analysisText += `Consider exploring your emotional responses to these topics in future reflections.`;
  } else {
    analysisText = `This entry contains general reflections. Consider exploring specific emotions and scenarios in future entries for deeper insights.`;
  }
  
  // Define positive, negative, and neutral emotions with expanded categories
  const positiveEmotions = [
    'happy', 'excited', 'confident', 'joy', 'love', 'trust', 'pride', 'hopeful', 
    'peaceful', 'grateful', 'motivated', 'content', 'satisfied', 'optimistic', 
    'enthusiastic', 'determined', 'compassionate', 'relieved', 'cheerful', 'pleased',
    'delighted', 'joyful', 'elated', 'glad', 'serene', 'confident'
  ];
  
  const negativeEmotions = [
    'sad', 'angry', 'anxious', 'stressed', 'worried', 'frustrated', 'fear', 'nervous', 
    'confused', 'overwhelmed', 'lonely', 'guilty', 'ashamed', 'embarrassed', 'jealous', 
    'hopeless', 'hurt', 'insecure', 'regretful', 'pessimistic', 'discouraged', 'vulnerable', 
    'resentful', 'unhappy', 'distrust', 'dislike', 'uncomfortable', 'dissatisfied', 'displeased',
    'empty', 'numb', 'depressed', 'desperate', 'miserable', 'upset', 'grief', 'grieving',
    'lost', 'helpless', 'drained', 'exhausted', 'tired', 'worried', 'distressed',
    'alone', 'isolated', 'distant', 'disconnected', 'detached', 'abandoned', 
    'suffocating', 'tense', 'uneasy', 'restless', 'unsettled', 'apprehensive'
  ];
  
  const neutralEmotions = [
    'calm', 'reflective', 'surprised', 'apathetic', 'bored', 'curious',
    'interested', 'thoughtful', 'contemplative', 'nostalgic', 'indifferent',
    'pensive', 'wondering'
  ];
  
  // Check for negation patterns in the text (like "not happy", "don't like", etc.)
  const negationPatterns = [
    /\bnot\s+(\w+)\b/gi,             // "not happy"
    /\bdon'?t\s+(\w+)\b/gi,          // "don't like"
    /\bdidn'?t\s+(\w+)\b/gi,         // "didn't enjoy"
    /\bisn'?t\s+(\w+)\b/gi,          // "isn't good"
    /\baren'?t\s+(\w+)\b/gi,         // "aren't helpful"
    /\bwasn'?t\s+(\w+)\b/gi,         // "wasn't pleasant"
    /\bweren'?t\s+(\w+)\b/gi,        // "weren't nice"
    /\bhaven'?t\s+(\w+)\b/gi,        // "haven't enjoyed"
    /\bhasn'?t\s+(\w+)\b/gi,         // "hasn't improved"
    /\bwouldn'?t\s+(\w+)\b/gi,       // "wouldn't recommend"
    /\bcouldn'?t\s+(\w+)\b/gi,       // "couldn't understand"
    /\bshouldn'?t\s+(\w+)\b/gi,      // "shouldn't worry"
    /\bno\s+(\w+)\b/gi,              // "no interest"
    /\bnever\s+(\w+)\b/gi,           // "never enjoy"
    /\bnor\s+(\w+)\b/gi,             // "nor happy"
    /\bneither\s+(\w+)\b/gi,         // "neither pleased"
    /\black\s+of\s+(\w+)\b/gi,       // "lack of enthusiasm"
    /\bavoid\s+(\w+)\b/gi,           // "avoid conflict"
    /\brefuse\s+to\s+(\w+)\b/gi      // "refuse to participate"
  ];
  
  // Check for negated positive emotions and add negative emotions instead
  const negatedWords: string[] = [];
  
  // Process each negation pattern separately
  negationPatterns.forEach(pattern => {
    // Reset pattern's lastIndex to 0 before using
    pattern.lastIndex = 0;
    
    let match;
    while ((match = pattern.exec(combinedText)) !== null) {
      if (match && match[1]) {
        const negatedWord = match[1].toLowerCase();
        negatedWords.push(negatedWord);
        
        // If a negated word is a positive emotion, add opposing negative emotions
        if (positiveEmotions.includes(negatedWord)) {
          // If not happy, add sad
          if (negatedWord === 'happy') foundEmotions.push('sad');
          // If not excited, add bored
          else if (negatedWord === 'excited') foundEmotions.push('bored');
          // If not love, add dislike
          else if (negatedWord === 'love') foundEmotions.push('dislike');
          // Generic case - add a negative emotion
          else foundEmotions.push('unhappy');
          
          // Add to fallback tags
          if (!fallbackTags.includes('unhappy')) fallbackTags.push('unhappy');
          
          // Remove any occurrences of the positive emotion
          const indexToRemove = foundEmotions.indexOf(negatedWord);
          if (indexToRemove > -1) foundEmotions.splice(indexToRemove, 1);
          
          // Remove from tags too
          const tagIndexToRemove = fallbackTags.indexOf(negatedWord);
          if (tagIndexToRemove > -1) fallbackTags.splice(tagIndexToRemove, 1);
        }
      }
    }
  });
  
  // Look for specific negative phrases
  const negativePatterns = [
    /not happy/i, /unhappy/i, /not satisfied/i, /dissatisfied/i,
    /not comfortable/i, /uncomfortable/i, /not pleased/i, /displeased/i,
    /not glad/i, /not excited/i, /not confident/i, /not trusting/i,
    /distrust/i, /mistrust/i, /insecure/i, /anxious/i
  ];
  
  let hasExplicitNegativeExpressions = false;
  for (const pattern of negativePatterns) {
    if (pattern.test(combinedText)) {
      hasExplicitNegativeExpressions = true;
      
      // Add appropriate negative emotions if not already present
      if (!foundEmotions.includes('unhappy')) {
        foundEmotions.push('unhappy');
        fallbackTags.push('unhappy');
      }
      
      // For specific patterns, add more specific emotions
      if (/anxious|anxiety/i.test(combinedText) && !foundEmotions.includes('anxious')) {
        foundEmotions.push('anxious');
        fallbackTags.push('anxious');
      }
      
      if (/distrust|mistrust|not trust/i.test(combinedText) && !foundEmotions.includes('distrust')) {
        foundEmotions.push('distrust');
        fallbackTags.push('distrust');
      }
      
      break;
    }
  }
  
  // Calculate a more accurate sentiment based on the emotions and content
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Check first for explicit negative content indicators
  const explicitNegativeContent = 
    /floating in a void|distant|far from|absent|not present|nod, rehearsed|far from fine|though i'm far from fine|knot tightens|go through motions|hollow|void|empty|numb|emotionless|blank|empty inside|can'?t feel/i.test(combinedText);
  
  // Override with negative sentiment for clearly negative content
  if (explicitNegativeContent && foundEmotions.some(e => ['numb', 'empty', 'hollow', 'void', 'absent'].includes(e))) {
    // Ensure happy is not incorrectly included for clearly empty/numb entries
    const happyIndex = foundEmotions.indexOf('happy');
    if (happyIndex > -1) {
      foundEmotions.splice(happyIndex, 1);
      
      // Also remove happy from tags
      const tagIndex = fallbackTags.indexOf('happy');
      if (tagIndex > -1) {
        fallbackTags.splice(tagIndex, 1);
      }
    }
    
    // Add more appropriate emotions if needed
    if (!foundEmotions.includes('empty')) {
      foundEmotions.push('empty');
      fallbackTags.push('empty');
    }
    
    if (!foundEmotions.includes('numb')) {
      foundEmotions.push('numb');
      fallbackTags.push('numb');
    }
    
    // Force sentiment to negative for these specific emotion types
    positiveScore = 0;
    negativeScore = 85;
    neutralScore = 15;
  } else {
  
  // Count the emotions in each category
  const positiveCount = foundEmotions.filter(e => positiveEmotions.includes(e)).length;
  const negativeCount = foundEmotions.filter(e => negativeEmotions.includes(e)).length;
  const neutralCount = foundEmotions.filter(e => neutralEmotions.includes(e)).length;
  
  // Calculate percentages if we have any emotions
  const totalEmotions = positiveCount + negativeCount + neutralCount;
  if (totalEmotions > 0) {
    positiveScore = Math.round((positiveCount / totalEmotions) * 100);
    negativeScore = Math.round((negativeCount / totalEmotions) * 100);
    neutralScore = 100 - positiveScore - negativeScore;
    // Ensure neutralScore is at least 0
    neutralScore = Math.max(0, neutralScore);
  }
  
  // If we found explicit negative expressions but somehow still have high positive score,
  // adjust the sentiment to reflect the negative expressions
  if (hasExplicitNegativeExpressions && positiveScore > 50) {
    positiveScore = 20;
    negativeScore = 60;
    neutralScore = 20;
  }
  
  // If we detected negated positive words but sentiment doesn't reflect it,
  // adjust the sentiment scores
  if (negatedWords.some(word => positiveEmotions.includes(word)) && positiveScore > negativeScore) {
    positiveScore = 20;
    negativeScore = 60;
    neutralScore = 20;
  }
  
  }
  
  return {
    suggestedTags: limitedTags,
    analysis: analysisText,
    emotions: foundEmotions,
    topics: foundTopics,
    sentiment: { 
      positive: positiveScore, 
      negative: negativeScore, 
      neutral: neutralScore 
    }
  };
}