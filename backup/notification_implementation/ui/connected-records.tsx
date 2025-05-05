import { RelationshipIndicator } from "@/components/ui/relationship-indicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Link2 } from "lucide-react";

interface EmotionRecord {
  id: number;
  coreEmotion: string;
  secondaryEmotion?: string;
  tertiaryEmotion?: string;
  intensity: number;
}

interface ThoughtRecord {
  id: number;
  emotionRecordId: number;
  automaticThoughts: string;
  cognitiveDistortions: string[];
  reflectionRating: number;
}

interface JournalEntry {
  id: number;
  title: string;
  content: string;
  tags: string[];
  emotions?: string[];
}

interface ConnectedRecordsProps {
  thoughtRecords?: ThoughtRecord[];
  emotions?: EmotionRecord[];
  journalEntries?: JournalEntry[];
  tags?: string[];
  distortions?: string[];
  className?: string;
  showTitle?: boolean;
  compact?: boolean;
}

export function ConnectedRecords({
  thoughtRecords = [],
  emotions = [],
  journalEntries = [],
  tags = [],
  distortions = [],
  className,
  showTitle = true,
  compact = false
}: ConnectedRecordsProps) {
  // Helper to truncate text
  const truncate = (text: string, limit: number) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };
  
  // Count the total number of connected records
  const totalConnections = 
    thoughtRecords.length + 
    emotions.length + 
    journalEntries.length + 
    tags.length + 
    distortions.length;
  
  // If there are no connections, don't render
  if (totalConnections === 0) {
    return null;
  }
  
  // For compact mode, only show number of connections and indicator
  if (compact) {
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Link2 className="h-3.5 w-3.5" />
        <span>{totalConnections} connected {totalConnections === 1 ? 'record' : 'records'}</span>
      </div>
    );
  }
  
  // Render full connections card
  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-1.5">
            <Link2 className="h-4 w-4 text-primary" />
            Connected Records
          </CardTitle>
          <CardDescription>
            These records are connected to each other
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4 pt-0">
        {/* Emotion records */}
        {emotions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Emotions</h4>
            <div className="flex flex-wrap gap-2">
              {emotions.map(emotion => (
                <RelationshipIndicator
                  key={`emotion-${emotion.id}`}
                  type="emotion"
                  id={emotion.id}
                  label={emotion.tertiaryEmotion || emotion.secondaryEmotion || emotion.coreEmotion}
                  path={`/emotions/${emotion.id}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Thought records */}
        {thoughtRecords.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Thought Records</h4>
            <div className="flex flex-wrap gap-2">
              {thoughtRecords.map(record => (
                <RelationshipIndicator
                  key={`thought-${record.id}`}
                  type="thought"
                  id={record.id}
                  label={truncate(record.automaticThoughts, 30)}
                  path={`/thoughts/${record.id}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Journal entries */}
        {journalEntries.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Journal Entries</h4>
            <div className="flex flex-wrap gap-2">
              {journalEntries.map(entry => (
                <RelationshipIndicator
                  key={`journal-${entry.id}`}
                  type="journal"
                  id={entry.id}
                  label={truncate(entry.title, 30)}
                  path={`/journal/${entry.id}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Related Tags</h4>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <RelationshipIndicator
                  key={`tag-${index}`}
                  type="tag"
                  id={encodeURIComponent(tag)}
                  label={tag}
                  path={`/tags/${encodeURIComponent(tag)}`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Cognitive distortions */}
        {distortions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Cognitive Distortions</h4>
            <div className="flex flex-wrap gap-2">
              {distortions.map((distortion, index) => (
                <RelationshipIndicator
                  key={`distortion-${index}`}
                  type="distortion"
                  id={encodeURIComponent(distortion)}
                  label={distortion.replace(/-/g, ' ')}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}