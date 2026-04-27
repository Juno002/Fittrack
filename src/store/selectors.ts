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

import { getNextProgressionStep, getProgressionTrackSteps } from '@/lib/exercises';
import {
  buildMuscleStatuses,
  calculateWeeklyVolume,
  getFatigueBreakdown,
  getMuscleStatusColor,
  getMuscleStatusIntensity,
  getMuscleStatusLabel,
  getMuscleStatusTone,
  getRecoveryStateLabel,
  getSleepRecoveryWarning,
  getVolumeZoneLabel,
  type MuscleStatus,
} from '@/lib/fatigue';
import { compareDayKeys, formatDayKey, getRecentDayKeys, parseDayKey, toDayKey } from '@/lib/dates';
import { formatMuscleGroup } from '@/lib/display';
import {
  getWorkoutLogLoadTotal,
  getWorkoutLogRepTotal,
  getWorkoutSessionLoadTotal,
  getWorkoutSessionRepTotal,
  getWorkoutSessionSetTotal,
} from '@/lib/workout';
import type { AppStoreData } from '@/store';
import type { ExerciseDefinition, MuscleGroup, ProgressionTrackId } from '@/store/types';

function getStatusSeverity(status: MuscleStatus) {
  if (status.volumeZone === 'over_mrv') {
    return 6;
  }

  if (status.performanceWarning) {
    return 5;
  }

  if (status.acuteRecoveryState === 'delayed_peak') {
    return 4;
  }

  if (status.acuteRecoveryState === 'early') {
    return 3;
  }

  if (status.volumeZone === 'high') {
    return 2;
  }

  if (status.volumeZone === 'below_mev') {
    return 1;
  }

  return 0;
}

function getRecommendedMuscleScore(status: MuscleStatus) {
  const recoveryScore = status.acuteRecoveryState === 'recovered' ? 0 : status.acuteRecoveryState === 'early' ? 10 : 20;
  const warningScore = status.performanceWarning ? 25 : 0;
  const volumeRatio = status.weeklySets / Math.max(status.thresholds.mavMax, 1);
  const volumePenalty = status.volumeZone === 'over_mrv'
    ? 100
    : status.volumeZone === 'high'
      ? 20
      : Math.round(volumeRatio * 10);

  return recoveryScore + warningScore + volumePenalty;
}

function getProgressionReadiness(log: AppStoreData['sessions'][number]['logs'][number], effort: number) {
  const completedSetsAboveThreshold = log.sets.filter((set) => set.completed && set.reps > 12).length;
  return completedSetsAboveThreshold >= 2 && effort <= 3;
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

export function selectMuscleStatuses(state: AppStoreData, referenceDate = new Date()) {
  return buildMuscleStatuses({
    sessions: state.sessions,
    sleepLogs: state.sleepLogs,
    referenceDate,
  });
}

export function selectFatigueSummary(state: AppStoreData, referenceDate = new Date()) {
  return selectMuscleStatuses(state, referenceDate);
}

export function selectReadinessSummary(state: AppStoreData, referenceDate = new Date()) {
  const muscleStatuses = selectMuscleStatuses(state, referenceDate);
  const entries = Object.values(muscleStatuses);
  const sortedBySeverity = [...entries].sort((left, right) => (
    getStatusSeverity(right) - getStatusSeverity(left)
      || right.weeklySets - left.weeklySets
  ));
  const primaryAlert = sortedBySeverity[0] ?? null;
  const recommendedMuscles = entries
    .filter((status) => status.volumeZone !== 'over_mrv')
    .sort((left, right) => getRecommendedMuscleScore(left) - getRecommendedMuscleScore(right))
    .slice(0, 2)
    .map((status) => status.muscleGroup);
  const sleepWarning = getSleepRecoveryWarning(state.sleepLogs, referenceDate);

  let coachTone: 'good' | 'warn' | 'danger' = 'good';
  let coachTitle = 'Lista para progresar.';
  let coachBody = 'Tus grupos mejor posicionados están recuperados y en una zona sostenible para seguir empujando.';

  if (primaryAlert) {
    const muscleName = formatMuscleGroup(primaryAlert.muscleGroup).toLowerCase();

    if (primaryAlert.volumeZone === 'over_mrv') {
      coachTone = 'danger';
      coachTitle = `Detén ${muscleName} esta semana.`;
      coachBody = `Ya superaste el MRV de ${muscleName}. Más volumen ahora probablemente añadiría daño sin mejorar la adaptación.`;
    } else if (primaryAlert.performanceWarning) {
      coachTone = 'warn';
      coachTitle = `Caída de rendimiento en ${muscleName}.`;
      coachBody = `Tu sesión reciente rindió peor que la comparable anterior. Si además sigue doliendo, conviene bajar intensidad o descansar antes de repetir ${muscleName}.`;
    } else if (primaryAlert.acuteRecoveryState === 'delayed_peak') {
      coachTone = 'warn';
      coachTitle = `Pico retardado en ${muscleName}.`;
      coachBody = `Ese músculo sigue dentro de la ventana de daño retardado de 24-72h. Te conviene entrenar otro foco mientras termina de asentarse la recuperación periférica.`;
    } else if (primaryAlert.acuteRecoveryState === 'early') {
      coachTone = 'warn';
      coachTitle = `${formatMuscleGroup(primaryAlert.muscleGroup)} aún recuperando.`;
      coachBody = `Todavía estás en la primera fase de recuperación aguda. Puedes entrenar, pero tiene más sentido priorizar músculos ya recuperados.`;
    } else if (primaryAlert.volumeZone === 'high') {
      coachTone = 'warn';
      coachTitle = `Volumen alto en ${muscleName}.`;
      coachBody = `Estás por encima del rango adaptativo cómodo. Monitorea dolor, rendimiento y sueño antes de seguir cargando ese músculo.`;
    } else if (primaryAlert.volumeZone === 'below_mev' && primaryAlert.weeklySets > 0) {
      coachTone = 'warn';
      coachTitle = `Volumen insuficiente en ${muscleName}.`;
      coachBody = `Aún no alcanzas el MEV de ${muscleName}. Si quieres hipertrofia ahí, todavía te faltan series efectivas esta semana.`;
    } else if (primaryAlert.volumeZone === 'optimal') {
      coachTone = 'good';
      coachTitle = `Zona óptima en ${muscleName}.`;
      coachBody = `Ese músculo está dentro de un rango útil de volumen semanal y ya no arrastra fatiga aguda relevante.`;
    }
  }

  if (sleepWarning) {
    coachTone = coachTone === 'danger' ? 'danger' : 'warn';
    coachBody = `${coachBody} Además, tu sueño reciente está por debajo de 7h de promedio, así que conviene interpretar el recovery con más prudencia.`;
  }

  const maxSeverity = primaryAlert ? getStatusSeverity(primaryAlert) : 0;
  const suggestedDurationMinutes = maxSeverity >= 6
    ? 20
    : maxSeverity >= 5
      ? 25
      : maxSeverity >= 4
        ? 30
        : maxSeverity >= 3 || sleepWarning
          ? 35
          : 45;

  return {
    muscleStatuses,
    recommendedMuscles,
    highestAlertMuscle: primaryAlert?.muscleGroup ?? null,
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
  const { recommendedMuscles, muscleStatuses } = selectReadinessSummary(state, referenceDate);
  const muscleSet = new Set(recommendedMuscles);

  return library
    .filter((exercise) => muscleSet.has(exercise.muscleGroup))
    .sort((left, right) => {
      const leftStatus = muscleStatuses[left.muscleGroup];
      const rightStatus = muscleStatuses[right.muscleGroup];
      return getRecommendedMuscleScore(leftStatus) - getRecommendedMuscleScore(rightStatus);
    })
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
      title: volumeDelta === null ? 'Línea base establecida.' : `Volumen semanal ${volumeDelta >= 0 ? 'sube' : 'baja'} un ${Math.abs(volumeDelta)}%.`,
      body: volumeDelta === null
        ? 'Ya tienes suficientes datos para empezar a comparar tu carga semanal desde ahora.'
        : 'Úsalo para decidir si seguir acumulando volumen o reservar una semana más liviana.',
    },
    {
      id: 'sleep',
      tone: latestSleep && latestSleep.durationHours < 7 ? 'warn' : 'good',
      title: latestSleep ? `${latestSleep.durationHours}h de sueño registradas.` : 'Sin datos de sueño aún.',
      body: latestSleep
        ? 'El sueño ahora actúa como señal cualitativa de recuperación, no como multiplicador opaco del MRV.'
        : 'Registrar el sueño hará más honestas las advertencias del coach sobre recuperación comprometida.',
    },
  ];

  const recentSessions = [...state.sessions]
    .filter((session) => differenceInHours(referenceDate, new Date(session.performedAt)) < 24 * 7)
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt));

  for (const session of recentSessions) {
    for (const log of session.logs) {
      if (!log.progressionTrackId || log.progressionStep === null) {
        continue;
      }

      if (!getProgressionReadiness(log, session.effort)) {
        continue;
      }

      const nextStep = getNextProgressionStep(log.progressionTrackId, log.progressionStep);
      insights.push({
        id: `progression-${log.exerciseId}`,
        tone: 'good',
        title: `Progresión disponible en ${log.exerciseName}.`,
        body: nextStep
          ? `Tu última sesión quedó demasiado fácil para hipertrofia. Prueba ${nextStep.name} para volver al rango útil de tensión.`
          : 'Ya estás en el último nivel del track. Sube la dificultad con más ROM, explosividad o trabajo unilateral.',
      });
      break;
    }

    if (insights.length > 3) {
      break;
    }
  }

  return insights.slice(0, 4);
}

export function selectMuscleBreakdown(state: AppStoreData, muscleGroup: MuscleGroup, referenceDate = new Date()) {
  return getFatigueBreakdown(
    {
      sessions: state.sessions,
      sleepLogs: state.sleepLogs,
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

export interface ExerciseProgressionSummary {
  trackId: ProgressionTrackId;
  currentStep: number;
  currentLabel: string;
  nextStep: { id: string; name: string; trackId: ProgressionTrackId; step: number } | null;
  steps: ReturnType<typeof getProgressionTrackSteps>;
  shouldAdvance: boolean;
}

export function selectExerciseProgression(
  state: AppStoreData,
  exercise: ExerciseDefinition,
): ExerciseProgressionSummary | null {
  if (!exercise.progressionTrackId || exercise.progressionStep === null) {
    return null;
  }

  const latestSession = [...state.sessions]
    .sort((left, right) => right.performedAt.localeCompare(left.performedAt))
    .find((session) => session.logs.some((log) => log.exerciseId === exercise.id));
  const matchingLog = latestSession?.logs.find((log) => log.exerciseId === exercise.id) ?? null;
  const steps = getProgressionTrackSteps(exercise.progressionTrackId);
  const currentLabel = steps.find((step) => step.step === exercise.progressionStep)?.name ?? exercise.name;

  return {
    trackId: exercise.progressionTrackId,
    currentStep: exercise.progressionStep,
    currentLabel,
    nextStep: getNextProgressionStep(exercise.progressionTrackId, exercise.progressionStep),
    steps,
    shouldAdvance: matchingLog ? getProgressionReadiness(matchingLog, latestSession?.effort ?? 5) : false,
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
  const personalRecords: Record<string, number> = {};

  state.sessions.forEach((session) => {
    session.logs.forEach((log) => {
      let maxWeight = 0;
      log.sets.filter((set) => set.completed).forEach((set) => {
        if (set.weight > maxWeight) {
          maxWeight = set.weight;
        }
      });

      if (maxWeight > 0) {
        if (!personalRecords[log.exerciseId] || maxWeight > personalRecords[log.exerciseId]) {
          personalRecords[log.exerciseId] = maxWeight;
        }
      }
    });
  });

  return personalRecords;
}

export function selectMuscleGroupStats(state: AppStoreData) {
  const stats: Record<MuscleGroup, { totalReps: number; totalLoad: number }> = {
    chest: { totalReps: 0, totalLoad: 0 },
    back: { totalReps: 0, totalLoad: 0 },
    legs: { totalReps: 0, totalLoad: 0 },
    shoulders: { totalReps: 0, totalLoad: 0 },
    biceps: { totalReps: 0, totalLoad: 0 },
    triceps: { totalReps: 0, totalLoad: 0 },
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

export {
  calculateWeeklyVolume,
  getMuscleStatusColor,
  getMuscleStatusIntensity,
  getMuscleStatusLabel,
  getMuscleStatusTone,
  getRecoveryStateLabel,
  getVolumeZoneLabel,
};
