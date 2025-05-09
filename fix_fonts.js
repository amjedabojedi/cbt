import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the file
const filePath = path.join(__dirname, 'server', 'services', 'pdfExport.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all font calls
content = content.replace(/\.font\(['"]Helvetica-Italic['"]\)/g, '');
content = content.replace(/\.font\(['"]Helvetica-Bold['"]\)/g, '');
content = content.replace(/\.font\(['"]Helvetica-Oblique['"]\)/g, '');
content = content.replace(/\.font\(['"]Helvetica['"]\)/g, '');

// Write back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Font references removed from the pdfExport.ts file');