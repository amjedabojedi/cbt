import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { JournalEntry } from "../types";
import { Feather, Save } from "lucide-react";
import { useLocalization } from "@/lib/localize.tsx";

interface JournalEntryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEntry: JournalEntry | null;
  title: string;
  content: string;
  onTitleChange: (v: string) => void;
  onContentChange: (v: string) => void;
  onSubmit: () => void;
  isCreating: boolean;
  isUpdating: boolean;
}

export function JournalEntryForm({
  open,
  onOpenChange,
  currentEntry,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSubmit,
  isCreating,
  isUpdating,
}: JournalEntryFormProps) {
  const { t, isRTL, tNum } = useLocalization();
  const isEditing = !!currentEntry;
  const isPending = isCreating || isUpdating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-xl p-0 rounded-2xl border-0 overflow-hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogTitle className="sr-only">{t("Journal")}</DialogTitle>

        <div
          className="relative overflow-hidden px-7 py-5"
          style={{ background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)" }}
        >
          <div className="absolute -end-10 -top-10 w-32 h-32 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -start-8 -bottom-8 w-24 h-24 rounded-full bg-indigo-700/15 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Feather className="h-5 w-5 text-teal-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
                {isEditing ? t("Edit Journal Entry") : t("New Journal Entry")}
              </h2>
              <p className="text-teal-100/80 text-xs mt-0.5 font-medium">
                {isEditing
                  ? t("Update your thoughts and reflections")
                  : t("Capture your thoughts and feelings")}
              </p>
            </div>
          </div>
        </div>

        <div className="px-7 py-6 space-y-5 bg-white">
          <div className="space-y-1.5">
            <label htmlFor="journal-title" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t("Title")}
            </label>
            <Input
              id="journal-title"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={t("Give your entry a title…")}
              className="text-base font-medium border-slate-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 rounded-xl h-11 bg-slate-50/60"
              voiceInput
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="journal-content" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t("Content")}
              </label>
              <span className="text-xs text-slate-400">
                {tNum(content.length)} {t("characters")}
              </span>
            </div>
            <Textarea
              id="journal-content"
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={t("Write about your thoughts, feelings, or experiences…")}
              className="min-h-[220px] text-sm border-slate-200 focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 rounded-xl resize-none leading-relaxed bg-slate-50/60"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 px-7 py-4 border-t border-slate-100 bg-white">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9 px-5"
          >
            {t("Cancel")}
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!title.trim() || !content.trim() || isPending}
            className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white border-0 shadow-md h-9 px-5 gap-2"
          >
            {isPending ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                {isEditing ? t("Update Entry") : t("Save Entry")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
