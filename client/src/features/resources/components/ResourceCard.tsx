import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, UserCheck } from "lucide-react";

interface ResourceCardProps {
  resource: any;
  user: any;
  onView: (resource: any) => void;
  onEdit: (resource: any) => void;
  onDelete: (resource: any) => void;
  onAssign: (resource: any) => void;
}

export default function ResourceCard({
  resource,
  user,
  onView,
  onEdit,
  onDelete,
  onAssign,
}: ResourceCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full transition-shadow hover:shadow-md">
      <CardHeader className="bg-neutral-50 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium">{resource.title}</CardTitle>
          {(resource.createdBy === user?.id || user?.role === "admin") && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(resource)}
              >
                <Edit className="h-4 w-4 text-neutral-500" />
              </Button>
              {user?.role === "admin" && resource.createdBy !== user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(resource)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
        <CardDescription className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
          </span>
          <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
            {resource.category}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <p className="text-sm text-neutral-600">{resource.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onView(resource)}>
          View Resource
        </Button>
        {user?.role === "therapist" && (
          <Button variant="default" size="sm" onClick={() => onAssign(resource)}>
            <UserCheck className="mr-1 h-4 w-4" />
            Assign to Client
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
