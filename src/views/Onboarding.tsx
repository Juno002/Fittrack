import { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  formatPreferredTrainingTime,
  formatTrainingDay,
  formatTrainingDays,
} from '@/lib/display';
import {
  calculateBodyMassIndex,
  getBodyMassIndexLabel,
  getDisplayWeight,
  getStorageWeight,
} from '@/lib/units';
import { useStore } from '@/store';
import type {
  AppSettings,
  ConnectedSignals,
  PreferredTrainingTime,
  TrainingDay,
  UserProfile,
} from '@/store/types';

const DAY_OPTIONS: TrainingDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME_OPTIONS: PreferredTrainingTime[] = ['morning', 'afternoon', 'evening'];

function copySettings(settings: AppSettings): AppSettings {
  return {
    ...settings,
    connectedSignals: { ...settings.connectedSignals },
    trainingSchedule: {
      ...settings.trainingSchedule,
      days: [...settings.trainingSchedule.days],
    },
    reminders: { ...settings.reminders },
  };
}

export function Onboarding() {
  const storeSettings = useStore((state) => state.settings);
  const storeProfile = useStore((state) => state.profile);
  const storeCalories = useStore((state) => state.calorieGoal);
  const updateProfile = useStore((state) => state.updateProfile);
  const updateSettings = useStore((state) => state.updateSettings);
  const setCalorieGoal = useStore((state) => state.setCalorieGoal);
  const logBodyWeight = useStore((state) => state.logBodyWeight);

  const [step, setStep] = useState(1);
  const [profileDraft, setProfileDraft] = useState<UserProfile>(storeProfile);
  const [settingsDraft, setSettingsDraft] = useState<AppSettings>(copySettings(storeSettings));
  const [calorieGoalDraft, setCalorieGoalDraft] = useState(storeCalories);
  const [displayWeightDraft, setDisplayWeightDraft] = useState(
    getDisplayWeight(storeProfile.weight, storeSettings.unitSystem),
  );

  const totalSteps = 6;
  const profileStepValid = profileDraft.name.trim().length > 0
    && profileDraft.age > 0
    && profileDraft.height > 0
    && displayWeightDraft > 0;

  const progress = useMemo(
    () => `${Math.round((step / totalSteps) * 100)}%`,
    [step],
  );

  const profileWeightKg = useMemo(
    () => getStorageWeight(displayWeightDraft, settingsDraft.unitSystem),
    [displayWeightDraft, settingsDraft.unitSystem],
  );

  const bodyMassIndex = useMemo(
    () => calculateBodyMassIndex(profileWeightKg, profileDraft.height),
    [profileDraft.height, profileWeightKg],
  );

  const finishOnboarding = () => {
    const finalWeightKg = getStorageWeight(displayWeightDraft, settingsDraft.unitSystem);

    updateSettings({
      ...settingsDraft,
      onboarded: true,
    });
    updateProfile({
      ...profileDraft,
      name: profileDraft.name.trim(),
      weight: finalWeightKg,
    });
    setCalorieGoal(calorieGoalDraft);
    logBodyWeight(finalWeightKg);
  };

  const toggleSignal = (signal: keyof ConnectedSignals) => {
    setSettingsDraft((current) => ({
      ...current,
      connectedSignals: {
        ...current.connectedSignals,
        [signal]: !current.connectedSignals[signal],
      },
    }));
  };

  const toggleDay = (day: TrainingDay) => {
    setSettingsDraft((current) => {
      const days = current.trainingSchedule.days.includes(day)
        ? current.trainingSchedule.days.filter((entry) => entry !== day)
        : [...current.trainingSchedule.days, day];

      return {
        ...current,
        trainingSchedule: {
          ...current.trainingSchedule,
          days,
        },
      };
    });
  };

  const handleUnitSystemChange = (unitSystem: AppSettings['unitSystem']) => {
    const rawWeightKg = getStorageWeight(displayWeightDraft, settingsDraft.unitSystem);
    setSettingsDraft((current) => ({ ...current, unitSystem }));
    setDisplayWeightDraft(getDisplayWeight(rawWeightKg, unitSystem));
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-[radial-gradient(circle_at_top,#173050_0%,#07101A_55%)] text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
        <div className="mb-10">
          <div className="h-2 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-[#6EE7B7] transition-all duration-500"
              style={{ width: progress }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
            <span>Paso {step} / {totalSteps}</span>
            <span>{progress}</span>
          </div>
        </div>

        <div className="flex-1">
          {step === 1 ? (
            <div className="pt-10">
              <div className="flex size-20 items-center justify-center rounded-[2.4rem] bg-[#6EE7B7] text-[#08111C] shadow-[0_24px_40px_rgba(110,231,183,0.2)]">
                <Sparkles className="size-10" />
              </div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">HomeFit Recovery</p>
              <h1 className="mt-4 text-4xl font-black tracking-tight text-white">
                Entrena con
                <br />
                recuperación real
              </h1>
              <p className="mt-5 max-w-[22rem] text-base leading-relaxed text-zinc-300">
                Vamos a montar tu perfil local, conectar tus señales y preparar un ritmo semanal que sí se adapte a cómo llegas cada día.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Crear perfil local</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Tu baseline física</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Empezamos por tu nombre, edad, estatura y peso para estimar tu IMC y dejar una base limpia desde el primer día.
              </p>

              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Nombre</Label>
                  <Input
                    aria-label="Nombre"
                    value={profileDraft.name}
                    onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Tu nombre"
                    className="h-14 rounded-[1.5rem] border-none bg-white/6 px-4 text-lg font-black text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Edad</Label>
                    <Input
                      type="number"
                      value={profileDraft.age}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, age: Number(event.target.value) }))}
                      className="h-14 rounded-[1.5rem] border-none bg-white/6 px-4 text-lg font-black text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Peso ({settingsDraft.unitSystem === 'metric' ? 'kg' : 'lb'})</Label>
                    <Input
                      type="number"
                      value={displayWeightDraft}
                      onChange={(event) => setDisplayWeightDraft(Number(event.target.value))}
                      className="h-14 rounded-[1.5rem] border-none bg-white/6 px-4 text-lg font-black text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Altura (cm)</Label>
                    <Input
                      type="number"
                      value={profileDraft.height}
                      onChange={(event) => setProfileDraft((current) => ({ ...current, height: Number(event.target.value) }))}
                      className="h-14 rounded-[1.5rem] border-none bg-white/6 px-4 text-lg font-black text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Unidades</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['metric', 'imperial'] as const).map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => handleUnitSystemChange(unit)}
                          className={`h-14 rounded-[1.35rem] border text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                            settingsDraft.unitSystem === unit
                              ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                              : 'border-white/8 bg-white/6 text-zinc-500'
                          }`}
                        >
                          {unit === 'metric' ? 'Métrico' : 'Imperial'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/8 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6EE7B7]">IMC estimado</p>
                      <p className="mt-3 text-4xl font-black tracking-tighter text-white">
                        {bodyMassIndex === null ? '--' : bodyMassIndex.toFixed(1)}
                      </p>
                    </div>
                    <div className="rounded-[1.4rem] border border-white/8 bg-white/6 px-4 py-3 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-500">Lectura</p>
                      <p className="mt-2 text-sm font-black text-white">{getBodyMassIndexLabel(bodyMassIndex)}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-200">
                    Es una referencia inicial para contextualizar tu baseline. Luego el sistema se apoyará más en tu recuperación real y tus sesiones.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Género</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['male', 'female', 'other'] as const).map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setProfileDraft((current) => ({ ...current, gender }))}
                        className={`h-14 rounded-[1.35rem] border text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                          profileDraft.gender === gender
                            ? 'border-transparent bg-white text-[#08111C]'
                            : 'border-white/8 bg-white/6 text-zinc-500'
                        }`}
                      >
                        {gender === 'male' ? 'Hombre' : gender === 'female' ? 'Mujer' : 'Otro'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Conectar señales</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Qué vas a trackear</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Todo queda local. Solo le dices a la app qué señales quieres usar para decidir mejor tu plan.
              </p>

              <div className="mt-8 space-y-3">
                {([
                  ['sleep', 'Sueño', 'Mejora el score de recuperación y la tolerancia a volumen.'],
                  ['food', 'Comida', 'Nos da contexto de energía, calorías y macros.'],
                  ['recovery', 'Quick log', 'Añade tu percepción diaria de carga muscular, energía y estrés.'],
                ] as Array<[keyof ConnectedSignals, string, string]>).map(([signal, label, description]) => (
                  <button
                    key={signal}
                    type="button"
                    onClick={() => toggleSignal(signal)}
                    className={`w-full rounded-[2rem] border p-5 text-left transition-all ${
                      settingsDraft.connectedSignals[signal]
                        ? 'border-transparent bg-[#6EE7B7]/12'
                        : 'border-white/8 bg-white/6'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-black text-white">{label}</p>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
                      </div>
                      {settingsDraft.connectedSignals[signal] ? (
                        <div className="flex size-9 items-center justify-center rounded-full bg-[#6EE7B7] text-[#08111C]">
                          <Check className="size-4" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 4 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Días de entrenamiento</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Cómo quieres repartir la semana</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Esto no te encierra: solo nos ayuda a proponer mejores sesiones y a dar contexto al plan diario.
              </p>

              <div className="mt-8 grid grid-cols-4 gap-2">
                {DAY_OPTIONS.map((day) => {
                  const isActive = settingsDraft.trainingSchedule.days.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`h-12 rounded-[1.25rem] border text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                        isActive
                          ? 'border-transparent bg-[#6EE7B7] text-[#08111C]'
                          : 'border-white/8 bg-white/6 text-zinc-500'
                      }`}
                    >
                      {formatTrainingDay(day)}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Mejor momento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_OPTIONS.map((timeOption) => (
                    <button
                      key={timeOption}
                      type="button"
                      onClick={() => setSettingsDraft((current) => ({
                        ...current,
                        trainingSchedule: { ...current.trainingSchedule, preferredTime: timeOption },
                      }))}
                      className={`h-14 rounded-[1.35rem] border px-3 text-[10px] font-black uppercase tracking-[0.25em] transition-all ${
                        settingsDraft.trainingSchedule.preferredTime === timeOption
                          ? 'border-transparent bg-white text-[#08111C]'
                          : 'border-white/8 bg-white/6 text-zinc-500'
                      }`}
                    >
                      {formatPreferredTrainingTime(timeOption)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {step === 5 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Baseline</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Arranca con una base simple</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                Define un objetivo calórico y deja que el score de recuperación marque el ritmo del día.
              </p>

              <div className="mt-8 rounded-[2.5rem] border border-white/8 bg-white/6 p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Calorías diarias</p>
                <p className="mt-4 text-5xl font-black tracking-tighter text-white">{calorieGoalDraft}</p>
                <input
                  type="range"
                  min="1200"
                  max="4500"
                  step="50"
                  value={calorieGoalDraft}
                  onChange={(event) => setCalorieGoalDraft(Number(event.target.value))}
                  className="mt-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#6EE7B7]"
                />
                <div className="mt-2 flex justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  <span>1200</span>
                  <span>4500</span>
                </div>
              </div>

              <div className="mt-6 rounded-[2rem] border border-[#6EE7B7]/18 bg-[#6EE7B7]/8 p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#6EE7B7]">Cómo funciona</p>
                <p className="mt-3 text-sm leading-relaxed text-zinc-200">
                  Cada día verás tu score de recuperación, el mapa muscular, un quick log y un plan ajustado a tu horario.
                </p>
              </div>
            </div>
          ) : null}

          {step === 6 ? (
            <div className="pt-10">
              <div className="flex size-24 items-center justify-center rounded-[2.8rem] bg-[#6EE7B7] text-[#08111C]">
                <Check className="size-12 stroke-[3]" />
              </div>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.35em] text-[#6EE7B7]">Todo listo</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white">Ya tienes tu sistema base</h2>
              <div className="mt-6 space-y-3 rounded-[2.2rem] border border-white/8 bg-white/6 p-5">
                <p className="text-sm font-bold text-white">Perfil local</p>
                <p className="text-sm text-zinc-300">
                  {profileDraft.name.trim() || 'Perfil local'} · {profileDraft.age} años · {profileDraft.height} cm · {bodyMassIndex === null ? 'IMC --' : `IMC ${bodyMassIndex.toFixed(1)}`}
                </p>
                <p className="text-sm font-bold text-white">Señales activas</p>
                <p className="text-sm text-zinc-300">
                  {Object.entries(settingsDraft.connectedSignals)
                    .filter(([, enabled]) => enabled)
                    .map(([key]) => (key === 'sleep' ? 'Sueño' : key === 'food' ? 'Comida' : 'Quick log'))
                    .join(' · ')}
                </p>
                <p className="text-sm font-bold text-white">Horario</p>
                <p className="text-sm text-zinc-300">
                  {formatTrainingDays(settingsDraft.trainingSchedule.days)} · {formatPreferredTrainingTime(settingsDraft.trainingSchedule.preferredTime)}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-12 flex gap-3">
          {step > 1 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(1, current - 1))}
              className="h-16 rounded-[2rem] border border-white/8 bg-white/6 px-6 text-white hover:bg-white/10"
            >
              <ChevronLeft className="size-5" />
            </Button>
          ) : null}

          <Button
            onClick={() => {
              if (step === totalSteps) {
                finishOnboarding();
                return;
              }
              setStep((current) => Math.min(totalSteps, current + 1));
            }}
            disabled={step === 2 && !profileStepValid}
            className={`h-16 flex-1 rounded-[2rem] text-sm font-black uppercase tracking-[0.25em] ${
              step === totalSteps ? 'bg-[#6EE7B7] text-[#08111C]' : 'bg-white text-[#08111C] hover:bg-zinc-100'
            }`}
          >
            {step === totalSteps ? 'Entrar a Inicio' : step === 1 ? 'Empezar' : 'Siguiente'}
            {step < totalSteps ? <ArrowRight className="ml-2 size-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}
