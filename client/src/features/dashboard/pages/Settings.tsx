import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bell, Globe, ShieldAlert, LogOut, User, Lock, Settings as SettingsIcon,
  Shield, BadgeCheck,
} from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean().default(true),
  reminderEmails: z.boolean().default(true),
  weeklyDigest: z.boolean().default(true),
  reminderFrequency: z.string().default("daily"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type TabId = "profile" | "password" | "notifications" | "appearance" | "account";

function TabButton({
  active, onClick, icon, label,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
        active
          ? "bg-[#090514] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
      }`}
    >
      <span className={active ? "text-purple-200" : "text-slate-400"}>{icon}</span>
      {label}
    </button>
  );
}

const inputClass =
  "h-10 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-purple-900/20 focus-visible:border-purple-900 transition-all";

const fieldLabelClass = "text-slate-700 text-xs font-semibold uppercase tracking-wide";

export default function Settings() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState<TabId>("profile");

  const isClinicalUser = user?.role === "admin" || user?.role === "therapist";

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      username: user?.username || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      reminderEmails: true,
      weeklyDigest: true,
      reminderFrequency: "daily",
    },
  });

  const onProfileSubmit = (data: ProfileFormValues) => {
    console.log("Profile data:", data);
    toast({ title: "Profile Updated", description: "Your profile information has been updated." });
  };

  const onPasswordSubmit = (data: PasswordFormValues) => {
    console.log("Password data:", data);
    toast({ title: "Password Updated", description: "Your password has been changed successfully." });
    passwordForm.reset();
  };

  const onNotificationSubmit = (data: NotificationFormValues) => {
    console.log("Notification data:", data);
    toast({ title: "Preferences Saved", description: "Your notification preferences have been saved." });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    toast({
      title: "Language Changed",
      description: `Display language set to ${value === "en" ? "English" : "Arabic"}.`,
    });
  };

  const handleDeleteAccount = () => {
    toast({ title: "Account Deleted", description: "Your account has been permanently deleted.", variant: "destructive" });
    logout();
  };

  const getInitials = (name: string) => {
    const parts = (name || "").split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return (name || "U").slice(0, 2).toUpperCase();
  };

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "profile",       icon: <User className="h-4 w-4" />,     label: "Profile"       },
    { id: "password",      icon: <Lock className="h-4 w-4" />,     label: "Password"      },
    { id: "notifications", icon: <Bell className="h-4 w-4" />,     label: "Notifications" },
    { id: "appearance",    icon: <Globe className="h-4 w-4" />,    label: "Appearance"    },
    { id: "account",       icon: <Shield className="h-4 w-4" />,   label: "Account"       },
  ];

  return (
    <AppLayout title="Settings">
      <div className="min-h-full bg-slate-50">

        {/* ── Hero ── */}
        <div className="bg-white border-b border-slate-100 px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-[#090514] rounded-xl shadow-lg shadow-purple-950/20">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-purple-900 uppercase tracking-widest mb-0.5">
                  {isClinicalUser ? "Clinical Account" : "My Account"}
                </p>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Settings</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manage your account, security, and preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white shadow-sm">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  icon={tab.icon}
                  label={tab.label}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {/* ══ PROFILE ══ */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">

              {/* Profile header — flat, no overlap */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md shrink-0"
                  style={{ background: "linear-gradient(135deg, #090514 0%, #1e0a36 100%)" }}
                >
                  {getInitials(user?.name || "")}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800 leading-tight">
                    {user?.name || "User"}
                  </h2>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5 ${
                    isClinicalUser
                      ? "bg-[#090514]/10 text-[#090514]"
                      : "bg-slate-100 text-slate-600"
                  }`}>
                    <BadgeCheck className="h-3 w-3" />
                    {user?.role === "therapist" ? "Clinical Therapist" : user?.role === "admin" ? "Admin" : "Client"}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6">
                <div className="pt-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Profile Information
                  </p>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={profileForm.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your full name" className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={profileForm.control} name="username" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={fieldLabelClass}>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="Your username" className={inputClass} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={profileForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={fieldLabelClass}>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Your email address" className={inputClass} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="pt-1">
                        <Button type="submit" className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl px-6">
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          )}

          {/* ══ PASSWORD ══ */}
          {activeTab === "password" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#090514]/10 border border-[#090514]/10">
                  <Lock className="h-5 w-5 text-[#090514]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Change Password</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Keep your account secure with a strong password</p>
                </div>
              </div>

              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel className={fieldLabelClass}>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter your current password" className={inputClass} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={fieldLabelClass}>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="New password" className={inputClass} {...field} />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400">Minimum 6 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                      <FormItem>
                        <FormLabel className={fieldLabelClass}>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm new password" className={inputClass} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-1">
                    <Button type="submit" className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl px-6">
                      Update Password
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {activeTab === "notifications" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#090514]/10 border border-[#090514]/10">
                  <Bell className="h-5 w-5 text-[#090514]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Notification Preferences</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Control how and when you receive notifications</p>
                </div>
              </div>

              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-3">
                  {([
                    { name: "emailNotifications" as const, label: "Email Notifications",  desc: "Receive notifications via email" },
                    { name: "reminderEmails" as const,     label: "Reminder Emails",      desc: "Reminders to log emotions and complete exercises" },
                    { name: "weeklyDigest" as const,       label: "Weekly Digest",        desc: "A weekly summary of your progress" },
                  ]).map(({ name, label, desc }) => (
                    <FormField key={name} control={notificationForm.control} name={name} render={({ field }) => (
                      <FormItem className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#090514]/10 transition-colors">
                        <div>
                          <FormLabel className="text-sm font-semibold text-slate-700 cursor-pointer">{label}</FormLabel>
                          <FormDescription className="text-xs text-slate-400 mt-0.5">{desc}</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )} />
                  ))}

                  <div className="pt-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Reminder Frequency</p>
                    <FormField control={notificationForm.control} name="reminderFrequency" render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-purple-900/20 focus:border-purple-900">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="every-other-day">Every Other Day</SelectItem>
                            <SelectItem value="twice-weekly">Twice Weekly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription className="text-xs text-slate-400">
                          How often you'll receive reminder emails
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>

                  <div className="pt-1">
                    <Button type="submit" className="bg-[#090514] hover:bg-purple-950 text-white rounded-xl px-6">
                      Save Preferences
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          )}

          {/* ══ APPEARANCE ══ */}
          {activeTab === "appearance" && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-[#090514]/10 border border-[#090514]/10">
                  <Globe className="h-5 w-5 text-[#090514]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">Appearance</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Customize language and display settings</p>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Language</p>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Application Language</p>
                  <p className="text-xs text-slate-400 mt-0.5">Select your preferred display language</p>
                </div>
                <Select value={language} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-full sm:w-[180px] h-10 rounded-xl border-slate-200 bg-white text-slate-700 focus:ring-2 focus:ring-purple-900/20 focus:border-purple-900">
                    <Globe className="h-4 w-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ══ ACCOUNT ══ */}
          {activeTab === "account" && (
            <div className="space-y-5">
              {/* Account info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-2.5 rounded-xl bg-[#090514]/10 border border-[#090514]/10">
                    <Shield className="h-5 w-5 text-[#090514]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Account Information</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Details about your account and membership</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    {
                      label: "Account Type",
                      value: user?.role === "therapist" ? "Clinical Therapist" : user?.role === "admin" ? "Administrator" : "Client",
                    },
                    { label: "Member Since", value: "January 15, 2023" },
                    { label: "Account Status", value: "Active", green: true },
                  ].map(({ label, value, green }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className={`text-sm font-semibold ${green ? "text-emerald-600" : "text-slate-700"}`}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Session</p>
                <Button
                  variant="outline"
                  className="w-full justify-start h-11 rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4 mr-3 text-slate-400" />
                  Sign Out
                </Button>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Danger Zone</p>
                <p className="text-xs text-slate-400 mb-4">Irreversible actions — proceed with caution</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium"
                    >
                      <ShieldAlert className="h-4 w-4 mr-3" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl bg-white border border-slate-100 shadow-xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-800">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        This action cannot be undone. This will permanently delete your account
                        and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
