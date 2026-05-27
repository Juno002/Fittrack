const fs = require('fs');
const path = require('path');

function cleanSvgFile(filePath, outPath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let removedCount = 0;
  let keptCount = 0;

  const cleanedContent = content.replace(/<path[^>]+>/gi, (tag) => {
    const dMatch = tag.match(/d="([^"]*)"/);
    if (!dMatch) return tag;
    const dLen = dMatch[1].length;
    
    const fillMatch = tag.match(/fill="([^"]*)"/);
    const fill = fillMatch ? fillMatch[1] : 'none';
    
    // Background colors to remove
    if (fill === '#040C1B' || fill === '#070A14' || fill === '#0B1320' || fill === '#080B11') {
        removedCount++;
        return '';
    }
    
    // Small noise paths
    if (dLen < 300) {
      removedCount++;
      return ''; 
    }
    
    keptCount++;
    return tag; 
  });

  fs.writeFileSync(outPath, cleanedContent);
  console.log(`[${path.basename(filePath)}] -> Removed ${removedCount} noise paths. Kept ${keptCount} main paths.`);
}

function processDirectory(inDir, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  
  const files = fs.readdirSync(inDir).filter(f => f.endsWith('.svg'));
  files.forEach(file => {
    cleanSvgFile(path.join(inDir, file), path.join(outDir, file));
  });
}

// Clean Core
processDirectory('./public/assets/Core/SVG CORE', './public/assets/Core/SVG CORE/limpios');

// Clean the specific new file in Tren Inferior
const squatIn = './public/assets/Tren Inferior/SVG TREN INFERIOR/SQUAT.svg';
const squatOut = './public/assets/Tren Inferior/SVG TREN INFERIOR/limpios/SQUAT.svg';
if (fs.existsSync(squatIn)) {
  cleanSvgFile(squatIn, squatOut);
}
