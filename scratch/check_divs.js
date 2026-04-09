const fs = require('fs');
const content = fs.readFileSync('app/page.tsx', 'utf8');

let depth = 0;
let lines = content.split('\n');
lines.forEach((line, i) => {
  let openers = (line.match(/<div(?![^>]*\/>)[^>]*>/g) || []).length;
  let closers = (line.match(/<\/div>/g) || []).length;
  if (openers !== closers) {
    depth += (openers - closers);
    console.log(`Line ${i + 1}: depth ${depth} (openers: ${openers}, closers: ${closers}) - "${line.trim()}"`);
  }
});
