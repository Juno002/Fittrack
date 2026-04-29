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

export function calculateBodyMassIndex(weightInKg: number, heightInCm: number): number | null {
  if (weightInKg <= 0 || heightInCm <= 0) {
    return null;
  }

  const heightInMeters = heightInCm / 100;
  const bmi = weightInKg / (heightInMeters * heightInMeters);
  return Math.round(bmi * 10) / 10;
}

export function getBodyMassIndexLabel(bmi: number | null): string {
  if (bmi === null) {
    return 'Sin calcular';
  }

  if (bmi < 18.5) {
    return 'Bajo peso';
  }

  if (bmi < 25) {
    return 'Rango saludable';
  }

  if (bmi < 30) {
    return 'Sobrepeso';
  }

  return 'Obesidad';
}
