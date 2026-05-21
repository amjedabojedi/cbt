import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { JournalEntry } from "../types";
import { JournalEntryCard } from "./JournalEntryCard";

interface JournalListProps {
  entries: JournalEntry[];
  isLoading: boolean;
  user: { role?: string } | null | undefined;
  canCreateEntries: boolean;
  onViewEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entry: JournalEntry) => void;
}

export function JournalList({
  entries,
  isLoading,
  user,
  canCreateEntries,
  onViewEntry,
  onEditEntry,
  onDeleteEntry,
}: JournalListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted/50"></CardHeader>
            <div className="h-40 space-y-2 p-6">
              <div className="h-4 w-3/4 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Journal Entries</CardTitle>
          <CardDescription>
            {user?.role === "client"
              ? "You haven't created any journal entries yet. Switch to the 'Write Entry' tab to get started."
              : "This client hasn't created any journal entries yet."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          canCreateEntries={canCreateEntries}
          onView={onViewEntry}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      ))}
    </div>
  );
}
