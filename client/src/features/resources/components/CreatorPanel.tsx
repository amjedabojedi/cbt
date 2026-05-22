import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { EducationalResource } from "@/features/resources/types";

interface CreatorPanelProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource?: EducationalResource;
  onResourceChange?: (resource: EducationalResource) => void;
  educationalResources: EducationalResource[];
  onSubmitCreate: (e: React.FormEvent<HTMLFormElement>) => void;
  onSubmitEdit: () => void;
  isPending: boolean;
}

export default function CreatorPanel({
  mode,
  open,
  onOpenChange,
  resource,
  onResourceChange,
  educationalResources,
  onSubmitCreate,
  onSubmitEdit,
  isPending,
}: CreatorPanelProps) {
  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const labelClass =
    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Educational Resource</DialogTitle>
            <DialogDescription>
              Create a new resource to share knowledge with clients
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmitCreate} className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="title" className={labelClass}>
                    Title
                  </label>
                  <Input id="title" name="title" placeholder="Enter title" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className={labelClass}>
                    Category
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    <select id="category" name="category" className={selectClass}>
                      <option value="">-- Select a Category --</option>
                      {educationalResources &&
                        Array.from(new Set(educationalResources.map((r: EducationalResource) => r.category)))
                          .filter((cat: string) => cat && cat !== "all")
                          .map((category: string) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                    </select>

                    <div className="relative">
                      <Input
                        id="custom-category"
                        name="custom-category"
                        placeholder="Or enter a new category name"
                        defaultValue=""
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Select an existing category or create a new one
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className={labelClass}>
                  Description
                </label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Enter a brief description"
                  rows={2}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="content" className={labelClass}>
                  Content
                </label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder="Enter the main content (supports HTML for formatting)"
                  rows={8}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className={labelClass}>
                    Resource Type
                  </label>
                  <select id="type" name="type" className={selectClass} required>
                    <option value="article">Article</option>
                    <option value="worksheet">Worksheet</option>
                    <option value="guide">Guide</option>
                    <option value="exercise">Exercise</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="pdfUrl" className={labelClass}>
                    PDF URL (Optional)
                  </label>
                  <Input
                    id="pdfUrl"
                    name="pdfUrl"
                    placeholder="https://example.com/document.pdf"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="tags" className={labelClass}>
                  Tags (comma-separated)
                </label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="anxiety, relaxation, mindfulness"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="published" name="published" defaultChecked={true} />
                <label htmlFor="published" className={labelClass}>
                  Published (visible to others)
                </label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl">
                {isPending ? "Creating..." : "Create Resource"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // edit mode
  if (!resource || !onResourceChange) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Resource</DialogTitle>
          <DialogDescription>Update this educational resource</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitEdit();
          }}
          className="space-y-4 mt-4"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Title</label>
                <Input
                  value={resource.title}
                  onChange={(e) => onResourceChange({ ...resource, title: e.target.value })}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <label className={labelClass}>Category</label>
                <div className="relative">
                  <Input
                    value={resource.category}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      if (value) {
                        onResourceChange({ ...resource, category: value });
                      }
                    }}
                    placeholder="Enter your custom category name"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Type the name of your custom category
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Description</label>
              <Textarea
                value={resource.description}
                onChange={(e) =>
                  onResourceChange({ ...resource, description: e.target.value })
                }
                placeholder="Enter a brief description"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Content</label>
              <Textarea
                value={resource.content}
                onChange={(e) =>
                  onResourceChange({ ...resource, content: e.target.value })
                }
                placeholder="Enter the main content (supports HTML for formatting)"
                rows={8}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>Resource Type</label>
                <select
                  value={resource.type}
                  onChange={(e) =>
                    onResourceChange({ ...resource, type: e.target.value })
                  }
                  className={selectClass}
                >
                  <option value="article">Article</option>
                  <option value="worksheet">Worksheet</option>
                  <option value="guide">Guide</option>
                  <option value="exercise">Exercise</option>
                  <option value="video">Video</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={labelClass}>PDF URL (Optional)</label>
                <Input
                  value={resource.pdfUrl || ""}
                  onChange={(e) =>
                    onResourceChange({ ...resource, pdfUrl: e.target.value })
                  }
                  placeholder="https://example.com/document.pdf"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Tags (comma-separated)</label>
              <Input
                value={(resource.tags || []).join(", ")}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(",")
                    .map((tag: string) => tag.trim())
                    .filter(Boolean);
                  onResourceChange({ ...resource, tags });
                }}
                placeholder="anxiety, relaxation, mindfulness"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="published"
                checked={resource.isPublished}
                onCheckedChange={(checked) =>
                  onResourceChange({ ...resource, isPublished: !!checked })
                }
              />
              <label htmlFor="published" className={labelClass}>
                Published (visible to others)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
