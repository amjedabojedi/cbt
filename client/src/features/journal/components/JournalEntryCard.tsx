import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarIcon,
  Edit,
  Info,
  MessageCircle,
  MoreVertical,
  Trash2,
} from "lucide-react";
import type { JournalEntry } from "../types";

interface JournalEntryCardProps {
  entry: JournalEntry;
  canCreateEntries: boolean;
  onView: (entry: JournalEntry) => void;
  onEdit: (entry: JournalEntry) => void;
  onDelete: (entry: JournalEntry) => void;
}

export function JournalEntryCard({
  entry,
  canCreateEntries,
  onView,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{entry.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(entry)}>
                <Info className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {canCreateEntries && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(entry)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center text-xs">
          <CalendarIcon className="mr-1 h-3 w-3" />
          {format(new Date(entry.createdAt), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="cursor-pointer" onClick={() => onView(entry)}>
          <p className="text-sm line-clamp-2 sm:line-clamp-3 mb-2">{entry.content}</p>
        </div>
        {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.userSelectedTags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.userSelectedTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{entry.userSelectedTags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground p-0 h-auto"
          onClick={() => onView(entry)}
        >
          <Info className="mr-1 h-3 w-3" />
          View Details
        </Button>
        {entry.comments && entry.comments.length > 0 && (
          <div className="ml-auto flex items-center text-xs text-muted-foreground">
            <MessageCircle className="mr-1 h-3 w-3" />
            {entry.comments.length}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
