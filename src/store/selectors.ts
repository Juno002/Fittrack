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
  getWorkoutLogLoadTotal,
  getWorkoutLogRepTotal,
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

export function selectFatigueSummary(state: AppStoreData, referenceDate = new Date()) {
  return calculateFatigue({
    sessions: state.sessions,
    sleepLogs: state.sleepLogs,
    profile: state.profile,
    referenceDate,
  });
}

export function selectReadinessSummary(state: AppStoreData, referenceDate = new Date()) {
  const fatigue = selectFatigueSummary(state, referenceDate);
  const entries = Object.entries(fatigue) as [MuscleGroup, number][];
  const averageFatigue = entries.reduce((total, [, value]) => total + value, 0) / entries.length;
  const readiness = clamp(Math.round(100 - averageFatigue), 12, 100);

  const weeklyVolume = calculateWeeklyVolume(state.sessions, referenceDate);
  const sleepMod = getSleepModifier(state.sleepLogs, referenceDate);

  let coachTitle = 'Volumen bajo.';
  let coachBody = 'Aún no realizas suficiente volumen para crecer óptimamente esta semana.';
  let coachTone: 'good' | 'warn' | 'danger' = 'warn';

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

  const muscleName = formatMuscleGroup(maxMuscle).toLowerCase();

  if (zone === 'over') {
    coachTone = 'danger';
    coachTitle = `Límite superado en ${muscleName}.`;
    coachBody = `No entrenes tus ${muscleName} más esta semana. Has superado su máximo volumen recuperable. Hoy prioriza descanso o movilidad ligera.`;
  } else if (zone === 'high') {
    coachTone = 'warn';
    coachTitle = `Volumen alto en ${muscleName}.`;
    coachBody = `Estás cerca del límite para ${muscleName}. Te conviene una sesión más técnica o un día de descarga activa.`;
  } else if (zone === 'optimal') {
    coachTone = 'good';
    coachTitle = `Volumen óptimo en ${muscleName}.`;
    coachBody = 'Estás en una buena zona de trabajo. Si duermes bien esta noche, mañana puedes empujar otro bloque sólido.';
  } else if (maxRatio > 0 && sleepMod < 0.9) {
    coachTone = 'warn';
    coachTitle = 'Recuperación comprometida.';
    coachBody = 'Tu sueño reciente está bajando la capacidad de recuperación. Antes de subir volumen, recupera mejor.';
  } else if (maxRatio > 0) {
    coachTone = 'warn';
    coachTitle = `Volumen corto en ${muscleName}.`;
    coachBody = 'Todavía estás por debajo del mínimo efectivo para ese grupo. Puedes completar la semana con una sesión simple y de calidad.';
  } else {
    coachTone = 'good';
    coachTitle = 'Listo para progresar.';
    coachBody = 'Tu recuperación está alta. Hoy es un buen momento para una sesión principal o para retomar una rutina guardada.';
  }

  const recommendedMuscles = [...entries]
    .sort((left, right) => left[1] - right[1])
    .slice(0, 2)
    .map(([muscleGroup]) => muscleGroup);

  const highestFatigue = [...entries].sort((left, right) => right[1] - left[1])[0];
  const suggestedDurationMinutes = readiness >= 80 ? 45 : readiness >= 60 ? 35 : readiness >= 40 ? 25 : 20;

  return {
    readiness,
    fatigue,
    recommendedMuscles,
    highestFatigue,
    suggestedDurationMinutes,
    coachTone,
    coachTitle,
    coachBody,
  };
}

export function selectRecommendedExercises(
  state: AppStoreData,
  library: ExerciseDefinition[],
  referenceDate = new Date(),
) {
  const { recommendedMuscles } = selectReadinessSummary(state, referenceDate);
  const muscleSet = new Set(recommendedMuscles);

  return library
    .filter((exercise) => muscleSet.has(exercise.muscleGroup))
    .slice(0, 4);
}

export function selectTrainingStreak(state: AppStoreData) {
  if (state.sessions.length === 0) {
    return 0;
  }

  const trainingDays = Array.from(new Set(state.sessions.map((session) => session.dayKey))).sort(compareDayKeys);
  let streak = 0;
  let cursor = parseDayKey(trainingDays[trainingDays.length - 1]);
  const trainingDaySet = new Set(trainingDays);

  while (trainingDaySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }

  return streak;
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
    defaultRestDuration: state.settings.defaultRestDuration ?? 60,
    profile: state.profile,
    latestWeight: state.weightLogs[0]?.weight ?? state.profile.weight,
  };
}

export function selectTodayPlan(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const trainingDay = getTrainingDayForDate(referenceDate);
  const scheduledToday = state.settings.trainingSchedule.days.includes(trainingDay);
  const focusLabel = readiness.recommendedMuscles.map((muscle) => formatMuscleGroup(muscle)).join(' + ');

  if (readiness.readiness >= 80) {
    return {
      title: scheduledToday ? 'Sesión principal' : 'Día ideal para entrenar',
      subtitle: `${focusLabel || 'Recuperación general'} · ${formatPreferredTrainingTime(state.settings.trainingSchedule.preferredTime)}`,
      ctaLabel: 'Empezar sesión',
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

  if (readiness.readiness >= 55) {
    return {
      title: 'Sesión base',
      subtitle: `Mantén calidad y técnica en ${focusLabel || 'los grupos frescos'}`,
      ctaLabel: 'Entrenar con control',
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
    title: 'Recuperación guiada',
    subtitle: `Baja el ritmo y evita sobrecargar ${formatMuscleGroup(readiness.highestFatigue?.[0] ?? 'legs').toLowerCase()}`,
    ctaLabel: 'Abrir rutina suave',
    tone: 'danger' as const,
    scheduledToday,
    steps: [
      { id: 'breath', label: 'Respiración', minutes: 4 },
      { id: 'mobility', label: 'Movilidad suave', minutes: 10 },
      { id: 'walk', label: 'Circuito ligero', minutes: Math.max(8, readiness.suggestedDurationMinutes - 14) },
    ],
  };
}

export function selectMapFocus(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const recoveryTarget = readiness.recommendedMuscles.map((muscle) => formatMuscleGroup(muscle));
  const highestFatigueMuscle = readiness.highestFatigue?.[0] ?? 'legs';
  const highestFatigueValue = readiness.highestFatigue?.[1] ?? 0;

  return {
    title: recoveryTarget.length > 0 ? `${recoveryTarget.join(' + ')} están listos` : 'Tu cuerpo está listo',
    body: readiness.readiness >= 65
      ? `Prioriza ${recoveryTarget.join(' y ').toLowerCase()} y evita sobrecargar ${formatMuscleGroup(highestFatigueMuscle).toLowerCase()}.`
      : `Reduce intensidad y cuida especialmente ${formatMuscleGroup(highestFatigueMuscle).toLowerCase()} antes de volver a empujar.`,
    recoveryTarget,
    highestFatigueMuscle,
    highestFatigueValue,
  };
}

export function selectCoachInsights(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const weeklyData = selectWeeklyTrainingData(state, referenceDate);
  const weeklyVolume = weeklyData.reduce((total, day) => total + day.totalReps, 0);
  const previousWeekVolume = selectPreviousWeekVolume(state, referenceDate);
  const latestSleep = selectLatestSleepLog(state);
  const latestRecovery = selectLatestRecoveryCheckIn(state);
  const volumeDelta = previousWeekVolume === 0
    ? null
    : Math.round(((weeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);

  const insights: Array<{ id: string; tone: 'good' | 'warn' | 'danger'; title: string; body: string }> = [
    {
      id: 'readiness',
      tone: readiness.coachTone,
      title: readiness.coachTitle,
      body: readiness.coachBody,
    },
    {
      id: 'volume',
      tone: volumeDelta !== null && volumeDelta < 0 ? 'warn' : 'good',
      title: volumeDelta === null ? 'Base semanal establecida.' : `Tu volumen semanal ${volumeDelta >= 0 ? 'subió' : 'bajó'} ${Math.abs(volumeDelta)}%.`,
      body: volumeDelta === null
        ? 'Ya tienes suficiente base para empezar a comparar tendencia semanal.'
        : 'Usa esta tendencia para decidir si subir carga o mantenerte estable una semana más.',
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

      const oneRepMax = set.weight * (1 + set.reps / 30);
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
  const streak = selectTrainingStreak(state);
  const muscleStats = selectMuscleGroupStats(state);
  const trainedMuscles = muscleStats.filter((stat) => stat.totalReps > 0).length;
  const balancedWeek = muscleStats.filter((stat) => stat.totalReps >= 20).length >= 3;

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
      label: 'Racha de 3 días',
      description: 'Entrenar o registrar actividad tres días seguidos.',
      complete: streak >= 3,
    },
    {
      id: 'balanced-week',
      label: 'Semana equilibrada',
      description: 'Activar al menos tres grupos musculares con carga significativa.',
      complete: balancedWeek || trainedMuscles >= 4,
    },
  ];
}

export function selectCurrentWeekLabel(referenceDate = new Date()) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  return capitalizeText(format(weekStart, "d 'de' MMMM", { locale: es }));
}

export { getRecoveryColor, getRecoveryText };
