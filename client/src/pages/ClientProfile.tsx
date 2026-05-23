import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/lib/auth";
import { useClientContext } from "@/context/ClientContext";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  User, Heart, Brain, BookOpen, Target, BarChart3, ArrowLeft,
  Plus, Trash2, FileDown, Mic, MicOff, Sparkles, FileText,
  Loader2, CheckCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { User as UserType } from "@shared/schema";
import { format } from "date-fns";

type ClientNote = {
  id: number;
  therapistId: number;
  clientId: number;
  noteType: string;
  communicationDate: string;
  subject: string | null;
  details: string;
  createdAt: string;
};

const NOTE_TYPES = [
  { value: "general", label: "General Note" },
  { value: "session", label: "Session Note" },
  { value: "progress", label: "Progress Note" },
  { value: "communication", label: "Communication Log" },
  { value: "risk-assessment", label: "Risk Assessment" },
  { value: "treatment-plan", label: "Treatment Plan" },
];

const NOTE_TONES = [
  { value: "professional", label: "Professional" },
  { value: "empathetic", label: "Empathetic" },
  { value: "concise", label: "Concise" },
];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function ClientProfile() {
  const { clientId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { setViewingClient } = useClientContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Notes state
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteType, setNoteType] = useState("general");
  const [commDate, setCommDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [tone, setTone] = useState("professional");
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Fetch client details
  const { data: client, isLoading: isLoadingClient } = useQuery<UserType>({
    queryKey: [`/api/users/${clientId}`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const { data: emotions = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/emotions`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const { data: journals = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/journal`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const { data: thoughts = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/thoughts`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const { data: goals = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${clientId}/goals`],
    enabled: !!clientId && !!user && user.role === "therapist",
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery<ClientNote[]>({
    queryKey: [`/api/therapist/clients/${clientId}/notes`],
    enabled: !!clientId && !!user && user.role === "therapist" && activeTab === "notes",
  });

  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: async (data: { noteType: string; communicationDate: string; subject: string; details: string }) => {
      const res = await apiRequest("POST", `/api/therapist/clients/${clientId}/notes`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/therapist/clients/${clientId}/notes`] });
      resetForm();
      setShowAddNote(false);
      toast({ title: "Note saved", description: "Client note has been saved successfully." });
    },
    onError: () => toast({ title: "Error", description: "Failed to save note.", variant: "destructive" }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      await apiRequest("DELETE", `/api/therapist/clients/${clientId}/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/therapist/clients/${clientId}/notes`] });
      toast({ title: "Note deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete note.", variant: "destructive" }),
  });

  const resetForm = () => {
    setNoteType("general");
    setCommDate(format(new Date(), "yyyy-MM-dd"));
    setSubject("");
    setDetails("");
    setEnhancedText(null);
    setTone("professional");
    stopRecording();
  };

  // Voice input
  const startRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Not supported", description: "Voice input is not supported in this browser. Try Chrome.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setDetails(prev => (prev ? prev + " " + transcript : transcript));
      setEnhancedText(null);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast({ title: "Recording stopped", variant: "destructive" });
    };
    recognition.onend = () => setIsRecording(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = () => (isRecording ? stopRecording() : startRecording());

  // AI enhancement
  const handleEnhance = async () => {
    const textToEnhance = enhancedText || details;
    if (!textToEnhance.trim() || textToEnhance.trim().length < 10) {
      toast({ title: "Too short", description: "Write at least a sentence before enhancing.", variant: "destructive" });
      return;
    }
    setIsEnhancing(true);
    try {
      const res = await apiRequest("POST", "/api/openai/enhance-note", { text: textToEnhance, tone });
      const data = await res.json();
      setEnhancedText(data.enhanced);
    } catch {
      toast({ title: "Error", description: "Failed to enhance note. Try again.", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const acceptEnhanced = () => {
    if (enhancedText) {
      setDetails(enhancedText);
      setEnhancedText(null);
      toast({ title: "Applied", description: "Enhanced text applied to note." });
    }
  };

  // PDF export
  const handleExportPdf = (noteId: number) => {
    window.open(`/api/therapist/clients/${clientId}/notes/${noteId}/pdf`, "_blank");
  };

  const handleViewSection = (section: string) => {
    if (!client) return;
    setViewingClient(client.id, client.name || client.username);
    localStorage.setItem("viewingClientId", client.id.toString());
    localStorage.setItem("viewingClientName", client.name || client.username);
    const routes: Record<string, string> = {
      emotions: "/emotions", thoughts: "/thoughts", journal: "/journal",
      goals: "/goals", dashboard: "/dashboard",
    };
    if (routes[section]) navigate(routes[section]);
  };

  const handleSaveNote = () => {
    createNoteMutation.mutate({
      noteType,
      communicationDate: commDate,
      subject,
      details: enhancedText || details,
    });
  };

  const noteTypeLabel = (value: string) =>
    NOTE_TYPES.find(t => t.value === value)?.label ?? value;

  if (isLoadingClient) {
    return (
      <AppLayout title="Client Profile">
        <div className="container mx-auto px-4 py-6 text-center">Loading client profile...</div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout title="Client Profile">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium mb-2">Client Not Found</h3>
              <p className="text-neutral-500 mb-4">
                The client profile you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/clients")}>Back to Clients</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${client.name || client.username} - Profile`}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => navigate("/clients")} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Clients
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-800">{client.name || client.username}</h1>
              <p className="text-neutral-500">{client.email}</p>
            </div>
          </div>
          <Badge variant={client.status === "active" ? "default" : "secondary"}>
            {client.status || "Active"}
          </Badge>
        </div>

        {/* Client Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-neutral-500">Full Name</label>
                <p className="text-neutral-800">{client.name || "Not provided"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Email</label>
                <p className="text-neutral-800">{client.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-500">Member Since</label>
                <p className="text-neutral-800">
                  {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { key: "emotions", icon: Heart, label: "Emotions", count: emotions.length, color: "text-red-500" },
            { key: "thoughts", icon: Brain, label: "Thoughts", count: thoughts.length, color: "text-purple-500" },
            { key: "journal", icon: BookOpen, label: "Journal", count: journals.length, color: "text-green-500" },
            { key: "goals", icon: Target, label: "Goals", count: goals.length, color: "text-blue-500" },
          ].map(({ key, icon: Icon, label, count, color }) => (
            <Button key={key} variant="outline" className="flex flex-col items-center p-4 h-auto" onClick={() => handleViewSection(key)}>
              <Icon className={`h-6 w-6 mb-2 ${color}`} />
              <span className="text-sm">{label}</span>
              <span className="text-xs text-neutral-500">{count} records</span>
            </Button>
          ))}
          <Button variant="default" className="flex flex-col items-center p-4 h-auto" onClick={() => handleViewSection("dashboard")}>
            <BarChart3 className="h-6 w-6 mb-2" />
            <span className="text-sm">Dashboard</span>
            <span className="text-xs">View all data</span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Emotions</CardTitle></CardHeader>
                <CardContent>
                  {emotions.length > 0 ? (
                    <div className="space-y-2">
                      {emotions.slice(0, 3).map((e: any) => (
                        <div key={e.id} className="flex justify-between items-center p-2 bg-neutral-50 rounded">
                          <span className="font-medium">{e.coreEmotion}</span>
                          <span className="text-sm text-neutral-500">{new Date(e.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-neutral-500">No emotion records yet</p>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Recent Journal Entries</CardTitle></CardHeader>
                <CardContent>
                  {journals.length > 0 ? (
                    <div className="space-y-2">
                      {journals.slice(0, 3).map((j: any) => (
                        <div key={j.id} className="p-2 bg-neutral-50 rounded">
                          <p className="font-medium text-sm">{j.title}</p>
                          <p className="text-xs text-neutral-500">{new Date(j.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-neutral-500">No journal entries yet</p>}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Recent Activity tab */}
          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Recent Activity Timeline</CardTitle></CardHeader>
              <CardContent>
                <p className="text-neutral-500">Activity timeline feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress tab */}
          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Progress Tracking</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Emotion Records", count: emotions.length, bg: "bg-blue-50", color: "text-blue-600" },
                    { label: "Journal Entries", count: journals.length, bg: "bg-green-50", color: "text-green-600" },
                    { label: "Thought Records", count: thoughts.length, bg: "bg-purple-50", color: "text-purple-600" },
                    { label: "Goals Set", count: goals.length, bg: "bg-orange-50", color: "text-orange-600" },
                  ].map(({ label, count, bg, color }) => (
                    <div key={label} className={`text-center p-4 ${bg} rounded-lg`}>
                      <div className={`text-2xl font-bold ${color}`}>{count}</div>
                      <div className={`text-sm ${color}`}>{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes tab — full feature */}
          <TabsContent value="notes" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Client Notes</h3>
                <p className="text-sm text-muted-foreground">Clinical notes with voice input and AI writing assistance</p>
              </div>
              <Button onClick={() => { resetForm(); setShowAddNote(true); }} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {isLoadingNotes ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : notes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <FileText className="h-12 w-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground font-medium">No notes yet</p>
                  <p className="text-sm text-muted-foreground">Add your first clinical note for this client.</p>
                  <Button variant="outline" onClick={() => { resetForm(); setShowAddNote(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => {
                  const isExpanded = expandedNoteId === note.id;
                  return (
                    <Card key={note.id} className="border border-border/60">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">{noteTypeLabel(note.noteType)}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(note.communicationDate), "MMM d, yyyy")}
                              </span>
                            </div>
                            {note.subject && <p className="font-medium text-sm mb-1">{note.subject}</p>}
                            <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}>
                              {note.details}
                            </p>
                            {note.details.length > 150 && (
                              <button
                                className="text-xs text-primary mt-1 flex items-center gap-1"
                                onClick={() => setExpandedNoteId(isExpanded ? null : note.id)}
                              >
                                {isExpanded ? <><ChevronUp className="h-3 w-3" />Show less</> : <><ChevronDown className="h-3 w-3" />Show more</>}
                              </button>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              Saved {format(new Date(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleExportPdf(note.id)}>
                                    <FileDown className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Export as PDF</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                    disabled={deleteNoteMutation.isPending}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete note</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Note Dialog */}
      <Dialog open={showAddNote} onOpenChange={(open) => { if (!open) { stopRecording(); setShowAddNote(false); } }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Client Note</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Communication Date */}
            <div className="space-y-1.5">
              <Label>Communication Date</Label>
              <Input type="date" value={commDate} onChange={e => setCommDate(e.target.value)} />
              <p className="text-xs text-muted-foreground">When did this communication happen?</p>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <Label>Subject <span className="text-muted-foreground font-normal">(Optional)</span></Label>
              <Input placeholder="Brief description..." value={subject} onChange={e => setSubject(e.target.value)} />
            </div>

            {/* Details with voice + AI toolbar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Details</Label>
                <div className="flex items-center gap-2">
                  {/* Tone selector */}
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-7 text-xs w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TONES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {/* AI enhance */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline" size="sm" className="h-7 px-2 gap-1 text-xs"
                          onClick={handleEnhance}
                          disabled={isEnhancing || (!details.trim() && !enhancedText)}
                        >
                          {isEnhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          Enhance
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Improve grammar, flow and tone with AI</TooltipContent>
                    </Tooltip>
                    {/* Voice */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={isRecording ? "destructive" : "outline"}
                          size="sm" className="h-7 w-7 p-0"
                          onClick={toggleRecording}
                        >
                          {isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{isRecording ? "Stop recording" : "Dictate note"}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {isRecording && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-md">
                  <div className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                  Listening… speak now. Click the mic button to stop.
                </div>
              )}

              <Textarea
                placeholder="Enter clinical notes here, or use the mic button to dictate…"
                value={details}
                onChange={e => { setDetails(e.target.value); setEnhancedText(null); }}
                className="min-h-[140px] resize-none"
              />
            </div>

            {/* AI enhanced preview */}
            {enhancedText && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Sparkles className="h-4 w-4" />
                  AI-Enhanced Version
                </div>
                <p className="text-sm leading-relaxed">{enhancedText}</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={acceptEnhanced} className="gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" /> Use this version
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEnhancedText(null)}>
                    Keep original
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { stopRecording(); setShowAddNote(false); }}>Cancel</Button>
            <Button
              onClick={handleSaveNote}
              disabled={createNoteMutation.isPending || !details.trim() || !commDate}
            >
              {createNoteMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : "Save Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
