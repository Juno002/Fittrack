const fs = require('fs');
const p = './src/lib/exercises.ts';
let d = fs.readFileSync(p, 'utf8');

const mapping = {
  '3/4 Sit-Up': '/assets/Core/SVG CORE/limpios/3-4 Sit-Up.svg',
  'Bent-Knee Hip Raise': '/assets/Core/SVG CORE/limpios/Bent-Knee Hip Raise.svg',
  'Cross-Body Crunch': '/assets/Core/SVG CORE/limpios/Cross-Body Crunch.svg',
  'Crunches': '/assets/Core/SVG CORE/limpios/CRUNCH.svg',
  'Dead Bug': '/assets/Core/SVG CORE/limpios/Dead Bug.svg',
  'Flutter Kicks': '/assets/Core/SVG CORE/limpios/Flutter Kicks.svg',
  'Front Leg Raises': '/assets/Core/SVG CORE/limpios/Front Leg Raises.svg',
  'Plank': '/assets/Core/SVG CORE/limpios/PLANK.svg',
  'Bodyweight Squat': '/assets/Tren Inferior/SVG TREN INFERIOR/limpios/Bodyweight Squat.svg',
  'Butt Lift (Bridge)': '/assets/Tren Inferior/SVG TREN INFERIOR/limpios/Butt Lift (Bridge).svg',
  'Crossover Reverse Lunge': '/assets/Tren Inferior/SVG TREN INFERIOR/limpios/Crossover Reverse Lunge.svg',
  'Bodyweight Walking Lunge': '/assets/Tren Inferior/SVG TREN INFERIOR/Bodyweight Walking Lunge.svg',
  'Chair Squat': '/assets/Tren Inferior/SVG TREN INFERIOR/Chair Squat.svg',
  'Single Leg Glute Bridge': '/assets/Tren Inferior/SVG TREN INFERIOR/Single Leg Glute Bridge.svg'
};

for (const [name, url] of Object.entries(mapping)) {
  const regex = new RegExp(`(name:\\s*['"]${name}['"][^}]*?)((?:\\/\\/\\s*)?illustrationUrl:\\s*['"][^'"]*['"])?`, 'g');
  d = d.replace(regex, (match, p1) => {
    return `${p1}illustrationUrl: '${url}'`;
  });
}

fs.writeFileSync(p, d);
console.log('Fixed TS URLs');
