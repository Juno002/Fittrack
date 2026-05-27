const fs = require('fs');
const path = require('path');

const parsedPath = './src/data/parsedExercises.json';
const exercises = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

const svgPaths = [
  'public/assets/Core/SVG CORE/limpios/3-4 Sit-Up.svg',
  'public/assets/Core/SVG CORE/limpios/Bent-Knee Hip Raise.svg',
  'public/assets/Core/SVG CORE/limpios/Cross-Body Crunch.svg',
  'public/assets/Core/SVG CORE/limpios/CRUNCH.svg',
  'public/assets/Core/SVG CORE/limpios/Dead Bug.svg',
  'public/assets/Core/SVG CORE/limpios/Flutter Kicks.svg',
  'public/assets/Core/SVG CORE/limpios/Front Leg Raises.svg',
  'public/assets/Core/SVG CORE/limpios/PLANK.svg',
  'public/assets/Tren Inferior/SVG TREN INFERIOR/limpios/SQUAT.svg'
];

svgPaths.forEach(svgPath => {
  const filename = path.basename(svgPath, '.svg').toLowerCase();
  
  let ex = exercises.find(e => e.name.toLowerCase() === filename);
  if (!ex && filename === 'squat') ex = exercises.find(e => e.name === 'Squats' || e.name === 'Sentadillas' || e.id === 'squat' || e.id === 'squats');
  if (!ex && filename === 'plank') ex = exercises.find(e => e.name === 'Plank' || e.id === 'plank');
  if (!ex && filename === 'crunch') ex = exercises.find(e => e.name === 'Crunches' || e.id === 'crunch');
  if (!ex) ex = exercises.find(e => e.name.toLowerCase().replace(/[-]/g, ' ') === filename.replace(/[-]/g, ' '));
  if (!ex) ex = exercises.find(e => e.id.toLowerCase().replace(/[_]/g, ' ') === filename.replace(/[-]/g, ' '));
  
  if (ex) {
    const url = '/' + svgPath.replace('public/', '').replace(/\\/g, '/');
    ex.illustrationUrl = url;
    console.log(`Mapped ${ex.name} (${ex.id}) -> ${url}`);
  } else {
    console.log(`Could not map ${filename}`);
  }
});

fs.writeFileSync(parsedPath, JSON.stringify(exercises, null, 2));
