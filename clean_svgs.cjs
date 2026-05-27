const fs = require('fs');
const path = require('path');

const dir = './public/assets/Tren Inferior/SVG TREN INFERIOR/sucio';
const outDir = './public/assets/Tren Inferior/SVG TREN INFERIOR/limpios';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Analizar estadisticas antes de limpiar
  const regex = /<path[^>]*d="([^"]*)"[^>]*>/gi;
  let match;
  let paths = [];
  
  // Vamos a usar otro regex para extraer el tag completo
  const tagRegex = /<path[^>]+>/gi;
  let cleanedContent = content;
  let removedCount = 0;
  let keptCount = 0;
  
  cleanedContent = content.replace(/<path[^>]+>/gi, (tag) => {
    // Extraer el atributo d
    const dMatch = tag.match(/d="([^"]*)"/);
    if (!dMatch) return tag;
    const dLen = dMatch[1].length;
    
    // Extraer fill para log
    const fillMatch = tag.match(/fill="([^"]*)"/);
    const fill = fillMatch ? fillMatch[1] : 'none';
    
    // Regla de limpieza: 
    // Los autotrazadores suelen generar fondos oscuros gigantes (dLen enorme, pero fill de fondo)
    // y miles de manchitas enanas (dLen pequeño).
    // Si la mancha es muy pequeña (< 150 caracteres) o si es un rectángulo del tamaño de la pantalla, lo quitamos.
    // Asumiremos que el ruido son trazados con un d="M..." corto.
    if (dLen < 300) {
      removedCount++;
      return ''; // Borrar
    }
    
    // También borrar el fondo gigante si existe (suele tener colores como #040C1B)
    if (fill === '#040C1B' || fill === '#070A14') {
        removedCount++;
        return '';
    }
    
    keptCount++;
    return tag; // Mantener
  });
  
  fs.writeFileSync(path.join(outDir, file), cleanedContent);
  console.log(`[${file}] -> Removed ${removedCount} noise paths. Kept ${keptCount} main paths.`);
});
