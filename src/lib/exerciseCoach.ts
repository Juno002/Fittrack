import { BODYWEIGHT_EXERCISES } from '@/data/bodyweightExercises';
import type {
  ExerciseDefinition,
  ExerciseDifficulty,
  ExerciseDemoKey,
  ExerciseProgression,
  MuscleGroup,
} from '@/store/types';

interface DemoTemplate {
  coachNote: string;
  cues: string[];
  instructions: string[];
  mistakes: string[];
  progressionPath: string[];
}

export interface ResolvedExerciseCoach {
  difficulty: ExerciseDifficulty;
  summary: string;
  coachNote: string;
  cues: string[];
  instructions: string[];
  mistakes: string[];
  progression: ExerciseProgression;
  youtubeQuery: string;
  demoKey: ExerciseDemoKey;
  noEquipment: boolean;
  searchTerms: string[];
}

const PUSH_UP_PATH = [
  'Wall Push-Up',
  'Incline Push-Up',
  'Knee Push-Up',
  'Push-Up',
  'Diamond Push-Up',
  'Decline Push-Up',
  'Archer Push-Up',
];

const SHOULDER_PUSH_PATH = [
  'Wall Push-Up',
  'Push-Up',
  'Pike Push-Up',
  'Decline Push-Up',
  'Archer Push-Up',
];

const SQUAT_PATH = [
  'Assisted Squat',
  'Bodyweight Squat',
  'Split Squat',
  'Jump Squat',
  'Pistol Squat Progression',
];

const LUNGE_PATH = [
  'Split Squat',
  'Reverse Lunge',
  'Jump Squat',
  'Pistol Squat Progression',
];

const CORE_CONTROL_PATH = [
  'Dead Bug',
  'Plank',
  'Hollow Hold',
  'Leg Raise',
];

const BACK_CONTROL_PATH = [
  'Superman Hold',
  'Reverse Snow Angel',
  'Bear Crawl',
];

const CONDITIONING_PATH = [
  'Mountain Climber',
  'Bear Crawl',
  'Burpee',
];

const BODYWEIGHT_INDEX = new Map(BODYWEIGHT_EXERCISES.map((exercise) => [exercise.id, exercise]));

const DEMO_TEMPLATES: Record<ExerciseDemoKey, DemoTemplate> = {
  push_up: {
    coachNote: 'Aprieta abdomen, baja con control y empuja sin romper la linea corporal.',
    cues: ['Core firme', 'Codos 45', 'Pecho abajo'],
    instructions: [
      'Empieza en una plancha alta con manos apenas mas anchas que hombros.',
      'Aprieta abdomen y gluteos antes de bajar.',
      'Baja el pecho con control hasta donde mantengas linea recta.',
      'Empuja el suelo y vuelve arriba sin colapsar cadera.',
    ],
    mistakes: [
      'Cadera caida o gluteos demasiado arriba.',
      'Repeticiones cortas sin rango real.',
      'Codos demasiado abiertos desde el inicio.',
      'Cabeza adelantada buscando el suelo.',
    ],
    progressionPath: PUSH_UP_PATH,
  },
  pike_push_up: {
    coachNote: 'Haz la cadera tu pico y lleva la cabeza entre las manos.',
    cues: ['Cadera arriba', 'Peso delante', 'Empuja vertical'],
    instructions: [
      'Desde una V invertida, apoya manos firmes y separadas al ancho de hombros.',
      'Mantén piernas activas y abdomen apretado.',
      'Dobla codos y lleva la coronilla hacia el suelo entre tus manos.',
      'Empuja fuerte hasta regresar a la V sin perder control.',
    ],
    mistakes: [
      'Convertirlo en flexion normal y no en empuje vertical.',
      'Codos saliendo hacia los lados sin control.',
      'Perder altura de cadera en cada repeticion.',
      'Acortar rango por miedo a cargar hombros.',
    ],
    progressionPath: SHOULDER_PUSH_PATH,
  },
  squat: {
    coachNote: 'Busca profundidad util, no una sentadilla apurada.',
    cues: ['Pecho alto', 'Rodillas siguen', 'Pies firmes'],
    instructions: [
      'Coloca los pies al ancho que te deje bajar con equilibrio.',
      'Inicia el movimiento doblando cadera y rodillas al mismo tiempo.',
      'Baja controlado hasta tu mejor rango manteniendo torso estable.',
      'Empuja el suelo para volver arriba sin rebotar.',
    ],
    mistakes: [
      'Talones levantandose al bajar.',
      'Rodillas colapsando hacia adentro.',
      'Torso cayendo por perder control de core.',
      'Bajar rapido y subir sin control.',
    ],
    progressionPath: SQUAT_PATH,
  },
  lunge: {
    coachNote: 'Desciende en vertical y reparte la carga entre ambas piernas.',
    cues: ['Torso alto', 'Base estable', 'Empuja piso'],
    instructions: [
      'Da tu zancada o separa los pies hasta sentir base estable.',
      'Mantén torso alto y abdomen activo antes de bajar.',
      'Desciende recto hasta acercar la rodilla trasera al suelo.',
      'Empuja con la pierna delantera para volver con control.',
    ],
    mistakes: [
      'Dar pasos demasiado cortos y cerrar el espacio de rodilla.',
      'Inclinar el pecho para compensar falta de equilibrio.',
      'Rebotar abajo sin control.',
      'Dejar que la rodilla delantera se hunda hacia dentro.',
    ],
    progressionPath: LUNGE_PATH,
  },
  plank: {
    coachNote: 'Tu plancha deberia verse aburrida: quieta, larga y bien alineada.',
    cues: ['Gluteos firmes', 'Costillas abajo', 'Cuello neutro'],
    instructions: [
      'Apoya antebrazos o manos y extiende piernas hacia atras.',
      'Aprieta gluteos y abdomen antes de empezar a contar.',
      'Mantén hombros empujando el suelo y espalda larga.',
      'Respira corto sin perder la linea de cabeza a talones.',
    ],
    mistakes: [
      'Hundirse en zona lumbar.',
      'Elevar demasiado la cadera para hacerlo facil.',
      'Mirar al frente y tensar cuello.',
      'Olvidar respirar durante la serie.',
    ],
    progressionPath: CORE_CONTROL_PATH,
  },
  dead_bug: {
    coachNote: 'El objetivo es mover extremidades sin que la espalda cambie de forma.',
    cues: ['Lumbar pegada', 'Respira lento', 'Extiende controlado'],
    instructions: [
      'Túmbate boca arriba con brazos al techo y rodillas flexionadas a noventa grados.',
      'Pega la zona lumbar al suelo antes de mover nada.',
      'Extiende brazo y pierna contraria con movimiento lento.',
      'Regresa y alterna sin que la espalda se despegue.',
    ],
    mistakes: [
      'Arquear la espalda al extender.',
      'Moverte demasiado rapido.',
      'Perder tension del abdomen entre repeticiones.',
      'Subir hombros o tensar cuello innecesariamente.',
    ],
    progressionPath: CORE_CONTROL_PATH,
  },
  hollow_hold: {
    coachNote: 'Poca altura, mucha tension: ese es el secreto del hollow.',
    cues: ['Lumbar pegada', 'Piernas largas', 'Costillas abajo'],
    instructions: [
      'Túmbate boca arriba y presiona la zona lumbar contra el suelo.',
      'Eleva hombros y piernas a una altura que puedas controlar.',
      'Estira brazos y piernas en direcciones opuestas.',
      'Respira corto sin perder la forma arqueada hacia dentro.',
    ],
    mistakes: [
      'Separar la espalda del suelo al cansarte.',
      'Subir demasiado piernas y perder tension.',
      'Encoger brazos o piernas para sobrevivir.',
      'Aguantar respiracion hasta romper la postura.',
    ],
    progressionPath: CORE_CONTROL_PATH,
  },
  leg_raise: {
    coachNote: 'La subida importa, pero la bajada lenta es la que construye control.',
    cues: ['Piernas juntas', 'Baja lento', 'Pelvis firme'],
    instructions: [
      'Túmbate boca arriba y lleva las piernas juntas al techo.',
      'Aprieta abdomen antes de iniciar cada repeticion.',
      'Controla la bajada sin perder contacto lumbar con el suelo.',
      'Sube de nuevo usando abdomen, no impulso.',
    ],
    mistakes: [
      'Dejar caer las piernas sin control.',
      'Arquear la espalda al bajar.',
      'Separar demasiado las piernas.',
      'Usar balanceo de cadera para subir.',
    ],
    progressionPath: CORE_CONTROL_PATH,
  },
  mountain_climber: {
    coachNote: 'Hazlo rapido solo si primero puedes hacerlo limpio.',
    cues: ['Plancha firme', 'Rodillas vivas', 'Hombros activos'],
    instructions: [
      'Comienza en plancha alta con hombros sobre manos.',
      'Activa abdomen y mantén el cuerpo largo.',
      'Lleva una rodilla al pecho y cambia de pierna con ritmo.',
      'Mantén la cadera estable mientras aceleras.',
    ],
    mistakes: [
      'Rebotar la cadera en cada cambio.',
      'Acortar demasiado la zancada y perder intensidad.',
      'Dejar hombros colapsados sobre las manos.',
      'Mover solo las piernas sin tension de core.',
    ],
    progressionPath: CONDITIONING_PATH,
  },
  superman: {
    coachNote: 'Levanta poco, pero con mucha intencion desde espalda y gluteos.',
    cues: ['Pecho sube', 'Piernas largas', 'Gluteos activos'],
    instructions: [
      'Túmbate boca abajo con brazos largos delante o a los lados.',
      'Aprieta gluteos y espalda alta antes de despegar.',
      'Eleva pecho, brazos y piernas solo lo necesario para sentir tension.',
      'Pausa un instante y vuelve con control.',
    ],
    mistakes: [
      'Subir demasiado y comprimir lumbar.',
      'Mover solo cuello para aparentar altura.',
      'Perder tension de gluteos.',
      'Hacer rebotes cortos sin control.',
    ],
    progressionPath: BACK_CONTROL_PATH,
  },
  jump_squat: {
    coachNote: 'La potencia buena siempre termina en un aterrizaje limpio.',
    cues: ['Carga abajo', 'Salta rapido', 'Aterriza suave'],
    instructions: [
      'Baja a tu sentadilla de potencia manteniendo pecho alto.',
      'Carga el peso sobre todo el pie antes de despegar.',
      'Salta extendiendo cadera, rodillas y tobillos a la vez.',
      'Aterriza suave y vuelve a cargar antes de la siguiente repeticion.',
    ],
    mistakes: [
      'Aterrizar rigido y ruidoso.',
      'Perder alineacion de rodillas al recibir.',
      'No usar la bajada para preparar el salto.',
      'Encadenar repeticiones sin recuperar postura.',
    ],
    progressionPath: SQUAT_PATH,
  },
  burpee: {
    coachNote: 'Hazlo en secuencia: bajar, plancha, volver y saltar.',
    cues: ['Baja compacto', 'Plancha firme', 'Salta limpio'],
    instructions: [
      'Desde pie, baja en sentadilla y lleva manos al suelo.',
      'Extiende las piernas a una plancha estable.',
      'Recoge las piernas de nuevo debajo del cuerpo.',
      'Sube y termina con un salto corto y controlado.',
    ],
    mistakes: [
      'Caer a la plancha con lumbar colapsada.',
      'Perder control al recoger los pies.',
      'Hacer el salto final sin extender cadera.',
      'Convertirlo en carrera caotica sin forma.',
    ],
    progressionPath: CONDITIONING_PATH,
  },
  bear_crawl: {
    coachNote: 'Cuatro apoyos, pasos cortos y espalda tranquila.',
    cues: ['Pasos cortos', 'Rodillas bajas', 'Core firme'],
    instructions: [
      'Ponte a cuatro apoyos con rodillas flotando cerca del suelo.',
      'Activa abdomen y empuja el suelo con hombros fuertes.',
      'Avanza con mano y pie opuesto en pasos pequeños.',
      'Mantén la espalda estable durante todo el desplazamiento.',
    ],
    mistakes: [
      'Subir demasiado la cadera y perder el patrón.',
      'Arrastrar pies o manos sin control.',
      'Moverte demasiado rapido y rebotar.',
      'Dejar las rodillas tocar el suelo todo el tiempo.',
    ],
    progressionPath: CONDITIONING_PATH,
  },
  crab_walk: {
    coachNote: 'Empuja el suelo detrás de ti y no dejes morir la cadera.',
    cues: ['Cadera alta', 'Manos firmes', 'Pasos cortos'],
    instructions: [
      'Siéntate, apoya manos detrás y eleva la cadera.',
      'Aprieta gluteos y mantén pecho abierto.',
      'Camina hacia delante o atrás alternando mano y pie.',
      'Avanza con pasos cortos manteniendo la pelvis arriba.',
    ],
    mistakes: [
      'Dejar caer la cadera entre pasos.',
      'Cerrar hombros y colapsar pecho.',
      'Moverte con pasos muy largos sin control.',
      'Perder apoyo de manos por mala colocacion.',
    ],
    progressionPath: CONDITIONING_PATH,
  },
};

function inferDemoKey(exercise: ExerciseDefinition): ExerciseDemoKey {
  const normalizedName = exercise.name.toLowerCase();

  if (normalizedName.includes('pike')) return 'pike_push_up';
  if (normalizedName.includes('push')) return 'push_up';
  if (normalizedName.includes('squat')) return normalizedName.includes('jump') ? 'jump_squat' : 'squat';
  if (normalizedName.includes('lunge') || normalizedName.includes('split')) return 'lunge';
  if (normalizedName.includes('plank')) return 'plank';
  if (normalizedName.includes('dead bug')) return 'dead_bug';
  if (normalizedName.includes('hollow')) return 'hollow_hold';
  if (normalizedName.includes('leg raise')) return 'leg_raise';
  if (normalizedName.includes('mountain')) return 'mountain_climber';
  if (normalizedName.includes('superman') || normalizedName.includes('snow angel')) return 'superman';
  if (normalizedName.includes('burpee')) return 'burpee';
  if (normalizedName.includes('bear')) return 'bear_crawl';
  if (normalizedName.includes('crab')) return 'crab_walk';

  if (exercise.muscleGroup === 'legs') return 'squat';
  if (exercise.muscleGroup === 'shoulders') return 'pike_push_up';
  if (exercise.muscleGroup === 'back') return 'superman';

  return 'plank';
}

function defaultSummary(muscleGroup: MuscleGroup) {
  if (muscleGroup === 'chest') return 'Patron de empuje para torso y control corporal.';
  if (muscleGroup === 'back') return 'Trabajo de espalda y postura usando solo tu cuerpo.';
  if (muscleGroup === 'legs') return 'Patron de piernas para fuerza, equilibrio y control.';
  if (muscleGroup === 'shoulders') return 'Empuje y estabilidad de hombros sin equipamiento.';
  if (muscleGroup === 'arms') return 'Trabajo de brazos y estabilidad de codo en peso corporal.';

  return 'Ejercicio de control corporal para abdomen y estabilidad.';
}

function defaultDifficulty(exercise: ExerciseDefinition): ExerciseDifficulty {
  if (exercise.source === 'custom') {
    return 'Custom';
  }

  return exercise.isBodyweight ? 'Intermediate' : 'Custom';
}

function buildProgression(current: string, path: string[]): ExerciseProgression {
  const currentIndex = path.indexOf(current);

  if (currentIndex === -1) {
    return {
      current,
      easier: path.slice(0, 2),
      harder: path.slice(-2),
    };
  }

  return {
    current,
    easier: path.slice(Math.max(0, currentIndex - 2), currentIndex),
    harder: path.slice(currentIndex + 1, currentIndex + 4),
  };
}

export function resolveExerciseCoach(exercise: ExerciseDefinition): ResolvedExerciseCoach {
  const sourceExercise = BODYWEIGHT_INDEX.get(exercise.id);
  const demoKey = exercise.demoKey ?? sourceExercise?.demoKey ?? inferDemoKey(exercise);
  const template = DEMO_TEMPLATES[demoKey];
  const difficulty = exercise.difficulty ?? sourceExercise?.difficulty ?? defaultDifficulty(exercise);
  const progression = exercise.progression ?? sourceExercise?.progression ?? buildProgression(exercise.name, template.progressionPath);

  return {
    difficulty,
    summary: exercise.summary ?? sourceExercise?.summary ?? defaultSummary(exercise.muscleGroup),
    coachNote: exercise.coachNote ?? sourceExercise?.coachNote ?? template.coachNote,
    cues: exercise.cues && exercise.cues.length > 0 ? exercise.cues : (sourceExercise?.cues?.length ? sourceExercise.cues : template.cues),
    instructions: exercise.instructions && exercise.instructions.length > 0 ? exercise.instructions : (sourceExercise?.instructions?.length ? sourceExercise.instructions : template.instructions),
    mistakes: exercise.mistakes && exercise.mistakes.length > 0 ? exercise.mistakes : (sourceExercise?.mistakes?.length ? sourceExercise.mistakes : template.mistakes),
    progression,
    youtubeQuery: exercise.youtubeQuery ?? sourceExercise?.youtubeQuery ?? `${exercise.name} proper form calisthenics no equipment`,
    demoKey,
    noEquipment: exercise.noEquipment ?? sourceExercise?.noEquipment ?? exercise.isBodyweight,
    searchTerms: [...(exercise.searchTerms ?? []), ...(sourceExercise?.searchTerms ?? [])],
  };
}
