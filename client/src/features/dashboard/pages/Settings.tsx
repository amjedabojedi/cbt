import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppLayout from "@/components/layout/AppLayout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useLocalization, DynamicTranslator } from "@/lib/localize";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Bell, Globe, ShieldAlert, LogOut, User, Lock,
  Shield, BadgeCheck, Sparkles, CheckCircle2, Settings as SettingsIcon,
} from "lucide-react";

// ── Schemas ──────────────────────────────────────────────────────────
const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((d) => d.newPassword === d.confirmPassword, {
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

// ── Shared input style ────────────────────────────────────────────────
const inputCls =
  "h-11 rounded-xl border-slate-200 focus:border-purple-400 focus:ring-1 focus:ring-purple-400/30 bg-slate-50/60";
const labelCls = "text-[10px] font-bold text-slate-500 uppercase tracking-wider";

// ── Card section header ───────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3.5 px-6 py-5 border-b border-slate-100">
      <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-[#090514]">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-bold text-slate-800 leading-tight">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
export default function Settings() {
  const { user, logout } = useAuth();
  const { t, currentLanguage, setLanguage: setAppLanguage } = useLocalization();
  const { toast } = useToast();
  const [language, setLanguage] = useState(currentLanguage || "en");
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
    defaultValues: { emailNotifications: true, reminderEmails: true, weeklyDigest: true, reminderFrequency: "daily" },
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
    // setLanguage(value);
    // setAppLanguage(value as "en" | "ar");
    toast({
      title: t("Language Changed"),
      description: value === "en" ? t("Display language set to English.") : t("Display language set to Arabic.")
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

  const roleLabel =
    user?.role === "therapist" ? "Clinical Therapist" :
      user?.role === "admin" ? "Administrator" : "Client";

  const tabs: { id: TabId; icon: React.ReactNode; label: string }[] = [
    { id: "profile", icon: <User className="h-3.5 w-3.5" />, label: t("Profile") },
    { id: "password", icon: <Lock className="h-3.5 w-3.5" />, label: t("Password") },
    { id: "notifications", icon: <Bell className="h-3.5 w-3.5" />, label: t("Notifications") },
    { id: "appearance", icon: <Globe className="h-3.5 w-3.5" />, label: t("Appearance") },
    { id: "account", icon: <Shield className="h-3.5 w-3.5" />, label: t("Account") },
  ];

  return (
    <AppLayout title="Settings">
      <div className="min-h-screen bg-slate-50" dir={currentLanguage === "ar" ? "rtl" : "ltr"}>

        {/* ── Hero banner ── */}
        <div className="-mx-2 sm:-mx-4 bg-gradient-to-br from-[#090514] via-purple-950 to-indigo-950 px-6 sm:px-10 pt-8 pb-10 relative overflow-hidden">
          <div className="absolute -top-10 right-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-12 w-52 h-52 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-3xl mx-auto relative">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              {/* Left: title */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-400/80 text-xs font-bold tracking-widest uppercase">
                    {isClinicalUser ? t("Clinical Account") : t("My Account")}
                  </span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">{t("Settings")}</h1>
                <p className="text-purple-300/70 text-base max-w-md leading-relaxed">
                  {t("Manage your account, security, and preferences")}
                </p>
              </div>

              {/* Right: quick stats */}
              <div className="flex items-center gap-6 shrink-0 flex-wrap">
                {[
                  { value: t(roleLabel), label: t("Role") },
                  { value: t("Active"), label: t("Status") },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="text-lg font-bold text-white leading-tight">{s.value}</div>
                    <div className="text-xs text-purple-400/80 font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Status strip */}
            <div className="mt-6 bg-white/5 rounded-xl border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs font-bold text-purple-200 uppercase tracking-widest">{t("Account Status")}</span>
                </div>
                <span className="text-xs text-purple-400">{t("Active & Secure")}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-purple-400 rounded-full" style={{ width: "100%" }} />
              </div>
              <p className="text-[11px] text-purple-400/60 mt-1.5">
                {t("Your account is active and in good standing — keep your security settings up to date.")}
              </p>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="max-w-3xl mx-auto pt-6 pb-10 space-y-5">

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} dir={currentLanguage === "ar" ? "rtl" : "ltr"}>

            {/* Tab nav — pill style matching other pages */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5">
              <TabsList className="w-full h-auto bg-transparent p-0 gap-1 grid grid-cols-3 sm:flex">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={cn(
                      "sm:flex-1 min-w-0 rounded-xl py-2.5 text-xs sm:text-sm font-semibold transition-all gap-1 sm:gap-2",
                      "data-[state=active]:bg-[#090514] data-[state=active]:text-white data-[state=active]:shadow-sm",
                      "data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-50"
                    )}
                  >
                    <span className="hidden sm:inline-flex">{tab.icon}</span>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* ── PROFILE ── */}
            <TabsContent value="profile" className="mt-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

                {/* User card header */}
                <div
                  className="relative px-6 py-5 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #090514 0%, #1a0838 50%, #0c071a 100%)" }}
                >
                  <div className="absolute -right-8 -top-8 w-28 h-28 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
                  <div className="relative flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl text-white shrink-0 backdrop-blur-sm">
                      {getInitials(user?.name || "")}
                    </div>
                    <div>
                      <p className="text-base font-bold text-white leading-tight">{user?.name || "User"}</p>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5",
                        isClinicalUser ? "bg-purple-400/20 text-purple-200" : "bg-white/10 text-purple-300"
                      )}>
                        <BadgeCheck className="h-3 w-3" />
                        {roleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form body */}
                <div className="px-6 py-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{t("Profile Information")}</p>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={profileForm.control} name="name" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelCls}>{t("Full Name")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Your full name")} className={inputCls} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={profileForm.control} name="username" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelCls}>{t("Username")}</FormLabel>
                            <FormControl>
                              <Input placeholder={t("Your username")} className={inputCls} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={profileForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>{t("Email Address")}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t("Your email address")} className={inputCls} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="pt-1 flex justify-end">
                        <Button type="submit" className="rounded-xl bg-[#090514] hover:bg-purple-950 text-white border-0 shadow-md h-10 px-6">
                          {t("Save Changes")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>

            {/* ── PASSWORD ── */}
            <TabsContent value="password" className="mt-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={<Lock className="h-5 w-5" />}
                  title={t("Change Password")}
                  subtitle={t("Keep your account secure with a strong password")}
                />
                <div className="px-6 py-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                      <FormField control={passwordForm.control} name="currentPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelCls}>{t("Current Password")}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t("Enter your current password")} className={inputCls} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={passwordForm.control} name="newPassword" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelCls}>{t("New Password")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("New password")} className={inputCls} {...field} />
                            </FormControl>
                            <FormDescription className="text-xs text-slate-400">{t("Minimum 6 characters")}</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={passwordForm.control} name="confirmPassword" render={({ field }) => (
                          <FormItem>
                            <FormLabel className={labelCls}>{t("Confirm Password")}</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder={t("Confirm new password")} className={inputCls} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <div className="pt-1 flex justify-end">
                        <Button type="submit" className="rounded-xl bg-[#090514] hover:bg-purple-950 text-white border-0 shadow-md h-10 px-6">
                          {t("Update Password")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>

            {/* ── NOTIFICATIONS ── */}
            <TabsContent value="notifications" className="mt-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={<Bell className="h-5 w-5" />}
                  title={t("Notification Preferences")}
                  subtitle={t("Control how and when you receive notifications")}
                />
                <div className="px-6 py-6">
                  <Form {...notificationForm}>
                    <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-3">
                      {([
                        { name: "emailNotifications" as const, label: t("Email Notifications"), desc: t("Receive notifications via email") },
                        { name: "reminderEmails" as const, label: t("Reminder Emails"), desc: t("Reminders to log emotions and complete exercises") },
                        { name: "weeklyDigest" as const, label: t("Weekly Digest"), desc: t("A weekly summary of your progress") },
                      ]).map(({ name, label, desc }) => (
                        <FormField key={name} control={notificationForm.control} name={name} render={({ field }) => (
                          <FormItem className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-purple-100 transition-colors">
                            <div>
                              <FormLabel className="text-sm font-semibold text-slate-700 cursor-pointer">{label}</FormLabel>
                              <FormDescription className="text-xs text-slate-400 mt-0.5">{desc}</FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value as boolean}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-purple-600 shrink-0"
                              />
                            </FormControl>
                          </FormItem>
                        )} />
                      ))}

                      <div className="pt-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t("Reminder Frequency")}</p>
                        <FormField control={notificationForm.control} name="reminderFrequency" render={({ field }) => (
                          <FormItem>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/60 text-slate-700 focus:ring-1 focus:ring-purple-400/30 focus:border-purple-400">
                                  <SelectValue placeholder={t("Select frequency")} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">{t("Daily")}</SelectItem>
                                <SelectItem value="every-other-day">{t("Every Other Day")}</SelectItem>
                                <SelectItem value="twice-weekly">{t("Twice Weekly")}</SelectItem>
                                <SelectItem value="weekly">{t("Weekly")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-slate-400">
                              {t("How often you'll receive reminder emails")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>

                      <div className="pt-1 flex justify-end">
                        <Button type="submit" className="rounded-xl bg-[#090514] hover:bg-purple-950 text-white border-0 shadow-md h-10 px-6">
                          {t("Save Preferences")}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </TabsContent>

            {/* ── APPEARANCE ── */}
            <TabsContent value="appearance" className="mt-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={<Globe className="h-5 w-5" />}
                  title={t("Appearance")}
                  subtitle={t("Customize language and display settings")}
                />
                <div className="px-6 py-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">{t("Language")}</p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/60 gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{t("Application Language")}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t("Select your preferred display language")}</p>
                    </div>
                    <Select value={language} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl border-slate-200 bg-white text-slate-700 focus:ring-1 focus:ring-purple-400/30 focus:border-purple-400">
                        <Globe className="h-4 w-4 mr-2 text-purple-400" />
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic (العربية)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── ACCOUNT ── */}
            <TabsContent value="account" className="mt-0 space-y-4">

              {/* Account info */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={<Shield className="h-5 w-5" />}
                  title={t("Account Information")}
                  subtitle={t("Details about your account and membership")}
                />
                <div className="px-6 py-5 space-y-2">
                  {[
                    { label: t("Account Type"), value: t(roleLabel) },
                    { label: t("Member Since"), value: t("January 15, 2023") },
                    { label: t("Account Status"), value: t("Active"), green: true },
                  ].map(({ label, value, green }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-slate-50/60 border border-slate-100">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className={cn("text-sm font-semibold", green ? "text-emerald-600" : "text-slate-700")}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign out */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <SectionHeader
                  icon={<LogOut className="h-5 w-5" />}
                  title={t("Session")}
                  subtitle={t("Manage your current login session")}
                />
                <div className="px-6 py-5">
                  <Button
                    variant="outline"
                    className="w-full justify-start h-11 rounded-xl border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-300 font-medium"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-3 text-slate-400" />
                    {t("Sign Out")}
                  </Button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3.5 px-6 py-5 border-b border-red-50">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 text-red-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-red-600 leading-tight">{t("Danger Zone")}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">{t("Irreversible actions — proceed with caution")}</p>
                  </div>
                </div>
                <div className="px-6 py-5">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium"
                      >
                        <ShieldAlert className="h-4 w-4 mr-3" />
                        {t("Delete Account")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl border-0 overflow-hidden p-0">
                      <div
                        className="relative px-7 py-5 overflow-hidden"
                        style={{ background: "linear-gradient(135deg, #090514 0%, #1a0838 50%, #0c071a 100%)" }}
                      >
                        <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-red-600/20 blur-3xl pointer-events-none" />
                        <div className="relative flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-400/30 flex items-center justify-center shrink-0">
                            <ShieldAlert className="h-4.5 w-4.5 text-red-300" />
                          </div>
                          <div>
                            <AlertDialogTitle className="text-white font-bold text-base leading-tight">
                              {t("Are you absolutely sure?")}
                            </AlertDialogTitle>
                          </div>
                        </div>
                      </div>
                      <div className="px-7 py-5 bg-white">
                        <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
                          {t("This action cannot be undone. This will permanently delete your account and remove all your data from our servers.")}
                        </AlertDialogDescription>
                      </div>
                      <AlertDialogFooter className="px-7 py-4 border-t border-slate-100 bg-white flex gap-2.5 justify-end">
                        <AlertDialogCancel className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 h-9 px-5">
                          {t("Cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          className="rounded-xl bg-red-600 hover:bg-red-700 text-white border-0 shadow-md h-9 px-5"
                        >
                          {t("Delete Account")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

            </TabsContent>

          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
