import DOMPurify from "dompurify";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText, Edit, Trash2, Copy, X,
  BookOpen, Layers, Activity, Zap, Lock,
  Tag, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EducationalResource } from "@/features/resources/types";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { formatResourceCategory, formatResourceType } from "@/features/resources/utils/resourceLabels";

interface ResourceViewerProps {
  resource: EducationalResource | null;
  user: any;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  isDeleting: boolean;
  isCloning: boolean;
}

const categoryMap: Record<string, { pill: string; dot: string }> = {
  "CBT Basics":           { pill: "bg-violet-50  text-violet-700  ring-violet-200",  dot: "bg-violet-500"  },
  "Anxiety":              { pill: "bg-amber-50   text-amber-700   ring-amber-200",   dot: "bg-amber-500"   },
  "Depression":           { pill: "bg-blue-50    text-blue-700    ring-blue-200",    dot: "bg-blue-500"    },
  "Stress Management":    { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  "Mindfulness":          { pill: "bg-teal-50    text-teal-700    ring-teal-200",    dot: "bg-teal-500"    },
  "Emotional Regulation": { pill: "bg-violet-50  text-violet-700  ring-violet-200",  dot: "bg-violet-500"  },
  "Relationships":        { pill: "bg-purple-50  text-purple-800  ring-purple-200",  dot: "bg-purple-700"  },
  "Trauma":               { pill: "bg-orange-50  text-orange-700  ring-orange-200",  dot: "bg-orange-500"  },
  "Self Care":            { pill: "bg-lime-50    text-lime-700    ring-lime-200",    dot: "bg-lime-500"    },
};
function getCat(cat: string) {
  return categoryMap[cat] ?? { pill: "bg-purple-50 text-purple-900 ring-purple-200", dot: "bg-purple-800" };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "article":   return <FileText className="h-4 w-4" />;
    case "worksheet": return <Layers className="h-4 w-4" />;
    case "guide":     return <BookOpen className="h-4 w-4" />;
    case "exercise":  return <Activity className="h-4 w-4" />;
    case "video":     return <Zap className="h-4 w-4" />;
    default:          return <FileText className="h-4 w-4" />;
  }
}

export default function ResourceViewer({
  resource, user, open, onClose, onEdit, onDelete, onClone, isDeleting, isCloning,
}: ResourceViewerProps) {
  const { t, isRTL } = useLocalization();

  if (!resource) return null;

  const cat = getCat(resource.category);
  const isOwner = resource.createdBy === user?.id || user?.role === "admin";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="!p-0 !gap-0 max-w-2xl !rounded-2xl border-0 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col [&>button:last-child]:hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogTitle className="sr-only">{t("Resource Library")}</DialogTitle>

        <div className="relative bg-gradient-to-r from-[#090514] via-purple-950 to-indigo-950 px-6 pt-6 pb-5 shrink-0">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />

          <button
            onClick={onClose}
            className="absolute top-4 end-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${cat.pill}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
              {formatResourceCategory(resource.category, t)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/80 ring-1 ring-white/20">
              {getTypeIcon(resource.type)}
              {formatResourceType(resource.type, t)}
            </span>
            {resource.isPublished === false && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/30">
                <Lock className="h-3 w-3" /> {t("Draft")}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white leading-snug pe-10">
            <DynamicTranslator text={resource.title} />
          </h2>
          <p className="text-sm text-white/60 mt-1.5 leading-relaxed line-clamp-2">
            <DynamicTranslator text={resource.description || ""} />
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-purple-900" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t("Content")}
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none text-slate-700 bg-slate-50 rounded-xl border border-slate-100 p-4 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resource.content) }}
            />
          </div>

          {resource.pdfUrl && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-purple-900" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {t("Attached PDF")}
                </span>
              </div>
              <a
                href={resource.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 border border-purple-100 text-[#090514]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-purple-900 transition-colors">
                    {t("Open PDF document")}
                  </span>
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-slate-300 group-hover:text-purple-500 transition-colors",
                    isRTL && "rotate-180"
                  )}
                />
              </a>
            </div>
          )}

          {resource.tags && resource.tags.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-purple-900" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  {t("Tags")}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag: string, idx: number) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-900 ring-1 ring-purple-100 font-medium"
                  >
                    #<DynamicTranslator text={tag} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
                className="h-9 px-3 text-sm rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 font-semibold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? t("Deleting…") : t("Delete")}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-9 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
            >
              {t("Close")}
            </Button>

            {user?.role === "therapist" && !isOwner && (
              <Button
                size="sm"
                onClick={onClone}
                disabled={isCloning}
                className="h-9 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm gap-2 shadow-sm"
              >
                <Copy className="h-4 w-4" />
                {isCloning ? t("Cloning…") : t("Clone")}
              </Button>
            )}

            {isOwner && (
              <Button
                size="sm"
                onClick={onEdit}
                className="h-9 px-4 rounded-xl bg-[#090514] hover:bg-purple-950 text-white font-semibold text-sm gap-2 shadow-sm"
              >
                <Edit className="h-4 w-4" /> {t("Edit Resource")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
