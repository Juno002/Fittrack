import { useState, useMemo } from 'react';
import { useStore, MuscleGroup } from '@/store';
import { calculateFatigueAt } from '@/lib/fatigue';
import { cn } from '@/lib/utils';

interface ExerciseDef {
  id: string;
  name: string;
  thumb: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  mechanic: string;
  desc: string;
}

const EXERCISES: ExerciseDef[] = [
  { id: 'pushups', name: 'Push-ups', thumb: '💪', primary: 'chest', secondary: ['arms', 'shoulders', 'core'], mechanic: 'Compound', desc: 'Plank position, lower until chest almost touches ground, push up explosively.' },
  { id: 'squats', name: 'Squats', thumb: '🦵', primary: 'legs', secondary: ['core'], mechanic: 'Compound', desc: 'Feet shoulder-width, lower until parallel, knees aligned with toes.' },
  { id: 'aus_pullups', name: 'Australian Pull-ups', thumb: '🧗', primary: 'back', secondary: ['arms'], mechanic: 'Compound', desc: 'Bar at hip height, body straight like a plank, pull chest to bar.' },
  { id: 'glute_bridge', name: 'Glute Bridge', thumb: '🌉', primary: 'legs', secondary: ['core'], mechanic: 'Isolation', desc: 'Lying on back, knees bent, squeeze glutes to elevate hips.' },
  { id: 'pullups', name: 'Pull-ups', thumb: '⏫', primary: 'back', secondary: ['arms'], mechanic: 'Compound', desc: 'Hang from bar, pull body up until chin clears the bar.' },
  { id: 'dips', name: 'Dips', thumb: '🤸', primary: 'arms', secondary: ['chest', 'shoulders'], mechanic: 'Compound', desc: 'Support body on parallel bars, lower until shoulders are below elbows, push up.' },
  { id: 'pike_hspu', name: 'Pike Push-ups', thumb: '🔺', primary: 'shoulders', secondary: ['arms', 'chest'], mechanic: 'Compound', desc: 'Inverted V position, lower head to ground, push back up.' },
  { id: 'lunges', name: 'Lunges', thumb: '🚶', primary: 'legs', secondary: ['core'], mechanic: 'Compound', desc: 'Step forward, lower rear knee to ground, push back to start.' },
  { id: 'plank', name: 'Plank', thumb: '📏', primary: 'core', secondary: ['shoulders'], mechanic: 'Isometric', desc: 'Support body on forearms and toes, keep body in a straight line.' },
];

export function Train() {
  const { setActiveSession, exercises, addExercise } = useStore();
  const [filter, setFilter] = useState<'All' | 'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Core' | 'Arms'>('All');
  
  const fatigue = calculateFatigueAt(new Date());

  const filteredExercises = useMemo(() => {
    if (filter === 'All') return EXERCISES;
    return EXERCISES.filter(ex => {
      if (filter === 'Chest') return ex.primary === 'chest' || ex.secondary.includes('chest');
      if (filter === 'Back') return ex.primary === 'back' || ex.secondary.includes('back');
      if (filter === 'Legs') return ex.primary === 'legs' || ex.secondary.includes('legs');
      if (filter === 'Shoulders') return ex.primary === 'shoulders' || ex.secondary.includes('shoulders');
      if (filter === 'Core') return ex.primary === 'core' || ex.secondary.includes('core');
      if (filter === 'Arms') return ex.primary === 'arms' || ex.secondary.includes('arms');
      return true;
    });
  }, [filter]);

  const handleStartExercise = (ex: ExerciseDef) => {
    if (!exercises.find(e => e.id === ex.id)) {
      addExercise({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.primary,
        isBodyweight: true,
        iconName: 'Flame'
      });
    }

    setActiveSession({
      logs: [{
        id: Math.random().toString(36).substring(7),
        exerciseId: ex.id,
        sets: [{ reps: 0, weight: 0 }],
        isBodyweight: true
      }],
      name: `${ex.name} Focus`,
      startTime: Date.now()
    });
  };

  const filters = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Core', 'Arms'] as const;

  return (
    <div className="h-full flex flex-col bg-[#080B11] overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-none">Library</h1>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Exercise database</p>
      </header>

      {/* Filters */}
      <div className="flex gap-2 px-6 pb-4 overflow-x-auto no-scrollbar shrink-0">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "text-[10px] font-bold tracking-widest px-5 py-2.5 rounded-[1rem] border transition-all shrink-0 uppercase",
              filter === f 
                ? "bg-[#6EE7B7] border-[#6EE7B7] text-[#080B11]" 
                : "bg-white/5 border-white/5 text-zinc-500 hover:text-zinc-300 hover:border-white/10"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-2 no-scrollbar">
        {filteredExercises.map(ex => {
          const mainFatigue = fatigue[ex.primary];
          const isFatigued = mainFatigue > 60;

          return (
            <div 
              key={ex.id} 
              onClick={() => handleStartExercise(ex)}
              className="bg-[#121721] border border-white/5 rounded-[2rem] p-5 flex items-center gap-4 cursor-pointer hover:border-[#6EE7B7]/30 transition-all active:scale-[0.98] group"
            >
               <div className="w-12 h-12 bg-white/5 rounded-2xl shrink-0 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                 {ex.thumb}
               </div>
               <div className="flex-1 min-w-0">
                 <h3 className="text-sm font-bold text-white">{ex.name}</h3>
                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                   {ex.primary} • {isFatigued ? 'Fatigued' : 'Ready'}
                 </p>
               </div>
               <div className={cn(
                 "w-2 h-2 rounded-full",
                 isFatigued ? "bg-[#F56565]" : "bg-[#6EE7B7]"
               )} />
            </div>
          )
        })}
      </div>
    </div>
  );
}
