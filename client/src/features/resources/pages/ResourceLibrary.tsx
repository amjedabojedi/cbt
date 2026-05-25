import { useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import {
  formatResourceCategory,
  formatResourceType,
  formatAssignmentStatus,
} from "@/features/resources/utils/resourceLabels";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField,
  FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PlusCircle, Shield, Sparkles, Trash2, Edit, BookOpen,
  FileText, Search, Users, ChevronRight, ChevronLeft, Globe, Lock,
  Eye, UserCheck, X, Layers, Brain, Activity, Zap,
} from "lucide-react";

import ResourceViewer from "@/features/resources/components/ResourceViewer";
import CreatorPanel from "@/features/resources/components/CreatorPanel";
import FeedbackDialog from "@/features/resources/components/FeedbackDialog";

import type {
  ProtectiveFactor, CopingStrategy,
  EducationalResource, ResourceAssignment,
} from "@/features/resources/types";
import {
  useProtectiveFactors, useCopingStrategies, useEducationalResources,
  useTherapistClients, useResourceAssignments,
  useCreateProtectiveFactor, useUpdateProtectiveFactor, useDeleteProtectiveFactor,
  useCreateCopingStrategy, useUpdateCopingStrategy, useDeleteCopingStrategy,
  useCreateResource, useUpdateResource, useDeleteResource,
  useAssignResource, useCloneResource,
} from "@/features/resources/hooks/useResources";

// ─── Schemas ───
const protectiveFactorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
});
const copingStrategySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  isGlobal: z.boolean().default(false),
});
type ProtectiveFactorFormValues = z.infer<typeof protectiveFactorSchema>;
type CopingStrategyFormValues = z.infer<typeof copingStrategySchema>;

// ─── Category accent map (light tokens) ───
const categoryMap: Record<string, { pill: string; dot: string }> = {
  "CBT Basics":           { pill: "bg-teal-50 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  "Anxiety":              { pill: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200", dot: "bg-fuchsia-500" },
  "Depression":           { pill: "bg-indigo-50 text-indigo-700 ring-indigo-200", dot: "bg-indigo-500" },
  "Stress Management":    { pill: "bg-violet-50 text-violet-700 ring-violet-200", dot: "bg-violet-500" },
  "Mindfulness":          { pill: "bg-teal-50 text-teal-700 ring-teal-200", dot: "bg-teal-500" },
  "Emotional Regulation": { pill: "bg-pink-50 text-pink-700 ring-pink-200", dot: "bg-pink-500" },
  "Relationships":        { pill: "bg-rose-50 text-rose-700 ring-rose-200", dot: "bg-rose-500" },
  "Trauma":               { pill: "bg-slate-50 text-slate-700 ring-slate-200", dot: "bg-slate-500" },
  "Self Care":            { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
};
function getCat(cat: string) {
  return categoryMap[cat] ?? { pill: "bg-teal-50 text-teal-700 ring-purple-200", dot: "bg-purple-800" };
}

function getTypeIcon(type: string) {
  switch (type) {
    case "article":   return <FileText className="h-3.5 w-3.5" />;
    case "worksheet": return <Layers className="h-3.5 w-3.5" />;
    case "guide":     return <BookOpen className="h-3.5 w-3.5" />;
    case "exercise":  return <Activity className="h-3.5 w-3.5" />;
    case "video":     return <Zap className="h-3.5 w-3.5" />;
    default:          return <FileText className="h-3.5 w-3.5" />;
  }
}

// ─── Resource Card ───
function ResourceCard({
  resource, user, onView, onEdit, onDelete, onAssign,
}: {
  resource: EducationalResource; user: any;
  onView: (r: EducationalResource) => void;
  onEdit: (r: EducationalResource) => void;
  onDelete: (r: EducationalResource) => void;
  onAssign: (r: EducationalResource) => void;
}) {
  const { t, isRTL } = useLocalization();
  const cat = getCat(resource.category);
  const isOwner = resource.createdBy === user?.id || user?.role === "admin";
  return (
    <div className="group relative flex flex-col h-full rounded-2xl bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-teal-100 overflow-hidden">
      {/* Purple top accent strip */}
      <div className="h-1 w-full bg-gradient-to-r from-slate-700 to-teal-600" />

      <div className="flex flex-col flex-grow p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${cat.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cat.dot}`} />
            {formatResourceCategory(resource.category, t)}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-200">
            {getTypeIcon(resource.type)}
            {formatResourceType(resource.type, t)}
          </span>
          {!resource.isPublished && (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200">
              <Lock className="h-3 w-3" /> {t("Draft")}
            </span>
          )}
        </div>

        <h3 className="text-sm font-semibold text-slate-800 mb-2 leading-snug group-hover:text-teal-700 transition-colors duration-200 line-clamp-2">
          <DynamicTranslator text={resource.title} />
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-grow">
          <DynamicTranslator text={resource.description || ""} />
        </p>

        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 ring-1 ring-purple-100">
                #<DynamicTranslator text={tag} />
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-400">+{resource.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100 gap-2">
        <Button variant="ghost" size="sm" onClick={() => onView(resource)}
          className="h-8 px-3 text-xs font-medium text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg">
          <Eye className="h-3.5 w-3.5 me-1.5" /> {t("View")}
        </Button>
        <div className="flex items-center gap-1.5">
          {user?.role === "therapist" && (
            <Button size="sm" onClick={() => onAssign(resource)}
              className="h-8 px-3 text-xs font-semibold bg-teal-800 hover:bg-teal-700 text-white rounded-lg shadow-sm">
              <UserCheck className="h-3.5 w-3.5 me-1.5" /> {t("Assign")}
            </Button>
          )}
          {isOwner && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEdit(resource)}
                className="h-8 w-8 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              {(user?.role === "admin" || resource.createdBy === user?.id) && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(resource)}
                  className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Factor / Strategy Card ───
function ItemCard({
  title, description, isGlobal, onEdit, onDelete,
  accentClass = "from-slate-700 to-teal-600",
}: {
  title: string; description?: string; isGlobal?: boolean;
  onEdit?: () => void; onDelete?: () => void; accentClass?: string;
}) {
  const { t } = useLocalization();
  return (
    <div className="group relative rounded-2xl bg-white border border-slate-100 shadow-sm p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-teal-100 overflow-hidden">
      <div className={`absolute top-0 start-0 w-1 h-full bg-gradient-to-b ${accentClass}`} />
      <div className="ps-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">
            <DynamicTranslator text={title} />
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            {isGlobal && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <Globe className="h-2.5 w-2.5" /> {t("Shared")}
              </span>
            )}
            {onEdit && (
              <button onClick={onEdit}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50">
                <Edit className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {description ? (
            <DynamicTranslator text={description} />
          ) : (
            t("No description provided.")
          )}
        </p>
      </div>
    </div>
  );
}

// TabButton was removed in favor of Radix Tabs integration

// ─── Section header divider ───
function SectionLabel({ icon, label, count, extra }: { icon: React.ReactNode; label: string; count?: number; extra?: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-teal-700">{icon}</span>
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</h3>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
      {extra && <span className="text-xs text-slate-400">— {extra}</span>}
    </div>
  );
}

// ========================
export default function ResourceLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, isRTL, tNum } = useLocalization();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"educational-resources" | "protective-factors" | "coping-strategies" | "client-assignments">("educational-resources");
  const [searchQuery, setSearchQuery] = useState("");
  const [resourceCategory, setResourceCategory] = useState("all");

  const [isAddingFactor, setIsAddingFactor] = useState(false);
  const [isEditingFactor, setIsEditingFactor] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState<ProtectiveFactor | null>(null);
  const [isDeleteFactorDialogOpen, setIsDeleteFactorDialogOpen] = useState(false);

  const [isAddingStrategy, setIsAddingStrategy] = useState(false);
  const [isEditingStrategy, setIsEditingStrategy] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<CopingStrategy | null>(null);
  const [isDeleteStrategyDialogOpen, setIsDeleteStrategyDialogOpen] = useState(false);

  const [isAddingResource, setIsAddingResource] = useState(false);
  const [isAssigningResource, setIsAssigningResource] = useState(false);
  const [isDeleteResourceDialogOpen, setIsDeleteResourceDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [currentResource, setCurrentResource] = useState<EducationalResource | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<ResourceAssignment | null>(null);
  const [isViewingAssignment, setIsViewingAssignment] = useState(false);

  const defaultCategories = ["CBT Basics","Anxiety","Depression","Stress Management","Mindfulness","Emotional Regulation","Relationships","Trauma","Self Care"];

  const pillsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = pillsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const scrollPills = (dir: "left" | "right") => {
    const el = pillsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
    setTimeout(updateScrollState, 300);
  };

  const factorForm = useForm<ProtectiveFactorFormValues>({ resolver: zodResolver(protectiveFactorSchema), defaultValues: { name: "", description: "", isGlobal: false } });
  const strategyForm = useForm<CopingStrategyFormValues>({ resolver: zodResolver(copingStrategySchema), defaultValues: { name: "", description: "", isGlobal: false } });
  const editFactorForm = useForm<ProtectiveFactorFormValues>({ resolver: zodResolver(protectiveFactorSchema), defaultValues: { name: "", description: "", isGlobal: false } });
  const editStrategyForm = useForm<CopingStrategyFormValues>({ resolver: zodResolver(copingStrategySchema), defaultValues: { name: "", description: "", isGlobal: false } });

  const { data: protectiveFactors, isLoading: factorsLoading } = useProtectiveFactors(user?.id);
  const { data: copingStrategies, isLoading: strategiesLoading } = useCopingStrategies(user?.id);
  const { data: educationalResources, isLoading: resourcesLoading } = useEducationalResources(!!user);
  const { data: clients, isLoading: clientsLoading } = useTherapistClients(!!user && user.role === "therapist");
  const { data: clientAssignments = [], isLoading: assignmentsLoading } = useResourceAssignments(!!user && user.role === "therapist");

  const createFactorMutation = useCreateProtectiveFactor(user?.id);
  const updateFactorMutation = useUpdateProtectiveFactor(user?.id);
  const deleteFactorMutation = useDeleteProtectiveFactor(user?.id);
  const createStrategyMutation = useCreateCopingStrategy(user?.id);
  const updateStrategyMutation = useUpdateCopingStrategy(user?.id);
  const deleteStrategyMutation = useDeleteCopingStrategy(user?.id);
  const createResourceMutation = useCreateResource();
  const updateResourceMutation = useUpdateResource();
  const deleteResourceMutation = useDeleteResource();
  const assignResourceMutation = useAssignResource();
  const cloneResourceMutation = useCloneResource();

  const onSubmitFactor = (data: ProtectiveFactorFormValues) =>
    createFactorMutation.mutate(data, { onSuccess: () => { setIsAddingFactor(false); factorForm.reset(); } });
  const onSubmitStrategy = (data: CopingStrategyFormValues) =>
    createStrategyMutation.mutate(data, { onSuccess: () => { setIsAddingStrategy(false); strategyForm.reset(); } });
  const onUpdateFactor = (data: ProtectiveFactorFormValues) => {
    if (selectedFactor) updateFactorMutation.mutate({ id: selectedFactor.id, data }, { onSuccess: () => { setIsEditingFactor(false); setSelectedFactor(null); } });
  };
  const onUpdateStrategy = (data: CopingStrategyFormValues) => {
    if (selectedStrategy) updateStrategyMutation.mutate({ id: selectedStrategy.id, data }, { onSuccess: () => { setIsEditingStrategy(false); setSelectedStrategy(null); } });
  };
  const handleEditFactor = (factor: ProtectiveFactor) => {
    setSelectedFactor(factor);
    editFactorForm.reset({ name: factor.name, description: factor.description || "", isGlobal: factor.isGlobal });
    setIsEditingFactor(true);
  };
  const handleEditStrategy = (strategy: CopingStrategy) => {
    setSelectedStrategy(strategy);
    editStrategyForm.reset({ name: strategy.name, description: strategy.description || "", isGlobal: strategy.isGlobal });
    setIsEditingStrategy(true);
  };
  const handleSubmitCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const dropCat = fd.get("category") as string;
    const custCat = fd.get("custom-category") as string;
    let cat = "other";
    if (dropCat?.trim()) cat = dropCat.trim();
    else if (custCat?.trim()) cat = custCat.trim();
    createResourceMutation.mutate({
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      content: fd.get("content") as string,
      type: fd.get("type") as string,
      category: cat,
      tags: fd.get("tags") ? (fd.get("tags") as string).split(",").map((t) => t.trim()) : [],
      isPublished: fd.get("published") === "on",
      pdfUrl: (fd.get("pdfUrl") as string) || undefined,
      createdBy: user?.id,
    }, { onSuccess: () => setIsAddingResource(false) });
  };
  const handleSubmitEdit = () => {
    if (currentResource) {
      updateResourceMutation.mutate(
        { id: currentResource.id, data: { title: currentResource.title, description: currentResource.description, content: currentResource.content, type: currentResource.type, category: currentResource.category, tags: currentResource.tags || [], isPublished: currentResource.isPublished, pdfUrl: currentResource.pdfUrl } },
        { onSuccess: () => { if (currentResource) setCurrentResource({ ...currentResource, isEditing: false }); } }
      );
    }
  };

  const personalFactors   = protectiveFactors?.filter((f: ProtectiveFactor) => !f.isGlobal || f.userId === user?.id);
  const globalFactors     = protectiveFactors?.filter((f: ProtectiveFactor) => f.isGlobal && f.userId !== user?.id);
  const personalStrategies = copingStrategies?.filter((s: CopingStrategy) => !s.isGlobal || s.userId === user?.id);
  const globalStrategies  = copingStrategies?.filter((s: CopingStrategy) => s.isGlobal && s.userId !== user?.id);

  const allCategories = useMemo(() => {
    if (!educationalResources) return defaultCategories;
    const fromData = Array.from(new Set(educationalResources.map((r: EducationalResource) => r.category))).filter(Boolean) as string[];
    return Array.from(new Set([...fromData, ...defaultCategories]));
  }, [educationalResources]);

  const filteredResources = useMemo(() => {
    if (!educationalResources) return [];
    return educationalResources.filter((r: EducationalResource) => {
      const matchCat = resourceCategory === "all" || r.category === resourceCategory;
      const q = searchQuery.toLowerCase();
      const matchQ = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || (r.tags || []).some((t: string) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [educationalResources, resourceCategory, searchQuery]);

  // ── Shared dialog styles ──
  const dlgContent = "max-w-md rounded-2xl bg-white border border-slate-100 shadow-xl";
  const dlgContentSm = "max-w-sm rounded-2xl bg-white border border-slate-100 shadow-xl";

  return (
    <AppLayout title={t("Resource Library")}>
      <div className="min-h-full bg-slate-50" dir={isRTL ? "rtl" : "ltr"}>

                {/* Premium Hero Banner */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-slate-800 via-teal-900 to-teal-700 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden transition-all duration-300 border-b border-teal-700/30">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-teal-300" />
                  <span className="text-teal-300/80 text-xs font-bold tracking-widest uppercase">
                    {t("Resource Library")}
                  </span>
                </div>
                <h1 className="font-bold text-white tracking-tight text-3xl md:text-4xl mb-2">
                  {t("Clinical Resource Hub")}
                </h1>
                <p className="text-teal-100/70 text-base max-w-md leading-relaxed">
                  {t(
                    "Therapeutic tools, protective factors, and coping strategies for recovery and growth"
                  )}
                </p>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 shrink-0 flex-wrap">
                {[
                  { value: educationalResources?.length ?? "—", label: t("Resources") },
                  { value: protectiveFactors?.length ?? "—", label: t("Factors") },
                  { value: copingStrategies?.length ?? "—", label: t("Strategies") },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-teal-300/80 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Library Overview strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-xs font-bold text-teal-200 uppercase tracking-widest">{t("Library Overview")}</span>
                </div>
                <span className="text-xs text-teal-300">
                  {tNum((educationalResources?.length ?? 0) + (protectiveFactors?.length ?? 0) + (copingStrategies?.length ?? 0))}{" "}
                  {t("total resources")}
                </span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-purple-400 rounded-full transition-all duration-700" style={{ width: "100%" }} />
              </div>
              <p className="text-[11px] text-teal-300/60 mt-1.5">
                {t(
                  "Evidence-based CBT tools, exercises, and strategies to support your recovery journey."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Main Body Layout */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 grid grid-cols-2 sm:flex">
                <TabsTrigger
                  value="educational-resources"
                  className={cn(
                    "sm:flex-1 min-w-0 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <BookOpen className="h-4 w-4 me-2 inline" />
                  {t("Educational Resources")}
                  {educationalResources && educationalResources.length > 0 && (
                    <span className={cn(
                      "ms-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold transition-all",
                      activeTab === "educational-resources"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      {educationalResources.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="protective-factors"
                  className={cn(
                    "sm:flex-1 min-w-0 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <Shield className="h-4 w-4 me-2 inline" />
                  {t("Protective Factors")}
                  {personalFactors && personalFactors.length > 0 && (
                    <span className={cn(
                      "ms-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold transition-all",
                      activeTab === "protective-factors"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      {personalFactors.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="coping-strategies"
                  className={cn(
                    "sm:flex-1 min-w-0 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all",
                    "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                    "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                  )}
                >
                  <Brain className="h-4 w-4 me-2 inline" />
                  {t("Coping Strategies")}
                  {personalStrategies && personalStrategies.length > 0 && (
                    <span className={cn(
                      "ms-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold transition-all",
                      activeTab === "coping-strategies"
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-500"
                    )}>
                      {personalStrategies.length}
                    </span>
                  )}
                </TabsTrigger>
                {user?.role === "therapist" && (
                  <TabsTrigger
                    value="client-assignments"
                    className={cn(
                      "sm:flex-1 min-w-0 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all",
                      "data-[state=active]:bg-teal-800 data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <Users className="h-4 w-4 me-2 inline" />
                    {t("Client Assignments")}
                    {clientAssignments && clientAssignments.length > 0 && (
                      <span className={cn(
                        "ms-1.5 text-xs px-1.5 py-0.5 rounded-full font-bold transition-all",
                        activeTab === "client-assignments"
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {clientAssignments.length}
                      </span>
                    )}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

          {/* ══ EDUCATIONAL RESOURCES ══ */}
          <TabsContent value="educational-resources" className="mt-0 focus-visible:outline-none">
            <div>
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t("Search resources by title, description or tag…")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full ps-10 pe-4 h-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-900/20 focus:border-teal-700 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(user?.role === "admin" || user?.role === "therapist") && (
                  <Button onClick={() => setIsAddingResource(true)}
                    className="h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm shrink-0">
                    <PlusCircle className="h-4 w-4 me-2" /> {t("Add Resource")}
                  </Button>
                )}
              </div>

              {/* Category pills with scroll arrows */}
              <div className="relative flex items-center mb-6 gap-1">
                {/* Left arrow */}
                <button
                  onClick={() => scrollPills("left")}
                  className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-teal-300 shadow-sm transition-all duration-200 ${
                    canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Scrollable pills */}
                <div
                  ref={pillsRef}
                  onScroll={updateScrollState}
                  className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 flex-1"
                >
                  {["all", ...allCategories].map((cat) => {
                    const isAll = cat === "all";
                    const isActive = resourceCategory === cat;
                    const c = getCat(cat);
                    return (
                      <button key={cat} onClick={() => setResourceCategory(cat)}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isActive
                            ? isAll
                              ? "bg-teal-800 text-white border-teal-700 shadow-sm"
                              : `${c.pill} border-transparent ring-1 ring-current`
                            : "bg-white border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700"
                        }`}>
                        {isAll ? t("All Categories") : t(cat)}
                      </button>
                    );
                  })}
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => scrollPills("right")}
                  className={`shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:border-teal-300 shadow-sm transition-all duration-200 ${
                    canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                  }`}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Grid */}
              {resourcesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-52 rounded-2xl bg-slate-200 animate-pulse overflow-hidden">
                      <div className="h-1 w-full bg-slate-300" />
                      <div className="p-5 space-y-3">
                        <div className="flex gap-2">
                          <div className="h-6 w-24 rounded-full bg-slate-300" />
                          <div className="h-6 w-20 rounded-full bg-slate-300" />
                        </div>
                        <div className="h-4 w-4/5 rounded bg-slate-300" />
                        <div className="h-3 w-full rounded bg-slate-300" />
                        <div className="h-3 w-3/4 rounded bg-slate-300" />
                        <div className="h-3 w-2/3 rounded bg-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-5 bg-teal-50 rounded-2xl mb-5 border border-teal-100">
                    <BookOpen className="h-10 w-10 text-slate-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">{t("No resources found")}</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    {searchQuery
                      ? `${t("No results for")} "${searchQuery}".`
                      : t("No resources in this category yet.")}
                  </p>
                  {(user?.role === "admin" || user?.role === "therapist") && (
                    <Button onClick={() => setIsAddingResource(true)} className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl">
                      <PlusCircle className="h-4 w-4 me-2" /> {t("Create First Resource")}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredResources.map((resource: EducationalResource) => (
                    <ResourceCard key={resource.id} resource={resource} user={user}
                      onView={(r) => setCurrentResource({ ...r, isEditing: false })}
                      onEdit={(r) => setCurrentResource({ ...r, isEditing: true })}
                      onDelete={(r) => { setCurrentResource(r); setIsDeleteResourceDialogOpen(true); }}
                      onAssign={(r) => { setCurrentResource(r); setIsAssigningResource(true); }}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ══ PROTECTIVE FACTORS ══ */}
          <TabsContent value="protective-factors" className="mt-0 focus-visible:outline-none">
            <div>
              <div className="flex items-start justify-between mb-7 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-teal-700" /> {t("Protective Factors")}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t("Elements in your life that contribute to resilience and wellbeing")}
                  </p>
                </div>
                <Button onClick={() => setIsAddingFactor(true)}
                  className="shrink-0 h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm">
                  <PlusCircle className="h-4 w-4 me-2" /> {t("Add Factor")}
                </Button>
              </div>

              <div className="mb-8">
                <SectionLabel icon={<Lock className="h-3.5 w-3.5" />} label={t("My Protective Factors")} count={personalFactors?.length ?? 0} />
                {!personalFactors || personalFactors.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 mb-4">
                      <Shield className="h-7 w-7 text-teal-700" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-700 mb-2">{t("No protective factors yet")}</h4>
                    <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
                      {t("Add personal strengths you can rely on during difficult times.")}
                    </p>
                    <Button onClick={() => setIsAddingFactor(true)} className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl">
                      {t("Add Your First Factor")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalFactors.map((f: ProtectiveFactor) => (
                      <ItemCard key={f.id} title={f.name} description={f.description} isGlobal={f.isGlobal}
                        accentClass="from-slate-700 to-teal-600"
                        onEdit={() => handleEditFactor(f)}
                        onDelete={() => { setSelectedFactor(f); setIsDeleteFactorDialogOpen(true); }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {globalFactors && globalFactors.length > 0 && (
                <div>
                  <SectionLabel icon={<Globe className="h-3.5 w-3.5 text-emerald-500" />} label={t("Shared Protective Factors")}
                    count={globalFactors.length} extra={user?.role === "therapist" ? t("from other therapists") : t("from your therapist")} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalFactors.map((f: ProtectiveFactor) => (
                      <ItemCard key={f.id} title={f.name} description={f.description} isGlobal accentClass="from-emerald-400 to-teal-500" />
                    ))}
                  </div>
                </div>
              )}

              {/* Add dialog */}
              <Dialog open={isAddingFactor} onOpenChange={setIsAddingFactor}>
                <DialogContent className={dlgContent}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800"><Shield className="h-5 w-5 text-teal-700" /> {t("Add a Protective Factor")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("Personal strengths that help you overcome challenges.")}</DialogDescription>
                  </DialogHeader>
                  <Form {...factorForm}>
                    <form onSubmit={factorForm.handleSubmit(onSubmitFactor)} className="space-y-4 pt-2">
                      <FormField control={factorForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("Name")}</FormLabel><FormControl><Input placeholder={t("E.g., Supportive relationships")} className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={factorForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t("Description")} <span className="text-slate-400 font-normal">{t("(optional)")}</span></FormLabel>
                          <FormControl><Textarea placeholder={t("More details…")} rows={3} className="rounded-xl resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      {user?.role === "therapist" && (
                        <FormField control={factorForm.control} name="isGlobal" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-emerald-800">{t("Share with all clients")}</FormLabel>
                              <FormDescription className="text-emerald-600/70">{t("Make available to all your clients.")}</FormDescription>
                            </div>
                          </FormItem>
                        )} />
                      )}
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddingFactor(false)} className="rounded-xl">{t("Cancel")}</Button>
                        <Button type="submit" disabled={createFactorMutation.isPending} className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white">
                          {createFactorMutation.isPending ? t("Adding…") : t("Add Factor")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Edit dialog */}
              <Dialog open={isEditingFactor} onOpenChange={setIsEditingFactor}>
                <DialogContent className={dlgContent}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800"><Edit className="h-5 w-5 text-teal-700" /> {t("Edit Protective Factor")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("Update the details of this protective factor.")}</DialogDescription>
                  </DialogHeader>
                  <Form {...editFactorForm}>
                    <form onSubmit={editFactorForm.handleSubmit(onUpdateFactor)} className="space-y-4 pt-2">
                      <FormField control={editFactorForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("Name")}</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={editFactorForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t("Description")}</FormLabel><FormControl><Textarea rows={3} className="rounded-xl resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      {user?.role === "therapist" && (
                        <FormField control={editFactorForm.control} name="isGlobal" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel className="text-emerald-800">{t("Share with all clients")}</FormLabel></div>
                          </FormItem>
                        )} />
                      )}
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditingFactor(false)} className="rounded-xl">{t("Cancel")}</Button>
                        <Button type="submit" disabled={updateFactorMutation.isPending} className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white">
                          {updateFactorMutation.isPending ? t("Saving…") : t("Save Changes")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Delete dialog */}
              <Dialog open={isDeleteFactorDialogOpen} onOpenChange={setIsDeleteFactorDialogOpen}>
                <DialogContent className={dlgContentSm}>
                  <DialogHeader>
                    <DialogTitle className="text-slate-800">{t("Delete Protective Factor?")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("This action cannot be undone.")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteFactorDialogOpen(false)} className="rounded-xl">{t("Cancel")}</Button>
                    <Button variant="destructive" className="rounded-xl" disabled={deleteFactorMutation.isPending}
                      onClick={() => { if (selectedFactor) deleteFactorMutation.mutate(selectedFactor.id, { onSuccess: () => { setSelectedFactor(null); setIsDeleteFactorDialogOpen(false); } }); }}>
                      {deleteFactorMutation.isPending ? t("Deleting…") : t("Delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* ══ COPING STRATEGIES ══ */}
          <TabsContent value="coping-strategies" className="mt-0 focus-visible:outline-none">
            <div>
              <div className="flex items-start justify-between mb-7 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-teal-700" /> {t("Coping Strategies")}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {t("Techniques and approaches to manage stress and difficult emotions")}
                  </p>
                </div>
                <Button onClick={() => setIsAddingStrategy(true)}
                  className="shrink-0 h-10 px-5 bg-teal-800 hover:bg-teal-700 text-white rounded-xl font-semibold shadow-sm">
                  <PlusCircle className="h-4 w-4 me-2" /> {t("Add Strategy")}
                </Button>
              </div>

              <div className="mb-8">
                <SectionLabel icon={<Lock className="h-3.5 w-3.5" />} label={t("My Coping Strategies")} count={personalStrategies?.length ?? 0} />
                {!personalStrategies || personalStrategies.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 mb-4">
                      <Sparkles className="h-7 w-7 text-teal-700" />
                    </div>
                    <h4 className="text-base font-semibold text-slate-700 mb-2">{t("No coping strategies yet")}</h4>
                    <p className="text-sm text-slate-400 mb-5 max-w-xs mx-auto">
                      {t("Build a toolkit for managing difficult situations.")}
                    </p>
                    <Button onClick={() => setIsAddingStrategy(true)} className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl">
                      {t("Add Your First Strategy")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {personalStrategies.map((s: CopingStrategy) => (
                      <ItemCard key={s.id} title={s.name} description={s.description} isGlobal={s.isGlobal}
                        accentClass="from-slate-700 to-teal-600"
                        onEdit={() => handleEditStrategy(s)}
                        onDelete={() => { setSelectedStrategy(s); setIsDeleteStrategyDialogOpen(true); }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {globalStrategies && globalStrategies.length > 0 && (
                <div>
                  <SectionLabel icon={<Globe className="h-3.5 w-3.5 text-emerald-500" />} label={t("Shared Strategies")}
                    count={globalStrategies.length} extra={user?.role === "therapist" ? t("from other therapists") : t("from your therapist")} />
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalStrategies.map((s: CopingStrategy) => (
                      <ItemCard key={s.id} title={s.name} description={s.description} isGlobal accentClass="from-emerald-400 to-teal-500" />
                    ))}
                  </div>
                </div>
              )}

              <Dialog open={isAddingStrategy} onOpenChange={setIsAddingStrategy}>
                <DialogContent className={dlgContent}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800"><Brain className="h-5 w-5 text-teal-700" /> {t("Add a Coping Strategy")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("Strategies to help deal with stress and difficult emotions.")}</DialogDescription>
                  </DialogHeader>
                  <Form {...strategyForm}>
                    <form onSubmit={strategyForm.handleSubmit(onSubmitStrategy)} className="space-y-4 pt-2">
                      <FormField control={strategyForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("Name")}</FormLabel><FormControl><Input placeholder={t("E.g., Deep breathing exercises")} className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={strategyForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t("Description")} <span className="text-slate-400 font-normal">{t("(optional)")}</span></FormLabel>
                          <FormControl><Textarea placeholder={t("More details…")} rows={3} className="rounded-xl resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      {user?.role === "therapist" && (
                        <FormField control={strategyForm.control} name="isGlobal" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel className="text-emerald-800">{t("Share with all clients")}</FormLabel></div>
                          </FormItem>
                        )} />
                      )}
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddingStrategy(false)} className="rounded-xl">{t("Cancel")}</Button>
                        <Button type="submit" disabled={createStrategyMutation.isPending} className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white">
                          {createStrategyMutation.isPending ? t("Adding…") : t("Add Strategy")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditingStrategy} onOpenChange={setIsEditingStrategy}>
                <DialogContent className={dlgContent}>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-slate-800"><Edit className="h-5 w-5 text-teal-700" /> {t("Edit Coping Strategy")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("Update the details of this coping strategy.")}</DialogDescription>
                  </DialogHeader>
                  <Form {...editStrategyForm}>
                    <form onSubmit={editStrategyForm.handleSubmit(onUpdateStrategy)} className="space-y-4 pt-2">
                      <FormField control={editStrategyForm.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>{t("Name")}</FormLabel><FormControl><Input className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={editStrategyForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>{t("Description")}</FormLabel><FormControl><Textarea rows={3} className="rounded-xl resize-none" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      {user?.role === "therapist" && (
                        <FormField control={editStrategyForm.control} name="isGlobal" render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none"><FormLabel className="text-emerald-800">{t("Share with all clients")}</FormLabel></div>
                          </FormItem>
                        )} />
                      )}
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditingStrategy(false)} className="rounded-xl">{t("Cancel")}</Button>
                        <Button type="submit" disabled={updateStrategyMutation.isPending} className="rounded-xl bg-teal-800 hover:bg-teal-700 text-white">
                          {updateStrategyMutation.isPending ? t("Saving…") : t("Save Changes")}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isDeleteStrategyDialogOpen} onOpenChange={setIsDeleteStrategyDialogOpen}>
                <DialogContent className={dlgContentSm}>
                  <DialogHeader>
                    <DialogTitle className="text-slate-800">{t("Delete Coping Strategy?")}</DialogTitle>
                    <DialogDescription className="text-slate-500">{t("This action cannot be undone.")}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteStrategyDialogOpen(false)} className="rounded-xl">{t("Cancel")}</Button>
                    <Button variant="destructive" className="rounded-xl" disabled={deleteStrategyMutation.isPending}
                      onClick={() => { if (selectedStrategy) deleteStrategyMutation.mutate(selectedStrategy.id, { onSuccess: () => { setSelectedStrategy(null); setIsDeleteStrategyDialogOpen(false); } }); }}>
                      {deleteStrategyMutation.isPending ? t("Deleting…") : t("Delete")}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </TabsContent>

          {/* ══ CLIENT ASSIGNMENTS ══ */}
          {user?.role === "therapist" && (
            <TabsContent value="client-assignments" className="mt-0 focus-visible:outline-none">
              <div>
              <div className="mb-7">
                <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                  <Users className="h-5 w-5 text-teal-700" /> {t("Client Assignments")}
                </h2>
                <p className="text-sm text-slate-500">{t("Resources you've assigned to your clients")}</p>
              </div>

              {assignmentsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-44 rounded-2xl bg-slate-200 animate-pulse overflow-hidden">
                      <div className="h-1 w-full bg-slate-300" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 w-3/4 rounded bg-slate-300" />
                        <div className="h-3 w-1/2 rounded bg-slate-300" />
                        <div className="h-3 w-full rounded bg-slate-300" />
                        <div className="h-3 w-5/6 rounded bg-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : clientAssignments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {clientAssignments.map((a: ResourceAssignment) => {
                    const cat = getCat(a.resource.category);
                    return (
                      <div key={a.id} className="group rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:border-teal-100">
                        <div className={`h-1 bg-gradient-to-r from-slate-700 to-teal-600`} />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
                              <DynamicTranslator text={a.resource.title} />
                            </h3>
                            <span className={`shrink-0 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              a.status === "completed" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                              a.status === "in_progress" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200" :
                              "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                            }`}>{formatAssignmentStatus(a.status, t)}</span>
                          </div>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center">
                              <Users className="h-3.5 w-3.5 text-teal-700" />
                            </div>
                            <span className="text-xs text-slate-500">
                              {(a.client && (a.client.name || a.client.username)) || t("Client unavailable")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                            <DynamicTranslator text={a.resource.description || ""} />
                          </p>
                          {a.notes && (
                            <div className="p-2.5 bg-teal-50 rounded-xl border border-teal-100 text-xs text-slate-600 mb-3">
                              <span className="font-medium text-teal-700 block mb-0.5">{t("Notes:")}</span>
                              <DynamicTranslator text={a.notes} />
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              {new Date(a.assignedAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => { setViewingAssignment(a); setIsViewingAssignment(true); }}
                              className="h-7 px-3 text-xs rounded-lg text-teal-700 hover:bg-teal-50">
                              {t("View Details")}{" "}
                              <ChevronRight className={cn("h-3 w-3 inline", isRTL && "rotate-180")} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="p-5 bg-teal-50 rounded-2xl mb-5 border border-teal-100">
                    <Users className="h-10 w-10 text-slate-800" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">{t("No assignments yet")}</h3>
                  <p className="text-sm text-slate-400 mb-6 max-w-sm">
                    {t("Assign educational resources to your clients from the Educational Resources tab.")}
                  </p>
                  <Button onClick={() => setActiveTab("educational-resources")} className="bg-teal-800 hover:bg-teal-700 text-white rounded-xl">
                    {t("Browse Resources")}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          )}
        </Tabs>
      </div>

        {/* ── Global dialogs ── */}
        <ResourceViewer
          resource={currentResource && !currentResource.isEditing && !isAssigningResource ? currentResource : null}
          user={user} open={!!currentResource && !currentResource.isEditing && !isAssigningResource}
          onClose={() => setCurrentResource(null)}
          onEdit={() => currentResource && setCurrentResource({ ...currentResource, isEditing: true })}
          onDelete={() => { if (currentResource) deleteResourceMutation.mutate(currentResource.id, { onSuccess: () => setCurrentResource(null) }); }}
          onClone={() => { if (currentResource) cloneResourceMutation.mutate(currentResource.id, { onSuccess: () => setCurrentResource(null) }); }}
          isDeleting={deleteResourceMutation.isPending} isCloning={cloneResourceMutation.isPending}
        />
        <CreatorPanel mode="edit" open={!!currentResource && !!currentResource.isEditing}
          onOpenChange={(open) => { if (!open && currentResource) setCurrentResource({ ...currentResource, isEditing: false }); }}
          resource={currentResource ?? undefined} onResourceChange={setCurrentResource}
          educationalResources={educationalResources ?? []} onSubmitCreate={handleSubmitCreate}
          onSubmitEdit={handleSubmitEdit} isPending={updateResourceMutation.isPending} />
        <CreatorPanel mode="create" open={isAddingResource} onOpenChange={setIsAddingResource}
          educationalResources={educationalResources ?? []} onSubmitCreate={handleSubmitCreate}
          onSubmitEdit={handleSubmitEdit} isPending={createResourceMutation.isPending} />

        <Dialog open={isDeleteResourceDialogOpen} onOpenChange={setIsDeleteResourceDialogOpen}>
          <DialogContent className={dlgContentSm}>
            <DialogHeader>
              <DialogTitle className="text-slate-800">{t("Delete Educational Resource?")}</DialogTitle>
              <DialogDescription className="text-slate-500">{t("This action cannot be undone.")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteResourceDialogOpen(false)} className="rounded-xl">{t("Cancel")}</Button>
              <Button variant="destructive" className="rounded-xl" disabled={deleteResourceMutation.isPending}
                onClick={() => { if (currentResource) deleteResourceMutation.mutate(currentResource.id, { onSuccess: () => { setCurrentResource(null); setIsDeleteResourceDialogOpen(false); } }); }}>
                {deleteResourceMutation.isPending ? t("Deleting…") : t("Delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <FeedbackDialog open={isAssigningResource}
          onOpenChange={(open) => { if (!open) { setIsAssigningResource(false); setSelectedClients([]); setAssignmentNotes(""); setCurrentResource(null); } }}
          clients={clients ?? []} clientsLoading={clientsLoading ?? false}
          selectedClients={selectedClients} onClientsChange={setSelectedClients}
          assignmentNotes={assignmentNotes} onNotesChange={setAssignmentNotes}
          onAssign={() => { if (currentResource) assignResourceMutation.mutate({ resourceId: currentResource.id, clientIds: selectedClients, notes: assignmentNotes }, { onSuccess: () => { setIsAssigningResource(false); setSelectedClients([]); setAssignmentNotes(""); setCurrentResource(null); } }); }}
          isPending={assignResourceMutation.isPending} currentResource={currentResource} />

        <Dialog open={isViewingAssignment} onOpenChange={setIsViewingAssignment}>
          <DialogContent
            className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-slate-100 shadow-xl"
            dir={isRTL ? "rtl" : "ltr"}
          >
            {viewingAssignment && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-800">{t("Assignment Details")}</DialogTitle>
                  <DialogDescription className="text-slate-500">
                    {t("View details about this resource assignment")}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <h3 className="font-semibold text-slate-800">
                        <DynamicTranslator text={viewingAssignment.resource.title} />
                      </h3>
                      <span
                        className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                          viewingAssignment.status === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : viewingAssignment.status === "in_progress"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {formatAssignmentStatus(viewingAssignment.status, t)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-4">
                      <DynamicTranslator text={viewingAssignment.resource.description || ""} />
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">{t("Assigned To")}</p>
                        <p className="font-medium text-slate-700">
                          {(viewingAssignment.client &&
                            (viewingAssignment.client.name || viewingAssignment.client.username)) ||
                            t("Unavailable")}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">{t("Assigned On")}</p>
                        <p className="font-medium text-slate-700">
                          {new Date(viewingAssignment.assignedAt).toLocaleDateString(
                            isRTL ? "ar-SA" : "en-US"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    const c = getCat(viewingAssignment.resource.category);
                    return (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2">{t("Category")}</p>
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${c.pill}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {formatResourceCategory(viewingAssignment.resource.category, t)}
                        </span>
                      </div>
                    );
                  })()}

                  {viewingAssignment.notes && (
                    <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-100">
                      <p className="text-xs font-medium text-teal-700 mb-1">{t("Your Notes")}</p>
                      <p className="text-sm text-slate-700">
                        <DynamicTranslator text={viewingAssignment.notes} />
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2">{t("Resource Content")}</p>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 max-h-64 overflow-y-auto">
                      {viewingAssignment.resource.type === "article" ? (
                        <div
                          className="prose prose-sm max-w-none text-slate-700"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(viewingAssignment.resource.content),
                          }}
                        />
                      ) : viewingAssignment.resource.type === "pdf" &&
                        viewingAssignment.resource.pdfUrl ? (
                        <div className="text-center py-6">
                          <a
                            href={viewingAssignment.resource.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-medium text-sm"
                          >
                            <FileText className="h-5 w-5" /> {t("Open PDF in new tab")}
                          </a>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic text-sm">{t("No preview available.")}</p>
                      )}
                    </div>
                  </div>
                </div>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsViewingAssignment(false)}
                    className="rounded-xl"
                  >
                    {t("Close")}
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={async () => {
                      try {
                        await apiRequest(
                          "DELETE",
                          `/api/resource-assignments/${viewingAssignment.id}`,
                          null
                        );
                        queryClient.invalidateQueries({ queryKey: ["/api/therapist/assignments"] });
                        setIsViewingAssignment(false);
                        toast({
                          title: t("Assignment Deleted"),
                          description: t("The resource assignment has been removed."),
                        });
                      } catch {
                        toast({
                          title: t("Error"),
                          description: t("Failed to delete assignment."),
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {t("Delete Assignment")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
