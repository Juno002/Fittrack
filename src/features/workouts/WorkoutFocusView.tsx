import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, ArrowRight, Activity, ChevronLeft, ChevronRight, Timer as TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import type { DraftSession } from '@/store/types';

interface WorkoutFocusViewProps {
  draftSession: DraftSession;
  elapsedSeconds: number;
  restSeconds: number;
  onSkipRest: () => void;
  onToggleSetCompleted: (logId: string, setIndex: number) => void;
  onUpdateSet: (logId: string, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onFinish: () => void;
  onGoToEdit: () => void;
}

export function WorkoutFocusView({
  draftSession,
  elapsedSeconds,
  restSeconds,
  onSkipRest,
  onToggleSetCompleted,
  onUpdateSet,
  onFinish,
  onGoToEdit
}: WorkoutFocusViewProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Find the first uncompleted set across all logs
  const allSets = draftSession.logs.flatMap(log => 
    log.sets.map((set, index) => ({ log, set, index }))
  );
  
  const activeSetIdx = allSets.findIndex(item => !item.set.completed);
  const isAllCompleted = activeSetIdx === -1;
  const activeItem = !isAllCompleted ? allSets[activeSetIdx] : null;
  const { log: activeLog, set: activeSet, index: activeSetIndex } = activeItem || {};

  // For the progress bar
  const totalSets = allSets.length;
  const completedSets = allSets.filter(s => s.set.completed).length;
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

  if (isAllCompleted) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center h-full"
      >
        <div className="relative mb-8 text-[#6EE7B7]">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 12 }}
            className="size-24 rounded-full bg-[#6EE7B7]/20 flex items-center justify-center"
          >
            <CheckCircle className="size-12 text-[#6EE7B7]" />
          </motion.div>
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-[#6EE7B7]/10 -z-10"
          />
        </div>
        
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">¡Sesión Terminada!</h2>
        <p className="text-zinc-400 mb-10 max-w-xs">Has completado todo el volumen planificado. ¡Buen trabajo!</p>
        
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button
            className="h-16 w-full rounded-[2rem] bg-[#6EE7B7] text-[12px] font-black uppercase tracking-[0.2em] text-[#080B11] shadow-[0_20px_50px_rgba(110,231,183,0.3)] hover:scale-105 transition-transform"
            onClick={onFinish}
          >
            GUARDAR RESULTADOS
          </Button>
          <Button
            variant="ghost"
            className="h-14 w-full rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
            onClick={onGoToEdit}
          >
            REVISAR EJERCICIOS
          </Button>
        </div>
      </motion.div>
    );
  }

  if (restSeconds > 0) {
    const nextItem = allSets[activeSetIdx]; 
    
    return (
      <motion.div 
        key="rest-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center p-6 h-full"
      >
        <div className="flex flex-col items-center flex-1 justify-center w-full relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full border border-white/5 animate-ping opacity-20" />
            
            <p className="text-[12px] font-black uppercase tracking-[0.4em] text-[#6EE7B7] mb-8">DESCANSANDO</p>
            
            <div className="relative mb-12 flex items-center justify-center">
               <svg className="size-64 -rotate-90">
                 <circle
                   cx="128"
                   cy="128"
                   r="120"
                   fill="transparent"
                   stroke="currentColor"
                   strokeWidth="4"
                   className="text-white/5"
                 />
                 <motion.circle
                   cx="128"
                   cy="128"
                   r="120"
                   fill="transparent"
                   stroke="currentColor"
                   strokeWidth="4"
                   strokeDasharray="753.98"
                   initial={{ strokeDashoffset: 0 }}
                   animate={{ strokeDashoffset: 753.98 * (1 - restSeconds / draftSession.restDurationSeconds) }}
                   transition={{ duration: 1, ease: "linear" }}
                   className="text-[#6EE7B7]"
                   strokeLinecap="round"
                 />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-8xl font-black text-white tabular-nums tracking-tighter">
                    {restSeconds}<span className="text-2xl text-zinc-500 ml-1">s</span>
                  </span>
               </div>
            </div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-xs rounded-[2.5rem] bg-white/5 border border-white/10 p-6 text-center backdrop-blur-xl"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">PRÓXIMA SERIE</p>
              <p className="text-xl font-bold text-white mb-2 line-clamp-1">{nextItem.log.exerciseName}</p>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/5">Serie {nextItem.index + 1}/{nextItem.log.sets.length}</span>
                <span className="text-[#6EE7B7] font-bold">{nextItem.set.weight}kg × {nextItem.set.reps}</span>
              </div>
            </motion.div>
        </div>
        
        <div className="w-full max-w-xs pb-12">
          <Button
              className="h-16 w-full rounded-[2rem] bg-white text-[12px] font-black uppercase tracking-[0.2em] text-[#080B11] hover:bg-white/90 shadow-xl"
              onClick={onSkipRest}
          >
            SALTAR DESCANSO <ArrowRight className="ml-2 size-5" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#080B11] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">EN SESIÓN</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <TimerIcon className="size-3.5 text-zinc-500" />
            <span className="text-sm font-black tabular-nums tracking-tight">
              {formatTime(elapsedSeconds)}
            </span>
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className="size-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white backdrop-blur-md"
            onClick={onGoToEdit}
          >
            <Activity className="size-5" />
          </motion.button>
        </div>
      </div>

      <div className="h-1.5 w-full bg-white/5 flex items-center overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 50 }}
          className="h-full bg-[#6EE7B7] shadow-[0_0_15px_rgba(110,231,183,0.5)]"
        />
      </div>

      <div className="flex-1 px-6 pt-12 pb-32 flex flex-col items-center justify-center max-w-lg mx-auto w-full relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeLog?.id}-${activeSetIndex}`}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full flex flex-col items-center"
          >
            <div className="relative mb-10 group">
              <div className="absolute inset-0 bg-[#6EE7B7]/20 blur-[60px] rounded-full scale-150 opacity-10 group-hover:opacity-30 transition-opacity" />
              <div className="relative flex items-center justify-center size-36 rounded-[3rem] bg-white/5 border border-white/10 text-white shadow-inner">
                <ExerciseIcon name={activeLog!.iconName} className="size-20" />
              </div>
            </div>

            <div className="text-center mb-10 w-full px-4">
              <h2 className="text-4xl font-black text-white tracking-tight leading-[1.1] mb-5 text-balance">
                {activeLog!.exerciseName}
              </h2>
              <div className="flex flex-col items-center gap-4">
                 <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">
                   {activeLog!.muscleGroup}
                 </span>
                 <div className="flex gap-1.5 h-1.5 items-center">
                   {activeLog!.sets.map((s, i) => (
                     <motion.div 
                       key={i} 
                       initial={false}
                       animate={{ 
                         backgroundColor: s.completed ? "#6EE7B7" : i === activeSetIndex ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
                         scale: i === activeSetIndex ? 1.2 : 1,
                         width: i === activeSetIndex ? 24 : 16
                       }}
                       className="h-1.5 rounded-full transition-all"
                     />
                   ))}
                 </div>
              </div>
            </div>

            <div className="w-full space-y-6">
              <div className="grid grid-cols-2 gap-5">
                {activeLog!.isBodyweight ? (
                  <div className="rounded-[2.5rem] border border-[#6EE7B7]/20 bg-[#6EE7B7]/5 p-6 backdrop-blur-md flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#6EE7B7] mb-2">MODO</p>
                    <span className="text-xl font-black text-white text-center leading-tight">PESO CORPORAL</span>
                  </div>
                ) : (
                  <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-5">PESO (KG)</p>
                    <div className="flex items-center justify-between w-full">
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="size-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-white"
                        onClick={() => onUpdateSet(activeLog!.id, activeSetIndex!, 'weight', Math.max(0, activeSet!.weight - 1))}
                      >
                        <ChevronLeft className="size-7" />
                      </motion.button>
                      <span className="text-4xl font-black text-white tabular-nums px-2">{activeSet!.weight}</span>
                      <motion.button 
                        whileTap={{ scale: 0.9 }}
                        className="size-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-white"
                        onClick={() => onUpdateSet(activeLog!.id, activeSetIndex!, 'weight', activeSet!.weight + 1)}
                      >
                        <ChevronRight className="size-7" />
                      </motion.button>
                    </div>
                  </div>
                )}

                <div className="rounded-[2.5rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md flex flex-col items-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-5">REPETICIONES</p>
                  <div className="flex items-center justify-between w-full">
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      className="size-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-white"
                      onClick={() => onUpdateSet(activeLog!.id, activeSetIndex!, 'reps', Math.max(0, activeSet!.reps - 1))}
                    >
                      <ChevronLeft className="size-7" />
                    </motion.button>
                    <span className="text-4xl font-black text-white tabular-nums px-2">{activeSet!.reps}</span>
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      className="size-12 rounded-[1.25rem] bg-white/5 flex items-center justify-center text-white"
                      onClick={() => onUpdateSet(activeLog!.id, activeSetIndex!, 'reps', activeSet!.reps + 1)}
                    >
                      <ChevronRight className="size-7" />
                    </motion.button>
                  </div>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                className="h-20 w-full rounded-[3.5rem] bg-[#6EE7B7] text-base font-black uppercase tracking-[0.3em] text-[#080B11] shadow-[0_20px_60px_rgba(110,231,183,0.3)] transition-all flex items-center justify-center relative overflow-hidden group shrink-0"
                onClick={() => onToggleSetCompleted(activeLog!.id, activeSetIndex!)}
              >
                <div className="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="relative z-10 flex items-center gap-3">
                  COMPLETAR SERIE <CheckCircle className="size-6" />
                </span>
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
