import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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

interface EngagementSettings {
  reminderEnabled: boolean;
  reminderDays: number;
  reminderTime: string;
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: number;
  weeklyDigestTime: string;
  emailTemplate: string;
  reminderEmailSubject: string;
  reminderEmailTemplate: string;
  weeklyDigestSubject: string;
  weeklyDigestTemplate: string;
  escalationEnabled: boolean;
  escalationDays: number[];
  escalationTemplates: string[];
}

interface ReminderStats {
  lastRunTime: string | null;
  totalEmailsSent: number;
  totalNotificationsSent: number;
  activeClients: number;
  inactiveClients: number;
}

export default function EngagementSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
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
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/engagement-settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch engagement settings:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiRequest("GET", "/api/admin/engagement-stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch engagement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await apiRequest("POST", "/api/admin/engagement-settings", {
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: "Settings Saved",
          description: "Engagement reminder settings have been updated successfully."
        });
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

  const sendTestReminder = async () => {
    setSending(true);
    try {
      const response = await apiRequest("POST", "/api/client-engagement/send-reminders", {
        body: JSON.stringify({ days: 1, therapistOnly: false })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Test Reminder Sent",
          description: `Sent ${result.emailsSent} emails and ${result.notificationsSent} notifications.`
        });
        fetchStats(); // Refresh stats
      } else {
        throw new Error("Failed to send test reminder");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  const generateEmailPreview = (templateType: 'reminder' | 'digest') => {
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
      // Use default template if empty
      subject = settings.reminderEmailSubject || "Emotion Tracking Reminder";
      body = settings.reminderEmailTemplate || `<p>Hi <strong>{{clientName}}</strong>,</p>

<p>This is a friendly reminder to track your emotions today. Regular emotional tracking helps you understand patterns and improve your mental health journey.</p>

<p>Your therapist <strong>{{therapistName}}</strong> is here to support you every step of the way.</p>

<p><a href="{{loginLink}}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Your Dashboard</a></p>

<p>If you have any questions, feel free to reach out to us at <a href="mailto:{{supportEmail}}">{{supportEmail}}</a>.</p>

<p>Best regards,<br>
<strong>The ResilienceHub Team</strong></p>`;
      typeLabel = "Emotion Tracking Reminder";
    } else {
      // Use default template if empty
      subject = settings.weeklyDigestSubject || "Your Weekly Progress Summary";
      body = settings.weeklyDigestTemplate || `<p>Hi <strong>{{clientName}}</strong>,</p>

<p>Here's your weekly progress summary:</p>

<div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
<h3 style="color: #1e40af; margin-top: 0;">📊 This Week's Activity:</h3>
<ul style="list-style: none; padding: 0;">
<li style="margin: 8px 0;">• Emotions tracked: <strong>{{emotionsThisWeek}}</strong></li>
<li style="margin: 8px 0;">• Journal entries: <strong>{{journalEntriesThisWeek}}</strong></li>
<li style="margin: 8px 0;">• Thought records: <strong>{{thoughtRecordsThisWeek}}</strong></li>
<li style="margin: 8px 0;">• Goals worked on: <strong>{{goalsWorkedOn}}</strong></li>
</ul>
</div>

<p><strong>🎯 Progress: {{progressPercentage}}% completion</strong></p>

<div style="background-color: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0;">
<p style="margin: 0;"><strong>💡 Weekly Insight:</strong> {{weeklyInsight}}</p>
</div>

<p>Keep up the great work! Your therapist <strong>{{therapistName}}</strong> is proud of your progress.</p>

<p><a href="{{loginLink}}" style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visit Your Dashboard</a></p>

<p>Best regards,<br>
<strong>The ResilienceHub Team</strong></p>`;
      typeLabel = "Weekly Progress Digest";
    }
    
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
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
          <TabsList>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="escalation">Escalation Rules</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
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
                    <Label>Send time</Label>
                    <Input
                      type="time"
                      value={settings.reminderTime}
                      onChange={(e) => updateSetting("reminderTime", e.target.value)}
                      disabled={!settings.reminderEnabled}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Daily time to send reminders
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
                    <span>{"{{dashboardLink}}"} - Login link</span>
                    <span>{"{{loginLink}}"} - Direct login URL</span>
                    <span>{"{{supportEmail}}"} - Support contact</span>
                  </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeClients}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Inactive Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.inactiveClients}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.totalEmailsSent}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.totalNotificationsSent}</div>
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
                      {stats.lastRunTime ? new Date(stats.lastRunTime).toLocaleString() : "Never"}
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
                <CardTitle>Test Reminders</CardTitle>
                <CardDescription>
                  Send test engagement reminders to verify the system is working
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will send reminders to all clients who haven't tracked emotions in the last 24 hours.
                  Use this to test the email system and verify templates are working correctly.
                </p>
                
                <Button onClick={sendTestReminder} disabled={sending}>
                  {sending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Reminder
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
                    className="font-normal leading-relaxed bg-white p-4 rounded border"
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    dangerouslySetInnerHTML={{ 
                      __html: previewContent.body
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
    </AdminLayout>
  );
}