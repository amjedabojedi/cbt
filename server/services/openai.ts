import OpenAI from "openai";
import crypto from "crypto";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Simple cache for reframing practice scenarios
const practiceScenarioCache = new Map<string, { data: any, timestamp: number }>();
const SCENARIO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to create a cache key
function createScenarioCacheKey(thought: string, distortions: string[], emotion: string, instructions?: string): string {
  const data = JSON.stringify({ thought, distortions, emotion, instructions });
  return crypto.createHash('md5').update(data).digest('hex');
}

// Type definitions for reframe practice scenarios
export interface ReframeScenario {
  scenario: string;
  options: {
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  cognitiveDistortion: string;
  emotionCategory: string;
}

export interface ReframePracticeSession {
  scenarios: ReframeScenario[];
  thoughtContent: string;
  generalFeedback: string;
}

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
interface JournalCacheEntry {
  result: JournalAnalysisResult;
  timestamp: number;
  hash: string;
}

// Cache interface for storing reframe practice scenarios
interface ReframeCacheEntry {
  result: ReframePracticeSession;
  timestamp: number;
}

// Simple LRU cache for OpenAI responses
// Create a singleton instance for the application
class AnalysisCache {
  private cache: Map<string, JournalCacheEntry> = new Map();
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
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
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
    
    const contentWordsArray = (title + ' ' + content).toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);  // Only consider words longer than 3 chars
    
    const contentWords = new Set<string>(contentWordsArray);
    
    let bestMatch: { similarity: number, result: JournalAnalysisResult } | null = null;
    
    // Check each cache entry for similarity
    // Convert entries to array to avoid iterator issues
    const cacheEntries = Array.from(this.cache.entries());
    for (const [key, entry] of cacheEntries) {
      // Skip if entry is expired
      if (Date.now() - entry.timestamp > this.ttlMs) continue;
      
      // Extract key parts (we stored as "title:content")
      const [cachedTitle, ...cachedContentParts] = key.split(':');
      const cachedContent = cachedContentParts.join(':');
      
      const cachedWordsArray = (cachedTitle + ' ' + cachedContent).toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(word => word.length > 3);
      
      const cachedWords = new Set<string>(cachedWordsArray);
      
      // Calculate Jaccard similarity (intersection over union)
      const contentWordsArray = Array.from(contentWords);
      const intersectionArray = contentWordsArray.filter(x => cachedWords.has(x));
      const intersection = new Set<string>(intersectionArray);
      
      // Create union by combining arrays then creating a set
      const unionArray = Array.prototype.concat.call(contentWordsArray, cachedWordsArray);
      const union = new Set<string>(unionArray);
      
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

// Create an instance of the AnalysisCache class
const analysisCache = new AnalysisCache();

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
    3. emotions: Up to 5 emotions ACTUALLY EXPRESSED by the writer in the entry. Important guidelines:
       - Identify only emotions the writer is CURRENTLY feeling, not emotions they reference or mention
       - DO NOT include emotions that are merely mentioned as words but not actually felt (e.g., "only perfection will calm me" does NOT mean the person feels "calm")
       - DO NOT include emotions that are desired but not present (e.g., "I wish I felt happy" does NOT mean the person feels "happy")
       - DO NOT include emotions that are negated (e.g., "I'm not excited" does NOT mean the person feels "excited")
       - Pay careful attention to context and the full meaning of sentences to accurately identify true emotional states
       - Look for indicators of genuine emotional experience rather than just emotional words
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

/**
 * Generates reframe practice scenarios based on a thought record
 * @param automaticThought The automatic thought to create practice scenarios for
 * @param cognitiveDistortions Array of cognitive distortions identified in the thought
 * @param emotionCategory The primary emotion category associated with the thought
 * @param customInstructions Any custom instructions from the therapist
 * @returns A complete practice session with multiple scenarios
 */
export async function generateReframePracticeScenarios(
  automaticThought: string,
  cognitiveDistortions: string[],
  emotionCategory: string,
  customInstructions?: string
): Promise<ReframePracticeSession & { fromCache?: boolean }> {
  try {
    // Check if we have a cached result
    const cacheKey = createScenarioCacheKey(automaticThought, cognitiveDistortions, emotionCategory, customInstructions);
    const cachedResult = practiceScenarioCache.get(cacheKey);
    
    // If we have a valid cache entry that hasn't expired
    if (cachedResult && (Date.now() - cachedResult.timestamp < SCENARIO_CACHE_TTL)) {
      console.log("CACHE HIT! Using cached practice scenarios");
      // Return cached data with fromCache flag set to true
      return {
        ...cachedResult.data,
        fromCache: true
      };
    }
    
    // If not in cache, proceed with generating new scenarios
    console.log("No cache hit. Generating new practice scenarios via OpenAI...");
    
    // Map thought category values to readable distortion names
    const thoughtCategoryToDistortion: Record<string, string> = {
      all_or_nothing: "All or Nothing Thinking",
      mental_filter: "Mental Filter",
      mind_reading: "Mind Reading",
      fortune_telling: "Fortune Telling",
      labelling: "Labelling",
      over_generalising: "Over-Generalising",
      compare_despair: "Compare and Despair",
      emotional_thinking: "Emotional Thinking",
      guilty_thinking: "Guilty Thinking",
      catastrophising: "Catastrophising",
      blaming_others: "Blaming Others",
      personalising: "Personalising",
      // Also handle kebab-case versions
      "all-or-nothing": "All or Nothing Thinking",
      "mental-filter": "Mental Filter",
      "mind-reading": "Mind Reading",
      "fortune-telling": "Fortune Telling",
      "over-generalising": "Over-Generalising",
      "compare-despair": "Compare and Despair",
      "emotional-thinking": "Emotional Thinking",
      "emotional-reasoning": "Emotional Reasoning",
      "guilty-thinking": "Guilty Thinking",
      overgeneralization: "Overgeneralization",
    };
    
    // Format cognitive distortions for better readability
    const formattedDistortions = cognitiveDistortions.map(distortion => {
      if (!distortion) return "Unknown";
      
      // First check our mapping
      const mapped = thoughtCategoryToDistortion[distortion.toLowerCase()];
      if (mapped) return mapped;
      
      // If unknown, just format it nicely
      return distortion
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    });
    
    const prompt = `
    I need to create a cognitive restructuring practice session based on the following automatic thought:
    "${automaticThought}"

    This thought involves these cognitive distortions: ${formattedDistortions.join(", ")}
    The primary emotion associated with this thought is: ${emotionCategory}
    ${customInstructions ? `Additional context and instructions: ${customInstructions}` : ""}

    Please generate a cognitive restructuring practice session with 3 different scenarios.
    Each scenario should:
    1. Present a realistic situation that directly relates to the original thought and distortions
    2. Ensure the scenarios feel personally relevant to the user's specific situation
    3. Provide 4 possible reframing options (1 correct, 3 incorrect)
    4. For each option, include an explanation of why it's helpful or unhelpful
    5. Make the scenarios progressively more challenging
    6. Use examples that clearly demonstrate the specific cognitive distortions mentioned
    
    IMPORTANT: The scenarios MUST be closely connected to the themes, situations, and content of the original thought.
    Do NOT create generic scenarios - make them highly specific to the user's thought content.
    
    The correct option should demonstrate effective cognitive restructuring that:
    - Directly challenges the specific distorted thinking pattern(s) in the original thought
    - Considers the evidence for and against the thought
    - Uses balanced, realistic thinking based on the alternative perspective provided
    - Promotes self-compassion and growth
    
    The incorrect options should:
    - Show subtle ways people might maintain the exact same distortions present in the original thought
    - Include examples that feel realistic but reinforce unhelpful patterns
    - Vary in how obviously incorrect they are, with some being subtle traps
    - Feel plausible but ultimately unhelpful

    Return the response as a JSON object with this structure:
    {
      "scenarios": [
        {
          "scenario": "Detailed scenario description",
          "options": [
            {
              "text": "Option text",
              "isCorrect": true/false,
              "explanation": "Why this is/isn't helpful"
            },
            ... (3 more options)
          ],
          "cognitiveDistortion": "Primary distortion targeted",
          "emotionCategory": "Emotion category targeted"
        },
        ... (2 more scenarios)
      ],
      "thoughtContent": "The original automatic thought",
      "generalFeedback": "Overall therapeutic guidance about the thought pattern"
    }
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
      const parsedResponse = JSON.parse(responseContent) as ReframePracticeSession;
      
      // Modify the parsed response to ensure cognitive distortions are properly formatted
      if (parsedResponse.scenarios && Array.isArray(parsedResponse.scenarios)) {
        parsedResponse.scenarios = parsedResponse.scenarios.map(scenario => {
          // Replace the cognitive distortion with our properly formatted version
          return {
            ...scenario,
            cognitiveDistortion: formattedDistortions[0] || "Cognitive Distortion"
          };
        });
      }
      
      // Create a version of the response without the fromCache flag for caching
      const responseForCache = { ...parsedResponse };
      delete (responseForCache as any).fromCache;
      
      // Save the clean response to cache
      practiceScenarioCache.set(cacheKey, {
        data: responseForCache,
        timestamp: Date.now()
      });
      console.log("Saved new practice scenarios to cache with key:", cacheKey);
      
      // Return the original response with fromCache set to false explicitly
      return {
        ...parsedResponse,
        fromCache: false
      };
    } catch (parseError) {
      console.error("Failed to parse OpenAI response for reframing practice:", parseError);
      throw new Error("Failed to generate reframing practice scenarios");
    }
  } catch (error) {
    console.error("OpenAI API error during reframing practice generation:", error);
    throw new Error("Failed to generate reframing practice scenarios due to API error");
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
  
  // Track intensity of emotions for deeper analysis
  const emotionIntensity: {[key: string]: number} = {};
  
  // Enhanced emotion keywords with broader coverage
  const emotionKeywords = [
    'happy', 'sad', 'angry', 'anxious', 'stressed', 'worried', 'excited', 'calm', 'frustrated', 'confident',
    'fear', 'joy', 'love', 'trust', 'pride', 'hopeful', 'nervous', 'confused', 'overwhelmed', 'peaceful', 'grateful',
    'motivated', 'disappointed', 'content', 'lonely', 'guilty', 'ashamed', 'embarrassed', 'surprised', 'jealous', 'hopeless',
    'satisfied', 'hurt', 'insecure', 'regretful', 'optimistic', 'pessimistic', 'apathetic', 'bored', 'enthusiastic', 'determined',
    'discouraged', 'vulnerable', 'resentful', 'compassionate', 'depressed', 'numb', 'empty', 'exhausted', 'tired', 'drained',
    'helpless', 'struggling', 'grief', 'grieving', 'hope', 'despair', 'meaningless', 'lost', 'distressed', 'miserable', 'relief', 'relieved',
    'alone', 'isolated', 'distant', 'disconnected', 'detached', 'heavy', 'hollow', 'void', 'abandoned', 'suffocating',
    'tense', 'uneasy', 'restless', 'unsettled', 'apprehensive', 'elated', 'ecstatic', 'blissful', 'serene', 'tranquil',
    'rage', 'fury', 'irritated', 'annoyed', 'agitated', 'terror', 'panic', 'dread', 'phobia', 'melancholy', 'sorrowful',
    'cheerful', 'jubilant', 'delighted', 'pleased', 'thrilled', 'devastated', 'heartbroken', 'crushed', 'shattered',
    'betrayed', 'rejected', 'humiliated', 'mortified', 'disgusted', 'revolted', 'contempt', 'scorn', 'amazed', 'astonished',
    'bewildered', 'perplexed', 'envious', 'covetous', 'remorseful', 'contrite', 'yearning', 'longing', 'nostalgic'
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
  
  // Check for exact emotion word matches, but with improved context awareness
  for (const keyword of emotionKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText) && !foundEmotions.includes(keyword)) {
      // Check for negative contexts that would invalidate the emotion
      const negationRegex = new RegExp(`\\b(not|don'?t|won'?t|can'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\\s+(?:\\w+\\s+){0,3}\\b${keyword}\\b|\\b${keyword}\\b\\s+(?:\\w+\\s+){0,3}(not|don'?t|won'?t|can'?t|isn'?t|aren'?t|wasn'?t|weren'?t)\\b`, 'i');
      
      // Check for future/conditional contexts that would invalidate the emotion
      const futureRegex = new RegExp(`\\b(will|would|could|should|might|may|if)\\s+(?:\\w+\\s+){0,3}\\b${keyword}\\b|\\bwish\\s+(?:\\w+\\s+){0,5}\\b${keyword}\\b|\\bhope\\s+(?:\\w+\\s+){0,5}\\b${keyword}\\b`, 'i');
      
      // Check for calm specifically since it's often in the phrase "will calm me" which doesn't indicate being calm
      const calmSpecificRegex = keyword === 'calm' ? /\b(?:will|would|could|should|might|to)\s+(?:\w+\s+){0,3}\bcalm\b|\bcalm\s+(?:\w+\s+){0,3}(?:will|would|could|should|might|if)\b/i : null;
      
      // Only add the emotion if it's not in a negation or future/conditional context
      if (!negationRegex.test(combinedText) && !futureRegex.test(combinedText) && 
          !(calmSpecificRegex && calmSpecificRegex.test(combinedText))) {
        foundEmotions.push(keyword);
        fallbackTags.push(keyword);
      }
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
        // For 'calm' specifically, check if it's in a future/conditional context
        if (emotion === 'calm') {
          const calmInFutureContext = /\b(?:will|would|could|should|might|to)\s+(?:\w+\s+){0,3}\bcalm\b|\bcalm\s+(?:\w+\s+){0,3}(?:will|would|could|should|might|if)\b/i.test(combinedText);
          if (!calmInFutureContext) {
            foundEmotions.push(emotion);
            fallbackTags.push(emotion);
          }
        } else {
          foundEmotions.push(emotion);
          fallbackTags.push(emotion);
        }
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
  
  // Create the final analysis text with more detailed insights
  if (cognitiveDistortions.length > 0) {
    // Focus on specific cognitive distortion patterns
    if (cognitiveDistortions.includes("All-or-nothing thinking") && combinedText.match(/perfection|flawless|excel|failure|worthless|disaster/i)) {
      analysisText = `I notice strong all-or-nothing thinking patterns where you're seeing yourself in extreme terms of total success or complete failure. This perspective is creating significant emotional strain because you're not allowing yourself any middle ground for being human and learning through mistakes.`;
    } 
    else if (cognitiveDistortions.includes("Overgeneralization") && combinedText.match(/never|always|every|all|again|eternal|history/i)) {
      analysisText = `Your journal reveals a clear pattern of overgeneralization, where you're taking isolated negative experiences and applying them as permanent rules for all future situations. This is creating a sense of defeat before you even try, as past setbacks are being treated as definitive proof of future outcomes.`;
    }
    else if (cognitiveDistortions.includes("Catastrophizing")) {
      analysisText = `The language in your entry shows catastrophic thinking where relatively minor issues are being amplified into overwhelming disasters. This tendency to imagine worst-case scenarios is intensifying your emotional response far beyond what the situation actually warrants.`;
    }
    else if (cognitiveDistortions.includes("Emotional reasoning")) {
      analysisText = `I see that you're treating your feelings as evidence of objective truth rather than as emotional responses. This emotional reasoning creates a distorted view where negative feelings become 'proof' that the situation is objectively negative, creating a self-reinforcing cycle.`;
    }
    else {
      // General cognitive distortion analysis
      const primaryDistortions = cognitiveDistortions.slice(0, 2);
      analysisText = `Your writing reveals ${primaryDistortions.join(" and ")} patterns that are likely intensifying your emotional distress. These thought patterns create a distorted perspective that affects how you see yourself and your abilities.`;
    }
    
    // Add topic-specific insights if available
    if (foundTopics.length > 0) {
      analysisText += ` This is particularly evident in how you approach ${foundTopics.join(" and ")}.`;
    }
    
    // Add actionable reflection prompt based on the distortion
    if (cognitiveDistortions.includes("All-or-nothing thinking") || cognitiveDistortions.includes("Overgeneralization")) {
      analysisText += ` Try identifying evidence that challenges these absolute perspectives - what middle-ground possibilities exist between the extremes you're seeing?`;
    } else if (cognitiveDistortions.includes("Catastrophizing")) {
      analysisText += ` Consider asking what's most likely to happen rather than focusing on the worst possible scenario.`;
    }
  } 
  // If no cognitive distortions but we have emotions
  else if (foundEmotions.length > 0) {
    if (foundEmotions.includes("anxious") || foundEmotions.includes("worried")) {
      analysisText = `Your writing reveals deep anxiety that seems to be consuming your thoughts and creating significant tension. This worry appears to be making it difficult to find any sense of peace or confidence in your abilities.`;
    }
    else if (foundEmotions.includes("sad") || foundEmotions.includes("depressed")) {
      analysisText = `There's a profound sadness permeating your journal entry. These feelings appear to be weighing heavily on you, potentially making it difficult to connect with positive possibilities or find motivation.`;
    }
    else if (foundEmotions.includes("empty") || foundEmotions.includes("numb")) {
      analysisText = `Your writing expresses a deep sense of emptiness and emotional numbness. This disconnection from your feelings might be a protective response to overwhelming emotions that feels safer but ultimately leaves you isolated from yourself and others.`;
    }
    else if (foundEmotions.includes("frustrated") || foundEmotions.includes("angry")) {
      analysisText = `I notice significant frustration and irritation in your writing. These feelings seem to be creating internal tension and possibly affecting how you perceive situations and others around you.`;
    }
    else {
      analysisText = `This entry reflects ${foundEmotions.join(", ")} emotions`;
      if (foundTopics.length > 0) {
        analysisText += ` in relation to ${foundTopics.join(", ")}`;
      }
      analysisText += `. These feelings appear to be significantly influencing your perspective and internal experience.`;
    }
    
    // Add insightText if available
    if (insightText) {
      analysisText += ` ${insightText}`;
    }
  } 
  // If we only have topics
  else if (foundTopics.length > 0) {
    analysisText = `Your entry focuses on ${foundTopics.join(', ')}. `;
    analysisText += insightText || "While you don't explicitly name your emotions, there seem to be significant feelings beneath the surface that might be worth exploring.";
  } 
  // Fallback
  else {
    analysisText = `This entry contains reflections that suggest underlying emotional processes. `;
    analysisText += insightText || "Consider naming specific emotions and exploring their sources in future entries to gain deeper insights into your experiences.";
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