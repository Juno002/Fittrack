import { useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Trash2, ChevronDown, ChevronUp, History as HistoryIcon, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function History() {
  const { sessions, deleteSession, exercises } = useStore();
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleLog = (logId: string) => {
    setExpandedLogs(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

  const sortedSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <header className="mb-6 mt-4">
        <h1 className="text-3xl font-light tracking-tight text-zinc-900">Historial</h1>
        <p className="text-zinc-500 mt-1 text-sm">Tus entrenamientos anteriores.</p>
      </header>

      <div className="space-y-4">
        {sortedSessions.length === 0 ? (
          <p className="text-center text-zinc-400 text-sm py-8">Aún no hay entrenamientos registrados.</p>
        ) : (
          sortedSessions.map(session => (
            <Card key={session.id} className="border-none shadow-xl bg-[#1a1c1e] rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-white text-xl uppercase tracking-tighter shadow-sm">{session.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5 opacity-60">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(session.date), "d MMM, yyyy", { locale: es })}
                      </p>
                      {session.durationSeconds && (
                        <>
                          <div className="w-1 h-1 rounded-full bg-zinc-800" />
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            {Math.floor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteSession(session.id)} className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 -mt-2 -mr-2 rounded-full transition-all">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                    {session.logs.map((log, i) => {
                      const exercise = exercises.find(e => e.id === log.exerciseId);
                      if (!exercise) return null;
                      
                      const isExpanded = expandedLogs[log.id];
                      
                      return (
                        <div key={log.id} className="border-b border-white/5 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                          <button 
                            onClick={() => toggleLog(log.id)}
                            className="w-full flex justify-between items-center text-zinc-200 py-3 hover:bg-white/[0.02] rounded-2xl transition-all px-3"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-[#2a2d31] flex items-center justify-center shadow-lg">
                                <ExerciseIcon name={exercise.iconName || 'Dumbbell'} className="w-5 h-5 text-emerald-400" />
                              </div>
                              <div className="flex flex-col items-start">
                                <span className="font-black text-sm uppercase tracking-tight">{exercise.name}</span>
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{exercise.muscleGroup}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em]">{log.sets.length} sets</span>
                              <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
                                <ChevronDown className="w-4 h-4 text-zinc-700" />
                              </div>
                            </div>
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-3 space-y-2 animate-in slide-in-from-top-4 duration-500 overflow-hidden ml-14">
                              {log.sets.map((set, j) => (
                                <div key={j} className={cn(
                                  "flex justify-between items-center px-4 py-3 rounded-2xl text-xs border transition-all",
                                  set.completed 
                                    ? "bg-white/[0.03] border-white/5" 
                                    : "bg-[#2a2d31]/20 border-white/5 opacity-50"
                                )}>
                                  <div className="flex items-center gap-3">
                                    <span className="text-zinc-600 font-black text-[9px] uppercase tracking-tighter w-8">Set {j + 1}</span>
                                    <div className="flex gap-4">
                                      {set.weight > 0 && (
                                        <div className="flex items-center gap-1">
                                          <span className="text-white font-black text-lg font-mono tracking-tighter">{set.weight}</span>
                                          <span className="text-[8px] font-black text-zinc-600 uppercase">kg</span>
                                        </div>
                                      )}
                                      <div className="flex items-center gap-1">
                                        <span className="text-white font-black text-lg font-mono tracking-tighter">{set.reps}</span>
                                        <span className="text-[8px] font-black text-zinc-600 uppercase">reps</span>
                                      </div>
                                    </div>
                                  </div>
                                  {set.completed && (
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
