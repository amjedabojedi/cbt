import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, X, Users, Send, BookOpen, RefreshCw } from "lucide-react";
import type { EducationalResource } from "@/features/resources/types";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";

interface Client {
  id: number;
  name?: string;
  username: string;
}

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  clientsLoading: boolean;
  selectedClients: number[];
  onClientsChange: (ids: number[]) => void;
  assignmentNotes: string;
  onNotesChange: (notes: string) => void;
  onAssign: () => void;
  isPending: boolean;
  currentResource: EducationalResource | null;
}

const avatarPalette = [
  { bg: "bg-teal-50",  text: "text-slate-800", border: "border-teal-200" },
  { bg: "bg-indigo-50",  text: "text-slate-800", border: "border-indigo-200" },
  { bg: "bg-violet-50",  text: "text-slate-800", border: "border-violet-200" },
  { bg: "bg-teal-100", text: "text-slate-800", border: "border-teal-300" },
  { bg: "bg-indigo-100", text: "text-slate-800", border: "border-indigo-300" },
  { bg: "bg-blue-50",    text: "text-slate-800", border: "border-blue-200"   },
];
const getAvatar = (id: number) => avatarPalette[id % avatarPalette.length];

function getInitials(name?: string, username?: string) {
  const display = name || username || "";
  const parts = display.split(" ").filter(Boolean);
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : display.slice(0, 2).toUpperCase();
}

export default function FeedbackDialog({
  open, onOpenChange,
  clients, clientsLoading,
  selectedClients, onClientsChange,
  assignmentNotes, onNotesChange,
  onAssign, isPending,
  currentResource,
}: FeedbackDialogProps) {
  const { t, isRTL, tNum } = useLocalization();

  const toggleClient = (id: number) => {
    onClientsChange(
      selectedClients.includes(id)
        ? selectedClients.filter((c) => c !== id)
        : [...selectedClients, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onOpenChange(false); }}>
      <DialogContent
        className="!p-0 !gap-0 max-w-md !rounded-2xl border border-slate-100 shadow-2xl overflow-hidden bg-white max-h-[90vh] flex flex-col [&>button:last-child]:hidden"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="relative bg-gradient-to-r from-slate-800 via-teal-900 to-teal-700 px-6 pt-6 pb-5 shrink-0">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)",
            }}
          />

          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 end-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/15 border border-white/25">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-teal-100 uppercase tracking-widest">
                {t("Assign Resource")}
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">{t("Select Clients")}</h2>
            </div>
          </div>

          {currentResource && (
            <div className="flex items-center gap-2 mt-1 p-2.5 rounded-xl bg-white/10 border border-white/15">
              <BookOpen className="h-4 w-4 text-teal-100 shrink-0" />
              <p className="text-sm text-white/80 font-medium truncate">
                <DynamicTranslator text={currentResource.title} />
              </p>
            </div>
          )}
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-teal-700" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t("Choose Clients")}
              </span>
              {selectedClients.length > 0 && (
                <span className="ms-auto text-xs font-bold px-2 py-0.5 rounded-full bg-teal-800 text-white">
                  {tNum(selectedClients.length)} {t("selected")}
                </span>
              )}
            </div>

            {clientsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-5 w-5 text-slate-400 animate-spin" />
              </div>
            ) : clients && clients.length > 0 ? (
              <div className="space-y-2 max-h-52 overflow-y-auto pe-0.5">
                {clients.map((client) => {
                  const isSelected = selectedClients.includes(client.id);
                  const avatar = getAvatar(client.id);
                  return (
                    <button
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-start ${
                        isSelected
                          ? "bg-teal-50 border-teal-200 shadow-sm"
                          : "bg-white border-slate-100 hover:border-teal-100 hover:bg-teal-50/40"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isSelected
                            ? "bg-teal-100 text-slate-800 border-teal-300"
                            : `${avatar.bg} ${avatar.text} ${avatar.border}`
                        }`}
                      >
                        {getInitials(client.name, client.username)}
                      </div>

                      <span
                        className={`text-sm font-semibold flex-1 truncate ${
                          isSelected ? "text-teal-800" : "text-slate-700"
                        }`}
                      >
                        {client.name || client.username}
                      </span>

                      <div
                        className={`h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? "bg-teal-800 border-teal-700"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50">
                <Users className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">{t("No clients yet")}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t("Invite clients to assign resources.")}</p>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                {t("Notes for Client")}
              </span>
              <span className="text-xs text-slate-400 font-normal">{t("(optional)")}</span>
            </label>
            <Textarea
              placeholder={t("Add instructions or context for this resource…")}
              value={assignmentNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
              className="resize-none rounded-xl border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:border-purple-400 transition-all"
            />
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-sm"
          >
            {t("Cancel")}
          </Button>
          <Button
            type="button"
            disabled={selectedClients.length === 0 || !currentResource || isPending}
            onClick={onAssign}
            className="flex-1 h-10 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-semibold text-sm gap-2 shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> {t("Assigning…")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />{" "}
                {selectedClients.length > 1
                  ? t("Assign to Clients")
                  : t("Assign to Client")}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
