import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Download, Settings, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExerciseCatalog } from '@/hooks/useExerciseCatalog';
import { useStoreData } from '@/hooks/useStoreData';
import { formatMuscleGroup } from '@/lib/display';
import { getDisplayWeight, getStorageWeight } from '@/lib/units';
import { buildWorkoutLog } from '@/lib/workout';
import { useStore, type MacroGoal, type UserProfile } from '@/store';
import { selectDashboardCards } from '@/store/selectors';
import type { MuscleGroup } from '@/store/types';

const MuscleMap = lazy(() => import('@/components/MuscleMap').then((module) => ({ default: module.MuscleMap })));

interface DashboardProps {
  onOpenWorkout: () => void;
}

function getFatigueActionLabel(value: number) {
  if (value >= 70) {
    return 'Evita pesado';
  }

  if (value >= 45) {
    return 'Carga moderada';
  }

  return 'Buen momento';
}

function getToneBadgeClasses(tone: 'good' | 'warn' | 'danger') {
  if (tone === 'danger') {
    return 'border-red-400/20 bg-red-400/10 text-red-200';
  }

  if (tone === 'warn') {
    return 'border-amber-400/20 bg-amber-400/10 text-amber-100';
  }

  return 'border-[#6EE7B7]/20 bg-[#6EE7B7]/10 text-[#C8FFE8]';
}

export function Dashboard({ onOpenWorkout }: DashboardProps) {
  const data = useStoreData();
  const startDraftSession = useStore((state) => state.startDraftSession);
  const updateProfile = useStore((state) => state.updateProfile);
  const setCalorieGoal = useStore((state) => state.setCalorieGoal);
  const setMacrosGoal = useStore((state) => state.setMacrosGoal);
  const { exercises } = useExerciseCatalog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileDraft, setProfileDraft] = useState<UserProfile>(data.profile);
  const [calorieDraft, setCalorieDraft] = useState(data.calorieGoal);
  const [macroDraft, setMacroDraft] = useState<MacroGoal>(data.macrosGoal);
  const [unitSystemDraft, setUnitSystemDraft] = useState(data.settings.unitSystem);
  const [displayWeightDraft, setDisplayWeightDraft] = useState(getDisplayWeight(data.profile.weight, data.settings.unitSystem));

  const dashboardCards = useMemo(() => selectDashboardCards(data), [data]);
  const readiness = dashboardCards.readiness;
  const weeklyMomentum = dashboardCards.weeklyMomentum;
  const toneBadgeClasses = getToneBadgeClasses(readiness.coachTone);

  useEffect(() => {
    if (isSettingsOpen) {
      setProfileDraft(data.profile);
      setCalorieDraft(data.calorieGoal);
      setMacroDraft(data.macrosGoal);
      setUnitSystemDraft(data.settings.unitSystem);
      setDisplayWeightDraft(getDisplayWeight(data.profile.weight, data.settings.unitSystem));
    }
  }, [data, isSettingsOpen]);

  const recommendedExercises = useMemo(() => {
    const muscleSet = new Set(readiness.recommendedMuscles);

    return exercises
      .filter((exercise) => muscleSet.has(exercise.muscleGroup))
      .slice(0, readiness.suggestedExerciseCount);
  }, [exercises, readiness.recommendedMuscles, readiness.suggestedExerciseCount]);
  const sessionExercises = recommendedExercises.length > 0
    ? recommendedExercises
    : exercises.slice(0, readiness.suggestedExerciseCount);

  const sleepProgress = dashboardCards.latestSleep
    ? Math.min(100, (dashboardCards.latestSleep.durationHours / 8) * 100)
    : 0;

  const handleStartWorkout = () => {
    if (data.draftSession) {
      onOpenWorkout();
      return;
    }

    startDraftSession({
      name: readiness.hasTrainingHistory ? `Hoy: ${readiness.focusLabel}` : 'Sesión base Fittrack',
      logs: sessionExercises.map((exercise) => buildWorkoutLog(exercise)),
    });
    onOpenWorkout();
  };

  const handleExportData = () => {
    const exportData = {
      customExercises: data.customExercises,
      sessions: data.sessions,
      foods: data.foods,
      sleepLogs: data.sleepLogs,
      calorieGoal: data.calorieGoal,
      macrosGoal: data.macrosGoal,
      profile: data.profile,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        if (!importedData.profile || !importedData.sessions) {
          throw new Error('Archivo de backup inválido');
        }

        if (window.confirm('Esto sobrescribirá tus datos actuales con el backup importado. ¿Estás seguro?')) {
          useStore.setState(importedData);
          setIsSettingsOpen(false);
          window.location.reload();
        }
      } catch (err) {
        alert('Error al procesar el archivo. Asegúrate de que sea un backup válido de FitTrack.');
        console.error('Import error:', err);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="flex items-start justify-between px-6 pt-10 pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Hoy</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white">Entrena lo correcto</h1>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
            Fittrack ya hizo el trabajo pesado. Abre, mira y actúa.
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-[#121721] text-zinc-400 hover:text-white"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings className="size-5" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-32">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/5 bg-[radial-gradient(circle_at_top_right,_rgba(110,231,183,0.16),_transparent_40%),linear-gradient(160deg,_rgba(18,23,33,0.96),_rgba(8,11,17,1))] p-6">
          <div className="absolute -right-12 top-8 h-32 w-32 rounded-full bg-[#6EE7B7]/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Hoy estás</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <p className="text-[4rem] font-black leading-none tracking-tighter text-white">
                    {readiness.readiness}%
                  </p>
                  <span className={`rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] ${toneBadgeClasses}`}>
                    {readiness.sessionModeLabel}
                  </span>
                </div>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-400">
                  {readiness.decisionBody}
                </p>
              </div>

              <div className="min-w-[108px] rounded-[2rem] border border-white/8 bg-black/20 px-4 py-4 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Duración</p>
                <p className="mt-2 text-3xl font-black leading-none text-white">{readiness.suggestedDurationMinutes}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
                  {readiness.suggestedExerciseCount} ejercicios
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3">
              <div className="rounded-[2rem] border border-white/5 bg-black/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mejor opción hoy</p>
                <p className="mt-2 text-xl font-black text-white">
                  {readiness.focusLabel} <span className="text-zinc-500">- {readiness.suggestedDurationMinutes} min</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{readiness.coachTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[2rem] border border-white/5 bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Riesgo</p>
                  <p className="mt-2 text-sm font-black text-white">{readiness.riskLabel}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{readiness.riskBody}</p>
                </div>

                <div className="rounded-[2rem] border border-white/5 bg-black/20 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Progreso semana</p>
                  <p className="mt-2 text-sm font-black text-white">{weeklyMomentum.summary}</p>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-500">{weeklyMomentum.detail}</p>
                </div>
              </div>
            </div>

            <Button
              className="mt-8 h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
              onClick={handleStartWorkout}
            >
              {data.draftSession ? 'Continuar sesión' : 'Entrenar ahora'}
            </Button>

            <p className="mt-3 text-xs leading-relaxed text-zinc-500">
              {data.draftSession
                ? 'Tu borrador sigue listo para retomarse sin perder el ritmo.'
                : 'La sugerencia combina recuperación muscular, sueño y tu carga reciente.'}
            </p>
          </div>
        </section>

        <section className="rounded-[2.75rem] border border-white/5 bg-[#121721] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Señales del día</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Qué movió la decisión</h2>
            </div>
            <span className="rounded-2xl bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
              Recovery Engine
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                <span>Sueño</span>
                <span className="text-zinc-100">
                  {dashboardCards.latestSleep ? `${dashboardCards.latestSleep.durationHours}h` : '--'}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1A202C]">
                <div className="h-full rounded-full bg-[#63B3ED]" style={{ width: `${sleepProgress}%` }} />
              </div>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {dashboardCards.latestSleep
                  ? `Calidad ${dashboardCards.latestSleep.qualityScore}/100.`
                  : 'Registrar sueño mejora mucho la precisión de la recomendación.'}
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-black/10 p-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                <span>Momentum</span>
                <span className="text-zinc-100">{weeklyMomentum.summary}</span>
              </div>
              <p className="mt-4 text-sm font-black text-white">{weeklyMomentum.detail}</p>
              <p className="mt-3 text-xs leading-relaxed text-zinc-500">
                {weeklyMomentum.averageSleepHours === null
                  ? 'Todavía falta contexto de descanso esta semana.'
                  : `Sueño promedio semanal: ${weeklyMomentum.averageSleepHours}h.`}
              </p>
            </div>
          </div>

          <div className="mt-6 h-[300px] overflow-hidden rounded-[2.25rem] bg-black/20">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading map...</div>}>
              <MuscleMap fatigue={readiness.fatigue} />
            </Suspense>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {(Object.entries(readiness.fatigue) as [MuscleGroup, number][]).map(([muscleGroup, value]) => (
              <div key={muscleGroup} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    {formatMuscleGroup(muscleGroup)}
                  </span>
                  <p className="mt-1 text-xs text-zinc-500">{getFatigueActionLabel(value)}</p>
                </div>
                <span className="text-sm font-black text-white">{Math.round(value)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.75rem] border border-white/5 bg-[#121721] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Plan sugerido</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Qué sí conviene hoy</h2>
            </div>
            <span className="rounded-2xl bg-[#6EE7B7]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
              {readiness.suggestedExerciseCount} movimientos
            </span>
          </div>

          {sessionExercises.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-white/5 bg-black/10 px-5 py-10 text-center text-sm text-zinc-500">
              Registra algunos entrenamientos para que podamos recomendarte una rutina.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {sessionExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-black/10 px-4 py-4">
                  <div>
                    <p className="font-black text-white">{exercise.name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {formatMuscleGroup(exercise.muscleGroup)} • {exercise.isBodyweight ? 'Sin equipo' : 'Carga externa'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
                      {getFatigueActionLabel(readiness.fatigue[exercise.muscleGroup])}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {Math.round(readiness.fatigue[exercise.muscleGroup])}% fatiga
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-white/5 bg-[#121721] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Ajustes y objetivos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Edad</Label>
                <Input
                  type="number"
                  value={profileDraft.age}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, age: Number(event.target.value) }))}
                  className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    Peso ({unitSystemDraft === 'metric' ? 'kg' : 'lb'})
                  </Label>
                  <button
                    onClick={() => {
                      const nextSys = unitSystemDraft === 'metric' ? 'imperial' : 'metric';
                      const rawKg = getStorageWeight(displayWeightDraft, unitSystemDraft);
                      setUnitSystemDraft(nextSys);
                      setDisplayWeightDraft(getDisplayWeight(rawKg, nextSys));
                    }}
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6EE7B7]"
                  >
                    Cambiar a {unitSystemDraft === 'metric' ? 'lb' : 'kg'}
                  </button>
                </div>
                <Input
                  type="number"
                  value={displayWeightDraft}
                  onChange={(event) => setDisplayWeightDraft(Number(event.target.value))}
                  className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Altura (cm)</Label>
                <Input
                  type="number"
                  value={profileDraft.height}
                  onChange={(event) => setProfileDraft((current) => ({ ...current, height: Number(event.target.value) }))}
                  className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Calorías</Label>
                <Input
                  type="number"
                  value={calorieDraft}
                  onChange={(event) => setCalorieDraft(Number(event.target.value))}
                  className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['protein', 'carbs', 'fat'] as const).map((macro) => (
                <div key={macro} className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                    {macro === 'protein' ? 'Proteína' : macro === 'carbs' ? 'Carbs' : 'Grasas'}
                  </Label>
                  <Input
                    type="number"
                    value={macroDraft[macro]}
                    onChange={(event) => setMacroDraft((current) => ({ ...current, [macro]: Number(event.target.value) }))}
                    className="h-14 rounded-2xl border-none bg-[#1A202C] text-lg font-black text-white"
                  />
                </div>
              ))}
            </div>

            <Button
              className="h-14 w-full rounded-[1.75rem] bg-[#6EE7B7] text-[10px] font-black uppercase tracking-[0.3em] text-[#080B11] hover:bg-[#5FE7B0]"
              onClick={() => {
                const finalWeightKg = getStorageWeight(displayWeightDraft, unitSystemDraft);
                const newProfile = { ...profileDraft, weight: finalWeightKg };

                updateProfile(newProfile);
                useStore.getState().updateSettings({ unitSystem: unitSystemDraft });

                if (finalWeightKg !== data.profile.weight) {
                  useStore.getState().logBodyWeight(finalWeightKg);
                }
                setCalorieGoal(calorieDraft);
                setMacrosGoal(macroDraft);
                setIsSettingsOpen(false);
              }}
            >
              Guardar perfil
            </Button>

            <div className="mt-6 space-y-3 border-t border-white/5 pt-6">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Gestión de Datos</p>

              <Button
                variant="outline"
                className="h-14 w-full rounded-[1.75rem] border-white/10 bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={handleExportData}
              >
                <Download className="mr-2 h-4 w-4" /> Exportar Backup
              </Button>

              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImportData}
                className="hidden"
              />
              <Button
                variant="outline"
                className="h-14 w-full rounded-[1.75rem] border-white/10 bg-transparent text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400 hover:bg-white/5 hover:text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Importar Backup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
