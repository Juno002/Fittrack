const fs = require('fs');
const p = './src/data/parsedExercises.json';
let d = fs.readFileSync(p, 'utf8');
d = d.replace(/"public\/assets/g, '"/assets');
fs.writeFileSync(p, d);
console.log('Fixed URLs');
