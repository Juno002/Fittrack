import { describe, expect, it } from 'vitest';

import { buildGuidedRoutinePreset, buildGuidedWorkoutSteps } from '@/lib/guidedWorkout';
import { createDraftSession } from '@/lib/workout';
import type { ExerciseDefinition } from '@/store/types';

const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'push-ups',
    name: 'Flexiones',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'ArrowDown',
    source: 'legacy',
  },
  {
    id: 'Clock_Push-Up',
    name: 'Clock Push-Up',
    muscleGroup: 'chest',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'ArrowDown',
    source: 'catalog',
  },
  {
    id: 'Close-Grip_Push-Up_off_of_a_Dumbbell',
    name: 'Close-Grip Push-Up off of a Dumbbell',
    muscleGroup: 'arms',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'Dumbbell',
    source: 'catalog',
  },
  {
    id: 'Bodyweight_Squat',
    name: 'Bodyweight Squat',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'Accessibility',
    source: 'catalog',
  },
  {
    id: 'Bodyweight_Walking_Lunge',
    name: 'Bodyweight Walking Lunge',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'compound',
    iconName: 'Footprints',
    source: 'catalog',
  },
  {
    id: 'Butt_Lift_Bridge',
    name: 'Butt Lift (Bridge)',
    muscleGroup: 'legs',
    isBodyweight: true,
    mechanic: 'isolation',
    iconName: 'Footprints',
    source: 'catalog',
  },
  {
    id: 'Dead_Bug',
    name: 'Dead Bug',
    muscleGroup: 'core',
    isBodyweight: true,
    mechanic: 'isolation',
    iconName: 'Timer',
    source: 'catalog',
  },
  {
    id: 'Crunches',
    name: 'Crunches',
    muscleGroup: 'core',
    isBodyweight: true,
    mechanic: 'isolation',
    iconName: 'Timer',
    source: 'catalog',
  },
  {
    id: 'Flutter_Kicks',
    name: 'Flutter Kicks',
    muscleGroup: 'core',
    isBodyweight: true,
    mechanic: 'isolation',
    iconName: 'Timer',
    source: 'catalog',
  },
];

describe('guided workout routines', () => {
  it('builds bodyweight presets for upper, lower and core routines', () => {
    const upper = buildGuidedRoutinePreset(EXERCISES, 'upper');
    const lower = buildGuidedRoutinePreset(EXERCISES, 'lower');
    const core = buildGuidedRoutinePreset(EXERCISES, 'core');

    expect(upper.logs).toHaveLength(3);
    expect(lower.logs).toHaveLength(3);
    expect(core.logs).toHaveLength(3);
    expect(upper.logs.every((log) => log.sets.length >= 2)).toBe(true);
    expect(lower.logs.every((log) => log.sets.length >= 2)).toBe(true);
    expect(core.logs.every((log) => log.sets.length >= 2)).toBe(true);
  });

  it('creates a guided flow with warmup, transition, main steps and cooldown', () => {
    const preset = buildGuidedRoutinePreset(EXERCISES, 'upper');
    const draftSession = createDraftSession({
      name: preset.name,
      logs: preset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });

    const steps = buildGuidedWorkoutSteps(draftSession);

    expect(steps[0]?.kind).toBe('warmup');
    expect(steps[1]?.kind).toBe('warmup');
    expect(steps[2]?.kind).toBe('warmup');
    expect(steps[3]?.kind).toBe('transition');
    expect(steps[3]?.kind === 'transition' ? steps[3].title : '').toBe('Prepárate para empezar');
    expect(steps[0]?.kind === 'warmup' ? steps[0].visualKey : null).toBe('arm-circles');
    expect(steps.some((step) => step.kind === 'main')).toBe(true);
    expect(steps.slice(-2).every((step) => step.kind === 'cooldown')).toBe(true);
    expect(steps[0]?.kind === 'warmup' ? steps[0].durationSeconds : 0).toBe(60);
    expect(steps[3]?.kind === 'transition' ? steps[3].durationSeconds : 0).toBe(60);

    const mainStep = steps.find((step) => step.kind === 'main');
    expect(mainStep && mainStep.kind === 'main' ? mainStep.isBodyweight : false).toBe(true);
    expect(mainStep && mainStep.kind === 'main' ? mainStep.detail : '').toMatch(/No necesitas registrar peso/i);
  });

  it('marks local visual matches for core cooldown steps', () => {
    const preset = buildGuidedRoutinePreset(EXERCISES, 'core');
    const draftSession = createDraftSession({
      name: preset.name,
      logs: preset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });

    const steps = buildGuidedWorkoutSteps(draftSession);
    const cooldownSteps = steps.filter((step) => step.kind === 'cooldown');

    expect(cooldownSteps[0]?.kind === 'cooldown' ? cooldownSteps[0].visualKey : null).toBe('torso-rotation');
    expect(cooldownSteps[1]?.kind === 'cooldown' ? cooldownSteps[1].visualKey : null).toBe('child-pose');
  });

  it('maps lower and upper cooldowns to the static local visuals', () => {
    const lowerPreset = buildGuidedRoutinePreset(EXERCISES, 'lower');
    const lowerDraftSession = createDraftSession({
      name: lowerPreset.name,
      logs: lowerPreset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });
    const lowerCooldowns = buildGuidedWorkoutSteps(lowerDraftSession).filter((step) => step.kind === 'cooldown');

    expect(lowerCooldowns[0]?.kind === 'cooldown' ? lowerCooldowns[0].visualKey : null).toBe('glute-release');
    expect(lowerCooldowns[1]?.kind === 'cooldown' ? lowerCooldowns[1].visualKey : null).toBe('hamstrings-ankles');

    const upperPreset = buildGuidedRoutinePreset(EXERCISES, 'upper');
    const upperDraftSession = createDraftSession({
      name: upperPreset.name,
      logs: upperPreset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });
    const upperCooldowns = buildGuidedWorkoutSteps(upperDraftSession).filter((step) => step.kind === 'cooldown');

    expect(upperCooldowns[0]?.kind === 'cooldown' ? upperCooldowns[0].visualKey : null).toBe('chest-opener');
    expect(upperCooldowns[1]?.kind === 'cooldown' ? upperCooldowns[1].visualKey : null).toBe('upper-back-release');
  });

  it('maps the updated phase 2 warmups to the new local visuals', () => {
    const upperPreset = buildGuidedRoutinePreset(EXERCISES, 'upper');
    const upperDraftSession = createDraftSession({
      name: upperPreset.name,
      logs: upperPreset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });
    const upperSteps = buildGuidedWorkoutSteps(upperDraftSession);

    expect(upperSteps[1]?.kind === 'warmup' ? upperSteps[1].title : '').toBe('Circulos de hombros');
    expect(upperSteps[1]?.kind === 'warmup' ? upperSteps[1].visualKey : null).toBe('shoulder-circles');

    const corePreset = buildGuidedRoutinePreset(EXERCISES, 'core');
    const coreDraftSession = createDraftSession({
      name: corePreset.name,
      logs: corePreset.logs.slice(0, 1),
      restDurationSeconds: 75,
    });
    const coreSteps = buildGuidedWorkoutSteps(coreDraftSession);

    expect(coreSteps[2]?.kind === 'warmup' ? coreSteps[2].title : '').toBe('Brazos y piernas opuestos en suelo');
    expect(coreSteps[2]?.kind === 'warmup' ? coreSteps[2].visualKey : null).toBe('opposite-limbs-floor');
  });
});
