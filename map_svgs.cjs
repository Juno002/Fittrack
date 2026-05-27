const fs = require('fs');
const path = require('path');

const parsedPath = './src/data/parsedExercises.json';
const exercises = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

const svgPaths = [
  './public/assets/Core/SVG CORE/limpios',
  './public/assets/Tren Inferior/SVG TREN INFERIOR/limpios',
  './public/assets/Tren Inferior/SVG TREN INFERIOR'
];

let updatedCount = 0;

svgPaths.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
  
  files.forEach(file => {
    // "3-4 Sit-Up.svg" -> "3-4 Sit-Up" -> might map to "3/4 Sit-Up" in JSON!
    let name = file.replace('.svg', '');
    if (name === '3-4 Sit-Up') name = '3/4 Sit-Up';
    if (name === 'CRUNCH') name = 'Crunches'; // Guessing mapping
    if (name === 'PLANK') name = 'Plank';
    if (name === 'SQUAT') name = 'Squat';
    
    const ex = exercises.find(e => e.name.toLowerCase() === name.toLowerCase());
    if (ex) {
      // Create the URL by removing ./public
      const url = path.join(dir, file).replace(/\\/g, '/').replace('./public', '');
      if (ex.illustrationUrl !== url) {
        ex.illustrationUrl = url;
        updatedCount++;
        console.log(`Mapped: ${ex.name} -> ${url}`);
      }
    }
  });
});

fs.writeFileSync(parsedPath, JSON.stringify(exercises, null, 2));
console.log(`Finished mapping SVGs to JSON. Updated ${updatedCount} exercises.`);
