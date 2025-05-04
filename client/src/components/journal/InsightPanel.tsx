import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, TrendingUp, Brain, AlertCircle, Check, Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
// Define the ThoughtRecord interface here to avoid schema compatibility issues
interface ThoughtRecord {
  id: number;
  userId: number;
  emotionRecordId: number | null;
  automaticThoughts: string;
  cognitiveDistortions: string[];
  rationalThoughts?: string;
  createdAt: string;
  updatedAt?: string;
  emotionIntensityBefore?: number;
  emotionIntensityAfter?: number;
  relatedJournalEntryIds?: number[];
}

interface EmotionalTone {
  positive?: number;
  negative?: number;
  neutral?: number;
}

interface InsightPanelProps {
  journalContent: string;
  journalTags: string[];
  thoughtRecords: ThoughtRecord[];
  emotionalTone?: EmotionalTone;
}

const InsightPanel: React.FC<InsightPanelProps> = ({
  journalContent,
  journalTags,
  thoughtRecords,
  emotionalTone,
}) => {
  // Find patterns and generate insights
  const getPatternInsights = () => {
    const insights: string[] = [];
    const distortions = thoughtRecords.flatMap(r => r.cognitiveDistortions || []);
    
    // Identify recurring cognitive distortions
    const distortionCounts: Record<string, number> = {};
    distortions.forEach(d => {
      distortionCounts[d] = (distortionCounts[d] || 0) + 1;
    });
    
    const topDistortions = Object.entries(distortionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name]) => name);
      
    if (topDistortions.length > 0) {
      insights.push(`You tend to engage in ${topDistortions.join(", ")} thinking patterns.`);
    }
    
    // Check for emotional themes across journal and thought records
    const emotionTags = journalTags.filter(tag => 
      ["sad", "anxious", "happy", "angry", "fearful", "worried", "calm", "hopeful", "frustrated", "overwhelmed"]
        .some(emotion => tag.toLowerCase().includes(emotion))
    );
    
    if (emotionTags.length > 0) {
      insights.push(`Your entries often express ${emotionTags.join(", ")} emotions.`);
    }
    
    // Add therapeutic suggestion based on cognitive distortions
    if (distortions.includes("catastrophizing")) {
      insights.push("When you notice catastrophic thinking, try asking 'What's the most likely outcome?' instead of focusing on worst-case scenarios.");
    }
    
    if (distortions.includes("all-or-nothing")) {
      insights.push("Practice looking for middle ground when you notice black-and-white thinking patterns.");
    }
    
    if (distortions.includes("mind-reading")) {
      insights.push("Instead of assuming what others think, consider asking for clarification.");
    }
    
    // Add general insight if none were generated
    if (insights.length === 0) {
      insights.push("Continue tracking your thoughts to discover patterns and gain deeper insights.");
    }
    
    return insights;
  };
  
  // Generate action suggestions based on the thought records and journal content
  const getActionSuggestions = () => {
    const suggestions: string[] = [];
    
    if (thoughtRecords.length > 0) {
      suggestions.push("Review your alternative perspectives when similar thoughts arise.");
    }
    
    const hasNegativeEmotions = journalTags.some(tag => 
      ["sad", "anxious", "angry", "fearful", "worried", "frustrated", "overwhelmed"]
        .some(emotion => tag.toLowerCase().includes(emotion))
    );
    
    if (hasNegativeEmotions) {
      suggestions.push("Practice a coping strategy you identified in your thought records.");
    }
    
    suggestions.push("Set a SMART goal based on the insights from these connected records.");
    
    return suggestions;
  };
  
  const insights = getPatternInsights();
  const suggestions = getActionSuggestions();
  
  return (
    <Card className="mt-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Cross-Reference Insights
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[180px] pr-4">
          <div className="space-y-4">
            {/* Patterns Section */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                Thought Patterns
              </h4>
              
              <ul className="space-y-2 pl-6 list-disc text-sm">
                {insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
            
            {/* Emotional Tone Analysis Section */}
            {emotionalTone && (emotionalTone.positive !== undefined || 
                              emotionalTone.negative !== undefined || 
                              emotionalTone.neutral !== undefined) && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Emotional Tone Analysis
                </h4>
                
                {(() => {
                  const positive = emotionalTone.positive || 0;
                  const negative = emotionalTone.negative || 0; 
                  const neutral = emotionalTone.neutral || 0;
                  const total = positive + negative + neutral;
                  
                  if (total === 0) return null;
                  
                  // Find the dominant sentiment
                  const max = Math.max(positive, negative, neutral);
                  let dominantSentiment = "neutral";
                  if (max === positive) dominantSentiment = "positive";
                  if (max === negative) dominantSentiment = "negative";
                  
                  // Create insights based on emotional tone
                  let toneInsight = "";
                  
                  if (dominantSentiment === "positive") {
                    toneInsight = "Your entry reflects predominantly positive emotions. Consider what factors contributed to this positive state and how you might maintain these elements in your daily life.";
                  } else if (dominantSentiment === "negative") {
                    toneInsight = "Your entry shows more negative emotions. This awareness can help you identify triggers and apply coping strategies from your thought records when similar feelings arise.";
                  } else {
                    toneInsight = "Your entry has a balanced emotional tone, showing a mix of emotions or more neutral reflections.";
                  }
                  
                  return (
                    <div className="space-y-3">
                      <div className="flex justify-between h-5 w-full rounded-full overflow-hidden bg-gray-100">
                        {positive > 0 && (
                          <div 
                            className="bg-green-500 h-full" 
                            style={{ width: `${(positive / total) * 100}%` }}
                            title={`Positive: ${Math.round(positive * 100)}%`}
                          />
                        )}
                        {neutral > 0 && (
                          <div 
                            className="bg-gray-400 h-full" 
                            style={{ width: `${(neutral / total) * 100}%` }}
                            title={`Neutral: ${Math.round(neutral * 100)}%`}
                          />
                        )}
                        {negative > 0 && (
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${(negative / total) * 100}%` }}
                            title={`Negative: ${Math.round(negative * 100)}%`}
                          />
                        )}
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span>Positive: {Math.round(positive * 100)}%</span>
                        <span>Neutral: {Math.round(neutral * 100)}%</span>
                        <span>Negative: {Math.round(negative * 100)}%</span>
                      </div>
                      
                      <p className="text-sm mt-1">{toneInsight}</p>
                    </div>
                  );
                })()}
              </div>
            )}
            
            {/* Cognitive Distortions Section */}
            {thoughtRecords.flatMap(r => r.cognitiveDistortions || []).length > 0 && (
              <div>
                <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                  <Brain className="h-4 w-4 text-purple-500" />
                  Cognitive Distortions
                </h4>
                
                <div className="flex flex-wrap gap-2 mb-2">
                  {Array.from(new Set(thoughtRecords.flatMap(r => r.cognitiveDistortions || []))).map(distortion => (
                    <Badge key={distortion} variant="outline" className="bg-purple-50">
                      {distortion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Action Items Section */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-500" />
                Suggested Actions
              </h4>
              
              <ul className="space-y-2 pl-6 list-disc text-sm">
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
            
            {/* Info Note - Shortened to save space */}
            <div className="bg-amber-50 border border-amber-100 rounded-md p-2 flex items-start gap-2 mt-3">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-800">
                Insights improve as you link more entries and thought records.
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default InsightPanel;