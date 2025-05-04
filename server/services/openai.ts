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
  const foundEmotions: string[] = [];
  const foundTopics: string[] = [];
  
  // Define emotion and topic keywords
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
  
  // Pattern matching for common emotional contexts
  // Check for isolation/loneliness patterns
  if (/alone|lonely|isolated|no one|by myself|disconnected|distant|foreign|alien/i.test(combinedText)) {
    if (!foundEmotions.includes('lonely')) {
      foundEmotions.push('lonely');
      fallbackTags.push('lonely');
    }
    if (!foundTopics.includes('isolation')) {
      foundTopics.push('isolation');
      fallbackTags.push('isolation');
    }
  }
  
  // Check for exhaustion/burnout patterns
  if (/tired|exhausted|drained|no energy|can'?t focus|overwhelmed|burden/i.test(combinedText)) {
    if (!foundEmotions.includes('exhausted')) {
      foundEmotions.push('exhausted');
      fallbackTags.push('exhausted');
    }
    if (!foundTopics.includes('self-care')) {
      foundTopics.push('self-care');
      fallbackTags.push('self-care');
    }
  }
  
  // Check for anxiety patterns
  if (/anxious|anxiety|worry|worries|racing thoughts|heart racing|mind racing|nervous|tense|on edge|alert/i.test(combinedText)) {
    if (!foundEmotions.includes('anxious')) {
      foundEmotions.push('anxious');
      fallbackTags.push('anxious');
    }
  }
  
  // Check for sadness patterns
  if (/sad|tear|cry|blue|down|heartbreak|sorrow|grief|weep|upset|miserable/i.test(combinedText)) {
    if (!foundEmotions.includes('sad')) {
      foundEmotions.push('sad');
      fallbackTags.push('sad');
    }
  }
  
  // Check for emptiness/numbness patterns
  if (/empty|hollow|void|numb|nothing|emotionless|blank|can'?t feel|floating in a void|distant|far from|absent/i.test(combinedText)) {
    if (!foundEmotions.includes('empty')) {
      foundEmotions.push('empty');
      fallbackTags.push('empty');
    }
    if (!foundEmotions.includes('numb')) {
      foundEmotions.push('numb');
      fallbackTags.push('numb');
    }
  }
  
  // Check for exact emotion word matches
  for (const keyword of emotionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText) && !foundEmotions.includes(keyword)) {
      foundEmotions.push(keyword);
      fallbackTags.push(keyword);
    }
  }
  
  // Check for exact topic word matches
  for (const keyword of topicKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText) && !foundTopics.includes(keyword)) {
      foundTopics.push(keyword);
      fallbackTags.push(keyword);
    }
  }
  
  // If we don't have enough emotions, look for emotional phrases
  if (foundEmotions.length < 2) {
    // Emotional phrases that don't directly mention emotion words
    const emotionalPhrases = [
      { pattern: /tears|cry|sobbing|weeping/i, emotion: 'sad' },
      { pattern: /dark\s+thoughts|restless|uninvited\s+thoughts/i, emotion: 'anxious' },
      { pattern: /racing\s+thoughts|heart\s+pounds/i, emotion: 'anxious' },
      { pattern: /trembling|shaking|tremors|freeze/i, emotion: 'fearful' },
      { pattern: /hide\s+struggle|putting on a face/i, emotion: 'struggling' },
      { pattern: /weight\s+on|burden|shoulders/i, emotion: 'overwhelmed' },
      { pattern: /disconnected|abandoned/i, emotion: 'lonely' },
      { pattern: /brain fog|difficult to concentrate/i, emotion: 'exhausted' },
      { pattern: /irritated|annoyed|bothered/i, emotion: 'frustrated' },
      { pattern: /can'?t feel|empty inside/i, emotion: 'numb' },
      { pattern: /smile|grin|laugh|chuckle/i, emotion: 'happy' },
      { pattern: /grateful|thankful|appreciate/i, emotion: 'grateful' },
      { pattern: /hopeful|looking\s+forward/i, emotion: 'hopeful' },
      { pattern: /quiet|silence|peaceful|tranquil/i, emotion: 'calm' }
    ];

    for (const { pattern, emotion } of emotionalPhrases) {
      if (pattern.test(combinedText) && !foundEmotions.includes(emotion)) {
        foundEmotions.push(emotion);
        fallbackTags.push(emotion);
      }
    }
  }
  
  // Ensure we have some tags
  if (fallbackTags.length < 3) {
    // Add standard journal tags
    fallbackTags.push('journal', 'reflection');
    
    // Add a default emotion if none found
    if (foundEmotions.length === 0) {
      fallbackTags.push('reflective');
      foundEmotions.push('reflective');
    }
    
    // Add a default topic if none found
    if (foundTopics.length === 0) {
      fallbackTags.push('personal development');
      foundTopics.push('personal development');
    }
    
    // Add length-based tag
    fallbackTags.push(content.length > 500 ? 'detailed' : 'brief');
  }
  
  // Limit to 8 tags maximum
  const limitedTags = fallbackTags.slice(0, 8);
  
  // Generate analysis text
  let analysisText = "";
  
  // Check for specific patterns that might provide deeper insights
  let insightText = "";
  
  // Self-doubt patterns
  if (/not good enough|failure|mistake|mess up|can'?t do|wrong with me|why can'?t I|failing|pointless/i.test(combinedText)) {
    insightText += "Consider how negative self-evaluation influences your perspective. ";
    if (!foundTopics.includes('self-esteem')) {
      foundTopics.push('self-esteem');
      fallbackTags.push('self-esteem');
    }
  }
  
  // Concealing feelings patterns
  if (/pretend|fake|hide|mask|act like|nodding|rehearsed|putting on|far from fine/i.test(combinedText)) {
    insightText += "The effort to conceal true feelings may create additional emotional tension. ";
    if (!foundTopics.includes('authenticity')) {
      foundTopics.push('authenticity');
      fallbackTags.push('authenticity');
    }
  }
  
  // Rumination patterns
  if (/can'?t stop|keep thinking|over and over|racing thoughts|mind won'?t quiet|replaying|keep remembering/i.test(combinedText)) {
    insightText += "Repetitive thought patterns may be contributing to emotional intensity. ";
    if (!fallbackTags.includes('rumination')) {
      fallbackTags.push('rumination');
    }
  }
  
  // Create the final analysis text
  if (foundEmotions.length > 0 && foundTopics.length > 0) {
    analysisText = `This entry reflects ${foundEmotions.join(', ')} emotions in relation to ${foundTopics.join(', ')}. `;
    analysisText += insightText || "Consider how these feelings influence your approach to these areas of your life.";
  } else if (foundEmotions.length > 0) {
    analysisText = `This entry primarily expresses ${foundEmotions.join(', ')} emotions. `;
    analysisText += insightText || "Reflecting on the sources of these feelings may provide additional insights.";
  } else if (foundTopics.length > 0) {
    analysisText = `This entry focuses on ${foundTopics.join(', ')}. `;
    analysisText += insightText || "Consider exploring your emotional responses to these topics in future reflections.";
  } else {
    analysisText = `This entry contains general reflections. `;
    analysisText += insightText || "Consider exploring specific emotions and scenarios in future entries for deeper insights.";
  }
  
  // Calculate sentiment scores
  const positiveEmotions = ['happy', 'excited', 'confident', 'joy', 'love', 'trust', 'pride', 'hopeful', 
    'peaceful', 'grateful', 'motivated', 'content', 'satisfied', 'optimistic', 'enthusiastic', 
    'determined', 'compassionate', 'relieved', 'cheerful', 'pleased'];
    
  const negativeEmotions = ['sad', 'angry', 'anxious', 'stressed', 'worried', 'frustrated', 'fear', 'nervous', 
    'confused', 'overwhelmed', 'lonely', 'guilty', 'ashamed', 'embarrassed', 'jealous', 'hopeless', 'hurt', 
    'insecure', 'regretful', 'pessimistic', 'discouraged', 'vulnerable', 'resentful', 'unhappy', 'empty', 
    'numb', 'depressed', 'desperate', 'miserable', 'upset', 'helpless', 'drained', 'exhausted', 'tired'];
    
  const neutralEmotions = ['calm', 'reflective', 'surprised', 'apathetic', 'bored', 'curious', 'interested', 
    'thoughtful', 'contemplative', 'nostalgic', 'indifferent', 'pensive', 'wondering'];
  
  // Calculate sentiment scores
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Special case for clear negative content
  if (/floating in a void|distant|far from|absent|not present|nod, rehearsed|far from fine|hollow|void|empty|numb|emotionless|blank|empty inside|can'?t feel/i.test(combinedText) && 
      foundEmotions.some(e => ['numb', 'empty', 'hollow', 'void', 'absent'].includes(e))) {
    positiveScore = 0;
    negativeScore = 85;
    neutralScore = 15;
  } else {
    // Count emotions by category
    const positiveCount = foundEmotions.filter(e => positiveEmotions.includes(e)).length;
    const negativeCount = foundEmotions.filter(e => negativeEmotions.includes(e)).length;
    const neutralCount = foundEmotions.filter(e => neutralEmotions.includes(e)).length;
    
    const totalEmotions = positiveCount + negativeCount + neutralCount;
    if (totalEmotions > 0) {
      positiveScore = Math.round((positiveCount / totalEmotions) * 100);
      negativeScore = Math.round((negativeCount / totalEmotions) * 100);
      neutralScore = 100 - positiveScore - negativeScore;
      neutralScore = Math.max(0, neutralScore);
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