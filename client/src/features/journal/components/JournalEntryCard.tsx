import { format } from "date-fns";
import { ar } from "date-fns/locale";
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
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { JournalTag } from "@/features/journal/components/JournalTag";

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
  const { t, isRTL, tNum } = useLocalization();
  const dateLocale = isRTL ? ar : undefined;

  return (
    <Card className="overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            <DynamicTranslator text={entry.title || t("Untitled Entry")} />
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(entry)}>
                <Info className="h-4 w-4 me-2" />
                {t("View Details")}
              </DropdownMenuItem>
              {canCreateEntries && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Edit className="h-4 w-4 me-2" />
                    {t("Edit")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(entry)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 me-2" />
                    {t("Delete")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription className="flex items-center text-xs">
          <CalendarIcon className="me-1 h-3 w-3" />
          {format(new Date(entry.createdAt), "MMM d, yyyy", { locale: dateLocale })}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="cursor-pointer" onClick={() => onView(entry)}>
          <p className="text-sm line-clamp-2 sm:line-clamp-3 mb-2">
            <DynamicTranslator text={entry.content} />
          </p>
        </div>
        {entry.userSelectedTags && entry.userSelectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {entry.userSelectedTags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <JournalTag text={tag} />
              </Badge>
            ))}
            {entry.userSelectedTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tNum(entry.userSelectedTags.length - 3)} {t("more")}
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
          <Info className="me-1 h-3 w-3" />
          {t("View Details")}
        </Button>
        {entry.comments && entry.comments.length > 0 && (
          <div className="ms-auto flex items-center text-xs text-muted-foreground">
            <MessageCircle className="me-1 h-3 w-3" />
            {tNum(entry.comments.length)}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
