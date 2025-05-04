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
  } catch (error) {
    console.error("OpenAI API error:", error);
    
    // Provide fallback tags and analysis when there's an API error (like quota exceeded)
    if (error.error?.type === 'insufficient_quota' || error.error?.code === 'insufficient_quota') {
      console.log("Using fallback analysis due to quota error");
      
      // Generate basic fallback tags from the title and content
      const combinedText = `${title} ${content}`.toLowerCase();
      const fallbackTags = [];
      
      // Check for common emotions in the text
      const emotionKeywords = [
        'happy', 'sad', 'angry', 'anxious', 'stressed', 
        'worried', 'excited', 'calm', 'frustrated', 'confident',
        'fear', 'joy', 'love', 'trust', 'pride'
      ];
      
      // Check for common topics
      const topicKeywords = [
        'work', 'family', 'relationship', 'health', 'sleep',
        'exercise', 'friends', 'challenge', 'success', 'failure',
        'conflict', 'achievement', 'goal', 'worry', 'progress'
      ];
      
      // Build basic fallback tags from the content
      for (const keyword of [...emotionKeywords, ...topicKeywords]) {
        if (combinedText.includes(keyword)) {
          fallbackTags.push(keyword);
        }
      }
      
      // Ensure we have at least a few tags
      if (fallbackTags.length < 3) {
        // Add some general tags
        fallbackTags.push('journal', 'reflection');
        
        // Add a tag based on content length
        if (content.length > 500) {
          fallbackTags.push('detailed');
        } else {
          fallbackTags.push('brief');
        }
      }
      
      // Limit to 8 tags maximum
      const limitedTags = fallbackTags.slice(0, 8);
      
      return {
        suggestedTags: limitedTags,
        analysis: "This entry has been analyzed with basic fallback processing. For advanced analysis, please check your OpenAI API quota.",
        emotions: limitedTags.filter(tag => emotionKeywords.includes(tag)),
        topics: limitedTags.filter(tag => topicKeywords.includes(tag)),
        sentiment: { positive: 33, negative: 33, neutral: 34 }
      };
    }
    
    // If it's not a quota error, throw the error
    throw new Error(`Failed to analyze journal entry: ${error.message}`);
  }
}