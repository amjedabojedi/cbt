const fs = require('fs');

const file = 'client/src/lib/localize.tsx';
let content = fs.readFileSync(file, 'utf8');

const newTranslations = {
  "cognitive_restructuring": "إعادة الهيكلة المعرفية",
  "This resource provides guided practice for cognitive restructuring": "يوفر هذا المورد ممارسة موجهة لإعادة الهيكلة المعرفية",
  "Guided practice for reframing automatic negative thoughts": "ممارسة موجهة لإعادة صياغة الأفكار السلبية التلقائية",
  "A detailed guide to understanding your emotions": "دليل مفصل لفهم عواطفك",
  "A clinical approach to changing thoughts": "نهج سريري لتغيير الأفكار",
  "Provides structured exercises for therapists to use with clients.": "يوفر تمارين منظمة للمعالجين لاستخدامها مع العملاء."
};

// Find the Arabic translation object inside localize.tsx
// It usually looks like `ar: { ... },`
// We'll append our keys right before the closing brace of `ar:`

const arStart = content.indexOf('ar: {');
if (arStart !== -1) {
  let depth = 1;
  let arEnd = -1;
  for (let i = arStart + 5; i < content.length; i++) {
    if (content[i] === '{') depth++;
    if (content[i] === '}') {
      depth--;
      if (depth === 0) {
        arEnd = i;
        break;
      }
    }
  }

  if (arEnd !== -1) {
    let toInsert = '';
    for (const [en, ar] of Object.entries(newTranslations)) {
      // make sure it doesn't already exist
      if (!content.includes(`"${en}"`)) {
        toInsert += `\n    "${en}": "${ar}",`;
      }
    }
    
    content = content.slice(0, arEnd) + toInsert + '\n  ' + content.slice(arEnd);
    fs.writeFileSync(file, content);
    console.log("Translations added successfully!");
  } else {
    console.log("Could not find the end of the Arabic translations object.");
  }
} else {
  console.log("Could not find the Arabic translations object.");
}
