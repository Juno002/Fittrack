import { useState } from 'react';
import { ArrowRight, Check, ChevronLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store';
import { cn } from '@/lib/utils';

export function Onboarding() {
  const [step, setStep] = useState(1);
  const updateProfile = useStore((state) => state.updateProfile);
  const updateSettings = useStore((state) => state.updateSettings);
  const setCalorieGoal = useStore((state) => state.setCalorieGoal);
  const logBodyWeight = useStore((state) => state.logBodyWeight);

  const [formData, setFormData] = useState({
    unitSystem: 'metric' as 'metric' | 'imperial',
    age: 25,
    weight: 70,
    height: 175,
    gender: 'male' as 'male' | 'female' | 'other',
    calorieGoal: 2000,
  });

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const finishOnboarding = () => {
    updateSettings({ 
      unitSystem: formData.unitSystem,
      onboarded: true 
    });
    updateProfile({
      age: formData.age,
      weight: formData.weight,
      height: formData.height,
      gender: formData.gender,
    });
    setCalorieGoal(formData.calorieGoal);
    logBodyWeight(formData.weight);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#080B11] text-white overflow-y-auto">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-12 flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                step >= i ? "bg-[#6EE7B7]" : "bg-white/10"
              )} 
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1">
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="mb-8 flex size-16 items-center justify-center rounded-[2rem] bg-white/5 text-[#6EE7B7]">
                <Target className="size-8" />
              </div>
              <h1 className="text-4xl font-black tracking-tight leading-tight">
                Bienvenido a <span className="text-[#6EE7B7]">FitTrack</span>
              </h1>
              <p className="mt-4 text-lg text-zinc-400">
                Tu compañero personal de entrenamiento. Vamos a configurar tu perfil en menos de un minuto.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black tracking-tight">Elige tu sistema de unidades</h2>
              <p className="mt-2 text-sm text-zinc-400">Podrás cambiar esto más tarde en la configuración.</p>
              
              <div className="mt-8 space-y-4">
                <button
                  onClick={() => setFormData({ ...formData, unitSystem: 'metric' })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[2rem] border p-6 transition-all",
                    formData.unitSystem === 'metric' ? "border-[#6EE7B7] bg-[#6EE7B7]/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="text-left">
                    <p className="font-bold">Métrico</p>
                    <p className="text-xs text-zinc-500">Kilogramos y Centímetros</p>
                  </div>
                  {formData.unitSystem === 'metric' && <Check className="size-5 text-[#6EE7B7]" />}
                </button>

                <button
                  onClick={() => setFormData({ ...formData, unitSystem: 'imperial' })}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[2rem] border p-6 transition-all",
                    formData.unitSystem === 'imperial' ? "border-[#6EE7B7] bg-[#6EE7B7]/10" : "border-white/5 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <div className="text-left">
                    <p className="font-bold">Imperial</p>
                    <p className="text-xs text-zinc-500">Libras y Pulgadas</p>
                  </div>
                  {formData.unitSystem === 'imperial' && <Check className="size-5 text-[#6EE7B7]" />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black tracking-tight">Sobre ti</h2>
              <p className="mt-2 text-sm text-zinc-400">Esto nos ayuda a calcular tus necesidades calóricas.</p>
              
              <div className="mt-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Género</label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFormData({ ...formData, gender: g as 'male' | 'female' | 'other' })}
                        className={cn(
                          "flex-1 rounded-2xl border py-4 text-xs font-bold uppercase tracking-widest transition-all",
                          formData.gender === g ? "border-[#6EE7B7] bg-[#6EE7B7]/10 text-white" : "border-white/5 bg-white/5 text-zinc-500"
                        )}
                      >
                        {g === 'male' ? 'HOMBRE' : g === 'female' ? 'MUJER' : 'OTRO'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Edad</label>
                    <Input 
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                      className="h-14 rounded-2xl border-none bg-white/5 text-center text-lg font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Peso ({formData.unitSystem === 'metric' ? 'kg' : 'lb'})</label>
                    <Input 
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                      className="h-14 rounded-2xl border-none bg-white/5 text-center text-lg font-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Altura (cm)</label>
                    <Input 
                      type="number"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                      className="h-14 rounded-2xl border-none bg-white/5 text-center text-lg font-black"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black tracking-tight">Tu objetivo calórico</h2>
              <p className="mt-2 text-sm text-zinc-400">¿Cuántas calorías planeas consumir al día?</p>
              
              <div className="mt-8 flex flex-col items-center">
                <div className="relative mb-8 flex size-40 items-center justify-center rounded-full border-4 border-[#6EE7B7]/20 bg-white/5">
                  <div className="text-center">
                    <p className="text-4xl font-black">{formData.calorieGoal}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">KCAL / DÍA</p>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <input 
                    type="range"
                    min="1200"
                    max="5000"
                    step="50"
                    value={formData.calorieGoal}
                    onChange={(e) => setFormData({ ...formData, calorieGoal: Number(e.target.value) })}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#6EE7B7]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500">
                    <span>1200 KCAL</span>
                    <span>5000 KCAL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center justify-center pt-12 animate-in fade-in zoom-in duration-700">
              <div className="mb-8 flex size-24 items-center justify-center rounded-[3rem] bg-[#6EE7B7] text-[#080B11]">
                <Check className="size-12 stroke-[3]" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-center">¡Todo listo!</h2>
              <p className="mt-4 text-center text-zinc-400">
                Tu perfil ha sido configurado. Ahora puedes empezar a registrar tus entrenamientos y ver tu progreso.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-12 flex gap-3">
          {step > 1 && step < 5 && (
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-16 rounded-[2rem] border border-white/5 bg-white/5 px-8 text-white hover:bg-white/10"
            >
              <ChevronLeft className="size-6" />
            </Button>
          )}
          
          <Button
            onClick={handleNext}
            className={cn(
              "h-16 flex-1 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all",
              step === 5 ? "bg-[#6EE7B7] text-[#080B11]" : "bg-white text-black hover:bg-zinc-200"
            )}
          >
            {step === 5 ? 'Empezar ahora' : step === 1 ? 'Vamos allá' : 'Siguiente'}
            {step < 5 && <ArrowRight className="ml-2 size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
