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
      return {
        suggestedTags: ["error-parsing-response"],
        analysis: "There was an error analyzing this journal entry.",
        emotions: [],
        topics: [],
        sentiment: { positive: 0, negative: 0, neutral: 100 }
      };
    }
  } catch (error: unknown) {
    console.error("OpenAI API error:", error);
    
    // Create a function to generate fallback analysis
    const generateFallbackAnalysis = () => {
      console.log("Using fallback analysis");
      
      // Generate basic fallback tags from the title and content
      const combinedText = `${title} ${content}`.toLowerCase();
      const fallbackTags = [];
      
      // Check for common emotions in the text - expanded list
      const emotionKeywords = [
        'happy', 'sad', 'angry', 'anxious', 'stressed', 
        'worried', 'excited', 'calm', 'frustrated', 'confident',
        'fear', 'joy', 'love', 'trust', 'pride', 'hopeful',
        'nervous', 'confused', 'overwhelmed', 'peaceful', 'grateful',
        'motivated', 'disappointed', 'content', 'lonely', 'guilty',
        'ashamed', 'embarrassed', 'surprised', 'jealous', 'hopeless',
        'satisfied', 'hurt', 'insecure', 'regretful', 'optimistic',
        'pessimistic', 'apathetic', 'bored', 'enthusiastic', 'determined',
        'discouraged', 'vulnerable', 'resentful', 'compassionate'
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
      const foundEmotions = [];
      const foundTopics = [];
      
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
      
      // If we don't have enough emotions, try a more flexible approach
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
      
      // Calculate a rough sentiment based on the emotions found
      let positiveScore = 33;
      let negativeScore = 33;
      let neutralScore = 34;
      
      // Define positive, negative, and neutral emotions
      const positiveEmotions = ['happy', 'excited', 'confident', 'joy', 'love', 'trust', 'pride', 'hopeful', 'peaceful', 'grateful', 'motivated', 'content', 'satisfied', 'optimistic', 'enthusiastic', 'determined', 'compassionate'];
      const negativeEmotions = ['sad', 'angry', 'anxious', 'stressed', 'worried', 'frustrated', 'fear', 'nervous', 'confused', 'overwhelmed', 'lonely', 'guilty', 'ashamed', 'embarrassed', 'jealous', 'hopeless', 'hurt', 'insecure', 'regretful', 'pessimistic', 'discouraged', 'vulnerable', 'resentful'];
      const neutralEmotions = ['calm', 'reflective', 'surprised', 'apathetic', 'bored'];
      
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
    };
    
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
        return generateFallbackAnalysis();
      }
    }
    
    // For any API error, use fallback analysis
    return generateFallbackAnalysis();
  }
}