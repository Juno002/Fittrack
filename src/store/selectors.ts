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

import { compareDayKeys, formatDayKey, getRecentDayKeys, parseDayKey, toDayKey } from '@/lib/dates';
import { formatMuscleGroup } from '@/lib/display';
import {
  calculateFatigue,
  getFatigueBreakdown,
  getRecoveryColor,
  getRecoveryText,
  calculateWeeklyVolume,
  getSleepModifier,
  getEffectiveMRV
} from '@/lib/fatigue';
import {
  getWorkoutSessionLoadTotal,
  getWorkoutSessionRepTotal,
  getWorkoutSessionSetTotal,
  getWorkoutLogRepTotal,
  getWorkoutLogLoadTotal,
} from '@/lib/workout';
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
  
  const weeklyVolume = calculateWeeklyVolume(state.sessions, referenceDate);
  const sleepMod = getSleepModifier(state.sleepLogs, referenceDate);
  
  let coachTitle = 'Volumen bajo.';
  let coachBody = 'Aún no realizas suficiente volumen para crecer óptimamente esta semana.';
  let coachTone: 'good' | 'warn' | 'danger' = 'warn';

  // Analyze the muscle with the most sets relative to its MRV
  let maxRatio = 0;
  let maxMuscle: MuscleGroup = 'chest';
  let zone = 'low'; // low, optimal, high, over
  
  for (const muscle of Object.keys(weeklyVolume) as MuscleGroup[]) {
    const sets = weeklyVolume[muscle];
    const limits = getEffectiveMRV(muscle, sleepMod);
    if (sets === 0) continue;
    
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
    coachBody = `No entrenes tus ${muscleName} más esta semana. Has superado su Máximo Volumen Recuperable (MRV). Sugerimos actividades de baja intensidad o un día de descanso absoluto.`;
  } else if (zone === 'high') {
    coachTone = 'warn';
    coachTitle = `Volumen alto en ${muscleName}.`;
    coachBody = `Estás cerca del límite para ${muscleName}. Tomar un día de descanso activo (caminar, yoga ligero) mejorará tu recuperación general.`;
  } else if (zone === 'optimal') {
    coachTone = 'good';
    coachTitle = `Volumen óptimo en ${muscleName}.`;
    coachBody = 'Estás en la zona ideal de hipertrofia. Duerme al menos 7-8 horas esta noche para consolidar este estímulo.';
  } else if (maxRatio > 0 && sleepMod < 0.9) {
     coachTone = 'warn';
     coachTitle = `Recuperación comprometida.`;
     coachBody = `La falta reciente de sueño de calidad (o duración) ha reducido tu capacidad de recuperación. Prioriza el descanso o reduce el volumen de tu próxima sesión.`;
  } else if (maxRatio > 0) {
    coachTone = 'warn';
    coachTitle = `Volumen insuficiente en ${muscleName}.`;
    coachBody = 'Aún estás por debajo del Volumen Mínimo Efectivo (MEV). Necesitas más series para crecer.';
  } else {
    coachTone = 'good';
    coachTitle = `Listo para progresar.`;
    coachBody = 'Tu recuperación está al máximo. Es un gran momento para una sesión de alta intensidad o un récord personal.';
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

  const insights: Array<{ id: string, tone: 'good' | 'warn' | 'danger', title: string, body: string }> = [
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
  ];

  // Progression Insight: Look for exercises with > 12 reps and low-medium session effort (<= 3) in recent days
  const recentSessions = state.sessions.filter(s => differenceInHours(referenceDate, new Date(s.performedAt)) < 168); // Last 7 days
  for (const session of recentSessions) {
    if (session.effort <= 3) {
      for (const log of session.logs) {
        if (log.sets.some(set => set.completed && set.reps > 12)) {
          insights.push({
            id: 'progression',
            tone: 'good',
            title: `Progresión disponible en ${log.exerciseName}.`,
            body: `Hiciste más de 12 repeticiones sintiéndolo relativamente fácil. Es hora de aumentar el peso o buscar una variante más difícil.`,
          });
          break; // just show one progression insight to avoid clutter
        }
      }
    }
  }

  // Only keep the first progression insight, but ensure total insights isn't too huge or just display it. We can show max 4.
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

export function selectDashboardCards(state: AppStoreData) {
  const todayKey = selectTodayDayKey();
  const todaySummary = selectDaySummary(state, todayKey);
  const readiness = selectReadinessSummary(state);

  return {
    todayKey,
    todaySummary,
    readiness,
    latestSleep: selectLatestSleepLog(state),
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
    const log = session.logs.find((l) => l.exerciseId === exerciseId);
    if (!log) return;

    let maxWeight = 0;
    let max1RM = 0;
    let totalVolume = 0;

    log.sets.filter((s) => s.completed).forEach((set) => {
      if (set.weight > maxWeight) maxWeight = set.weight;
      const oneRepMax = set.weight * (1 + set.reps / 30);
      if (oneRepMax > max1RM) max1RM = oneRepMax;
      totalVolume += set.reps * set.weight;
    });

    if (totalVolume > 0 || (log.isBodyweight && log.sets.some(s => s.completed))) {
      history.push({
        dayKey: session.dayKey,
        performedAt: session.performedAt,
        maxWeight,
        estimated1RM: max1RM,
        totalVolume,
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

      if (stats[log.muscleGroup]) {
        stats[log.muscleGroup].totalReps += reps;
        stats[log.muscleGroup].totalLoad += load;
      }
    });
  });

  return Object.entries(stats).map(([muscleGroup, data]) => ({
    muscleGroup: muscleGroup as MuscleGroup,
    ...data,
  }));
}

export { getRecoveryColor, getRecoveryText };
