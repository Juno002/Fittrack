import { differenceInHours, subDays } from 'date-fns';
import { useStore, MuscleGroup } from '@/store';

export const FATIGUE_PER_SET = 15; // 15% fatigue per set
export const RECOVERY_HOURS = 48; // 48 hours to fully recover from 100% fatigue (base)
export const BASE_RECOVERY_PER_HOUR = 100 / RECOVERY_HOURS;

// Helper to get dynamic recovery rate based on recent sleep
export function getEffectiveRecoveryPerHour(): number {
  const state = useStore.getState();
  const today = new Date();
  const recentLogs = state.sleepLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= subDays(today, 3);
  });
  
  const avgScore = recentLogs.length > 0
    ? recentLogs.reduce((acc, log) => acc + log.qualityScore, 0) / recentLogs.length
    : 80;
    
  const avgHours = recentLogs.length > 0
    ? recentLogs.reduce((acc, log) => acc + log.durationHours, 0) / recentLogs.length
    : 8;
  
  // Dynamic formula: Recovery is boosted by quality and length of sleep.
  // Base is 8 hours at 80% quality.
  // Multiplier logic: (hours / 8) * (quality / 80)
  const sleepEfficiency = (avgHours / 8) * (avgScore / 80);
  const sleepMultiplier = Math.max(0.3, Math.min(1.5, sleepEfficiency));
  
  // Profile multiplier (older = slower recovery)
  const age = state.profile?.age || 25;
  const ageMultiplier = age > 30 ? 1 - ((age - 30) * 0.01) : 1; 
  
  return BASE_RECOVERY_PER_HOUR * sleepMultiplier * ageMultiplier;
}

export function calculateFatigueAt(targetDate: Date): Record<MuscleGroup, number> {
  const state = useStore.getState();
  const EFFECTIVE_RECOVERY_RATE = getEffectiveRecoveryPerHour();
  
  const fatigue: Record<MuscleGroup, number> = {
    chest: 0,
    back: 0,
    legs: 0,
    shoulders: 0,
    arms: 0,
    core: 0,
  };

  // Look at sessions before the target date
  const relevantSessions = state.sessions.filter(session => {
    const sessionDate = new Date(session.date);
    return sessionDate <= targetDate;
  });

  relevantSessions.forEach(session => {
    const hoursSince = differenceInHours(targetDate, new Date(session.date));
    if (hoursSince < 0 || hoursSince > RECOVERY_HOURS * 2) return; // Optimization skip

    session.logs.forEach(log => {
      const exercise = state.exercises.find(e => e.id === log.exerciseId);
      if (!exercise) return;

      const sets = log.sets.length;
      const addedFatigue = sets * FATIGUE_PER_SET;
      const decayedFatigue = Math.max(0, addedFatigue - (hoursSince * EFFECTIVE_RECOVERY_RATE));
      
      fatigue[exercise.muscleGroup] += decayedFatigue;
    });
  });

  (Object.keys(fatigue) as MuscleGroup[]).forEach(key => {
    fatigue[key] = Math.min(100, Math.max(0, fatigue[key]));
  });

  return fatigue;
}

export function calculateFatigue(): Record<MuscleGroup, number> {
  return calculateFatigueAt(new Date());
}

export interface FatigueContribution {
  sessionName: string;
  date: string;
  exerciseName: string;
  sets: number;
  fatigueContribution: number;
}

export function getFatigueBreakdown(muscleGroup: MuscleGroup): FatigueContribution[] {
  const state = useStore.getState();
  const EFFECTIVE_RECOVERY_RATE = getEffectiveRecoveryPerHour();
  const now = new Date();
  const contributions: FatigueContribution[] = [];

  state.sessions.forEach(session => {
    const hoursSince = differenceInHours(now, new Date(session.date));
    if (hoursSince < 0 || hoursSince > RECOVERY_HOURS * 2) return;

    session.logs.forEach(log => {
      const exercise = state.exercises.find(e => e.id === log.exerciseId);
      if (!exercise || exercise.muscleGroup !== muscleGroup) return;

      const sets = log.sets.length;
      const addedFatigue = sets * FATIGUE_PER_SET;
      const decayedFatigue = Math.max(0, addedFatigue - (hoursSince * EFFECTIVE_RECOVERY_RATE));
      
      if (decayedFatigue > 0) {
        contributions.push({
          sessionName: session.name,
          date: session.date,
          exerciseName: exercise.name,
          sets,
          fatigueContribution: decayedFatigue
        });
      }
    });
  });

  return contributions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getRecoveryColor(fatigue: number) {
  if (fatigue < 20) return 'bg-emerald-500'; // Fully recovered
  if (fatigue < 50) return 'bg-amber-400'; // Partially recovered
  if (fatigue < 80) return 'bg-orange-500'; // Fatigued
  return 'bg-red-500'; // Highly fatigued
}

export function getRecoveryText(fatigue: number) {
  if (fatigue < 20) return 'Listo para entrenar';
  if (fatigue < 50) return 'Recuperación parcial';
  if (fatigue < 80) return 'Fatigado';
  return 'Necesita descanso';
}
