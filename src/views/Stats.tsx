import { useMemo } from 'react';
import { useStore } from '@/store';
import { isSameDay, subDays, startOfWeek, addDays, format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { TrendingUp, Flame, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function Stats() {
  const { sessions, sleepLogs } = useStore();

  // Very basic streak mock calculation
  const streak = 7; 

  // Generate weekly timeline
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
  
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(weekStart, i);
      const isFuture = isAfter(d, today) && !isSameDay(d, today);
      const daySessions = sessions.filter(s => isSameDay(new Date(s.date), d));
      
      const totalReps = daySessions.reduce((acc, session) => 
        acc + session.logs.reduce((lAcc, l) => 
          lAcc + l.sets.reduce((sAcc, s) => sAcc + s.reps, 0), 0), 0);
          
      // normalize reps for bar chart height (0-100%)
      const height = Math.min(100, (totalReps / 200) * 100);
      
      return {
        label: format(d, 'EEE').slice(0, 1),
        totalReps,
        height: isFuture ? 0 : height,
        trained: daySessions.length > 0,
        isFuture,
        isToday: isSameDay(d, today)
      };
    });
  }, [sessions, weekStart, today]);

  const currentWeekVolume = weeklyData.reduce((acc, d) => acc + d.totalReps, 0);

  // Sleep quality over last 7 days
  const sleepData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(today, 6 - i);
      const log = sleepLogs.find(s => isSameDay(new Date(s.date), d));
      return {
        name: format(d, 'EEE').toUpperCase(),
        score: log ? log.qualityScore : null
      };
    });
  }, [sleepLogs, today]);

  return (
    <div className="h-full flex flex-col bg-[#080B11] overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 shrink-0">
        <h1 className="text-3xl font-bold text-white tracking-tight leading-none">Activity</h1>
        <p className="text-xs font-semibold text-zinc-500 mt-1 uppercase tracking-wider">Metrics & Insights</p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-32 space-y-5 no-scrollbar">
        
        <div className="grid grid-cols-2 gap-4">
          {/* Streak card */}
          <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6 flex flex-col">
             <TrendingUp className="w-5 h-5 text-[#6EE7B7] mb-4" />
             <div className="text-4xl font-bold text-white leading-none">
                {streak}
             </div>
             <div className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Day Streak
             </div>
          </div>
          
          {/* Total Volume card */}
          <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6 flex flex-col">
             <Flame className="w-5 h-5 text-orange-400 mb-4" />
             <div className="text-4xl font-bold text-white leading-none">
                {currentWeekVolume}
             </div>
             <div className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                Unit Volume
             </div>
          </div>
        </div>

        {/* Weekly Bars */}
        <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-8">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase">Weekly trend</h3>
              <span className="text-[9px] text-[#6EE7B7] bg-[#6EE7B7]/10 px-2 py-1 rounded-md">Last 7 days</span>
           </div>
           
           <div className="flex justify-between items-end h-[140px] px-2">
             {weeklyData.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-4">
                   <div className="w-2.5 h-32 bg-white/5 rounded-full overflow-hidden flex items-end">
                      <div 
                        className={cn(
                          "w-full transition-all duration-1000 rounded-full", 
                          d.isToday ? "bg-[#6EE7B7]" : "bg-[#6EE7B7]/30"
                        )}
                        style={{ height: `${Math.max(10, d.height)}%` }}
                      />
                   </div>
                   <span className={cn("text-[10px] font-bold", d.isToday ? "text-[#6EE7B7]" : "text-zinc-600")}>
                     {d.label}
                   </span>
                </div>
             ))}
           </div>
        </div>

        {/* Sleep Quality Chart */}
        <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-8">
           <h3 className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mb-8">Sleep precision</h3>
           <div className="h-[120px] w-full">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={sleepData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                 <XAxis dataKey="name" hide />
                 <YAxis axisLine={false} tickLine={false} tick={false} domain={[0, 100]} />
                 <Tooltip 
                   contentStyle={{ backgroundColor: '#121721', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '1.5rem', fontSize: '10px' }}
                   itemStyle={{ color: '#6EE7B7', fontWeight: 'bold' }}
                   formatter={(value: number) => [`${value}`, 'Score']}
                 />
                 <Line type="monotone" dataKey="score" stroke="#6EE7B7" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#6EE7B7', stroke: '#080B11', strokeWidth: 2 }} />
               </LineChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-between mt-4 px-2">
              {sleepData.map((d, i) => (
                <span key={i} className="text-[9px] font-bold text-zinc-600">{d.name.slice(0, 1)}</span>
              ))}
           </div>
        </div>

        {/* Coach Analysis */}
        <div className="space-y-3">
           <h3 className="text-xl font-bold text-white tracking-tight mb-4 px-2">Performance review</h3>
           <div className="space-y-3">
              <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6 flex gap-4 items-center">
                 <div className="w-12 h-12 bg-[#6EE7B7]/10 rounded-2xl flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-[#6EE7B7]" />
                 </div>
                 <p className="text-xs leading-relaxed text-zinc-400">
                   <strong className="text-zinc-100 font-bold">Good acceleration.</strong> Your intensity is up 12% from last week. Keep this pace for another 7 days.
                 </p>
              </div>

              <div className="bg-[#121721] border border-white/5 rounded-[2.5rem] p-6 flex gap-4 items-center">
                 <div className="w-12 h-12 bg-orange-400/10 rounded-2xl flex items-center justify-center shrink-0">
                    <Flame className="w-6 h-6 text-orange-400" />
                 </div>
                 <p className="text-xs leading-relaxed text-zinc-400">
                   <strong className="text-zinc-100 font-bold">Rest imbalance.</strong> Recovery score is dropping. Add an extra hour of sleep tonight to compensate.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
