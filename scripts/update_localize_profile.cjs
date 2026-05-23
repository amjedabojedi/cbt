const fs = require('fs');
const path = require('path');

const profilePath = path.join(__dirname, '../client/src/features/dashboard/pages/ClientProfile.tsx');
let content = fs.readFileSync(profilePath, 'utf-8');

if (!content.includes('import { useLocalization }')) {
  content = content.replace(
    'import { useClientContext } from "@/context/ClientContext";',
    'import { useClientContext } from "@/context/ClientContext";\nimport { useLocalization } from "@/lib/localize";'
  );
}

if (!content.includes('const { t } = useLocalization();')) {
  content = content.replace(
    'export default function ClientProfile() {',
    'export default function ClientProfile() {\n  const { t } = useLocalization();'
  );
}

const replacements = [
  { search: /<p className="text-slate-500 text-sm font-medium">Loading client profile…<\/p>/g, replace: '<p className="text-slate-500 text-sm font-medium">{t("Loading client profile…")}</p>' },
  { search: /<h3 className="text-lg font-bold text-slate-700 mb-2">Client Not Found<\/h3>/g, replace: '<h3 className="text-lg font-bold text-slate-700 mb-2">{t("Client Not Found")}</h3>' },
  { search: />\s*This profile doesn't exist or you don't have permission to view it.\s*<\/p>/g, replace: '>\n              {t("This profile doesn\'t exist or you don\'t have permission to view it.")}\n            </p>' },
  { search: /<ArrowLeft className="h-4 w-4 mr-2" \/> Back to Clients/g, replace: '<ArrowLeft className="h-4 w-4 mr-2" /> {t("Back to Clients")}' },
  { search: /title=\{`\$\{client.name \|\| client.username\} — Profile`\}/g, replace: 'title={`${client.name || client.username} ${t("— Profile")}`}' },
  { search: />\s*Back to Clients\s*<\/button>/g, replace: '>\n              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />\n              {t("Back to Clients")}\n            </button>' },
  { search: /Since \{client.createdAt/g, replace: '{t("Since ")} {client.createdAt' },
  { search: /ID #\{client.id\}/g, replace: '{t("ID #")}{client.id}' },
  { search: /label: "Emotions"/g, replace: 'label: t("Emotions")' },
  { search: /label: "Thoughts"/g, replace: 'label: t("Thoughts")' },
  { search: /label: "Journals"/g, replace: 'label: t("Journals")' },
  { search: /label: "Goals"/g, replace: 'label: t("Goals")' },
  { search: /label="Overview"/g, replace: 'label={t("Overview")}' },
  { search: /label="Progress"/g, replace: 'label={t("Progress")}' },
  { search: /label="Recent Activity"/g, replace: 'label={t("Recent Activity")}' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Modules<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Clinical Modules")}</span>' },
  { search: /<span className="text-xs text-slate-400 ml-1">— click to open in client context<\/span>/g, replace: '<span className="text-xs text-slate-400 ml-1">{t("— click to open in client context")}</span>' },
  { search: /title="Mood & Triggers"/g, replace: 'title={t("Mood & Triggers")}' },
  { search: /description="Emotion fluctuations & trigger events"/g, replace: 'description={t("Emotion fluctuations & trigger events")}' },
  { search: /unit="records"/g, replace: 'unit={t("records")}' },
  { search: /title="Thought Records"/g, replace: 'title={t("Thought Records")}' },
  { search: /description="Cognitive distortions & reframing"/g, replace: 'description={t("Cognitive distortions & reframing")}' },
  { search: /title="Journal Entries"/g, replace: 'title={t("Journal Entries")}' },
  { search: /description="Self-reflections & session notes"/g, replace: 'description={t("Self-reflections & session notes")}' },
  { search: /unit="entries"/g, replace: 'unit={t("entries")}' },
  { search: /title="Goals & Objectives"/g, replace: 'title={t("Goals & Objectives")}' },
  { search: /description="SMART objectives & milestones"/g, replace: 'description={t("SMART objectives & milestones")}' },
  { search: /unit="goals"/g, replace: 'unit={t("goals")}' },
  { search: /<ArrowLeft className="h-4 w-4" \/> Back to Directory/g, replace: '<ArrowLeft className="h-4 w-4" /> {t("Back to Directory")}' },
  { search: />\s*Open Analytics <ExternalLink className="h-4 w-4" \/>\s*<\/Button>/g, replace: '>\n                  {t("Open Analytics ")} <ExternalLink className="h-4 w-4" />\n                </Button>' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Emotions<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Recent Emotions")}</span>' },
  { search: />\s*View all <ChevronRight className="h-3.5 w-3.5" \/>\s*<\/button>/g, replace: '>\n                      {t("View all ")} <ChevronRight className="h-3.5 w-3.5" />\n                    </button>' },
  { search: /title=\{e.coreEmotion \|\| "Emotion recorded"\}/g, replace: 'title={e.coreEmotion || t("Emotion recorded")}' },
  { search: /<p className="text-sm text-slate-400 py-4 text-center">No emotion records yet<\/p>/g, replace: '<p className="text-sm text-slate-400 py-4 text-center">{t("No emotion records yet")}</p>' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recent Journal<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Recent Journal")}</span>' },
  { search: /title=\{j.title \|\| "Journal entry"\}/g, replace: 'title={j.title || t("Journal entry")}' },
  { search: /<p className="text-sm text-slate-400 py-4 text-center">No journal entries yet<\/p>/g, replace: '<p className="text-sm text-slate-400 py-4 text-center">{t("No journal entries yet")}</p>' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Activity Summary<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Activity Summary")}</span>' },
  { search: /label="Emotion Records"/g, replace: 'label={t("Emotion Records")}' },
  { search: /label="Thought Records"/g, replace: 'label={t("Thought Records")}' },
  { search: /label="Journal Entries"/g, replace: 'label={t("Journal Entries")}' },
  { search: /label="Goals Set"/g, replace: 'label={t("Goals Set")}' },
  { search: /<p className="text-sm text-slate-500 font-medium mt-1">Total Activities<\/p>/g, replace: '<p className="text-sm text-slate-500 font-medium mt-1">{t("Total Activities")}</p>' },
  { search: /<p className="text-xs text-slate-400 mt-0.5">Across all modules<\/p>/g, replace: '<p className="text-xs text-slate-400 mt-0.5">{t("Across all modules")}</p>' },
  { search: /<p className="text-sm text-slate-500 font-medium mt-1">Goals Completed<\/p>/g, replace: '<p className="text-sm text-slate-500 font-medium mt-1">{t("Goals Completed")}</p>' },
  { search: /\`\$\{Math.round\(\(completedGoals \/ goals.length\) \* 100\)\}% success rate\`/g, replace: '`${Math.round((completedGoals / goals.length) * 100)}% ${t(" success rate")}`' },
  { search: /: "No goals yet"\}/g, replace: ': t("No goals yet")}' },
  { search: /<p className="text-sm text-slate-500 font-medium mt-1">Days as Client<\/p>/g, replace: '<p className="text-sm text-slate-500 font-medium mt-1">{t("Days as Client")}</p>' },
  { search: /<p className="text-xs text-slate-400 mt-0.5">Since registration<\/p>/g, replace: '<p className="text-xs text-slate-400 mt-0.5">{t("Since registration")}</p>' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Goals<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Goals")}</span>' },
  { search: />\s*Open module <ChevronRight className="h-3.5 w-3.5" \/>\s*<\/button>/g, replace: '>\n                      {t("Open module ")} <ChevronRight className="h-3.5 w-3.5" />\n                    </button>' },
  { search: /g.title \|\| g.goal \|\| "Goal"/g, replace: 'g.title || g.goal || t("Goal")' },
  { search: /<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Latest Entries<\/span>/g, replace: '<span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("Latest Entries")}</span>' },
  { search: /title: e.coreEmotion \|\| "Emotion"/g, replace: 'title: e.coreEmotion || t("Emotion")' },
  { search: /title: j.title \|\| "Journal entry"/g, replace: 'title: j.title || t("Journal entry")' },
  { search: /title: t.situation \|\| t.automaticThought \|\| "Thought record"/g, replace: 'title: t.situation || t.automaticThought || t("Thought record")' },
  { search: /title: g.title \|\| g.goal \|\| "Goal"/g, replace: 'title: g.title || g.goal || t("Goal")' },
  { search: /label: "Emotion"/g, replace: 'label: t("Emotion")' },
  { search: /label: "Journal"/g, replace: 'label: t("Journal")' },
  { search: /label: "Thought"/g, replace: 'label: t("Thought")' },
  { search: /label: "Goal"/g, replace: 'label: t("Goal")' },
  { search: /<p className="text-sm font-medium text-slate-500">No activity recorded yet<\/p>/g, replace: '<p className="text-sm font-medium text-slate-500">{t("No activity recorded yet")}</p>' }
];

replacements.forEach(rep => {
  content = content.replace(rep.search, rep.replace);
});

fs.writeFileSync(profilePath, content);

// Add missing translations to localize.tsx
const localizePath = path.join(__dirname, '../client/src/lib/localize.tsx');
let localizeContent = fs.readFileSync(localizePath, 'utf-8');

const missingTranslations = {
  "Loading client profile…": "جاري تحميل ملف العميل...",
  "Client Not Found": "العميل غير موجود",
  "This profile doesn't exist or you don't have permission to view it.": "هذا الملف الشخصي غير موجود أو ليس لديك إذن لعرضه.",
  "Back to Clients": "العودة للعملاء",
  "— Profile": "— الملف الشخصي",
  "Since ": "منذ ",
  "ID #": "رقم #",
  "Emotions": "المشاعر",
  "Thoughts": "الأفكار",
  "Journals": "المذكرات",
  "Goals": "الأهداف",
  "Overview": "نظرة عامة",
  "Progress": "التقدم",
  "Recent Activity": "النشاط الأخير",
  "Clinical Modules": "الوحدات السريرية",
  "— click to open in client context": "— انقر للفتح في سياق العميل",
  "Mood & Triggers": "المزاج والمحفزات",
  "Emotion fluctuations & trigger events": "تقلبات المشاعر وأحداث الإثارة",
  "records": "سجلات",
  "Thought Records": "سجلات الأفكار",
  "Cognitive distortions & reframing": "التشوهات المعرفية وإعادة الصياغة",
  "Journal Entries": "إدخالات المذكرات",
  "Self-reflections & session notes": "تأملات ذاتية وملاحظات الجلسة",
  "entries": "إدخالات",
  "Goals & Objectives": "الأهداف والغايات",
  "SMART objectives & milestones": "أهداف ذكية ومعالم",
  "goals": "أهداف",
  "Back to Directory": "العودة للدليل",
  "Open Analytics ": "فتح التحليلات ",
  "Recent Emotions": "المشاعر الأخيرة",
  "View all ": "عرض الكل ",
  "Emotion recorded": "تم تسجيل الشعور",
  "No emotion records yet": "لا توجد سجلات مشاعر بعد",
  "Recent Journal": "المذكرات الأخيرة",
  "Journal entry": "إدخال المذكرات",
  "No journal entries yet": "لا توجد إدخالات مذكرات بعد",
  "Activity Summary": "ملخص النشاط",
  "Emotion Records": "سجلات المشاعر",
  "Goals Set": "الأهداف المحددة",
  "Total Activities": "إجمالي الأنشطة",
  "Across all modules": "عبر جميع الوحدات",
  "Goals Completed": "الأهداف المكتملة",
  " success rate": " معدل النجاح",
  "No goals yet": "لا توجد أهداف بعد",
  "Days as Client": "أيام كعميل",
  "Since registration": "منذ التسجيل",
  "Open module ": "فتح الوحدة ",
  "Goal": "هدف",
  "Latest Entries": "أحدث الإدخالات",
  "No activity recorded yet": "لم يتم تسجيل أي نشاط بعد",
  "Emotion": "شعور",
  "Journal": "مذكرة",
  "Thought": "فكرة",
  "Thought record": "سجل فكرة"
};

// Split localizeContent by 'ar: {' to insert exactly in the Arabic section
let parts = localizeContent.split('  ar: {');
if (parts.length > 1) {
  let arSection = parts[1];
  for (const [key, value] of Object.entries(missingTranslations)) {
    if (!arSection.includes(`"${key}": `)) {
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
  if (!parts[0].includes(`"${key}": `)) {
    parts[0] = parts[0].replace(
      '    // Admin Sidebar',
      `    "${key}": "${key}",\n    // Admin Sidebar`
    );
  }
}

fs.writeFileSync(localizePath, localizeContent);

// deduplicate again
const dedupScriptPath = path.join(__dirname, 'dedup.cjs');
require('child_process').execSync(`node ${dedupScriptPath}`);

console.log("Updated ClientProfile.tsx and localize.tsx");
EOF
