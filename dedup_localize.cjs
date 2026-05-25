const fs = require('fs');
const file = '/Users/aghashahhaider/Documents/Mi6/Projects/cbt/client/src/lib/localize.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

let inEn = false;
let inAr = false;
const enKeys = new Set();
const arKeys = new Set();

const newLines = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.trim() === 'en: {') {
    inEn = true;
    inAr = false;
    newLines.push(line);
    continue;
  }
  if (line.trim() === 'ar: {') {
    inAr = true;
    inEn = false;
    newLines.push(line);
    continue;
  }
  if (line.trim() === '},' && inEn) {
    inEn = false;
    newLines.push(line);
    continue;
  }
  if (line.trim() === '}' && inAr) {
    inAr = false;
    newLines.push(line);
    continue;
  }
  
  // Look for "Key": "Value" or "Key": "Value",
  const match = line.match(/^\s*"([^"]+)"\s*:/);
  if (match) {
    const key = match[1];
    if (inEn) {
      if (enKeys.has(key)) {
        console.log('Skipping duplicate en key:', key);
        continue;
      }
      enKeys.add(key);
    } else if (inAr) {
      if (arKeys.has(key)) {
        console.log('Skipping duplicate ar key:', key);
        continue;
      }
      arKeys.add(key);
    }
  }
  
  newLines.push(line);
}

fs.writeFileSync(file, newLines.join('\n'), 'utf8');
console.log('Done de-duplicating.');
