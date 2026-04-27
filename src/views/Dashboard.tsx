import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Settings, Download, Upload, Dumbbell, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

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
import type { MuscleGroup } from '@/store/types';
import { selectDashboardCards } from '@/store/selectors';

const MuscleMap = lazy(() => import('@/components/MuscleMap').then((module) => ({ default: module.MuscleMap })));

interface DashboardProps {
  onOpenWorkout: () => void;
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
    const muscleSet = new Set(dashboardCards.readiness.recommendedMuscles);
    return exercises.filter((exercise) => muscleSet.has(exercise.muscleGroup)).slice(0, 4);
  }, [dashboardCards.readiness.recommendedMuscles, exercises]);

  const focusLabel = dashboardCards.readiness.recommendedMuscles
    .map((muscle) => formatMuscleGroup(muscle))
    .join(' + ');
  const handleStartWorkout = () => {
    if (data.draftSession) {
      onOpenWorkout();
      return;
    }

    startDraftSession({
      name: focusLabel ? `Focus: ${focusLabel}` : 'Training Session',
      logs: recommendedExercises.slice(0, 2).map((exercise) => buildWorkoutLog(exercise)),
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

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Reset input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#080B11]">
      <header className="flex items-end justify-between px-6 pt-10 pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Hola, Atleta</h1>
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
        <section className="relative overflow-hidden rounded-[3rem] border border-white/5 bg-[#121721] p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Dumbbell className="size-32 rotate-12" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="size-2 rounded-full bg-[#6EE7B7] animate-pulse" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6EE7B7]">ESTADO ACTUAL</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-7xl font-black leading-none tracking-tighter text-white">
                    {dashboardCards.readiness.readiness}<span className="text-xl text-zinc-600">%</span>
                  </p>
                </div>
                <p className="mt-4 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  ENFOQUE: <span className="text-white">{focusLabel || 'RECUPERACIÓN'}</span>
                </p>
              </div>

              <div className="flex flex-col items-end">
                 <div className="size-16 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center justify-center backdrop-blur-sm">
                    <span className="text-lg font-black text-white leading-none">{dashboardCards.readiness.suggestedDurationMinutes}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">MIN</span>
                 </div>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed text-zinc-400 mb-8 max-w-[240px]">
              {dashboardCards.readiness.coachBody}
            </p>

            <motion.button
              whileTap={{ scale: 0.96 }}
              className="h-20 w-full rounded-[2.25rem] bg-[#6EE7B7] text-[12px] font-black uppercase tracking-[0.4em] text-[#080B11] shadow-[0_20px_40px_rgba(110,231,183,0.2)] hover:bg-[#5FE7B0] transition-colors flex items-center justify-center gap-3"
              onClick={handleStartWorkout}
            >
              {data.draftSession ? (
                <>CONTINUAR SESIÓN <ArrowRight className="size-5" /></>
              ) : (
                <>EMPEZAR ENTRENAMIENTO <ArrowRight className="size-5" /></>
              )}
            </motion.button>
          </div>
        </section>

        <section className="rounded-[2.75rem] border border-white/5 bg-[#121721] p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Tu Cuerpo</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Fatiga Muscular</h2>
            </div>
          </div>

          <div className="h-[300px] overflow-hidden rounded-[2.25rem] bg-black/20">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-zinc-500">Loading map...</div>}>
              <MuscleMap fatigue={dashboardCards.readiness.fatigue} />
            </Suspense>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            {(Object.entries(dashboardCards.readiness.fatigue) as [MuscleGroup, number][]).map(([muscleGroup, value]) => (
              <div key={muscleGroup} className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/10 px-4 py-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                  {formatMuscleGroup(muscleGroup)}
                </span>
                <span className="text-sm font-black text-white">{Math.round(value)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2.75rem] border border-white/5 bg-[#121721] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Sugerencia</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-white">Rutina Recomendada</h2>
            </div>
            <span className="rounded-2xl bg-[#6EE7B7]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
              {dashboardCards.readiness.suggestedDurationMinutes} min
            </span>
          </div>

          {recommendedExercises.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-white/5 bg-black/10 px-5 py-10 text-center text-sm text-zinc-500">
              Registra algunos entrenamientos para que podamos recomendarte una rutina.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {recommendedExercises.map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-black/10 px-4 py-4">
                  <div>
                    <p className="font-black text-white">{exercise.name}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
                      {formatMuscleGroup(exercise.muscleGroup)} • {exercise.isBodyweight ? 'Bodyweight' : 'Weighted'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#6EE7B7]">
                    {Math.round(dashboardCards.readiness.fatigue[exercise.muscleGroup])}% fatiga
                  </span>
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
                      // If we switch, convert the draft display value to the other unit so the input looks right
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

            <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500 mb-4">Gestión de Datos</p>
              
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
