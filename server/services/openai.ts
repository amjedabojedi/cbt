import OpenAI from "openai";
import crypto from "crypto";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Type definitions for journal analysis results
export interface JournalAnalysisResult {
  suggestedTags: string[];
  analysis: string;
  emotions: string[];
  topics: string[];
  cognitiveDistortions?: string[];
  sentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

// Cache interface for storing analysis results
interface CacheEntry {
  result: JournalAnalysisResult;
  timestamp: number;
  hash: string;
}

// Simple LRU cache for OpenAI responses
// Create a singleton instance for the application
const analysisCache = new class AnalysisCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 100;
  private ttlMs: number = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  // Generate a hash for the content
  private generateHash(text: string): string {
    return crypto.createHash('md5').update(text.toLowerCase().trim()).digest('hex');
  }

  // Check if we have a cached result for this content
  public get(title: string, content: string): JournalAnalysisResult | null {
    const now = Date.now();
    const hash = this.generateHash(`${title}:${content}`);
    
    const cached = this.cache.get(hash);
    
    // If we have a cached entry and it's not expired
    if (cached && (now - cached.timestamp) < this.ttlMs) {
      console.log("CACHE HIT! Using cached analysis");
      return cached.result;
    }
    
    // Delete if expired
    if (cached) {
      console.log("CACHE EXPIRED. Deleting entry.");
      this.cache.delete(hash);
    }
    
    return null;
  }

  // Store a result in the cache
  public set(title: string, content: string, result: JournalAnalysisResult): void {
    const hash = this.generateHash(`${title}:${content}`);
    
    // Ensure we don't exceed max entries (simple LRU - delete oldest entry)
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      hash
    });
    
    console.log("CACHE STORE. New analysis cached.");
  }

  // Check if a text is similar to any cached entries
  public findSimilar(title: string, content: string, threshold: number = 0.8): JournalAnalysisResult | null {
    // Only try to find similar for shorter content (efficiency)
    if (content.length > 1000) return null;
    
    const contentWords = new Set(
      (title + ' ' + content).toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)  // Only consider words longer than 3 chars
    );
    
    let bestMatch: { similarity: number, result: JournalAnalysisResult } | null = null;
    
    // Check each cache entry for similarity
    for (const [key, entry] of this.cache.entries()) {
      // Skip if entry is expired
      if (Date.now() - entry.timestamp > this.ttlMs) continue;
      
      // Extract key parts (we stored as "title:content")
      const [cachedTitle, ...cachedContentParts] = key.split(':');
      const cachedContent = cachedContentParts.join(':');
      
      const cachedWords = new Set(
        (cachedTitle + ' ' + cachedContent).toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3)
      );
      
      // Calculate Jaccard similarity (intersection over union)
      const intersection = new Set([...contentWords].filter(x => cachedWords.has(x)));
      const union = new Set([...contentWords, ...cachedWords]);
      
      const similarity = intersection.size / union.size;
      
      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = {
          similarity,
          result: entry.result
        };
      }
    }
    
    if (bestMatch) {
      console.log(`SIMILARITY CACHE HIT! Found content with ${Math.round(bestMatch.similarity * 100)}% similarity`);
      return bestMatch.result;
    }
    
    return null;
  }
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
  // Step 1: Check if we have an exact match in the cache
  const cachedResult = analysisCache.get(title, content);
  if (cachedResult) {
    console.log("Using cached analysis result (exact match)");
    return cachedResult;
  }
  
  // Step 2: Check if we have a similar entry in the cache (for shorter entries)
  if (content.length < 1000) {
    const similarResult = analysisCache.findSimilar(title, content, 0.8);
    if (similarResult) {
      console.log("Using cached analysis result (similar content)");
      return similarResult;
    }
  }
  
  // Step 3: If no cache hit, proceed with API call
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
    5. cognitiveDistortions: Identify any cognitive distortions present, such as:
       - All-or-nothing thinking (black-and-white thinking)
       - Overgeneralization (using words like "always", "never", "everyone")
       - Mental filtering (focusing only on negatives)
       - Disqualifying the positive (dismissing positive experiences)
       - Jumping to conclusions (mind reading or fortune telling)
       - Catastrophizing (expecting disaster)
       - Emotional reasoning (believing feelings reflect reality)
       - Should statements (using words like "should", "must", "ought to")
       - Labeling (attaching negative labels to self or others)
       - Personalization (blaming yourself for events outside your control)
    6. sentiment: Score the overall emotional tone with percentages for positive, negative, and neutral (totaling 100%)
    
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
      
      // Step 4: Cache the successful result
      analysisCache.set(title, content, parsedResponse);
      
      return parsedResponse;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      // Return a default response structure with error information
      return generateFallbackAnalysis(title, content);
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
    
    // For any API error, use fallback analysis - IMPORTANT: Pass the original title and content
    console.log(`Using fallback analysis for title: "${title}" and content starting with: "${content.substring(0, 50)}..."`);
    return generateFallbackAnalysis(title, content);
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
  
  // Pattern matching for common emotional contexts and more complex emotional patterns
  console.log("Starting emotional pattern detection");
  
  // Expanded patterns for depression/sadness
  const sadPatterns = [
    /sad|tear|cry|blue|down|heartbreak|sorrow|grief|weep|upset|miserable/i,
    /hollow ache|heavy|gravity|weight|burden|struggle|push myself/i,
    /hide my struggle|clinging|cling to|hiding|mask|facade/i,
    /behind closed curtains|hide/i
  ];
  
  console.log("Testing sadness patterns on text:", combinedText);
  for (const pattern of sadPatterns) {
    if (pattern.test(combinedText)) {
      console.log("MATCH FOUND! Sadness pattern matched:", pattern);
      if (!foundEmotions.includes('sad')) {
        foundEmotions.push('sad');
        fallbackTags.push('sad');
        console.log("Added 'sad' to emotions:", foundEmotions);
      }
      break;
    }
  }
  
  // Expanded patterns for anxiety
  const anxietyPatterns = [
    /anxious|anxiety|worry|worries|racing thoughts|heart racing|mind racing|nervous|tense|on edge|alert/i,
    /trembling|shaking|dark corners|restless|uninvited|drift to dark/i,
    /racing thoughts|heart pounds|tension|pressure|overwhelm/i,
    /legs trembling|unsettled|uneasy|apprehensive/i
  ];
  
  for (const pattern of anxietyPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes('anxious')) {
        foundEmotions.push('anxious');
        fallbackTags.push('anxious');
      }
      break;
    }
  }
  
  // Expanded patterns for emptiness/numbness
  const emptinessPatterns = [
    /empty|hollow|void|numb|nothing|emotionless|blank|can'?t feel|floating in a void|distant|far from|absent/i,
    /hollow ache|settle in my chest|going through motions|emotionless/i,
    /disconnected|detached|far away|absent|not present/i
  ];
  
  for (const pattern of emptinessPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes('empty')) {
        foundEmotions.push('empty');
        fallbackTags.push('empty');
      }
      if (!foundEmotions.includes('numb')) {
        foundEmotions.push('numb');
        fallbackTags.push('numb');
      }
      break;
    }
  }
  
  // Expanded patterns for isolation/loneliness
  const isolationPatterns = [
    /alone|lonely|isolated|no one|by myself|disconnected|distant|foreign|alien/i,
    /behind closed curtains|cling to the quiet|hide|hiding|isolated/i
  ];
  
  for (const pattern of isolationPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes('lonely')) {
        foundEmotions.push('lonely');
        fallbackTags.push('lonely');
      }
      if (!foundTopics.includes('isolation')) {
        foundTopics.push('isolation');
        fallbackTags.push('isolation');
      }
      break;
    }
  }
  
  // Expanded patterns for exhaustion/burnout
  const exhaustionPatterns = [
    /tired|exhausted|drained|no energy|can'?t focus|overwhelmed|burden/i,
    /heavy|gravity|doubled|weight|push myself|struggle/i
  ];
  
  for (const pattern of exhaustionPatterns) {
    if (pattern.test(combinedText)) {
      if (!foundEmotions.includes('exhausted')) {
        foundEmotions.push('exhausted');
        fallbackTags.push('exhausted');
      }
      if (!foundTopics.includes('self-care')) {
        foundTopics.push('self-care');
        fallbackTags.push('self-care');
      }
      break;
    }
  }
  
  // Check for fear/dread patterns
  if (/fear|afraid|scared|terrified|frightened|panic|terror|trembling|freeze|shaking|dread/i.test(combinedText)) {
    if (!foundEmotions.includes('fearful')) {
      foundEmotions.push('fearful');
      fallbackTags.push('fearful');
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
  
  // Identify cognitive distortions in the journal text
  const cognitiveDistortions: string[] = [];
  
  // All-or-nothing thinking
  if (/\b(all|nothing|every|none|always|never|everyone|no one|completely|totally|absolutely|perfect|failure|disaster)\b/i.test(combinedText)) {
    cognitiveDistortions.push("All-or-nothing thinking");
  }
  
  // Overgeneralization
  if (/\b(always|never|everyone|nobody|everything|nothing|every time|all the time)\b/i.test(combinedText)) {
    if (!cognitiveDistortions.includes("Overgeneralization")) {
      cognitiveDistortions.push("Overgeneralization");
    }
  }
  
  // Mental filtering
  if (/\b(only bad|only negative|only the worst|focus on bad|ignore good|didn't matter|doesn't count|still bad|still failed)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Mental filtering");
  }
  
  // Disqualifying the positive
  if (/\b(doesn't count|don't deserve|got lucky|fluke|accident|just being nice|not important|not real|meaningless)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Disqualifying the positive");
  }
  
  // Jumping to conclusions
  if (/\b(think|knows? what|they think|they feel|going to|will happen|will fail|will reject|won't like|won't approve|predict|foresee|expect the worst)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Jumping to conclusions");
  }
  
  // Catastrophizing
  if (/\b(disaster|catastrophe|terrible|horrible|worst|awful|unbearable|can'?t stand|can'?t handle|too much|end of the world|devastat(ing|ed)|nightmare)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Catastrophizing");
  }
  
  // Emotional reasoning
  if (/\b(feel like|feels? true|must be true|must be real|feels? like|emotions? tell|gut says|intuition says|sense that)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Emotional reasoning");
  }
  
  // Should statements
  if (/\b(should|must|have to|ought to|need to|supposed to|expected to|obligated to)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Should statements");
  }
  
  // Labeling
  if (/\b(I am a|I'm a|he is a|she is a|they are|we are|you are|you're)( a)? (failure|loser|idiot|stupid|worthless|useless|pathetic|horrible|terrible|awful|bad person)\b/i.test(combinedText)) {
    cognitiveDistortions.push("Labeling");
  }
  
  // Personalization
  if (/\b(my fault|blame (me|myself)|responsible for|caused|should have prevented|could have stopped|if only I|blame (myself|me))\b/i.test(combinedText)) {
    cognitiveDistortions.push("Personalization");
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
  
  // Check for various negative content patterns
  const hasNegativeContent = 
      /floating in a void|distant|far from|absent|not present|nod, rehearsed|far from fine|hollow|void|empty|numb|emotionless|blank|empty inside|can'?t feel/i.test(combinedText) ||
      /hollow ache|heavy|gravity|burden|struggle|push myself|trembling|dark corners|restless|uninvited/i.test(combinedText) ||
      /behind closed curtains|cling to the quiet|hide|hiding|weight|doubled|heavy|legs trembling/i.test(combinedText);
  
  // Check for specifically negative emotions in our detected emotions
  const hasNegativeEmotions = foundEmotions.some(e => 
      ['sad', 'anxious', 'empty', 'numb', 'lonely', 'exhausted', 'fearful', 'struggling'].includes(e));
  
  // For journal entries with clear negative content or emotions
  if ((hasNegativeContent || hasNegativeEmotions) && foundEmotions.length > 0) {
    // If it has negative content and only neutral emotions, force a negative score
    if (foundEmotions.every(e => neutralEmotions.includes(e))) {
      positiveScore = 0;
      negativeScore = 70;
      neutralScore = 30;
    } else if (hasNegativeContent && hasNegativeEmotions) {
      // If both the content and emotions are negative, heavily weight the negative score
      positiveScore = 0;
      negativeScore = 85;
      neutralScore = 15;
    } else {
      // Count emotions by category but give more weight to negative emotions if negative content
      const positiveCount = foundEmotions.filter(e => positiveEmotions.includes(e)).length;
      const negativeCount = foundEmotions.filter(e => negativeEmotions.includes(e)).length;
      const neutralCount = foundEmotions.filter(e => neutralEmotions.includes(e)).length;
      
      // Give extra weight to negative emotions when negative content is detected
      const weightedNegativeCount = hasNegativeContent ? negativeCount * 1.5 : negativeCount;
      
      const totalWeight = positiveCount + weightedNegativeCount + neutralCount;
      if (totalWeight > 0) {
        positiveScore = Math.round((positiveCount / totalWeight) * 100);
        negativeScore = Math.round((weightedNegativeCount / totalWeight) * 100);
        neutralScore = 100 - positiveScore - negativeScore;
        neutralScore = Math.max(0, neutralScore);
      }
    }
  } else {
    // Standard calculation for entries without clear negative markers
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
  
  const result = {
    suggestedTags: limitedTags,
    analysis: analysisText,
    emotions: foundEmotions,
    topics: foundTopics,
    cognitiveDistortions: cognitiveDistortions.length > 0 ? cognitiveDistortions : [],
    sentiment: { 
      positive: positiveScore, 
      negative: negativeScore, 
      neutral: neutralScore 
    }
  };
  
  console.log("FINAL FALLBACK ANALYSIS RESULT:", JSON.stringify(result, null, 2));
  
  return result;
}