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
import { Loader2, Save, Send, Clock, Mail, Settings as SettingsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EngagementSettings {
  reminderEnabled: boolean;
  reminderDays: number;
  reminderTime: string;
  weeklyDigestEnabled: boolean;
  weeklyDigestDay: number;
  weeklyDigestTime: string;
  emailTemplate: string;
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
  const [settings, setSettings] = useState<EngagementSettings>({
    reminderEnabled: true,
    reminderDays: 3,
    reminderTime: "09:00",
    weeklyDigestEnabled: true,
    weeklyDigestDay: 0, // Sunday
    weeklyDigestTime: "08:00",
    emailTemplate: ""
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
    </AdminLayout>
  );
}