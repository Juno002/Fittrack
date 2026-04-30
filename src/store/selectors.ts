import {
  addDays,
  differenceInHours,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';
import { es } from 'date-fns/locale';

import { compareDayKeys, formatDayKey, getRecentDayKeys, parseDayKey, toDayKey } from '@/lib/dates';
import {
  capitalizeText,
  formatMuscleGroup,
  formatPreferredTrainingTime,
  formatTrainingDays,
} from '@/lib/display';
import {
  calculateFatigue,
  calculateWeeklyVolume,
  getEffectiveMRV,
  getFatigueBreakdown,
  getRecoveryColor,
  getRecoveryText,
  getSleepModifier,
} from '@/lib/fatigue';
import {
  DEFAULT_REST_DURATION_SECONDS,
  getAgeReadinessAdjustment,
  getBodyweightLoadFactor,
  getNutritionAdequacySummary as buildNutritionAdequacySummary,
  getReadinessGate,
  getRecentSignalCounts,
  getRecoveryConfidence,
  getSleepReadinessAdjustment,
  GLOBAL_READINESS_BASE,
  type NutritionAdequacySummary,
  RECOVERY_MUSCLE_GROUP_ORDER,
} from '@/lib/recoveryModel';
import {
  calculate1RM,
  getWorkoutLogLoadTotal,
  getWorkoutLogRepTotal,
  getTrackedSetCount,
  getWorkoutSessionLoadTotal,
  getWorkoutSessionRepTotal,
  getWorkoutSessionSetTotal,
} from '@/lib/workout';
import type { AppStoreData } from '@/store';
import type { ExerciseDefinition, MuscleGroup, TrainingDay } from '@/store/types';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

const TRAINING_DAY_BY_INDEX: TrainingDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function getTrainingDayForDate(referenceDate: Date) {
  return TRAINING_DAY_BY_INDEX[referenceDate.getDay()] ?? 'mon';
}

function hasTrainingHistory(state: AppStoreData) {
  return state.sessions.length > 0;
}

function getQuickLogAdjustment(state: AppStoreData, referenceDate = new Date()) {
  const latestRecovery = selectLatestRecoveryCheckIn(state);
  if (!latestRecovery) {
    return 0;
  }

  const hoursSince = differenceInHours(referenceDate, new Date(latestRecovery.loggedAt));
  if (hoursSince > 24 || hoursSince < 0) {
    return 0;
  }

  return ((latestRecovery.energy - 3) * 4)
    + ((3 - latestRecovery.soreness) * 4)
    + ((3 - latestRecovery.stress) * 3);
}

function getSystemicSessionPenalty(state: AppStoreData, referenceDate = new Date()) {
  const effortMultipliers = [0.7, 0.85, 1, 1.15, 1.3];
  const penalty = state.sessions.reduce((total, session) => {
    const hoursSince = differenceInHours(referenceDate, new Date(session.performedAt));
    if (hoursSince < 0 || hoursSince > 120) {
      return total;
    }

    const recencyMultiplier = hoursSince < 24 ? 1 : hoursSince < 48 ? 0.7 : hoursSince < 72 ? 0.4 : 0.15;
    const effortMultiplier = effortMultipliers[Math.max(0, Math.min(effortMultipliers.length - 1, session.effort - 1))] ?? 1;

    const sessionPenalty = session.logs.reduce((sessionTotal, log) => {
      const trackedSets = getTrackedSetCount(log);
      const bodyweightFactor = log.isBodyweight ? getBodyweightLoadFactor(state.profile.weight) : 1;
      return sessionTotal + (trackedSets * effortMultiplier * recencyMultiplier * bodyweightFactor);
    }, 0);

    return total + sessionPenalty;
  }, 0);

  return Math.min(35, penalty * 2.2);
}

function getReadinessConfidence(state: AppStoreData, referenceDate = new Date()) {
  const nutrition = buildNutritionAdequacySummary({
    foods: state.foods,
    calorieGoal: state.calorieGoal,
    macroGoal: state.macrosGoal,
    foodSignalEnabled: state.settings.connectedSignals.food,
    referenceDate,
  });
  const signalCounts = getRecentSignalCounts({
    sleepLogs: state.sleepLogs,
    recoveryCheckins: state.recoveryCheckins,
    referenceDate,
  });

  return getRecoveryConfidence({
    sessions: state.sessions.length,
    recentSleepLogs: signalCounts.recentSleepLogs,
    recentRecoveryCheckins: signalCounts.recentRecoveryCheckins,
    nutritionDaysLogged: nutrition.daysLogged,
  });
}

export function selectTodayDayKey() {
  return toDayKey(new Date());
}

export function selectSessionsByDay(state: AppStoreData, dayKey: string) {
  return [...state.sessions]
    .filter((session) => session.dayKey === dayKey)
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt));
}

export function selectFoodsByDay(state: AppStoreData, dayKey: string) {
  return [...state.foods]
    .filter((entry) => entry.dayKey === dayKey)
    .sort((left, right) => right.consumedAt.localeCompare(left.consumedAt));
}

export function selectSleepLogByDay(state: AppStoreData, dayKey: string) {
  return state.sleepLogs.find((entry) => entry.dayKey === dayKey) ?? null;
}

export function selectLatestSleepLog(state: AppStoreData) {
  return [...state.sleepLogs].sort((left, right) => right.dayKey.localeCompare(left.dayKey))[0] ?? null;
}

export function selectRecoveryCheckInByDay(state: AppStoreData, dayKey: string) {
  return [...state.recoveryCheckins]
    .filter((entry) => entry.dayKey === dayKey)
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null;
}

export function selectLatestRecoveryCheckIn(state: AppStoreData) {
  return [...state.recoveryCheckins].sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))[0] ?? null;
}

export function selectLocalFatigueSummary(state: AppStoreData, referenceDate = new Date()) {
  return calculateFatigue({
    sessions: state.sessions,
    sleepLogs: state.sleepLogs,
    profile: state.profile,
    referenceDate,
  });
}

export function selectFatigueSummary(state: AppStoreData, referenceDate = new Date()) {
  return selectLocalFatigueSummary(state, referenceDate);
}

export function selectNutritionAdequacySummary(state: AppStoreData, referenceDate = new Date()): NutritionAdequacySummary {
  return buildNutritionAdequacySummary({
    foods: state.foods,
    calorieGoal: state.calorieGoal,
    macroGoal: state.macrosGoal,
    foodSignalEnabled: state.settings.connectedSignals.food,
    referenceDate,
  });
}

export function selectSystemicReadinessSummary(state: AppStoreData, referenceDate = new Date()) {
  const trainingPenalty = getSystemicSessionPenalty(state, referenceDate);
  const sleepAdjustment = getSleepReadinessAdjustment(state.sleepLogs, referenceDate);
  const recoveryAdjustment = getQuickLogAdjustment(state, referenceDate);
  const nutritionAdequacy = selectNutritionAdequacySummary(state, referenceDate);
  const ageAdjustment = getAgeReadinessAdjustment(state.profile.age);
  const readiness = clamp(
    Math.round(
      GLOBAL_READINESS_BASE
      - trainingPenalty
      + sleepAdjustment
      + recoveryAdjustment
      + nutritionAdequacy.adjustment
      + ageAdjustment,
    ),
    0,
    100,
  );

  return {
    readiness,
    systemicFatigue: clamp(Math.round(100 - readiness), 0, 100),
    trainingPenalty,
    sleepAdjustment,
    recoveryAdjustment,
    nutritionAdjustment: nutritionAdequacy.adjustment,
    ageAdjustment,
  };
}

export function selectReadinessSummary(state: AppStoreData, referenceDate = new Date()) {
  const hasTrainingData = hasTrainingHistory(state);
  const hasRecoverySignals = state.sleepLogs.length > 0 || state.recoveryCheckins.length > 0;
  const fatigue = selectLocalFatigueSummary(state, referenceDate);
  const systemic = selectSystemicReadinessSummary(state, referenceDate);
  const nutritionAdequacy = selectNutritionAdequacySummary(state, referenceDate);
  const confidence = getReadinessConfidence(state, referenceDate);
  const entries = Object.entries(fatigue) as [MuscleGroup, number][];
  const maxFatigueValue = Math.max(...entries.map(([, value]) => value), 0);
  const readiness = systemic.readiness;
  const readinessGate = getReadinessGate(readiness);

  const weeklyVolume = calculateWeeklyVolume(state.sessions, referenceDate);
  const sleepMod = getSleepModifier(state.sleepLogs, referenceDate);

  const recommendedMuscles = readinessGate === 'recover' || (!hasTrainingData && maxFatigueValue === 0)
    ? []
    : [...entries]
      .sort((left, right) => left[1] - right[1])
      .slice(0, 2)
      .map(([muscleGroup]) => muscleGroup);
  const highestFatigue = hasTrainingData && maxFatigueValue > 0
    ? [...entries].sort((left, right) => right[1] - left[1])[0] ?? null
    : null;
  const suggestedDurationMinutes = hasTrainingData
    ? readinessGate === 'train' ? 45 : readinessGate === 'controlled' ? 30 : 18
    : readinessGate === 'train' ? 28 : readinessGate === 'controlled' ? 22 : 16;

  let coachTitle = 'Base de recuperacion lista.';
  let coachBody = 'Con historial y senales recientes podemos proponerte una sesion mas afinada.';
  let coachTone: 'good' | 'warn' | 'danger' = 'warn';

  if (readinessGate === 'recover') {
    coachTone = 'danger';
    coachTitle = confidence === 'low' ? 'Hoy toca recuperar con prudencia.' : 'Recuperacion prioritaria hoy.';
    coachBody = highestFatigue
      ? `Tu estado global pide bajar una marcha y proteger ${formatMuscleGroup(highestFatigue[0]).toLowerCase()}. Respira, mueve suave y evita sembrar una sesion exigente.`
      : 'El sistema detecta poca disponibilidad global. Hoy encaja mejor movilidad, respiracion y recuperacion activa.';
  } else if (readinessGate === 'controlled') {
    coachTone = 'warn';
    coachTitle = confidence === 'low' ? 'Sesion base con estimacion inicial.' : 'Buen dia para controlar el volumen.';
    coachBody = recommendedMuscles.length > 0
      ? `Los grupos mas frescos hoy son ${recommendedMuscles.map((muscle) => formatMuscleGroup(muscle).toLowerCase()).join(' y ')}. Mantén tecnica y volumen moderado.`
      : 'Todavia falta contexto para recomendar un foco exacto, pero conviene una sesion sencilla y bien medida.';
  } else {
    coachTone = 'good';
    coachTitle = confidence === 'low' ? 'Base util para entrenar, aun por afinar.' : 'Listo para una sesion principal.';
    coachBody = recommendedMuscles.length > 0
      ? `Tus grupos mas frescos hoy son ${recommendedMuscles.map((muscle) => formatMuscleGroup(muscle).toLowerCase()).join(' y ')}. Puedes empujar ahi sin sobrecargar lo que viene mas fatigado.`
      : 'La disponibilidad global es buena y no hay una zona claramente comprometida. Puedes seguir una sesion equilibrada.';
  }

  let maxRatio = 0;
  let maxMuscle: MuscleGroup = 'chest';
  let zone = 'low';

  for (const muscle of Object.keys(weeklyVolume) as MuscleGroup[]) {
    const sets = weeklyVolume[muscle];
    const limits = getEffectiveMRV(muscle, sleepMod);
    if (sets === 0) {
      continue;
    }

    const ratio = sets / limits.mrv;
    if (ratio > maxRatio) {
      maxRatio = ratio;
      maxMuscle = muscle;
      if (sets > limits.mrv) {
        zone = 'over';
      } else if (sets >= limits.mavMin) {
        zone = sets > limits.mavMax ? 'high' : 'optimal';
      } else if (sets >= limits.mev) {
        zone = 'optimal';
      } else {
        zone = 'low';
      }
    }
  }

  if (readinessGate !== 'recover') {
    const muscleName = formatMuscleGroup(maxMuscle).toLowerCase();

    if (zone === 'over') {
      coachTone = 'danger';
      coachTitle = `Limite semanal superado en ${muscleName}.`;
      coachBody = `Tu volumen acumulado ahi ya esta por encima del rango tolerable. Incluso si el score global acompana, hoy conviene no sumar mas carga en ese grupo.`;
    } else if (zone === 'high') {
      coachTone = 'warn';
      coachTitle = `Volumen alto en ${muscleName}.`;
      coachBody = `Ese grupo ya va cerca de su techo semanal. Mantén tecnica, reduce accesorios o cambia el foco del dia.`;
    } else if (maxRatio > 0 && sleepMod < 0.9) {
      coachTone = 'warn';
      coachTitle = 'Recuperacion limitada por sueno.';
      coachBody = 'Tu tolerancia al volumen bajo un poco esta semana. Antes de subir carga, mejora descanso y controla el esfuerzo.';
    }
  }

  return {
    readiness,
    globalReadiness: readiness,
    systemicFatigue: systemic.systemicFatigue,
    fatigue,
    localFatigue: fatigue,
    nutritionAdequacy,
    confidence,
    readinessGate,
    recommendedMuscles,
    highestFatigue,
    suggestedDurationMinutes,
    coachTone,
    coachTitle,
    coachBody,
    hasTrainingData,
    hasRecoverySignals,
  };
}

export function selectRecommendedExercises(
  state: AppStoreData,
  library: ExerciseDefinition[],
  referenceDate = new Date(),
) {
  const { recommendedMuscles, readinessGate } = selectReadinessSummary(state, referenceDate);
  const muscleSet = new Set(recommendedMuscles);

  if (readinessGate === 'recover') {
    return [];
  }

  if (muscleSet.size === 0) {
    return library.slice(0, 4);
  }

  return library
    .filter((exercise) => muscleSet.has(exercise.muscleGroup))
    .slice(0, 4);
}

export function selectRecoveryConsistencyStreak(state: AppStoreData) {
  const recoveryDays = Array.from(new Set([
    ...state.sessions.map((session) => session.dayKey),
    ...state.sleepLogs.map((entry) => entry.dayKey),
    ...state.recoveryCheckins.map((entry) => entry.dayKey),
  ])).sort(compareDayKeys);

  if (recoveryDays.length === 0) {
    return 0;
  }

  let streak = 0;
  let cursor = parseDayKey(recoveryDays[recoveryDays.length - 1]);
  const recoveryDaySet = new Set(recoveryDays);

  while (recoveryDaySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
}

export function selectTrainingStreak(state: AppStoreData) {
  return selectRecoveryConsistencyStreak(state);
}

export function selectDaySummary(state: AppStoreData, dayKey: string) {
  const sessions = selectSessionsByDay(state, dayKey);
  const foods = selectFoodsByDay(state, dayKey);
  const sleepLog = selectSleepLogByDay(state, dayKey);
  const recoveryCheckIn = selectRecoveryCheckInByDay(state, dayKey);

  return {
    dayKey,
    sessions,
    foods,
    sleepLog,
    recoveryCheckIn,
    calories: foods.reduce((total, food) => total + food.calories, 0),
    protein: foods.reduce((total, food) => total + food.protein, 0),
    carbs: foods.reduce((total, food) => total + food.carbs, 0),
    fat: foods.reduce((total, food) => total + food.fat, 0),
    totalSets: sessions.reduce((total, session) => total + getWorkoutSessionSetTotal(session), 0),
    totalReps: sessions.reduce((total, session) => total + getWorkoutSessionRepTotal(session), 0),
    totalDurationSeconds: sessions.reduce((total, session) => total + session.durationSeconds, 0),
  };
}

export function selectTimelineEntries(state: AppStoreData, dayKey: string) {
  const summary = selectDaySummary(state, dayKey);

  return [
    ...summary.sessions.map((session) => ({
      id: `session-${session.id}`,
      type: 'session' as const,
      at: session.performedAt,
      session,
    })),
    ...summary.foods.map((food) => ({
      id: `food-${food.id}`,
      type: 'food' as const,
      at: food.consumedAt,
      food,
    })),
    ...(summary.sleepLog
      ? [
          {
            id: `sleep-${summary.sleepLog.id}`,
            type: 'sleep' as const,
            at: summary.sleepLog.loggedAt,
            sleepLog: summary.sleepLog,
          },
        ]
      : []),
    ...(summary.recoveryCheckIn
      ? [
          {
            id: `recovery-${summary.recoveryCheckIn.id}`,
            type: 'recovery' as const,
            at: summary.recoveryCheckIn.loggedAt,
            recoveryCheckIn: summary.recoveryCheckIn,
          },
        ]
      : []),
  ].sort((left, right) => right.at.localeCompare(left.at));
}

export function selectWeeklyTrainingData(state: AppStoreData, referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(weekStart, index);
    const dayKey = toDayKey(day);
    const sessions = selectSessionsByDay(state, dayKey);
    const totalReps = sessions.reduce((total, session) => total + getWorkoutSessionRepTotal(session), 0);
    const totalLoad = sessions.reduce((total, session) => total + getWorkoutSessionLoadTotal(session), 0);
    const isFuture = isAfter(day, referenceDate) && !isSameDay(day, referenceDate);

    return {
      dayKey,
      label: capitalizeText(format(day, 'EEE', { locale: es }).slice(0, 1)),
      totalReps,
      totalLoad,
      totalSets: sessions.reduce((total, session) => total + getWorkoutSessionSetTotal(session), 0),
      trained: sessions.length > 0,
      isFuture,
      isToday: isSameDay(day, referenceDate),
    };
  });
}

export function selectPreviousWeekVolume(state: AppStoreData, referenceDate = new Date()) {
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const previousWeekStart = subDays(currentWeekStart, 7);
  const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 });

  return state.sessions
    .filter((session) => {
      const performedAt = parseISO(session.performedAt);
      return performedAt >= previousWeekStart && performedAt <= previousWeekEnd;
    })
    .reduce((total, session) => total + getWorkoutSessionRepTotal(session), 0);
}

function selectPreviousWeekTotals(state: AppStoreData, referenceDate = new Date()) {
  const currentWeekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const previousWeekStart = subDays(currentWeekStart, 7);
  const previousWeekEnd = endOfWeek(previousWeekStart, { weekStartsOn: 1 });

  return state.sessions
    .filter((session) => {
      const performedAt = parseISO(session.performedAt);
      return performedAt >= previousWeekStart && performedAt <= previousWeekEnd;
    })
    .reduce((totals, session) => ({
      totalReps: totals.totalReps + getWorkoutSessionRepTotal(session),
      totalLoad: totals.totalLoad + getWorkoutSessionLoadTotal(session),
    }), { totalReps: 0, totalLoad: 0 });
}

export function selectPrimaryWeeklyVolume(state: AppStoreData, referenceDate = new Date()) {
  const byDay = selectWeeklyTrainingData(state, referenceDate);
  const previousWeekTotals = selectPreviousWeekTotals(state, referenceDate);
  const currentTotals = byDay.reduce((totals, day) => ({
    totalReps: totals.totalReps + day.totalReps,
    totalLoad: totals.totalLoad + day.totalLoad,
  }), { totalReps: 0, totalLoad: 0 });
  const metricMode = currentTotals.totalLoad > 0 || previousWeekTotals.totalLoad > 0 ? 'load' : 'reps';

  return {
    metricMode,
    current: metricMode === 'load' ? currentTotals.totalLoad : currentTotals.totalReps,
    previous: metricMode === 'load' ? previousWeekTotals.totalLoad : previousWeekTotals.totalReps,
    byDay: byDay.map((day) => ({
      ...day,
      value: metricMode === 'load' ? day.totalLoad : day.totalReps,
    })),
  };
}

export function selectSleepChartData(state: AppStoreData, referenceDate = new Date()) {
  return getRecentDayKeys(7, referenceDate).map((dayKey) => {
    const entry = selectSleepLogByDay(state, dayKey);

    return {
      dayKey,
      name: formatDayKey(dayKey, 'EEE').toUpperCase(),
      score: entry?.qualityScore ?? null,
      durationHours: entry?.durationHours ?? null,
    };
  });
}

export function selectProfileSummary(state: AppStoreData) {
  return {
    unitSystem: state.settings.unitSystem,
    calorieGoal: state.calorieGoal,
    macrosGoal: state.macrosGoal,
    connectedSignals: state.settings.connectedSignals,
    trainingSchedule: state.settings.trainingSchedule,
    reminders: state.settings.reminders,
    defaultRestDuration: state.settings.defaultRestDuration ?? DEFAULT_REST_DURATION_SECONDS,
    profile: state.profile,
    latestWeight: state.weightLogs[0]?.weight ?? state.profile.weight,
  };
}

export function selectTodayPlan(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const trainingDay = getTrainingDayForDate(referenceDate);
  const scheduledToday = state.settings.trainingSchedule.days.includes(trainingDay);
  const focusLabel = readiness.recommendedMuscles.map((muscle) => formatMuscleGroup(muscle)).join(' + ');

  if (readiness.readinessGate === 'recover') {
    return {
      title: readiness.hasTrainingData ? 'Recuperacion activa' : 'Construye base sin forzar',
      subtitle: readiness.highestFatigue
        ? `Tu readiness global esta bajo. Baja el ritmo y evita sobrecargar ${formatMuscleGroup(readiness.highestFatigue[0]).toLowerCase()}.`
        : 'Hoy encaja mejor respiracion, movilidad y control tecnico que una sesion exigente.',
      ctaLabel: 'Ver catalogo base',
      tone: 'danger' as const,
      scheduledToday,
      steps: [
        { id: 'breath', label: 'Respiracion', minutes: 4 },
        { id: 'mobility', label: 'Movilidad suave', minutes: 8 },
        { id: 'walk', label: 'Circuito ligero', minutes: Math.max(6, readiness.suggestedDurationMinutes - 12) },
      ],
    };
  }

  if (readiness.readinessGate === 'controlled') {
    return {
      title: readiness.hasTrainingData ? 'Sesion base' : 'Arranque controlado',
      subtitle: readiness.hasTrainingData
        ? `Mantén calidad y volumen moderado en ${focusLabel || 'los grupos mas frescos'}.`
        : 'Movilidad, tecnica y una sesion breve mientras reunimos mas senales reales.',
      ctaLabel: readiness.hasTrainingData ? 'Entrenar con control' : 'Crear primera rutina',
      tone: 'warn' as const,
      scheduledToday,
      steps: [
        { id: 'warmup', label: 'Activación', minutes: 5 },
        { id: 'work', label: 'Trabajo principal', minutes: Math.max(12, readiness.suggestedDurationMinutes - 10) },
        { id: 'mobility', label: 'Movilidad', minutes: 5 },
      ],
    };
  }

  return {
    title: readiness.hasTrainingData
      ? (scheduledToday ? 'Sesion principal' : 'Dia ideal para entrenar')
      : 'Buen dia para empezar',
    subtitle: `${focusLabel || 'Recuperacion general'} · ${formatPreferredTrainingTime(state.settings.trainingSchedule.preferredTime)}`,
    ctaLabel: readiness.hasTrainingData ? 'Empezar sesion' : 'Crear primera rutina',
    tone: 'good' as const,
    scheduledToday,
    steps: [
      { id: 'warmup', label: 'Calentamiento', minutes: 5 },
      { id: 'compound', label: focusLabel || 'Bloque principal', minutes: Math.max(15, readiness.suggestedDurationMinutes - 15) },
      { id: 'finisher', label: 'Accesorios', minutes: 7 },
      { id: 'cooldown', label: 'Vuelta a la calma', minutes: 3 },
    ],
  };
}

export function selectMapFocus(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const recoveryTarget = readiness.recommendedMuscles.map((muscle) => formatMuscleGroup(muscle));
  const highestFatigueMuscle = readiness.highestFatigue?.[0] ?? null;
  const highestFatigueValue = readiness.highestFatigue?.[1] ?? 0;

  if (!readiness.hasTrainingData) {
    return {
      title: 'Aún no hay carga acumulada',
      body: 'Cuando completes tus primeras sesiones, el mapa señalará qué zonas llegan más frescas o más cargadas. Por ahora es una referencia general.',
      recoveryTarget,
      highestFatigueMuscle,
      highestFatigueValue,
      hasTrainingData: readiness.hasTrainingData,
    };
  }

  if (readiness.readinessGate === 'recover') {
    return {
      title: 'Hoy toca recuperar',
      body: highestFatigueMuscle
        ? `Aunque otros grupos parezcan frescos, tu readiness global esta bajo. Protege ${formatMuscleGroup(highestFatigueMuscle).toLowerCase()} y prioriza movilidad o respiracion.`
        : 'El mapa detecta poca disponibilidad global. Usa el dia para recuperacion activa y evita sembrar una sesion exigente.',
      recoveryTarget,
      highestFatigueMuscle,
      highestFatigueValue,
      hasTrainingData: readiness.hasTrainingData,
    };
  }

  if (recoveryTarget.length === 0 && highestFatigueMuscle === null) {
    return {
      title: 'Recuperación equilibrada',
      body: 'No hay un grupo especialmente cargado hoy. Puedes elegir una rutina equilibrada o seguir tu horario normal.',
      recoveryTarget,
      highestFatigueMuscle,
      highestFatigueValue,
      hasTrainingData: readiness.hasTrainingData,
    };
  }

  return {
    title: recoveryTarget.length > 0 ? `${recoveryTarget.join(' + ')} están listos` : 'Tu cuerpo está listo',
    body: highestFatigueMuscle && readiness.readinessGate === 'train'
      ? `Prioriza ${recoveryTarget.join(' y ').toLowerCase()} y evita sobrecargar ${formatMuscleGroup(highestFatigueMuscle).toLowerCase()}.`
      : highestFatigueMuscle
        ? `Reduce intensidad y cuida especialmente ${formatMuscleGroup(highestFatigueMuscle).toLowerCase()} antes de volver a empujar.`
        : 'No hay una zona claramente comprometida. Usa el mapa para elegir una sesión balanceada.',
    recoveryTarget,
    highestFatigueMuscle,
    highestFatigueValue,
    hasTrainingData: readiness.hasTrainingData,
  };
}

export function selectCoachInsights(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const weeklyVolume = selectPrimaryWeeklyVolume(state, referenceDate);
  const latestSleep = selectLatestSleepLog(state);
  const latestRecovery = selectLatestRecoveryCheckIn(state);
  const volumeDelta = weeklyVolume.previous === 0
    ? null
    : Math.round(((weeklyVolume.current - weeklyVolume.previous) / weeklyVolume.previous) * 100);
  const hasTrainingData = hasTrainingHistory(state);

  const insights: Array<{ id: string; tone: 'good' | 'warn' | 'danger'; title: string; body: string }> = [
    {
      id: 'readiness',
      tone: readiness.coachTone,
      title: readiness.coachTitle,
      body: readiness.coachBody,
    },
    {
      id: 'volume',
      tone: !hasTrainingData || (volumeDelta !== null && volumeDelta < 0) ? 'warn' : 'good',
      title: !hasTrainingData
        ? 'Tu primera sesión definirá la línea base.'
        : volumeDelta === null
          ? 'Base semanal establecida.'
          : `Tu volumen semanal ${volumeDelta >= 0 ? 'subió' : 'bajó'} ${Math.abs(volumeDelta)}%.`,
      body: !hasTrainingData
        ? 'Empieza con una rutina breve y consistente para que la comparación semanal tenga contexto real.'
        : volumeDelta === null
          ? 'Ya tienes suficiente base para empezar a comparar tendencia semanal.'
          : `La comparacion usa ${weeklyVolume.metricMode === 'load' ? 'carga total' : 'repeticiones'} para no mezclar metricas distintas en la misma tendencia.`,
    },
    {
      id: 'sleep',
      tone: latestSleep && latestSleep.durationHours < 7 ? 'warn' : 'good',
      title: latestSleep ? `${latestSleep.durationHours}h de sueño registradas.` : 'Todavía no registras sueño.',
      body: latestSleep
        ? 'El sueño influye directamente en la recomendación de recuperación y en tu volumen tolerable.'
        : 'Registrar tu descanso hará más precisas las recomendaciones del mapa y del plan diario.',
    },
  ];

  if (latestRecovery) {
    const lowEnergy = latestRecovery.energy <= 2;
    const highStress = latestRecovery.stress >= 4;
    const severeSoreness = latestRecovery.soreness >= 4;

    if (lowEnergy || highStress || severeSoreness) {
      insights.push({
        id: 'recovery-checkin',
        tone: lowEnergy && highStress ? 'danger' : 'warn',
        title: 'Tu quick log pide bajar una marcha.',
        body: `Carga muscular ${latestRecovery.soreness}/5 · Energía ${latestRecovery.energy}/5 · Estrés ${latestRecovery.stress}/5. Mantén la sesión simple o cambia a movilidad.`,
      });
    }
  }

  const recentSessions = state.sessions.filter((session) => differenceInHours(referenceDate, new Date(session.performedAt)) < 168);
  for (const session of recentSessions) {
    if (session.effort <= 3) {
      for (const log of session.logs) {
        if (log.sets.some((set) => set.completed && set.reps > 12)) {
          insights.push({
            id: 'progression',
            tone: 'good',
            title: `Progresión disponible en ${log.exerciseName}.`,
            body: 'Hiciste más de 12 repeticiones con esfuerzo moderado. Puedes subir carga o elegir una variante más difícil.',
          });
          return insights.slice(0, 4);
        }
      }
    }
  }

  return insights.slice(0, 4);
}

export function selectMuscleBreakdown(state: AppStoreData, muscleGroup: MuscleGroup, referenceDate = new Date()) {
  return getFatigueBreakdown(
    {
      sessions: state.sessions,
      sleepLogs: state.sleepLogs,
      profile: state.profile,
      referenceDate,
    },
    muscleGroup,
  );
}

export function selectDashboardCards(state: AppStoreData, referenceDate = new Date()) {
  const todayKey = toDayKey(referenceDate);
  const todaySummary = selectDaySummary(state, todayKey);
  const readiness = selectReadinessSummary(state, referenceDate);
  const schedule = state.settings.trainingSchedule;

  return {
    todayKey,
    todaySummary,
    readiness,
    latestSleep: selectLatestSleepLog(state),
    latestRecoveryCheckIn: selectLatestRecoveryCheckIn(state),
    todayPlan: selectTodayPlan(state, referenceDate),
    mapFocus: selectMapFocus(state, referenceDate),
    profileSummary: selectProfileSummary(state),
    trainingScheduleLabel: formatTrainingDays(schedule.days),
    preferredTimeLabel: formatPreferredTrainingTime(schedule.preferredTime),
  };
}

export interface ExerciseHistoryEntry {
  dayKey: string;
  performedAt: string;
  maxWeight: number;
  estimated1RM: number;
  totalVolume: number;
}

export function selectExerciseHistory(state: AppStoreData, exerciseId: string): ExerciseHistoryEntry[] {
  const history: ExerciseHistoryEntry[] = [];

  state.sessions.forEach((session) => {
    const log = session.logs.find((entry) => entry.exerciseId === exerciseId);
    if (!log) {
      return;
    }

    let maxWeight = 0;
    let max1RM = 0;
    let totalVolume = 0;

    log.sets.filter((set) => set.completed).forEach((set) => {
      if (set.weight > maxWeight) {
        maxWeight = set.weight;
      }

      const oneRepMax = calculate1RM(set.weight, set.reps);
      if (oneRepMax > max1RM) {
        max1RM = oneRepMax;
      }

      totalVolume += set.reps * set.weight;
    });

    if (totalVolume > 0 || (log.isBodyweight && log.sets.some((set) => set.completed))) {
      history.push({
        dayKey: session.dayKey,
        performedAt: session.performedAt,
        maxWeight,
        estimated1RM: max1RM,
        totalVolume,
      });
    }
  });

  return history.sort((left, right) => left.performedAt.localeCompare(right.performedAt));
}

export function selectPersonalRecords(state: AppStoreData): Record<string, number> {
  const records: Record<string, number> = {};

  state.sessions.forEach((session) => {
    session.logs.forEach((log) => {
      let maxWeight = 0;
      log.sets.filter((set) => set.completed).forEach((set) => {
        if (set.weight > maxWeight) {
          maxWeight = set.weight;
        }
      });

      if (maxWeight > 0 && (!records[log.exerciseId] || maxWeight > records[log.exerciseId])) {
        records[log.exerciseId] = maxWeight;
      }
    });
  });

  return records;
}

export function selectMuscleGroupStats(state: AppStoreData) {
  const stats: Record<MuscleGroup, { totalReps: number; totalLoad: number }> = {
    chest: { totalReps: 0, totalLoad: 0 },
    back: { totalReps: 0, totalLoad: 0 },
    legs: { totalReps: 0, totalLoad: 0 },
    shoulders: { totalReps: 0, totalLoad: 0 },
    arms: { totalReps: 0, totalLoad: 0 },
    core: { totalReps: 0, totalLoad: 0 },
  };

  state.sessions.forEach((session) => {
    session.logs.forEach((log) => {
      const reps = getWorkoutLogRepTotal(log);
      const load = getWorkoutLogLoadTotal(log);
      stats[log.muscleGroup].totalReps += reps;
      stats[log.muscleGroup].totalLoad += load;
    });
  });

  return Object.entries(stats).map(([muscleGroup, data]) => ({
    muscleGroup: muscleGroup as MuscleGroup,
    ...data,
  }));
}

export function selectProgressMilestones(state: AppStoreData) {
  const streak = selectRecoveryConsistencyStreak(state);
  const weeklyVolume = calculateWeeklyVolume(state.sessions);
  const weeklyBalancedMuscles = RECOVERY_MUSCLE_GROUP_ORDER.filter((muscleGroup) => weeklyVolume[muscleGroup] >= 6).length;
  const muscleStats = selectMuscleGroupStats(state);

  return [
    {
      id: 'first-session',
      label: 'Primera sesión completa',
      description: 'Guardar al menos un entrenamiento finalizado.',
      complete: state.sessions.length > 0,
    },
    {
      id: 'home-volume',
      label: '10 sesiones registradas',
      description: 'Construir constancia en casa con volumen sostenido.',
      complete: state.sessions.length >= 10,
    },
    {
      id: 'streak',
      label: 'Constancia de 3 días',
      description: 'Se mantiene si entrenas o registras recuperacion tres dias seguidos.',
      complete: streak >= 3,
    },
    {
      id: 'balanced-week',
      label: 'Semana equilibrada',
      description: 'Alcanzar al menos 6 series utiles en cuatro grupos musculares durante la semana.',
      complete: weeklyBalancedMuscles >= 4 || muscleStats.filter((stat) => stat.totalLoad > 0).length >= 4,
    },
  ];
}

export function selectCurrentWeekLabel(referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return capitalizeText(format(weekStart, "d 'de' MMMM", { locale: es }));
}

export { getRecoveryColor, getRecoveryText };
