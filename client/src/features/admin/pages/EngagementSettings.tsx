import { useState, useEffect } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save, Send, Clock, Mail, Settings as SettingsIcon, Eye, FileText, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { reminderDeliverySummary, type ReminderDeliverySummary } from "../reminderDeliverySummary";
import { z } from "zod";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const engagementSettingsSchema = z.object({
  reminderEnabled: z.boolean(),
  reminderDays: z.number().int(),
  reminderTime: timeSchema,
  weeklyDigestEnabled: z.boolean(),
  weeklyDigestDay: z.number().int().min(0).max(6),
  weeklyDigestTime: timeSchema,
  // Legacy defaults include this field; persisted settings need not.
  emailTemplate: z.string().optional(),
  reminderEmailSubject: z.string(),
  reminderEmailTemplate: z.string(),
  weeklyDigestSubject: z.string(),
  weeklyDigestTemplate: z.string(),
  escalationEnabled: z.boolean(),
  escalationDays: z.array(z.number().int()),
  escalationTemplates: z.array(z.string()),
}).passthrough();

type EngagementSettings = z.infer<typeof engagementSettingsSchema>;

const reportCountSchema = z.number().int().nonnegative().safe();
const reminderStatsSchema = z.object({
  lastRunTime: z.string().datetime({ offset: true })
    .refine(value => Number.isFinite(Date.parse(value))).nullable(),
  totalEmailsSent: reportCountSchema,
  totalNotificationsSent: reportCountSchema,
  activeClients: reportCountSchema,
  inactiveClients: reportCountSchema,
});

type ReminderStats = z.infer<typeof reminderStatsSchema>;

export default function EngagementSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settingsAvailable, setSettingsAvailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<ReminderDeliverySummary | null>(null);
  const [reportDays, setReportDays] = useState(3);
  const [statsAvailable, setStatsAvailable] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState({ subject: "", body: "", type: "" });
  const [settings, setSettings] = useState<EngagementSettings>({
    reminderEnabled: true,
    reminderDays: 3,
    reminderTime: "09:00",
    weeklyDigestEnabled: true,
    weeklyDigestDay: 0, // Sunday
    weeklyDigestTime: "08:00",
    emailTemplate: "",
    reminderEmailSubject: "Time to check in with ResilienceHub",
    reminderEmailTemplate: `Hi {{clientName}},

We haven't seen you on ResilienceHub for {{daysSinceLastActivity}} days and wanted to check in with you.

Your mental health journey is important, and we're here to support you every step of the way. Taking just a few minutes to track your emotions or write in your journal can make a real difference.

Ready to continue your progress?
{{dashboardLink}}

If you have any questions or need support, don't hesitate to reach out to your therapist: {{therapistName}}.

Take care,
The ResilienceHub Team`,
    weeklyDigestSubject: "Your weekly progress summary",
    weeklyDigestTemplate: `Hi {{clientName}},

Here's a summary of your progress this week:

• Emotions tracked: {{emotionsThisWeek}}
• Journal entries: {{journalEntriesThisWeek}}  
• Goals worked on: {{goalsWorkedOn}}
• Thought records: {{thoughtRecordsThisWeek}}

{{weeklyInsight}}

Keep up the great work! Continue your journey:
{{dashboardLink}}

Best regards,
{{therapistName}} and the ResilienceHub Team`,
    escalationEnabled: false,
    escalationDays: [7, 14, 30],
    escalationTemplates: [
      "Gentle follow-up after 1 week",
      "More concerned check-in after 2 weeks", 
      "Urgent wellness check after 1 month"
    ]
  });
  const [stats, setStats] = useState<ReminderStats>({
    lastRunTime: null,
    totalEmailsSent: 0,
    totalNotificationsSent: 0,
    activeClients: 0,
    inactiveClients: 0
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setSettingsAvailable(false);
    try {
      const response = await apiRequest("GET", "/api/admin/engagement-settings");
      if (!response.ok) throw new Error("Failed to fetch engagement settings");
      const parsed = engagementSettingsSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("Invalid engagement settings response");
      const data = parsed.data;
      setSettings(data);
      setSettingsAvailable(true);
      await fetchStats(data.reminderDays);
    } catch (error) {
      console.error("Failed to fetch engagement settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async (days: number) => {
    setStatsAvailable(false);
    try {
      const response = await apiRequest("GET", `/api/admin/engagement-stats?days=${days}`);
      if (response.ok) {
        const parsed = reminderStatsSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("Invalid engagement statistics response");
        setStats(parsed.data);
        setReportDays(days);
        setStatsAvailable(true);
      }
    } catch (error) {
      console.error("Failed to fetch engagement stats:", error);
    }
  };

  const saveSettings = async () => {
    if (loading || !settingsAvailable) return;
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/engagement-settings", settings);

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Engagement reminder settings have been updated successfully."
        });
        fetchStats(settings.reminderDays);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const sendManualReminders = async () => {
    if (sending || !statsAvailable) return;
    if (!window.confirm(`Send real reminders to eligible clients inactive for ${reportDays} days? Sending again may duplicate reminders that already succeeded.`)) return;
    setSending(true);
    try {
      const response = await apiRequest("POST", "/api/admin/inactivity/send-reminders", { days: reportDays });

      if (response.ok) {
        const result = await response.json();
        const summary = reminderDeliverySummary(result);
        setDeliveryResult(summary);
        toast(summary);
        fetchStats(reportDays); // Refresh stats
      } else {
        throw new Error("Failed to send reminders");
      }
    } catch (error) {
      const summary: ReminderDeliverySummary = {
        title: "Reminder Delivery Unconfirmed",
        description: "Could not confirm delivery. Some reminders may already have been sent. Sending again may duplicate them.",
        variant: "destructive",
      };
      setDeliveryResult(summary);
      toast(summary);
    } finally {
      setSending(false);
    }
  };

  const generateEmailPreview = (templateType: 'reminder' | 'digest') => {
    console.log('Generating preview for:', templateType);
    console.log('Current settings:', settings);
    
    const sampleData = {
      clientName: "Sarah Johnson",
      therapistName: "Dr. Emily Chen",
      daysSinceLastActivity: settings.reminderDays,
      dashboardLink: "https://resiliencehub.app/dashboard",
      loginLink: "https://resiliencehub.app/login",
      supportEmail: "support@resiliencehub.app",
      emotionsThisWeek: 12,
      journalEntriesThisWeek: 4,
      thoughtRecordsThisWeek: 2,
      goalsWorkedOn: 3,
      weeklyInsight: "You've shown great consistency in tracking your emotions this week, with a notable improvement in positive mood ratings.",
      progressPercentage: 78
    };

    let body: string, subject: string, typeLabel: string;

    if (templateType === 'reminder') {
      subject = settings.reminderEmailSubject || "Emotion Tracking Reminder";
      body = settings.reminderEmailTemplate || "No template content yet. Please add your reminder email template.";
      typeLabel = "Emotion Tracking Reminder";
    } else {
      subject = settings.weeklyDigestSubject || "Your Weekly Progress Summary";
      body = settings.weeklyDigestTemplate || "No template content yet. Please add your weekly digest email template.";
      typeLabel = "Weekly Progress Digest";
    }
    
    console.log('Before replacement - Body:', body);
    console.log('Before replacement - Subject:', subject);
    
    // Replace template variables with sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      
      // Special handling for link variables to create buttons
      if (key === 'dashboardLink' || key === 'loginLink') {
        const buttonHtml = `<a href="${value.toString()}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin: 10px 0;">Visit Your Dashboard</a>`;
        body = body.replace(new RegExp(placeholder, 'g'), buttonHtml);
      } else {
        body = body.replace(new RegExp(placeholder, 'g'), value.toString());
      }
      
      subject = subject.replace(new RegExp(placeholder, 'g'), value.toString());
    });

    console.log('After replacement - Body:', body);
    console.log('After replacement - Subject:', subject);

    setPreviewContent({
      subject,
      body,
      type: typeLabel
    });
    
    setPreviewOpen(true);
  };

  const updateSetting = (key: keyof EngagementSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <AppLayout title="Engagement Settings">
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!settingsAvailable) {
    return (
      <AppLayout title="Engagement Settings">
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle role="heading" aria-level={1}>Engagement settings are unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p role="alert">
                We couldn&apos;t load the saved reminder settings. Editing and saving are
                unavailable until the settings load successfully. Your saved settings
                have not been changed.
              </p>
              <Button onClick={fetchSettings}>Retry loading settings</Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Engagement Settings">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Engagement Settings
          </h1>
          <p className="text-muted-foreground">
            Configure automatic reminders and engagement emails for clients
          </p>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="settings" className="text-xs sm:text-sm">Settings</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs sm:text-sm">Templates</TabsTrigger>
            <TabsTrigger value="escalation" className="text-xs sm:text-sm">Escalation</TabsTrigger>
            <TabsTrigger value="stats" className="text-xs sm:text-sm">Statistics</TabsTrigger>
            <TabsTrigger value="testing" className="text-xs sm:text-sm">Manual Reminders</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {/* Daily Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Daily Engagement Reminders
                </CardTitle>
                <CardDescription>
                  Automatically remind clients to track emotions when inactive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.reminderEnabled}
                    onCheckedChange={(checked) => updateSetting("reminderEnabled", checked)}
                  />
                  <Label>Enable daily reminders</Label>
                  <Badge variant={settings.reminderEnabled ? "default" : "secondary"}>
                    {settings.reminderEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Inactive days threshold</Label>
                    <Input
                      type="number"
                      min="1"
                      max="14"
                      value={settings.reminderDays}
                      onChange={(e) => updateSetting("reminderDays", parseInt(e.target.value))}
                      disabled={!settings.reminderEnabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Send reminder after this many days of inactivity
                    </p>
                  </div>

                  <div>
                    <Label>Send time (UTC)</Label>
                    <Input
                      type="time"
                      value={settings.reminderTime}
                      onChange={(e) => updateSetting("reminderTime", e.target.value)}
                      disabled={!settings.reminderEnabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily time in UTC (not your local time). Changes apply after saving.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Digests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Weekly Progress Digests
                </CardTitle>
                <CardDescription>
                  Send weekly activity summaries to clients and therapists
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.weeklyDigestEnabled}
                    onCheckedChange={(checked) => updateSetting("weeklyDigestEnabled", checked)}
                  />
                  <Label>Enable weekly digests</Label>
                  <Badge variant={settings.weeklyDigestEnabled ? "default" : "secondary"}>
                    {settings.weeklyDigestEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Send day</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={settings.weeklyDigestDay}
                      onChange={(e) => updateSetting("weeklyDigestDay", parseInt(e.target.value))}
                      disabled={!settings.weeklyDigestEnabled}
                    >
                      {dayNames.map((day, index) => (
                        <option key={index} value={index}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label>Send time</Label>
                    <Input
                      type="time"
                      value={settings.weeklyDigestTime}
                      onChange={(e) => updateSetting("weeklyDigestTime", e.target.value)}
                      disabled={!settings.weeklyDigestEnabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Email Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Email Templates</h3>
                <p className="text-sm text-muted-foreground">Customize your engagement email templates</p>
              </div>
              <Button onClick={saveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Templates
                  </>
                )}
              </Button>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Daily Reminder Email Template
                </CardTitle>
                <CardDescription>
                  Customize the email sent to inactive clients. Use variables like clientName, therapistName, daysSinceLastActivity, dashboardLink
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={settings.reminderEmailSubject}
                    onChange={(e) => updateSetting("reminderEmailSubject", e.target.value)}
                    placeholder="Enter email subject line"
                  />
                </div>
                
                <div>
                  <Label>Email Content</Label>
                  <Textarea
                    value={settings.reminderEmailTemplate}
                    onChange={(e) => updateSetting("reminderEmailTemplate", e.target.value)}
                    placeholder="Write your email template here..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Available Variables:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                    <span>{"{{clientName}}"} - Client's name</span>
                    <span>{"{{therapistName}}"} - Therapist's name</span>
                    <span>{"{{daysSinceLastActivity}}"} - Days inactive</span>
                    <span>{"{{dashboardLink}}"} - Dashboard URL</span>
                    <span>{"{{loginLink}}"} - Login page URL</span>
                    <span>{"{{supportEmail}}"} - Support contact</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Note:</strong> Use HTML tags like &lt;p&gt;, &lt;br&gt;, &lt;strong&gt; for formatting. Links will be converted to buttons automatically.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => generateEmailPreview('reminder')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Weekly Digest Email Template
                </CardTitle>
                <CardDescription>
                  Weekly progress summary sent to clients. Additional variables for weekly data tracking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email Subject</Label>
                  <Input
                    value={settings.weeklyDigestSubject}
                    onChange={(e) => updateSetting("weeklyDigestSubject", e.target.value)}
                    placeholder="Enter weekly digest subject"
                  />
                </div>
                
                <div>
                  <Label>Email Content</Label>
                  <Textarea
                    value={settings.weeklyDigestTemplate}
                    onChange={(e) => updateSetting("weeklyDigestTemplate", e.target.value)}
                    placeholder="Write your weekly digest template here..."
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Weekly Digest Variables:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
                    <span>{"{{emotionsThisWeek}}"} - Emotions tracked</span>
                    <span>{"{{journalEntriesThisWeek}}"} - Journal entries</span>
                    <span>{"{{thoughtRecordsThisWeek}}"} - Thought records</span>
                    <span>{"{{goalsWorkedOn}}"} - Goals in progress</span>
                    <span>{"{{weeklyInsight}}"} - AI-generated insight</span>
                    <span>{"{{progressPercentage}}"} - Weekly progress</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => generateEmailPreview('digest')}>
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Digest
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Digest
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Escalation Rules Tab */}
          <TabsContent value="escalation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Escalation Reminder System
                </CardTitle>
                <CardDescription>
                  Set up multiple reminder stages with increasing urgency for long-term inactive clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={settings.escalationEnabled}
                    onCheckedChange={(checked) => updateSetting("escalationEnabled", checked)}
                  />
                  <Label>Enable escalation reminders</Label>
                  <Badge variant={settings.escalationEnabled ? "default" : "secondary"}>
                    {settings.escalationEnabled ? "Active" : "Disabled"}
                  </Badge>
                </div>

                {settings.escalationEnabled && (
                  <div className="space-y-4 border-l-4 border-orange-200 pl-4">
                    <h4 className="font-medium">Escalation Timeline</h4>
                    
                    {(settings.escalationDays || []).map((days, index) => (
                      <Card key={index} className="bg-orange-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Label>After</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="90"
                                  value={days}
                                  onChange={(e) => {
                                    const newDays = [...settings.escalationDays];
                                    newDays[index] = parseInt(e.target.value);
                                    updateSetting("escalationDays", newDays);
                                  }}
                                  className="w-20"
                                />
                                <Label>days</Label>
                              </div>
                              <Badge variant="outline">Stage {index + 1}</Badge>
                            </div>
                            
                            <div>
                              <Label>Email Subject</Label>
                              <Input
                                value={`Escalation ${index + 1}: ${(settings.escalationTemplates || [])[index] || 'Custom message'}`}
                                placeholder="Enter escalation email subject"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label>Email Template</Label>
                              <Textarea
                                value={`Hi {{clientName}},

We've noticed you haven't been active on ResilienceHub for ${days} days. Your mental health journey is important to us.

${index === 0 ? 'This is a gentle reminder to check in.' : 
                  index === 1 ? 'We want to make sure you are doing okay.' : 
                  'We are concerned about your wellbeing and would like to connect.'}

Your therapist {{therapistName}} is here to support you.

{{dashboardLink}}

Please reach out if you need any assistance.

Best regards,
The ResilienceHub Team`}
                                rows={6}
                                className="font-mono text-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    <Button variant="outline" size="sm">
                      Add Escalation Stage
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            {!statsAvailable && (
              <p role="alert">Engagement statistics are unavailable. Reload before sending manual reminders.</p>
            )}
            <p className="text-sm text-muted-foreground">
              This report and manual reminders include only active client accounts. Inactive means
              no emotion record has been saved for at least {reportDays} full 24-hour days, including
              exactly at the cutoff. For clients with no emotion records, the period starts at account
              creation. The saved date is used, not the emotion&apos;s recorded date. Other tools do not
              reset this period. Recently joined clients are counted as within the period, not as
              having recorded activity. Automatic reminders use this same rule with the saved
              inactivity period, and run only when daily reminders are enabled.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Within Inactivity Period</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{statsAvailable ? stats.activeClients : "Unavailable"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Eligible for Manual Reminders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{statsAvailable ? stats.inactiveClients : "Unavailable"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{statsAvailable ? stats.totalEmailsSent : "Unavailable"}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-teal-700">{statsAvailable ? stats.totalNotificationsSent : "Unavailable"}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Last reminder run:</span>
                    <span className="text-muted-foreground">
                      {!statsAvailable ? "Unavailable" : stats.lastRunTime ? new Date(stats.lastRunTime).toLocaleString() : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily reminders:</span>
                    <Badge variant={settings.reminderEnabled ? "default" : "secondary"}>
                      {settings.reminderEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekly digests:</span>
                    <Badge variant={settings.weeklyDigestEnabled ? "default" : "secondary"}>
                      {settings.weeklyDigestEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Manual Reminders</CardTitle>
                <CardDescription>
                  Send real emotion-tracking reminders using the same rule as Statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This sends real notifications and, when email is enabled, real emails to active client
                  accounts inactive for at least {reportDays} full days. It uses the last saved emotion
                  record, or account creation if no records exist. This is not a test or an email-template
                  preview. Save threshold changes before sending.
                </p>
                
                {!statsAvailable && (
                  <p role="alert">Engagement statistics are unavailable. Reload before sending manual reminders.</p>
                )}
                {deliveryResult && (
                  <div role={deliveryResult.variant === "destructive" ? "alert" : "status"} aria-label="Manual reminder delivery result" className="rounded-md border p-4 space-y-2">
                    <p className="font-medium">{deliveryResult.title}</p>
                    <p className="text-sm">{deliveryResult.description}</p>
                  </div>
                )}
                <Button onClick={sendManualReminders} disabled={sending || !statsAvailable}>
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Manual Reminders
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Email Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Preview - {previewContent.type}</DialogTitle>
            <DialogDescription>
              Preview how the email will appear to clients with sample data
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email Subject:
                </div>
                <div className="font-medium bg-white p-2 rounded border">
                  {previewContent.subject}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-white">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <FileText className="h-4 w-4" />
                  Email Content:
                </div>
                <div className="prose prose-sm max-w-none">
                  <div 
                    className="font-normal leading-relaxed bg-white p-4 rounded border email-preview"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    dangerouslySetInnerHTML={{ 
                      __html: previewContent.body.replace(/\n/g, '<br>')
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Note:</strong> This preview uses sample data. Actual emails will use real client information when sent.</p>
                <p><strong>HTML Support:</strong> You can use HTML tags like &lt;strong&gt;, &lt;em&gt;, &lt;p&gt;, &lt;br&gt;, and &lt;a&gt; for formatting.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
