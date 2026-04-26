import { useEffect, useState, useMemo } from 'react';
import { calculateFatigue, calculateFatigueAt, RECOVERY_HOURS } from '@/lib/fatigue';
import { MuscleGroup, useStore, Exercise } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { MuscleMap } from '@/components/MuscleMap';
import { Settings, AlertTriangle, CheckCircle2, Info, Moon, Droplet, Flame, Footprints, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // if we want Spanish date, but we can stick to English
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { sessions, profile, updateProfile, foods, sleepLogs, exercises, setActiveSession } = useStore();
  const [fatigue, setFatigue] = useState<Record<MuscleGroup, number> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editProfile, setEditProfile] = useState(profile);

  useEffect(() => {
    if (isProfileOpen) setEditProfile(profile);
  }, [isProfileOpen, profile]);

  const handleSaveProfile = () => {
    updateProfile(editProfile);
    setIsProfileOpen(false);
  };

  const startRecommended = (exerciseId: string) => {
    const ex = exercises.find(e => e.id === exerciseId);
    if (!ex) return;
    
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

  useEffect(() => {
    setFatigue(calculateFatigue());
    const interval = setInterval(() => {
      setFatigue(calculateFatigue());
    }, 60000);
    return () => clearInterval(interval);
  }, [sessions]);

  // Calories & Macros calc
  const todayDate = new Date();
  const todayStr = format(todayDate, 'yyyy-MM-dd');
  const todayFoods = foods.filter(f => f.date.startsWith(todayStr));
  const consumedCals = todayFoods.reduce((acc, f) => acc + f.calories, 0);

  // Last sleep calc
  const lastSleep = sleepLogs.length > 0 ? sleepLogs[sleepLogs.length - 1] : null;

  const coachAdvice = useMemo(() => {
    if (!fatigue) return null;
    const entries = (Object.entries(fatigue) as [MuscleGroup, number][]).sort((a, b) => b[1] - a[1]);
    const highest = entries[0];
    
    if (highest[1] > 70) {
      const related = entries.find(e => e[0] !== highest[0] && e[1] > 60);
      return {
        level: 'danger',
        title: `${highest[0]} ${related ? `and ${related[0]}` : ''} need rest.`,
        body: `Accumulated fatigue is high (${Math.round(highest[1])}%). Train lower body or take an active recovery day.`
      };
    } else if (highest[1] > 40) {
      return {
        level: 'warn',
        title: `Moderate fatigue in ${highest[0]}.`,
        body: `You can train, but avoid taking sets to absolute failure to prevent CNS burnout.`
      };
    } else {
      return {
        level: 'good',
        title: `Prime condition.`,
        body: `All systems nominal. Perfect day for high-volume progression or hitting PRs.`
      };
    }
  }, [fatigue]);

  if (!fatigue) return null;

  return (
    <div className="h-full flex flex-col bg-[#080B11] overflow-hidden relative">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-end shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-none">Today</h1>
          <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Readiness estimate</p>
        </div>
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger
            render={
              <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full bg-[#121721] text-zinc-400 hover:text-white border border-white/5 transition-all">
                <Settings className="w-5 h-5" />
              </Button>
            }
          />
          <DialogContent className="bg-[#121721] border-white/5 text-white rounded-[2.5rem] p-6 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold tracking-tight">Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Age</Label>
                  <Input 
                    type="number" 
                    value={editProfile.age} 
                    onChange={e => setEditProfile({...editProfile, age: Number(e.target.value)})}
                    className="bg-[#1A202C] border-none rounded-2xl h-14 font-bold text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Weight (kg)</Label>
                  <Input 
                    type="number" 
                    value={editProfile.weight} 
                    onChange={e => setEditProfile({...editProfile, weight: Number(e.target.value)})}
                    className="bg-[#1A202C] border-none rounded-2xl h-14 font-bold text-lg"
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="w-full bg-[#6EE7B7] hover:bg-[#5FE7B0] text-black font-bold h-14 rounded-2xl text-lg transition-all active:scale-95">
                Save & Update
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4 no-scrollbar">
        
        {/* Readiness Card */}
        <div className="bg-[#121721] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden group">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <div className="text-[4rem] font-black text-white leading-none tracking-tighter">78%</div>
              <div className="mt-2 flex flex-col">
                <span className="text-[#6EE7B7] text-sm font-bold uppercase tracking-widest">Ready to train</span>
                <span className="text-zinc-500 text-[10px] mt-0.5">Best focus: Legs + Core</span>
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-[8px] border-[#1A202C] border-t-[#6EE7B7] flex items-center justify-center relative rotate-45 group-hover:scale-105 transition-transform duration-500">
               <div className="text-xs font-bold text-[#6EE7B7] -rotate-45">28 min</div>
            </div>
          </div>
          
          <Button 
            onClick={() => startRecommended('e3')}
            className="w-full mt-8 bg-[#6EE7B7] hover:bg-[#5FE7B0] text-[#080B11] font-black h-14 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-emerald-500/10"
          >
            Start workout
          </Button>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="space-y-2">
               <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                 <span>Sleep</span>
                 <span className="text-zinc-100">{lastSleep ? lastSleep.durationHours : '--'}h</span>
               </div>
               <div className="h-1 bg-[#1A202C] rounded-full overflow-hidden">
                 <div className="h-full bg-[#63B3ED] rounded-full" style={{ width: `${Math.min(100, ((lastSleep?.durationHours || 0) / 8) * 100)}%` }} />
               </div>
            </div>
            <div className="space-y-2">
               <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                 <span>Food Log</span>
                 <span className="text-zinc-100">{consumedCals}</span>
               </div>
               <div className="h-1 bg-[#1A202C] rounded-full overflow-hidden">
                 <div className="h-full bg-[#F6AD55] rounded-full" style={{ width: `${Math.min(100, (consumedCals / 2500) * 100)}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* Heatmap Card */}
        <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Recovery map</h3>
              <span className="text-[9px] text-zinc-500 bg-white/5 px-2 py-1 rounded-md">Estimated by zone</span>
           </div>
           
           <div className="h-[280px] relative pointer-events-auto rounded-[2rem] overflow-hidden bg-black/20">
             <MuscleMap fatigue={fatigue} />
           </div>

           <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Chest</span>
                 <span className="text-[10px] text-zinc-100 font-bold">42%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Arms</span>
                 <span className="text-[10px] text-orange-400 font-bold">58%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Core</span>
                 <span className="text-[10px] text-emerald-400 font-bold">91%</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Legs</span>
                 <span className="text-[10px] text-emerald-400 font-bold">84%</span>
              </div>
           </div>
        </div>

        {/* Recommendation Plan */}
        <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6">
           <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight mb-0.5">Today's plan</h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">28 min • no equipment</p>
              </div>
           </div>

           <div className="space-y-3">
              {[
                { name: 'Warm-up', time: '4 min', emoji: '🔥' },
                { name: 'Squats', time: '8 min', emoji: '🦵' },
                { name: 'Glute bridges', time: '6 min', emoji: '🌉' },
                { name: 'Plank circuit', time: '7 min', emoji: '📏' },
                { name: 'Cooldown', time: '3 min', emoji: '🧘' }
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-[#1A202C]/50 rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:bg-[#1A202C] transition-all cursor-pointer group"
                >
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">{item.emoji}</div>
                      <span className="text-sm font-bold text-white">{item.name}</span>
                   </div>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase">{item.time}</span>
                </div>
              ))}
           </div>

           <Button className="w-full mt-6 bg-[#6EE7B7]/10 hover:bg-[#6EE7B7]/20 text-[#6EE7B7] font-bold h-14 rounded-2xl text-sm border border-[#6EE7B7]/20 transition-all active:scale-95">
              Begin session
           </Button>
        </div>
      </div>
    </div>
  );
}
