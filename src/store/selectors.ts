import {
  addDays,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfWeek,
  subDays,
} from 'date-fns';

import { compareDayKeys, formatDayKey, getRecentDayKeys, parseDayKey, toDayKey } from '@/lib/dates';
import {
  calculateFatigue,
  getFatigueBreakdown,
  getRecoveryColor,
  getRecoveryText,
} from '@/lib/fatigue';
import { getTrackedSets, getWorkoutSessionLoadTotal, getWorkoutSessionRepTotal, getWorkoutSessionSetTotal } from '@/lib/workout';
import { formatMuscleGroup, formatMuscleList } from '@/lib/display';
import type { AppStoreData } from '@/store';
import type { ExerciseDefinition, MuscleGroup } from '@/store/types';

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
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
  const hasTrainingHistory = state.sessions.length > 0;
  const recommendedMuscles: MuscleGroup[] = hasTrainingHistory
    ? [...entries]
        .sort((left, right) => left[1] - right[1])
        .slice(0, 2)
        .map(([muscleGroup]) => muscleGroup)
    : ['back', 'legs', 'chest'];
  const highestFatigue = [...entries].sort((left, right) => right[1] - left[1])[0];
  const latestSleep = selectLatestSleepLog(state);
  const lowSleep = Boolean(latestSleep && (latestSleep.durationHours < 7 || latestSleep.qualityScore < 65));
  const highFatigue = Boolean(highestFatigue && highestFatigue[1] >= 70);
  const suggestedDurationMinutes = !hasTrainingHistory
    ? 30
    : readiness >= 80
      ? 45
      : readiness >= 60
        ? 35
        : readiness >= 40
          ? 25
          : 20;
  const suggestedExerciseCount = suggestedDurationMinutes >= 45 ? 4 : suggestedDurationMinutes >= 30 ? 3 : 2;
  const focusLabel = hasTrainingHistory ? formatMuscleList(recommendedMuscles) : 'Cuerpo completo';

  let coachTitle = 'Listo para trabajo progresivo.';
  let coachBody = 'La recuperación está en un punto sólido. Puedes aumentar el volumen con buena técnica hoy.';
  let coachTone: 'good' | 'warn' | 'danger' = 'good';
  let sessionModeLabel = 'Día productivo';
  let decisionBody = 'Tienes margen para entrenar con intención sin sobrecargarte.';
  const riskLabel = highFatigue && highestFatigue
    ? `${formatMuscleGroup(highestFatigue[0])} con fatiga alta`
    : lowSleep
      ? 'Sueño por debajo de lo ideal'
      : hasTrainingHistory
        ? 'Carga semanal estable'
        : 'Sin línea base todavía';
  const riskBody = highFatigue && highestFatigue
    ? `Evita cargar fuerte ${formatMuscleGroup(highestFatigue[0]).toLowerCase()} hoy.`
    : lowSleep
      ? 'Prioriza control técnico y evita perseguir fatiga extra.'
      : hasTrainingHistory
        ? 'La distribución de carga se ve razonable para seguir empujando.'
        : 'Tu primera sesión servirá para calibrar futuras recomendaciones.';

  if (!hasTrainingHistory) {
    coachTitle = 'Empieza con una sesión base.';
    coachBody = 'Haz un entrenamiento corto y limpio para que Fittrack empiece a entender cómo recuperas.';
    sessionModeLabel = 'Sesión base';
    decisionBody = 'Lo mejor ahora es crear una referencia simple antes de optimizar volumen o intensidad.';
  } else if (highestFatigue && highestFatigue[1] >= 70) {
    coachTone = 'danger';
    coachTitle = `Tus ${formatMuscleGroup(highestFatigue[0]).toLowerCase()} necesitan descanso extra.`;
    coachBody = 'Enfócate hoy en los músculos menos fatigados o mantén la sesión ligera y técnica.';
    sessionModeLabel = 'Sesión inteligente';
    decisionBody = 'Conviene mantener la sesión corta y evitar los patrones que más castigan tu músculo en riesgo.';
  } else if (latestSleep && latestSleep.qualityScore < 65) {
    coachTone = 'warn';
    coachTitle = 'El sueño está frenando la recuperación.';
    coachBody = 'Mantén una intensidad moderada y prioriza series limpias antes que buscar la fatiga.';
    sessionModeLabel = 'Sesión técnica';
    decisionBody = 'Tu recuperación sistémica bajó, así que hoy conviene calidad antes que volumen.';
  } else if (readiness < 55) {
    coachTone = 'warn';
    coachTitle = 'La recuperación tiende a ser neutra.';
    coachBody = 'Una sesión más corta tiene más sentido que un entrenamiento de alto volumen ahora mismo.';
    sessionModeLabel = 'Sesión corta';
    decisionBody = 'Tu carga reciente todavía pesa, así que vale más sumar que forzar.';
  } else if (readiness >= 80) {
    sessionModeLabel = 'Día fuerte';
    decisionBody = 'Hoy sí tienes espacio para empujar un poco más si la técnica se mantiene sólida.';
  }

  return {
    readiness,
    fatigue,
    recommendedMuscles,
    highestFatigue,
    suggestedDurationMinutes,
    suggestedExerciseCount,
    coachTone,
    coachTitle,
    coachBody,
    focusLabel,
    sessionModeLabel,
    decisionBody,
    riskLabel,
    riskBody,
    hasTrainingHistory,
  };
}

export function selectRecommendedExercises(
  state: AppStoreData,
  library: ExerciseDefinition[],
  referenceDate = new Date(),
) {
  const { recommendedMuscles, suggestedExerciseCount } = selectReadinessSummary(state, referenceDate);
  const muscleSet = new Set(recommendedMuscles);

  return library
    .filter((exercise) => muscleSet.has(exercise.muscleGroup))
    .slice(0, suggestedExerciseCount);
}

export function selectTrainingStreak(state: AppStoreData) {
  if (state.sessions.length === 0) {
    return 0;
  }

  const trainingDays = Array.from(new Set(state.sessions.map((session) => session.dayKey)))
    .sort(compareDayKeys);
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

  return {
    dayKey,
    sessions,
    foods,
    sleepLog,
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
      label: format(day, 'EEE').slice(0, 1),
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

export function selectCoachInsights(state: AppStoreData, referenceDate = new Date()) {
  const readiness = selectReadinessSummary(state, referenceDate);
  const weeklyData = selectWeeklyTrainingData(state, referenceDate);
  const weeklyVolume = weeklyData.reduce((total, day) => total + day.totalReps, 0);
  const previousWeekVolume = selectPreviousWeekVolume(state, referenceDate);
  const latestSleep = selectLatestSleepLog(state);
  const volumeDelta = previousWeekVolume === 0
    ? null
    : Math.round(((weeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);

  return [
    {
      id: 'readiness',
      tone: readiness.coachTone,
      title: readiness.coachTitle,
      body: readiness.coachBody,
    },
    {
      id: 'volume',
      tone: volumeDelta !== null && volumeDelta < 0 ? 'warn' : 'good',
      title: volumeDelta === null ? 'Línea base establecida.' : `Volumen semanal ${volumeDelta >= 0 ? 'sube' : 'baja'} un ${Math.abs(volumeDelta)}%.`,
      body: volumeDelta === null
        ? 'Ya tienes suficientes datos para empezar a comparar tu carga semanal desde ahora.'
        : 'Usa esta tendencia para decidir si seguir aumentando volumen o mantenerte estable para recuperar.',
    },
    {
      id: 'sleep',
      tone: latestSleep && latestSleep.durationHours < 7 ? 'warn' : 'good',
      title: latestSleep ? `${latestSleep.durationHours}h de sueño registradas.` : 'Sin datos de sueño aún.',
      body: latestSleep
        ? 'El sueño alimenta directamente el modelo de recuperación, registrarlo mejorará las recomendaciones.'
        : 'Registra tu último bloque de sueño para que la estimación de recuperación sea más confiable.',
    },
  ] as const;
}

export function selectWeeklyMomentumSummary(state: AppStoreData, referenceDate = new Date()) {
  const weeklyData = selectWeeklyTrainingData(state, referenceDate);
  const sessionsCompleted = weeklyData.filter((day) => day.trained).length;
  const weeklyVolume = weeklyData.reduce((total, day) => total + day.totalReps, 0);
  const previousWeekVolume = selectPreviousWeekVolume(state, referenceDate);
  const volumeDelta = previousWeekVolume === 0
    ? null
    : Math.round(((weeklyVolume - previousWeekVolume) / previousWeekVolume) * 100);
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weeklySleepLogs = state.sleepLogs.filter((entry) => {
    const loggedAt = parseISO(entry.loggedAt);

    return loggedAt >= weekStart && loggedAt <= referenceDate;
  });
  const averageSleepHours = weeklySleepLogs.length > 0
    ? Number((weeklySleepLogs.reduce((total, entry) => total + entry.durationHours, 0) / weeklySleepLogs.length).toFixed(1))
    : null;
  const targetSessions = 4;

  return {
    sessionsCompleted,
    targetSessions,
    volumeDelta,
    averageSleepHours,
    summary: `${sessionsCompleted}/${targetSessions} sesiones`,
    detail: volumeDelta === null ? 'Primera semana con referencia' : `${volumeDelta >= 0 ? '+' : ''}${volumeDelta}% volumen`,
  };
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

export function selectDashboardCards(state: AppStoreData) {
  const todayKey = selectTodayDayKey();
  const todaySummary = selectDaySummary(state, todayKey);
  const readiness = selectReadinessSummary(state);

  return {
    todayKey,
    todaySummary,
    readiness,
    latestSleep: selectLatestSleepLog(state),
    weeklyMomentum: selectWeeklyMomentumSummary(state),
  };
}

export interface ExerciseHistoryEntry {
  dayKey: string;
  performedAt: string;
  maxWeight: number;
  estimated1RM: number;
  totalVolume: number;
  totalReps: number;
  bestReps: number;
}

export function selectExerciseHistory(state: AppStoreData, exerciseId: string): ExerciseHistoryEntry[] {
  const history: ExerciseHistoryEntry[] = [];

  state.sessions.forEach((session) => {
    const log = session.logs.find((l) => l.exerciseId === exerciseId);
    if (!log) return;

    let maxWeight = 0;
    let max1RM = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let bestReps = 0;

    getTrackedSets(log).forEach((set) => {
      if (set.weight > maxWeight) maxWeight = set.weight;
      const oneRepMax = set.weight * (1 + set.reps / 30);
      if (oneRepMax > max1RM) max1RM = oneRepMax;
      totalVolume += set.reps * set.weight;
      totalReps += set.reps;
      if (set.reps > bestReps) bestReps = set.reps;
    });

    if (totalReps > 0 || totalVolume > 0) {
      history.push({
        dayKey: session.dayKey,
        performedAt: session.performedAt,
        maxWeight,
        estimated1RM: max1RM,
        totalVolume,
        totalReps,
        bestReps,
      });
    }
  });

  // Sort by date ascending to show progression
  return history.sort((a, b) => a.performedAt.localeCompare(b.performedAt));
}

export function selectPersonalRecords(state: AppStoreData): Record<string, number> {
  const prs: Record<string, number> = {};
  
  state.sessions.forEach((session) => {
    session.logs.forEach((log) => {
      let maxWeight = 0;
      log.sets.filter((s) => s.completed).forEach((set) => {
        if (set.weight > maxWeight) maxWeight = set.weight;
      });
      
      if (maxWeight > 0) {
        if (!prs[log.exerciseId] || maxWeight > prs[log.exerciseId]) {
          prs[log.exerciseId] = maxWeight;
        }
      }
    });
  });
  
  return prs;
}

export { getRecoveryColor, getRecoveryText };
