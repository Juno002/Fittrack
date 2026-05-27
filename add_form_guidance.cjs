const fs = require('fs');

const premiumCues = {
  "3/4 Sit-Up": [
    "Acuéstate boca arriba con las rodillas flexionadas.",
    "Cruza los brazos sobre el pecho.",
    "Contrae el abdomen y levanta el torso hasta tres cuartos del recorrido.",
    "Baja lentamente manteniendo la tensión."
  ],
  "Bent-Knee Hip Raise": [
    "Acuéstate boca arriba con las manos a los lados.",
    "Dobla las rodillas y levanta las piernas.",
    "Contrae el abdomen para elevar la pelvis del suelo.",
    "Baja la pelvis de forma controlada."
  ],
  "Bodyweight Squat": [
    "Pies separados al ancho de los hombros.",
    "Mantén la espalda recta y el pecho arriba.",
    "Baja la cadera como si fueras a sentarte en una silla.",
    "Empuja con los talones para volver a la posición inicial."
  ],
  "Bodyweight Walking Lunge": [
    "Da un paso largo hacia adelante con una pierna.",
    "Baja la cadera hasta que ambas rodillas formen un ángulo de 90 grados.",
    "Impúlsate hacia adelante con la pierna trasera para dar el siguiente paso.",
    "Mantén el torso erguido en todo momento."
  ],
  "Butt Lift (Bridge)": [
    "Acuéstate boca arriba con las rodillas dobladas y pies apoyados.",
    "Empuja con los talones y levanta la cadera.",
    "Aprieta los glúteos en la posición más alta.",
    "Baja la cadera lentamente sin descansar por completo."
  ],
  "Chair Squat": [
    "Colócate de pie frente a una silla.",
    "Baja lentamente la cadera hacia atrás hasta rozar la silla.",
    "Mantén el peso en los talones y el pecho elevado.",
    "Levántate impulsando con las piernas antes de sentarte por completo."
  ],
  "Clock Push-Up": [
    "En posición de plancha alta.",
    "Haz una flexión tradicional.",
    "Al subir, mueve las manos y pies un paso hacia la derecha (como las agujas del reloj).",
    "Realiza otra flexión y repite rotando en círculo."
  ],
  "Close-Grip Push-Up off of a Dumbbell": [
    "Coloca las manos sobre una mancuerna en el suelo.",
    "Mantén el cuerpo recto desde la cabeza hasta los pies.",
    "Baja el pecho hasta tocar las manos.",
    "Empuja con los tríceps para volver a subir."
  ],
  "Cross-Body Crunch": [
    "Acuéstate boca arriba con las rodillas flexionadas.",
    "Coloca las manos detrás de la nuca.",
    "Levanta el torso y gira llevando el codo hacia la rodilla opuesta.",
    "Regresa al centro y repite hacia el otro lado."
  ],
  "Crossover Reverse Lunge": [
    "Párate con los pies juntos.",
    "Da un paso hacia atrás y cruza la pierna detrás de la otra.",
    "Baja la rodilla trasera hacia el suelo (reverencia).",
    "Empuja para volver a la posición inicial."
  ],
  "Crunches": [
    "Acuéstate con las rodillas dobladas y pies en el suelo.",
    "Manos detrás de la cabeza sin tirar del cuello.",
    "Contrae el abdomen para elevar solo los omóplatos del suelo.",
    "Baja con control manteniendo la tensión."
  ],
  "Dead Bug": [
    "Acuéstate boca arriba con brazos y piernas elevados a 90 grados.",
    "Extiende un brazo hacia atrás y la pierna opuesta hacia adelante.",
    "No dejes que toquen el suelo. Mantén la espalda baja pegada al piso.",
    "Vuelve a la posición inicial y cambia de lado."
  ],
  "Decline Push-Up": [
    "Coloca los pies sobre una superficie elevada (caja o silla).",
    "Manos en el suelo al ancho de los hombros.",
    "Baja el pecho hacia el suelo con el cuerpo recto.",
    "Empuja hacia arriba con fuerza."
  ],
  "Flutter Kicks": [
    "Acuéstate boca arriba con las piernas extendidas.",
    "Levanta ambas piernas unos centímetros del suelo.",
    "Haz pequeños movimientos alternos de arriba hacia abajo (pataleo).",
    "Mantén la zona lumbar presionando el suelo."
  ],
  "Front Leg Raises": [
    "Acuéstate boca arriba con las piernas estiradas.",
    "Levanta ambas piernas juntas hasta formar un ángulo de 90 grados.",
    "Baja las piernas lentamente sin que toquen el suelo.",
    "Usa el abdomen inferior y no la inercia."
  ],
  "Incline Push-Up Close-Grip": [
    "Apoya las manos juntas sobre una superficie elevada (banco o mesa).",
    "Mantén los codos pegados al cuerpo.",
    "Baja el pecho hacia las manos.",
    "Empuja enfocando la fuerza en los tríceps y pecho."
  ],
  "Plank": [
    "Apóyate sobre tus antebrazos y las puntas de los pies.",
    "Alinea los codos justo debajo de los hombros.",
    "Mantén el cuerpo completamente recto y firme como una tabla.",
    "Aprieta el abdomen y los glúteos."
  ],
  "Push-Up Wide": [
    "En posición de plancha, coloca las manos más anchas que los hombros.",
    "Baja el cuerpo hasta que el pecho casi toque el suelo.",
    "Mantén los codos apuntando ligeramente hacia atrás, no a los lados.",
    "Empuja con fuerza usando el pecho."
  ],
  "Push-Ups - Close Triceps Position": [
    "Manos en el suelo juntas, formando un diamante o muy cerca.",
    "Mantén los codos rozando el torso al bajar.",
    "Baja el pecho hasta las manos.",
    "Sube extendiendo completamente los tríceps."
  ],
  "Pushups": [
    "Manos en el suelo al ancho de los hombros o un poco más.",
    "Cuerpo recto desde la cabeza hasta los talones.",
    "Baja hasta que el pecho esté a un centímetro del suelo.",
    "Empuja hacia arriba hasta extender los brazos."
  ],
  "Single Leg Glute Bridge": [
    "Acuéstate boca arriba con una pierna flexionada y la otra extendida en el aire.",
    "Empuja con el talón de la pierna apoyada para levantar la cadera.",
    "Alinea tu cuerpo desde el hombro hasta la rodilla.",
    "Baja lentamente sin perder el control."
  ]
};

const parsedPath = './src/data/parsedExercises.json';
const exercises = JSON.parse(fs.readFileSync(parsedPath, 'utf8'));

let updatedCount = 0;
exercises.forEach(ex => {
  if (premiumCues[ex.name]) {
    ex.formGuidance = premiumCues[ex.name];
    updatedCount++;
  } else if (!ex.formGuidance) {
    // Generic fallback for all other exercises so the section always appears
    ex.formGuidance = [
      "Prepárate en la posición inicial correcta.",
      "Realiza el movimiento de forma controlada.",
      "Mantén la tensión en el grupo muscular objetivo.",
      "Respira de forma fluida durante el ejercicio."
    ];
  }
});

fs.writeFileSync(parsedPath, JSON.stringify(exercises, null, 2));
console.log(`Updated formGuidance for ${updatedCount} premium exercises, and added fallbacks for the rest.`);
