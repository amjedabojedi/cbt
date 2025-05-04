import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, HeartIcon, CalendarIcon } from "lucide-react";

// Types for the API responses
interface RelatedEmotionRecord {
  id: number;
  timestamp: string;
  coreEmotion: string;
  primaryEmotion: string;
  tertiaryEmotion: string;
  intensity: number;
  situation: string;
  matchingEmotions: string[];
}

interface RelatedJournalEntry {
  id: number;
  title: string;
  timestamp: string;
  userSelectedTags: string[];
  matchingEmotions: string[];
}

interface RelatedThoughtRecord {
  id: number;
  situation: string;
  automaticThought: string;
  emotion: string;
  emotionIntensity: number;
  timestamp: string;
}

/**
 * A component that displays emotions related to a journal entry
 * or journal entries related to an emotion
 */
interface RelatedEmotionsPanelProps {
  journalEntryId?: number;
  emotion?: string;
  userId: number;
}

export default function RelatedEmotionsPanel({ 
  journalEntryId, 
  emotion,
  userId 
}: RelatedEmotionsPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("emotions");
  
  // Query for related emotions when viewing a journal entry
  const {
    data: relatedEmotionsData,
    isLoading: isLoadingEmotions,
    error: emotionsError
  } = useQuery({
    queryKey: ['/api/users', userId, 'journal', journalEntryId, 'related-emotions'],
    enabled: !!journalEntryId,
  });
  
  // Query for related journal entries when viewing an emotion
  const {
    data: relatedJournalData,
    isLoading: isLoadingJournal,
    error: journalError
  } = useQuery({
    queryKey: ['/api/users', userId, 'emotions', emotion, 'related-journal'],
    enabled: !!emotion,
  });
  
  // Query for related thought records when viewing an emotion
  const {
    data: relatedThoughtsData,
    isLoading: isLoadingThoughts,
    error: thoughtsError
  } = useQuery({
    queryKey: ['/api/users', userId, 'emotions', emotion, 'related-thoughts'],
    enabled: !!emotion,
  });
  
  // Set the initial active tab based on what data we're viewing
  useEffect(() => {
    if (journalEntryId) {
      setActiveTab("emotions");
    } else if (emotion) {
      setActiveTab("journal");
    }
  }, [journalEntryId, emotion]);
  
  // Helper to format dates nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };
  
  // Determine if we have data to show
  const hasEmotionData = relatedEmotionsData?.relatedEmotions?.length > 0;
  const hasJournalData = relatedJournalData?.relatedEntries?.length > 0;
  const hasThoughtData = relatedThoughtsData?.relatedThoughts?.length > 0;
  
  // If we don't have data and we're not loading, show an empty state
  if (
    !isLoadingEmotions && 
    !isLoadingJournal && 
    !isLoadingThoughts && 
    !hasEmotionData && 
    !hasJournalData && 
    !hasThoughtData
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-primary" />
            {journalEntryId ? "Related Emotions" : "Related Content"}
          </CardTitle>
          <CardDescription>
            {journalEntryId 
              ? "No related emotions found for this journal entry." 
              : "No related content found for this emotion."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>No connections found</AlertTitle>
            <AlertDescription>
              {journalEntryId 
                ? "Try adding more emotion tags to this journal entry." 
                : "Try recording more emotions or journal entries."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  // Handle loading state
  if (isLoadingEmotions || isLoadingJournal || isLoadingThoughts) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-primary" />
            {journalEntryId ? "Related Emotions" : "Related Content"}
          </CardTitle>
          <CardDescription>
            Loading related content...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  // Handle error state
  if (emotionsError || journalError || thoughtsError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HeartIcon className="h-5 w-5 text-primary" />
            {journalEntryId ? "Related Emotions" : "Related Content"}
          </CardTitle>
          <CardDescription>
            An error occurred while loading related content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {emotionsError?.message || journalError?.message || thoughtsError?.message || "Unknown error"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartIcon className="h-5 w-5 text-primary" />
          {journalEntryId ? "Related Emotions" : (emotion ? `Content Related to "${emotion}"` : "Related Content")}
        </CardTitle>
        <CardDescription>
          {journalEntryId 
            ? `Showing emotions related to the tags in this entry.` 
            : `Showing content related to the emotion "${emotion}".`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full mb-4">
            {journalEntryId && hasEmotionData && (
              <TabsTrigger value="emotions">Emotions</TabsTrigger>
            )}
            {emotion && hasJournalData && (
              <TabsTrigger value="journal">Journal Entries</TabsTrigger>
            )}
            {emotion && hasThoughtData && (
              <TabsTrigger value="thoughts">Thought Records</TabsTrigger>
            )}
          </TabsList>
          
          {/* Related Emotions Tab */}
          {journalEntryId && (
            <TabsContent value="emotions" className="space-y-4">
              {relatedEmotionsData?.relatedEmotions?.map((record: RelatedEmotionRecord) => (
                <Card key={record.id} className="border-l-4" style={{ borderLeftColor: getEmotionColor(record.coreEmotion) }}>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-base">
                      {record.tertiaryEmotion}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({record.intensity}/10)
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {formatDate(record.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm mb-2 line-clamp-2">{record.situation}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {record.matchingEmotions.map((emotion) => (
                        <Badge key={emotion} variant="outline" className="bg-primary/10">
                          {emotion}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
          
          {/* Related Journal Entries Tab */}
          {emotion && (
            <TabsContent value="journal" className="space-y-4">
              {relatedJournalData?.relatedEntries?.map((entry: RelatedJournalEntry) => (
                <Card key={entry.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <Link href={`/journal/${entry.id}`}>
                      <CardTitle className="text-base hover:underline cursor-pointer">
                        {entry.title}
                      </CardTitle>
                    </Link>
                    <CardDescription className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {formatDate(entry.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.userSelectedTags?.map((tag) => (
                        <Badge key={tag} 
                          variant={entry.matchingEmotions.includes(tag) ? "default" : "outline"}
                          className={entry.matchingEmotions.includes(tag) ? "" : "bg-muted/50"}>
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
          
          {/* Related Thought Records Tab */}
          {emotion && (
            <TabsContent value="thoughts" className="space-y-4">
              {relatedThoughtsData?.relatedThoughts?.map((thought: RelatedThoughtRecord) => (
                <Card key={thought.id} className="hover:bg-accent/50 transition-colors">
                  <CardHeader className="p-4 pb-2">
                    <Link href={`/thoughts/${thought.id}`}>
                      <CardTitle className="text-base hover:underline cursor-pointer">
                        {thought.situation.length > 60 
                          ? thought.situation.substring(0, 60) + "..." 
                          : thought.situation}
                      </CardTitle>
                    </Link>
                    <CardDescription className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" /> {formatDate(thought.timestamp)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm mb-2 line-clamp-2">{thought.automaticThought}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge>{thought.emotion}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Intensity: {thought.emotionIntensity}/10
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

// Helper function to get color for an emotion
function getEmotionColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    // Core emotions
    "Joy": "#F9D71C",
    "Sadness": "#6D87C4",
    "Fear": "#8A65AA",
    "Disgust": "#7DB954",
    "Anger": "#E43D40",
    "Love": "#E6338F",
    "Surprise": "#6B46C1",
    // Default for others
    "default": "#888888"
  };
  
  return colorMap[emotion] || colorMap.default;
}