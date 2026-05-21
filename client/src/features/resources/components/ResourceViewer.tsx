import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ResourceViewerProps {
  resource: any | null;
  user: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  isDeleting: boolean;
  isCloning: boolean;
}

export default function ResourceViewer({
  resource,
  user,
  open,
  onClose,
  onEdit,
  onDelete,
  onClone,
  isDeleting,
  isCloning,
}: ResourceViewerProps) {
  if (!resource) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource.title}</DialogTitle>
          <DialogDescription>
            <div className="flex space-x-2 mt-1">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
              </span>
              <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10">
                {resource.category}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <p className="text-neutral-700">{resource.description}</p>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium mb-2">Content</h3>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.content) }}
            />
          </div>

          {resource.pdfUrl && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-2">Attached PDF</h3>
              <Button asChild>
                <a href={resource.pdfUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="mr-2 h-4 w-4" />
                  View PDF
                </a>
              </Button>
            </div>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t mt-6 pt-4 flex justify-between">
          <div className="flex gap-2">
            {(resource.createdBy === user?.id || user?.role === "admin") && (
              <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Resource"}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {(resource.createdBy === user?.id || user?.role === "admin") && (
              <Button onClick={onEdit}>Edit Resource</Button>
            )}

            {user?.role === "therapist" && resource.createdBy !== user?.id && (
              <Button onClick={onClone} disabled={isCloning}>
                {isCloning ? "Cloning..." : "Clone to My Resources"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
