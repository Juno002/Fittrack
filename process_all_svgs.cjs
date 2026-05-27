const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      processDir(fullPath);
    } else if (file.name.endsWith('.svg')) {
      cleanSvg(fullPath);
    }
  }
}

function cleanSvg(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  let removedCount = 0;
  let keptCount = 0;
  
  let cleanedContent = content.replace(/<path[^>]+>/gi, (tag) => {
    const dMatch = tag.match(/d="([^"]*)"/);
    if (!dMatch) return tag;
    const dLen = dMatch[1].length;
    
    const fillMatch = tag.match(/fill="([^"]*)"/i);
    const fill = fillMatch ? fillMatch[1].toUpperCase() : 'NONE';
    
    // Remove noise and huge dark backgrounds
    if (dLen < 300) {
      removedCount++;
      return ''; 
    }
    
    if (['#040C1B', '#070A14', '#00030B', '#010512', '#000000'].includes(fill)) {
        // Double check it's a huge background by checking path length
        if (dLen > 2000) {
            removedCount++;
            return '';
        }
    }
    
    keptCount++;
    return tag;
  });

  // Remove width and height to let CSS control it
  cleanedContent = cleanedContent.replace(/width="[^"]*"/gi, '');
  cleanedContent = cleanedContent.replace(/height="[^"]*"/gi, '');

  fs.writeFileSync(filePath, cleanedContent);
  console.log(`[${path.basename(filePath)}] Cleaned! Removed: ${removedCount}, Kept: ${keptCount}`);
}

processDir('./public/assets/Core');
processDir('./public/assets/Tren Inferior');
