const fs = require('fs');
const path = require('path');

// Update localize.tsx
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
  "You are viewing {name}'s data in read-only mode": "أنت تعرض بيانات {name} في وضع القراءة فقط"
};

// Split localizeContent by 'ar: {' to insert exactly in the Arabic section
let parts = localizeContent.split('  ar: {');
if (parts.length > 1) {
  let arSection = parts[1];
  for (const [key, value] of Object.entries(missingTranslations)) {
    if (!arSection.includes(`"${key}": "${value}"`)) {
      arSection = arSection.replace(
        '    // Admin Sidebar',
        `    "${key}": "${value}",\n    // Admin Sidebar`
      );
    }
  }
  localizeContent = parts[0] + '  ar: {' + arSection;
}

// Add to English if missing
for (const [key, value] of Object.entries(missingTranslations)) {
  if (!parts[0].includes(`"${key}": "${key}"`)) {
    parts[0] = parts[0].replace(
      '    // Admin Sidebar',
      `    "${key}": "${key}",\n    // Admin Sidebar`
    );
  }
}

fs.writeFileSync(localizePath, localizeContent);

// Update Header.tsx
const headerPath = path.join(__dirname, '../client/src/components/layout/Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf-8');
headerContent = headerContent.replace(
  "You are viewing {viewingClientName}'s data in read-only mode",
  '{t("You are viewing {name}\'s data in read-only mode").replace("{name}", viewingClientName)}'
);
fs.writeFileSync(headerPath, headerContent);

console.log("Updated localize.tsx and Header.tsx");
