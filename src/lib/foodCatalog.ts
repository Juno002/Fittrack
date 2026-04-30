import type { FoodEntry } from '@/store/types';

export interface LocalFoodPreset {
  id: string;
  name: string;
  aliases: string[];
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes?: string;
}

const FOOD_PRESETS: LocalFoodPreset[] = [
  { id: 'mangu-salami', name: 'Mangu con salami', aliases: ['mangu', 'mangú', 'mangu con salami', 'mangú con salami'], servingLabel: '1 plato mediano', calories: 540, protein: 17, carbs: 58, fat: 26, notes: 'Base estimada con mangu, salami frito y cebolla.' },
  { id: 'mangu-completo', name: 'Mangu completo', aliases: ['mangu completo', 'mangú completo', 'tres golpes'], servingLabel: '1 plato mediano', calories: 760, protein: 29, carbs: 69, fat: 41, notes: 'Incluye huevo, queso frito y salami.' },
  { id: 'mangu-solo', name: 'Mangu solo', aliases: ['mangu solo', 'mangú solo', 'pure de platano'], servingLabel: '1 taza grande', calories: 260, protein: 3, carbs: 52, fat: 5 },
  { id: 'arroz-blanco', name: 'Arroz blanco', aliases: ['arroz blanco', 'arroz'], servingLabel: '1 taza cocida', calories: 205, protein: 4, carbs: 45, fat: 0 },
  { id: 'habichuelas-guisadas', name: 'Habichuelas guisadas', aliases: ['habichuelas', 'habichuelas guisadas', 'frijoles guisados'], servingLabel: '1 taza', calories: 210, protein: 12, carbs: 32, fat: 4 },
  { id: 'pollo-guisado', name: 'Pollo guisado', aliases: ['pollo guisado', 'pollo'], servingLabel: '1 porcion mediana', calories: 285, protein: 33, carbs: 4, fat: 14 },
  { id: 'pollo-plancha', name: 'Pechuga a la plancha', aliases: ['pechuga', 'pechuga a la plancha', 'pollo a la plancha'], servingLabel: '150 g cocidos', calories: 248, protein: 46, carbs: 0, fat: 5 },
  { id: 'salami-frito', name: 'Salami frito', aliases: ['salami', 'salami frito'], servingLabel: '4 ruedas medianas', calories: 220, protein: 10, carbs: 2, fat: 19 },
  { id: 'queso-frito', name: 'Queso frito', aliases: ['queso frito', 'queso'], servingLabel: '3 tajadas', calories: 280, protein: 15, carbs: 4, fat: 22 },
  { id: 'huevo-frito', name: 'Huevo frito', aliases: ['huevo frito', 'huevo'], servingLabel: '1 unidad', calories: 90, protein: 6, carbs: 0, fat: 7 },
  { id: 'avena-leche', name: 'Avena con leche', aliases: ['avena', 'avena con leche'], servingLabel: '1 taza', calories: 260, protein: 11, carbs: 38, fat: 7 },
  { id: 'batata-hervida', name: 'Batata hervida', aliases: ['batata', 'batata hervida', 'camote'], servingLabel: '1 taza', calories: 180, protein: 4, carbs: 41, fat: 0 },
  { id: 'yuca-hervida', name: 'Yuca hervida', aliases: ['yuca', 'yuca hervida'], servingLabel: '1 taza', calories: 330, protein: 3, carbs: 78, fat: 0 },
  { id: 'platano-hervido', name: 'Platano hervido', aliases: ['platano hervido', 'plátano hervido'], servingLabel: '1 unidad mediana', calories: 220, protein: 2, carbs: 57, fat: 0 },
  { id: 'spaghetti-rojo', name: 'Espaguetis con salsa roja', aliases: ['espagueti', 'espaguetis', 'spaghetti', 'spaghetti rojo'], servingLabel: '1 plato mediano', calories: 420, protein: 12, carbs: 70, fat: 10 },
  { id: 'res-guisada', name: 'Carne de res guisada', aliases: ['res guisada', 'carne guisada', 'carne de res'], servingLabel: '1 porcion mediana', calories: 320, protein: 29, carbs: 5, fat: 20 },
  { id: 'pescado-frito', name: 'Pescado frito', aliases: ['pescado frito', 'pescado'], servingLabel: '1 filete mediano', calories: 310, protein: 27, carbs: 6, fat: 19 },
  { id: 'tostones', name: 'Tostones', aliases: ['tostones'], servingLabel: '4 unidades', calories: 230, protein: 2, carbs: 36, fat: 9 },
  { id: 'ensalada-verde', name: 'Ensalada verde', aliases: ['ensalada', 'ensalada verde'], servingLabel: '1 bowl mediano', calories: 80, protein: 3, carbs: 10, fat: 3 },
  { id: 'pan-agua', name: 'Pan de agua', aliases: ['pan', 'pan de agua'], servingLabel: '1 unidad', calories: 180, protein: 6, carbs: 35, fat: 1 },
  { id: 'yogur-griego', name: 'Yogur griego', aliases: ['yogurt griego', 'yogur griego', 'yogur'], servingLabel: '1 vaso', calories: 140, protein: 15, carbs: 10, fat: 4 },
  { id: 'banana', name: 'Guineo banana', aliases: ['guineo', 'banana', 'banano'], servingLabel: '1 unidad mediana', calories: 105, protein: 1, carbs: 27, fat: 0 },
  { id: 'batido-proteina', name: 'Batido de proteina', aliases: ['batido', 'batido de proteina', 'protein shake'], servingLabel: '1 scoop con agua', calories: 130, protein: 24, carbs: 3, fat: 2 },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function roundMacro(value: number) {
  return Math.max(0, Math.round(value));
}

export function searchFoodPresets(query: string, limit = 8) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return FOOD_PRESETS.slice(0, limit);
  }

  return FOOD_PRESETS
    .map((preset) => {
      const haystacks = [preset.name, ...preset.aliases].map(normalizeText);
      let score = 0;

      haystacks.forEach((haystack) => {
        if (haystack === normalizedQuery) {
          score = Math.max(score, 120);
        } else if (haystack.startsWith(normalizedQuery)) {
          score = Math.max(score, 90);
        } else if (haystack.includes(normalizedQuery)) {
          score = Math.max(score, 60);
        }
      });

      return {
        preset,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.preset.name.localeCompare(right.preset.name);
    })
    .slice(0, limit)
    .map((entry) => entry.preset);
}

export function getFoodPresetById(id: string) {
  return FOOD_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function applyFoodPresetToEntry(entry: FoodEntry, preset: LocalFoodPreset, servings: number) {
  const multiplier = Math.max(0.5, Math.min(3, servings));

  return {
    ...entry,
    name: preset.name,
    calories: roundMacro(preset.calories * multiplier),
    protein: roundMacro(preset.protein * multiplier),
    carbs: roundMacro(preset.carbs * multiplier),
    fat: roundMacro(preset.fat * multiplier),
  };
}

export function getSuggestedServingChips() {
  return [0.5, 1, 1.5, 2];
}
