import { 
  ClipboardList, 
  Lightbulb, 
  FileText, 
  ListTodo, 
  BookOpen, 
  Calendar, 
  Search, 
  Users,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type IconType = 
  | "clipboard-list" 
  | "lightbulb" 
  | "file-text" 
  | "list-todo" 
  | "book-open" 
  | "calendar" 
  | "search" 
  | "users" 
  | "alert-circle";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconType;
  actionText?: string;
  actionLink?: string;
}

export function EmptyState({
  title,
  description,
  icon = "search",
  actionText,
  actionLink
}: EmptyStateProps) {
  const getIcon = () => {
    switch (icon) {
      case "clipboard-list":
        return <ClipboardList className="h-12 w-12 text-muted-foreground" />;
      case "lightbulb":
        return <Lightbulb className="h-12 w-12 text-muted-foreground" />;
      case "file-text":
        return <FileText className="h-12 w-12 text-muted-foreground" />;
      case "list-todo":
        return <ListTodo className="h-12 w-12 text-muted-foreground" />;
      case "book-open":
        return <BookOpen className="h-12 w-12 text-muted-foreground" />;
      case "calendar":
        return <Calendar className="h-12 w-12 text-muted-foreground" />;
      case "search":
        return <Search className="h-12 w-12 text-muted-foreground" />;
      case "users":
        return <Users className="h-12 w-12 text-muted-foreground" />;
      case "alert-circle":
        return <AlertCircle className="h-12 w-12 text-muted-foreground" />;
      default:
        return <Search className="h-12 w-12 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-muted/20 rounded-lg border border-dashed">
      <div className="mb-4">
        {getIcon()}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mt-1">{description}</p>
      
      {actionText && actionLink && (
        <Button asChild variant="outline" className="mt-4 gap-1">
          <Link href={actionLink}>
            {actionText}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}