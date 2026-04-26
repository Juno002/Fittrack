import { useState, useMemo } from 'react';
import { MuscleGroup } from '@/store';
import { cn } from '@/lib/utils';
import { RECOVERY_HOURS, getFatigueBreakdown, FatigueContribution } from '@/lib/fatigue';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Clock, Activity } from 'lucide-react';
import Model from 'react-body-highlighter';

interface MuscleMapProps {
  fatigue: Record<MuscleGroup, number>;
  className?: string;
}

const MUSCLE_MAPPING: Record<MuscleGroup, string[]> = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back', 'trapezius'],
  legs: ['quadriceps', 'hamstring', 'gluteal', 'calves'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  arms: ['biceps', 'triceps', 'forearm'],
  core: ['abs', 'obliques']
};

export function MuscleMap({ fatigue, className }: MuscleMapProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [breakdown, setBreakdown] = useState<FatigueContribution[]>([]);

  const handleMuscleClick = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    setBreakdown(getFatigueBreakdown(muscle));
  };

  const modelData = useMemo(() => {
    const data: { name: string; muscles: string[]; frequency: number }[] = [];
    
    (Object.entries(fatigue) as [MuscleGroup, number][]).forEach(([muscleGroup, value]) => {
      let frequency = 0;
      if (value < 20) {
        frequency = 1; // Ready
      } else if (value < 60) {
        frequency = 2; // Recovering
      } else {
        frequency = 3; // Rest Needed
      }

      data.push({
        name: muscleGroup,
        muscles: MUSCLE_MAPPING[muscleGroup],
        frequency
      });
    });

    return data;
  }, [fatigue]);

  // Reverse mapping to handle clicks from react-body-highlighter back to our MuscleGroups
  const handleModelClick = (exercise: any) => {
    const clickedMuscle = exercise.muscle;
    const foundGroup = (Object.keys(MUSCLE_MAPPING) as MuscleGroup[]).find(group => 
      MUSCLE_MAPPING[group].includes(clickedMuscle)
    );
    
    if (foundGroup) {
      handleMuscleClick(foundGroup);
    }
  };

  return (
    <div className={cn("flex flex-col items-center w-full h-full", className)}>
      <div className="flex justify-center gap-6 relative w-full h-full items-center">
        {/* Front View */}
        <div className="relative group cursor-pointer h-full flex flex-col items-center justify-center">
          <Model
            data={modelData}
            style={{ width: '8rem', height: '16rem' }}
            onClick={handleModelClick}
            type="anterior"
            highlightedColors={['#10b981', '#fb923c', '#ef4444']} // emerald-500, orange-400, red-500
            bodyColor="#2a2d31"
          />
          <div className="mt-2 bg-[#252529] border border-white/5 px-2 py-0.5 rounded-md pointer-events-none">
            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Front</span>
          </div>
        </div>

        {/* Back View */}
        <div className="relative group cursor-pointer h-full flex flex-col items-center justify-center">
          <Model
            data={modelData}
            style={{ width: '8rem', height: '16rem' }}
            onClick={handleModelClick}
            type="posterior"
            highlightedColors={['#10b981', '#fb923c', '#ef4444']}
            bodyColor="#2a2d31"
          />
          <div className="mt-2 bg-[#252529] border border-white/5 px-2 py-0.5 rounded-md pointer-events-none">
            <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest">Back</span>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedMuscle} onOpenChange={(open) => !open && setSelectedMuscle(null)}>
        <DialogContent className="bg-[#1a1c1e] border-white/5 text-white rounded-[2.5rem] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight capitalize flex items-center gap-3">
              <Activity className="w-6 h-6 text-emerald-400" />
              {selectedMuscle} Breakdown.
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {breakdown.length > 0 ? (
              breakdown.map((item, idx) => (
                <div key={idx} className="bg-[#2a2d31]/40 p-4 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-white">{item.exerciseName}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{item.sessionName}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400">+{Math.round(item.fatigueContribution)}%</div>
                      <div className="text-[8px] text-zinc-600 uppercase font-bold">Fatigue</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px]">{format(new Date(item.date), 'MMM d, HH:mm')}</span>
                    </div>
                    <div className="text-[10px] font-bold text-zinc-500 uppercase">{item.sets} sets</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500 text-sm">No recent workouts contributing to fatigue.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5">
            <div className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Total Fatigue</span>
              <span className="text-xl font-black text-emerald-400">{selectedMuscle ? Math.round(fatigue[selectedMuscle]) : 0}%</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
