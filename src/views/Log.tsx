import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { format, subDays, startOfDay, isSameDay } from 'date-fns';
import { Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function Log() {
  const { sessions, sleepLogs, foods, setActiveSession } = useStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Generate last 6 days + today
  const dates = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const isSelected = isSameDay(d, selectedDate);
      return {
        date: d,
        day: i === 6 ? 'HOY' : format(d, 'EEE').toUpperCase(),
        num: format(d, 'd'),
        hasData: sessions.some(s => isSameDay(new Date(s.date), d)),
        isSelected
      };
    });
  }, [selectedDate, sessions]);

  // Data for selected day
  const daySessions = useMemo(() => sessions.filter(s => isSameDay(new Date(s.date), selectedDate)), [sessions, selectedDate]);
  const daySleep = useMemo(() => sleepLogs.find(s => isSameDay(new Date(s.date), selectedDate)), [sleepLogs, selectedDate]);
  const dayFoods = useMemo(() => foods.filter(f => isSameDay(new Date(f.date), selectedDate)), [foods, selectedDate]);
  const dayCals = dayFoods.reduce((acc, f) => acc + f.calories, 0);

  return (
    <div className="h-full flex flex-col bg-[#080B11] overflow-hidden relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-none">History</h1>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Training timeline</p>
      </header>

      {/* Date Ribbon */}
      <div className="flex gap-2 px-6 pb-6 overflow-x-auto no-scrollbar shrink-0">
        {dates.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(d.date)}
            className={cn(
              "flex flex-col items-center justify-center rounded-[2rem] border min-w-[50px] aspect-[1/1.6] transition-all shrink-0",
              d.isSelected 
                ? "bg-[#6EE7B7] border-[#6EE7B7] text-[#080B11]" 
                : "bg-white/5 border-transparent text-zinc-500 hover:border-white/10"
            )}
          >
            <span className={cn("text-[9px] font-bold tracking-widest uppercase", d.isSelected ? "text-[#080B11]/70" : "text-zinc-600")}>
              {d.day.slice(0, 3)}
            </span>
            <span className={cn("text-xl font-bold leading-none mt-1", d.isSelected ? "text-[#080B11]" : "text-white")}>
              {d.num}
            </span>
            <div className={cn("text-[8px] font-black mt-1", d.hasData ? (d.isSelected ? "text-[#080B11]/50" : "text-[#6EE7B7]") : "opacity-0")}>
              •
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-6 no-scrollbar">
        {/* Workout section */}
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-4 px-3">
            LOGGED ACTIVITIES
          </h3>
          
          <div className="space-y-2">
            {daySessions.length === 0 ? (
              <div className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase px-3 py-12 bg-white/5 rounded-[2.5rem] border border-white/5 border-dashed text-center">
                Nothing recorded
              </div>
            ) : (
              daySessions.map(session => {
                const totalReps = session.logs.reduce((acc, log) => acc + log.sets.reduce((sAcc, s) => sAcc + s.reps, 0), 0);
                const fatigueAdded = Math.min(100, Math.round(totalReps * 0.8));

                return (
                  <div key={session.id} className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">💪</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white leading-tight">{session.name || 'Strength Session'}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        {session.logs.length} moves • {totalReps} total units
                      </p>
                    </div>
                    <div className="text-[9px] font-bold text-[#F56565] shrink-0 bg-[#F56565]/10 px-2 py-1 rounded-lg">
                      +{fatigueAdded}% fatigue
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Vitals section */}
        <div className="space-y-2">
          {/* Sleep */}
          <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-5 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">😴</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight">Sleep</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {daySleep ? `${daySleep.durationHours} hours` : 'No sync data'}
              </p>
            </div>
            {daySleep && <CheckCircle2 className="w-5 h-5 text-[#6EE7B7]" />}
          </div>

          {/* Calories */}
          <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-5 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl">🔥</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-tight">Nutrition</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                {dayCals > 0 ? `${dayCals} kcal` : 'Incomplete'}
              </p>
            </div>
            {dayCals > 0 && <CheckCircle2 className="w-5 h-5 text-[#6EE7B7]" />}
          </div>
        </div>
      </div>

      {/* FAB add button */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild>
          <Button className="absolute bottom-28 right-8 w-14 h-14 bg-[#6EE7B7] rounded-full flex items-center justify-center text-[#080B11] shadow-2xl active:scale-95 transition-all outline-none p-0 border-none ring-0">
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-[#121721] border-white/5 text-white max-w-[320px] rounded-[3rem] p-8 focus:outline-none shadow-2xl">
           <h2 className="text-xl font-bold text-center mb-8 tracking-tight">Post progress</h2>
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setIsAddOpen(false);
                  setActiveSession({ logs: [], name: '', startTime: Date.now() });
                }}
                className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 hover:bg-white/10 transition-all border border-transparent active:scale-95"
              >
                 <span className="text-3xl">💪</span>
                 <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Workout</span>
              </button>
              <button 
                className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 opacity-30 cursor-not-allowed"
              >
                 <span className="text-3xl">😴</span>
                 <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Sleep</span>
              </button>
              <button 
                className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 opacity-30 cursor-not-allowed"
              >
                 <span className="text-3xl">🔥</span>
                 <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Meal</span>
              </button>
              <button 
                className="bg-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-3 opacity-30 cursor-not-allowed"
              >
                 <span className="text-3xl">💧</span>
                 <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Water</span>
              </button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
