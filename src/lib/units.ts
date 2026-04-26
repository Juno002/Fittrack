const KG_TO_LB_RATIO = 2.20462;

export function kgToLb(kg: number): number {
  return kg * KG_TO_LB_RATIO;
}

export function lbToKg(lb: number): number {
  return lb / KG_TO_LB_RATIO;
}

export function formatWeight(weightInKg: number, unitSystem: 'metric' | 'imperial'): string {
  if (unitSystem === 'imperial') {
    return `${Math.round(kgToLb(weightInKg))} lb`;
  }
  return `${Math.round(weightInKg)} kg`;
}

export function getDisplayWeight(weightInKg: number, unitSystem: 'metric' | 'imperial'): number {
  if (unitSystem === 'imperial') {
    return Math.round(kgToLb(weightInKg));
  }
  return Math.round(weightInKg);
}

export function getStorageWeight(displayWeight: number, unitSystem: 'metric' | 'imperial'): number {
  if (unitSystem === 'imperial') {
    return lbToKg(displayWeight);
  }
  return displayWeight;
}
