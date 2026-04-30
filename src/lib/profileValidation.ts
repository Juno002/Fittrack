import type { AppSettings, UserProfile } from '@/store/types';

export const PROFILE_AGE_RANGE = { min: 10, max: 100 };
export const PROFILE_HEIGHT_RANGE_CM = { min: 100, max: 250 };

const WEIGHT_RANGES = {
  metric: { min: 20, max: 300, unitLabel: 'kg' },
  imperial: { min: 44, max: 660, unitLabel: 'lb' },
} as const;

export interface ProfileFieldErrors {
  age: string | null;
  height: string | null;
  weight: string | null;
}

function getRangeMessage(label: string, minimum: number, maximum: number, suffix = '') {
  return `${label} debe estar entre ${minimum}${suffix} y ${maximum}${suffix}.`;
}

export function getWeightRange(unitSystem: AppSettings['unitSystem']) {
  return WEIGHT_RANGES[unitSystem];
}

export function validateAge(age: number) {
  if (!Number.isFinite(age) || age < PROFILE_AGE_RANGE.min || age > PROFILE_AGE_RANGE.max) {
    return getRangeMessage('La edad', PROFILE_AGE_RANGE.min, PROFILE_AGE_RANGE.max);
  }

  return null;
}

export function validateHeight(height: number) {
  if (!Number.isFinite(height) || height < PROFILE_HEIGHT_RANGE_CM.min || height > PROFILE_HEIGHT_RANGE_CM.max) {
    return getRangeMessage('La altura', PROFILE_HEIGHT_RANGE_CM.min, PROFILE_HEIGHT_RANGE_CM.max, ' cm');
  }

  return null;
}

export function validateDisplayWeight(weight: number, unitSystem: AppSettings['unitSystem']) {
  const range = getWeightRange(unitSystem);
  if (!Number.isFinite(weight) || weight < range.min || weight > range.max) {
    return getRangeMessage('El peso', range.min, range.max, ` ${range.unitLabel}`);
  }

  return null;
}

export function validateProfileFields(
  profile: Pick<UserProfile, 'age' | 'height'>,
  displayWeight: number,
  unitSystem: AppSettings['unitSystem'],
): ProfileFieldErrors {
  return {
    age: validateAge(profile.age),
    height: validateHeight(profile.height),
    weight: validateDisplayWeight(displayWeight, unitSystem),
  };
}

export function hasProfileFieldErrors(errors: ProfileFieldErrors) {
  return Object.values(errors).some(Boolean);
}
