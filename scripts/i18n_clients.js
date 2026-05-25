const fs = require('fs');
const path = require('path');

const clientsPath = path.join(__dirname, '../client/src/features/dashboard/pages/Clients.tsx');
let content = fs.readFileSync(clientsPath, 'utf-8');

if (!content.includes('import { useLocalization }')) {
  content = content.replace(
    'import { useLocation } from "wouter";',
    'import { useLocation } from "wouter";\nimport { useLocalization } from "@/lib/localize";'
  );
}

if (!content.includes('const { t } = useLocalization();')) {
  content = content.replace(
    'export default function Clients() {',
    'export default function Clients() {\n  const { t } = useLocalization();'
  );
}

const replacements = [
  { search: /title="Clients"/g, replace: 'title={t("Client Directory")}' },
  { search: /<p className="text-slate-500 text-sm font-medium">Syncing practice data…<\/p>/g, replace: '<p className="text-slate-500 text-sm font-medium">{t("Syncing practice data…")}</p>' },
  { search: /<span className="text-purple-900 text-sm font-bold tracking-widest uppercase">Clinical Workspace<\/span>/g, replace: '<span className="text-purple-900 text-sm font-bold tracking-widest uppercase">{t("Clinical Workspace")}</span>' },
  { search: />\s*Client Directory\s*<\/h1>/g, replace: '>\n                  {t("Client Directory")}\n                </h1>' },
  { search: />\s*Access individual client records, launch clinical modules, and manage your practice connections.\s*<\/p>/g, replace: '>\n                  {t("Access individual client records, launch clinical modules, and manage your practice connections.")}\n                </p>' },
  { search: /label: "Clients"/g, replace: 'label: t("Clients")' },
  { search: /label: "Active"/g, replace: 'label: t("Active")' },
  { search: /label: "Pending"/g, replace: 'label: t("Pending")' },
  { search: /<Plus className="h-4 w-4 mr-2" \/> Invite Client/g, replace: '<Plus className="h-4 w-4 mr-2" /> {t("Invite Client")}' },
  { search: /<UserPlus className="h-5 w-5 text-\[#090514\]" \/> Invite a Client/g, replace: '<UserPlus className="h-5 w-5 text-[#090514]" /> {t("Invite a Client")}' },
  { search: />\s*Send a secure invitation to connect a client's account to your practice.\s*<\/DialogDescription>/g, replace: '>\n                        {t("Send a secure invitation to connect a client\'s account to your practice.")}\n                      </DialogDescription>' },
  { search: /<FormLabel className="text-slate-700">Full Name<\/FormLabel>/g, replace: '<FormLabel className="text-slate-700">{t("Full Name")}</FormLabel>' },
  { search: /placeholder="Jane Doe"/g, replace: 'placeholder={t("Jane Doe")}' },
  { search: /<FormLabel className="text-slate-700">Email Address<\/FormLabel>/g, replace: '<FormLabel className="text-slate-700">{t("Email Address")}</FormLabel>' },
  { search: /placeholder="client@example.com"/g, replace: 'placeholder={t("client@example.com")}' },
  { search: />\s*Cancel\s*<\/Button>/g, replace: '>\n                            {t("Cancel")}\n                          </Button>' },
  { search: /<span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" \/> Sending…<\/span>/g, replace: '<span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> {t("Sending…")}</span>' },
  { search: /<span className="flex items-center gap-2"><Send className="h-4 w-4" \/> Send Invitation<\/span>/g, replace: '<span className="flex items-center gap-2"><Send className="h-4 w-4" /> {t("Send Invitation")}</span>' },
  { search: /label="Client Directory"/g, replace: 'label={t("Client Directory")}' },
  { search: /label="Pending Connections"/g, replace: 'label={t("Pending Connections")}' },
  { search: /placeholder="Search clients…"/g, replace: 'placeholder={t("Search clients…")}' },
  { search: /<p className="text-xs text-slate-500 font-medium mb-1">Registered<\/p>/g, replace: '<p className="text-xs text-slate-500 font-medium mb-1">{t("Registered")}</p>' },
  { search: /<p className="text-xs text-slate-500 font-medium mb-1">Active Rate<\/p>/g, replace: '<p className="text-xs text-slate-500 font-medium mb-1">{t("Active Rate")}</p>' },
  { search: /<span>Select a client to open their workspace.<\/span>/g, replace: '<span>{t("Select a client to open their workspace.")}</span>' },
  { search: /<p className="text-sm font-medium text-slate-600">No clients found<\/p>/g, replace: '<p className="text-sm font-medium text-slate-600">{t("No clients found")}</p>' },
  { search: /<p className="text-xs text-slate-400 mt-1">Try a different search or send an invite.<\/p>/g, replace: '<p className="text-xs text-slate-400 mt-1">{t("Try a different search or send an invite.")}</p>' },
  { search: /<ArrowLeft className="h-4 w-4" \/> Back to list/g, replace: '<ArrowLeft className="h-4 w-4" /> {t("Back to list")}' },
  { search: /Since \{new Date\(selectedClient.createdAt\)/g, replace: '{t("Since ")} {new Date(selectedClient.createdAt)' },
  { search: /ID #\{selectedClient.id\}/g, replace: '{t("ID #")}{selectedClient.id}' },
  { search: /title="Message"/g, replace: 'title={t("Message")}' },
  { search: /title="Remove client"/g, replace: 'title={t("Remove client")}' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Modules<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Clinical Modules")}</span>' },
  { search: /<span className="text-\[10px\] text-slate-400 font-medium uppercase tracking-wide">Select to launch<\/span>/g, replace: '<span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{t("Select to launch")}</span>' },
  { search: /title="Thought Records"/g, replace: 'title={t("Thought Records")}' },
  { search: /description="Cognitive distortions & reframing"/g, replace: 'description={t("Cognitive distortions & reframing")}' },
  { search: /title="Journal Entries"/g, replace: 'title={t("Journal Entries")}' },
  { search: /description="Self-reflections & session notes"/g, replace: 'description={t("Self-reflections & session notes")}' },
  { search: /title="Mood & Triggers"/g, replace: 'title={t("Mood & Triggers")}' },
  { search: /description="Mood fluctuations & trigger events"/g, replace: 'description={t("Mood fluctuations & trigger events")}' },
  { search: /title="Goals & Objectives"/g, replace: 'title={t("Goals & Objectives")}' },
  { search: /description="SMART objectives & milestones"/g, replace: 'description={t("SMART objectives & milestones")}' },
  { search: /<User className="h-4 w-4" \/> View Profile/g, replace: '<User className="h-4 w-4" /> {t("View Profile")}' },
  { search: />\s*Open Analytics <ExternalLink className="h-4 w-4" \/>\s*<\/Button>/g, replace: '>\n                          {t("Open Analytics ")} <ExternalLink className="h-4 w-4" />\n                        </Button>' },
  { search: /<h3 className="text-lg font-bold text-slate-800 mb-2">Clinical Workspace<\/h3>/g, replace: '<h3 className="text-lg font-bold text-slate-800 mb-2">{t("Clinical Workspace")}</h3>' },
  { search: />\s*Select a client from the directory on the left to open their workspace and launch clinical modules.\s*<\/p>/g, replace: '>\n                      {t("Select a client from the directory on the left to open their workspace and launch clinical modules.")}\n                    </p>' },
  { search: /title: "Load Client File"/g, replace: 'title: t("Load Client File")' },
  { search: /desc: "Select a profile to access their records and metadata."/g, replace: 'desc: t("Select a profile to access their records and metadata.")' },
  { search: /title: "Launch Modules"/g, replace: 'title: t("Launch Modules")' },
  { search: /desc: "Analyze cognitive records, journals, or progress reports."/g, replace: 'desc: t("Analyze cognitive records, journals, or progress reports.")' },
  { search: /<Clock className="h-5 w-5 text-purple-900" \/> Pending Connections/g, replace: '<Clock className="h-5 w-5 text-purple-900" /> {t("Pending Connections")}' },
  { search: /<p className="text-sm text-slate-500">Invitations dispatched to clients awaiting registration.<\/p>/g, replace: '<p className="text-sm text-slate-500">{t("Invitations dispatched to clients awaiting registration.")}</p>' },
  { search: /<UserPlus className="h-4 w-4 mr-2" \/> Send Invite/g, replace: '<UserPlus className="h-4 w-4 mr-2" /> {t("Send Invite")}' },
  { search: /<TableHead className="font-semibold text-slate-500 pl-6 h-11 text-xs uppercase tracking-widest">Recipient<\/TableHead>/g, replace: '<TableHead className="font-semibold text-slate-500 pl-6 h-11 text-xs uppercase tracking-widest">{t("Recipient")}</TableHead>' },
  { search: /<TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">Email<\/TableHead>/g, replace: '<TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">{t("Email")}</TableHead>' },
  { search: /<TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">Sent On<\/TableHead>/g, replace: '<TableHead className="font-semibold text-slate-500 h-11 text-xs uppercase tracking-widest">{t("Sent On")}</TableHead>' },
  { search: /<TableHead className="font-semibold text-slate-500 h-11 text-xs text-right pr-6 uppercase tracking-widest">Action<\/TableHead>/g, replace: '<TableHead className="font-semibold text-slate-500 h-11 text-xs text-right pr-6 uppercase tracking-widest">{t("Action")}</TableHead>' },
  { search: /\{invitation.name \|\| "Anonymous"\}/g, replace: '{invitation.name || t("Anonymous")}' },
  { search: />\s*Resend\s*<\/Button>/g, replace: '>\n                              {t("Resend")}\n                            </Button>' },
  { search: /<h3 className="text-lg font-semibold text-slate-700 mb-2">No pending invitations<\/h3>/g, replace: '<h3 className="text-lg font-semibold text-slate-700 mb-2">{t("No pending invitations")}</h3>' },
  { search: />\s*All connection requests have been completed. Invite new clients to expand your practice.\s*<\/p>/g, replace: '>\n                    {t("All connection requests have been completed. Invite new clients to expand your practice.")}\n                  </p>' },
  { search: /<UserPlus className="h-4 w-4 mr-2" \/> Send Secure Invite/g, replace: '<UserPlus className="h-4 w-4 mr-2" /> {t("Send Secure Invite")}' },
  
  // Toast and mutation replacements
  { search: /toast\(\{ title: "Invitation sent!", description: "The client invitation has been sent successfully." \}\);/g, replace: 'toast({ title: t("Invitation sent!"), description: t("The client invitation has been sent successfully.") });' },
  { search: /toast\(\{ title: "Error", description: error.message \|\| "Failed to send invitation.", variant: "destructive" \}\);/g, replace: 'toast({ title: t("Error"), description: error.message || t("Failed to send invitation."), variant: "destructive" });' },
  { search: /toast\(\{ title: "Feature Coming Soon", description: "Direct messaging will be available in a future update." \}\)/g, replace: 'toast({ title: t("Feature Coming Soon"), description: t("Direct messaging will be available in a future update.") })' },
  { search: /toast\(\{ title: "Client Removed", description: "The client has been successfully removed from your practice." \}\);/g, replace: 'toast({ title: t("Client Removed"), description: t("The client has been successfully removed from your practice.") });' },
  { search: /toast\(\{ title: "Error", description: error.message \|\| "Failed to remove client", variant: "destructive" \}\);/g, replace: 'toast({ title: t("Error"), description: error.message || t("Failed to remove client"), variant: "destructive" });' },
  { search: /if \(confirm\(`Are you sure you want to remove \$\{client.name \|\| client.username\} from your practice\? This action cannot be undone.`\)\) \{/g, replace: 'if (confirm(t("Are you sure you want to remove {name} from your practice? This action cannot be undone.").replace("{name}", client.name || client.username))) {' },
  { search: /toast\(\{ title: "Invitation Resent!", description: "The invitation has been sent again successfully." \}\);/g, replace: 'toast({ title: t("Invitation Resent!"), description: t("The invitation has been sent again successfully.") });' },
  { search: /toast\(\{ title: "Invitation Removed", description: "This invitation was already processed or removed." \}\);/g, replace: 'toast({ title: t("Invitation Removed"), description: t("This invitation was already processed or removed.") });' },
  { search: /toast\(\{ title: "Error", description: error.message \|\| "Failed to resend invitation.", variant: "destructive" \}\);/g, replace: 'toast({ title: t("Error"), description: error.message || t("Failed to resend invitation."), variant: "destructive" });' },
  { search: /\{selectedClient.status\}/g, replace: '{t(selectedClient.status)}' }
];

replacements.forEach(rep => {
  content = content.replace(rep.search, rep.replace);
});

fs.writeFileSync(clientsPath, content);

// Add missing translations to localize.tsx
const localizePath = path.join(__dirname, '../client/src/lib/localize.tsx');
let localizeContent = fs.readFileSync(localizePath, 'utf-8');

const missingTranslations = {
  "Client Directory": "دليل العملاء",
  "Syncing practice data…": "جاري مزامنة بيانات العيادة...",
  "Clinical Workspace": "مساحة العمل السريرية",
  "Access individual client records, launch clinical modules, and manage your practice connections.": "الوصول إلى سجلات العملاء الفردية، تشغيل الوحدات السريرية، وإدارة اتصالات عيادتك.",
  "Clients": "العملاء",
  "Active": "نشط",
  "Pending": "قيد الانتظار",
  "Invite Client": "دعوة عميل",
  "Invite a Client": "دعوة عميل",
  "Send a secure invitation to connect a client's account to your practice.": "أرسل دعوة آمنة لربط حساب العميل بعيادتك.",
  "Full Name": "الاسم الكامل",
  "Jane Doe": "فلان الفلاني",
  "Email Address": "عنوان البريد الإلكتروني",
  "client@example.com": "client@example.com",
  "Sending…": "جاري الإرسال...",
  "Send Invitation": "إرسال دعوة",
  "Pending Connections": "الاتصالات المعلقة",
  "Search clients…": "البحث عن العملاء...",
  "Registered": "مسجل",
  "Active Rate": "معدل النشاط",
  "Select a client to open their workspace.": "حدد عميلاً لفتح مساحة العمل الخاصة به.",
  "No clients found": "لم يتم العثور على عملاء",
  "Try a different search or send an invite.": "جرب بحثًا مختلفًا أو أرسل دعوة.",
  "Back to list": "العودة للقائمة",
  "Since ": "منذ ",
  "ID #": "رقم #",
  "Message": "رسالة",
  "Remove client": "إزالة العميل",
  "Clinical Modules": "الوحدات السريرية",
  "Select to launch": "اختر للتشغيل",
  "Self-reflections & session notes": "تأملات ذاتية وملاحظات الجلسة",
  "Mood fluctuations & trigger events": "تقلبات المزاج وأحداث الإثارة",
  "SMART objectives & milestones": "أهداف ذكية ومعالم",
  "View Profile": "عرض الملف الشخصي",
  "Open Analytics ": "فتح التحليلات ",
  "Select a client from the directory on the left to open their workspace and launch clinical modules.": "حدد عميلاً من الدليل على اليسار لفتح مساحة العمل الخاصة به وتشغيل الوحدات السريرية.",
  "Load Client File": "تحميل ملف العميل",
  "Select a profile to access their records and metadata.": "حدد ملفًا شخصيًا للوصول إلى سجلاته والبيانات الوصفية.",
  "Launch Modules": "تشغيل الوحدات",
  "Analyze cognitive records, journals, or progress reports.": "تحليل السجلات المعرفية، المذكرات، أو تقارير التقدم.",
  "Invitations dispatched to clients awaiting registration.": "الدعوات المرسلة إلى العملاء بانتظار التسجيل.",
  "Send Invite": "إرسال دعوة",
  "Recipient": "المستلم",
  "Email": "البريد الإلكتروني",
  "Sent On": "أرسلت في",
  "Action": "إجراء",
  "Anonymous": "مجهول",
  "Resend": "إعادة إرسال",
  "No pending invitations": "لا توجد دعوات معلقة",
  "All connection requests have been completed. Invite new clients to expand your practice.": "اكتملت جميع طلبات الاتصال. ادعُ عملاء جدد لتوسيع عيادتك.",
  "Send Secure Invite": "إرسال دعوة آمنة",
  "Invitation sent!": "تم إرسال الدعوة!",
  "The client invitation has been sent successfully.": "تم إرسال دعوة العميل بنجاح.",
  "Failed to send invitation.": "فشل إرسال الدعوة.",
  "Feature Coming Soon": "ميزة قادمة قريبًا",
  "Direct messaging will be available in a future update.": "ستكون المراسلة المباشرة متاحة في تحديث مستقبلي.",
  "Client Removed": "تم إزالة العميل",
  "The client has been successfully removed from your practice.": "تم إزالة العميل بنجاح من عيادتك.",
  "Failed to remove client": "فشل في إزالة العميل",
  "Are you sure you want to remove {name} from your practice? This action cannot be undone.": "هل أنت متأكد من أنك تريد إزالة {name} من عيادتك؟ هذا الإجراء لا يمكن التراجع عنه.",
  "Invitation Resent!": "تم إعادة إرسال الدعوة!",
  "The invitation has been sent again successfully.": "تم إرسال الدعوة مرة أخرى بنجاح.",
  "Invitation Removed": "تم إزالة الدعوة",
  "This invitation was already processed or removed.": "هذه الدعوة تمت معالجتها بالفعل أو إزالتها.",
  "Failed to resend invitation.": "فشل إعادة إرسال الدعوة.",
};

// Add to en object
for (const [key, value] of Object.entries(missingTranslations)) {
  if (!localizeContent.includes(`"${key}": "${key}"`)) {
    // Insert at the end of en object (before `ar: {`)
    localizeContent = localizeContent.replace(
      '    // Admin Sidebar',
      `    "${key}": "${key}",\n    // Admin Sidebar`
    );
  }
}

// Add to ar object
for (const [key, value] of Object.entries(missingTranslations)) {
  if (!localizeContent.includes(`"${key}": "${value}"`)) {
    localizeContent = localizeContent.replace(
      '    // Admin Sidebar (Arabic)',
      `    "${key}": "${value}",\n    // Admin Sidebar (Arabic)`
    );
  }
}

fs.writeFileSync(localizePath, localizeContent);
console.log("Updated Clients.tsx and localize.tsx");
