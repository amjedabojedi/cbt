const fs = require('fs');
const path = require('path');

const localizePath = path.join(__dirname, '../client/src/lib/localize.tsx');
let content = fs.readFileSync(localizePath, 'utf-8');

// Function to deduplicate keys within an object literal in a string
function deduplicateSection(text) {
  const lines = text.split('\n');
  const seenKeys = new Set();
  const newLines = [];
  
  // We'll process from bottom to top so that we keep the LAST definition of a key
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const match = line.match(/^\s*"([^"]+)"\s*:/);
    if (match) {
      const key = match[1];
      if (seenKeys.has(key)) {
        // Skip duplicate
        continue;
      }
      seenKeys.add(key);
    }
    newLines.unshift(line);
  }
  return newLines.join('\n');
}

let parts = content.split('  ar: {');
if (parts.length > 1) {
  let enSection = parts[0];
  let arSection = parts[1];
  
  // We need to split the english section into imports and the en object
  const enParts = enSection.split('  en: {');
  if (enParts.length > 1) {
    enParts[1] = deduplicateSection(enParts[1]);
    enSection = enParts.join('  en: {');
  }
  
  // For AR section, we split by the end of the translations object
  const arParts = arSection.split('};\n');
  if (arParts.length > 1) {
    arParts[0] = deduplicateSection(arParts[0]);
    arSection = arParts.join('};\n');
  }
  
  content = enSection + '  ar: {' + arSection;
  fs.writeFileSync(localizePath, content);
  console.log("Deduplication complete.");
} else {
  console.log("Could not parse file structure.");
}
