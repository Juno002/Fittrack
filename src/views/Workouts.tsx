import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, WorkoutSession, WorkoutLog, WorkoutSet, MuscleGroup } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ExerciseIcon } from '@/components/ExerciseIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Save, ArrowUp, ArrowDown, Copy, Dumbbell, ChevronDown, ChevronUp, Search, Timer, CheckCircle2 } from 'lucide-react';
import { ALL_EXERCISES } from '@/data/allExercises';
import { cn } from '@/lib/utils';

interface WorkoutsProps {
  defaultLogs?: WorkoutLog[];
  defaultName?: string;
  defaultStartTime?: number | null;
  onExit?: () => void;
}

export function Workouts({ defaultLogs, defaultName, defaultStartTime, onExit }: WorkoutsProps) {
  const { exercises, addSession, addExercise, setActiveSession, updateActiveSessionLogs } = useStore();
  const [sessionName, setSessionName] = useState(defaultName || '');
  const [logs, setLogs] = useState<WorkoutLog[]>(defaultLogs || []);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  
  // Timers
  const [startTime, setStartTime] = useState<number | null>(defaultStartTime || null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync state changes back to store for resilience
  useEffect(() => {
    setActiveSession({
      logs,
      name: sessionName,
      startTime
    });
  }, [logs, sessionName, startTime, setActiveSession]);
  const [restSeconds, setRestSeconds] = useState(0);
  const [restDuration, setRestDuration] = useState(60); 
  const [restDone, setRestDone] = useState(false);
  
  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => ({ ...prev, [logId]: !prev[logId] }));
  };
  
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('chest');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<MuscleGroup | 'all'>('all');
  const [showManualEntry, setShowManualEntry] = useState(false);

  // Workout duration effect
  useEffect(() => {
    let interval: number;
    if (startTime) {
      interval = window.setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest timer effect
  useEffect(() => {
    let interval: number;
    if (restSeconds > 0) {
      setRestDone(false);
      interval = window.setInterval(() => {
        setRestSeconds(s => {
          if (s <= 1) {
            setRestDone(true);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restSeconds]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredExercises = useMemo(() => {
    let list = ALL_EXERCISES;
    if (filterMuscle !== 'all') {
      list = list.filter(ex => ex.muscleGroup === filterMuscle);
    }
    if (!searchQuery) return list.slice(0, 50);
    const searchLower = searchQuery.toLowerCase();
    return list.filter(ex => 
      ex.name.toLowerCase().includes(searchLower) || 
      ex.muscleGroup.toLowerCase().includes(searchLower)
    ).slice(0, 50);
  }, [searchQuery, filterMuscle]);

  const startWorkoutTime = () => {
    if (!startTime) setStartTime(Date.now());
  };

  const handleAddDBExercise = (ex: any) => {
    if (!exercises.find(e => e.id === ex.id)) {
        addExercise({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup as MuscleGroup,
        isBodyweight: ex.isBodyweight,
        iconName: 'Dumbbell'
        });
    }
    
    const newLogId = Date.now().toString();
    setLogs([...logs, { 
        id: newLogId, 
        exerciseId: ex.id, 
        sets: [],
        isBodyweight: ex.isBodyweight || false
    }]);
    setExpandedLogs(prev => ({ ...prev, [newLogId]: true }));
    setIsDialogOpen(false);
  };

  const handleAddExercise = () => {
    if (exercises.length === 0) return;
    const firstEx = exercises[0];
    const newLogId = Date.now().toString();
    setLogs([...logs, { 
      id: newLogId, 
      exerciseId: firstEx.id, 
      sets: [],
      isBodyweight: firstEx.isBodyweight || false
    }]);
    setExpandedLogs(prev => ({ ...prev, [newLogId]: true }));
  };

  const handleDuplicateLog = (logId: string) => {
    const logToDuplicate = logs.find(l => l.id === logId);
    if (!logToDuplicate) return;
    
    const newLog: WorkoutLog = {
      ...logToDuplicate,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 7),
      sets: logToDuplicate.sets.map(s => ({ ...s }))
    };
    
    const index = logs.findIndex(l => l.id === logId);
    const newLogs = [...logs];
    newLogs.splice(index + 1, 0, newLog);
    setLogs(newLogs);
  };

  const handleAddSet = (logId: string) => {
    startWorkoutTime();
    setLogs(logs.map(log => {
      if (log.id === logId) {
        const lastSet = log.sets[log.sets.length - 1];
        return {
          ...log,
          sets: [...log.sets, { reps: lastSet?.reps || 10, weight: lastSet?.weight || 0 }]
        };
      }
      return log;
    }));
  };

  const handleUpdateSet = (logId: string, setIndex: number, field: keyof WorkoutSet, value: number) => {
    startWorkoutTime();
    const validatedValue = Math.max(0, value);
    setLogs(logs.map(log => {
      if (log.id === logId) {
        const newSets = [...log.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: validatedValue };
        return { ...log, sets: newSets };
      }
      return log;
    }));
  };

  const handleCompleteSet = (logId: string, setIndex: number) => {
    startWorkoutTime();
    
    setLogs(logs.map(log => {
      if (log.id === logId) {
        const newSets = [...log.sets];
        const isCurrentlyCompleted = !!newSets[setIndex].completed;
        newSets[setIndex] = { ...newSets[setIndex], completed: !isCurrentlyCompleted };
        
        // Only trigger rest timer if we are marking it as completed (and it wasn't before)
        if (!isCurrentlyCompleted) {
          setRestSeconds(restDuration);
        }
        
        return { ...log, sets: newSets };
      }
      return log;
    }));
  };

  const handleRemoveSet = (logId: string, setIndex: number) => {
    setLogs(logs.map(log => {
      if (log.id === logId) {
        return { ...log, sets: log.sets.filter((_, i) => i !== setIndex) };
      }
      return log;
    }));
  };

  const handleRemoveLog = (logId: string) => {
    setLogs(logs.filter(log => log.id !== logId));
  };

  const handleToggleBodyweight = (logId: string, checked: boolean) => {
    setLogs(logs.map(log => {
      if (log.id === logId) {
        return { ...log, isBodyweight: checked };
      }
      return log;
    }));
  };

  const [isFinishing, setIsFinishing] = useState(false);
  const [effort, setEffort] = useState<number | null>(null);

  const handleSaveSession = () => {
    if (logs.length === 0) return;
    
    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: sessionName || 'Entrenamiento',
      logs: logs.filter(log => log.sets.length > 0),
      durationSeconds: elapsedSeconds
    };

    addSession(session);
    setActiveSession(null);
    if (onExit) onExit();
  };

  if (isFinishing) {
    return (
      <div className="h-full flex flex-col bg-[#080B11] p-8 animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white tracking-tight">How was the workout?</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Help us calibrate your recovery</p>
          </div>

          <div className="flex justify-center gap-3">
             {[1, 2, 3, 4, 5].map((num) => (
               <button
                key={num}
                onClick={() => setEffort(num)}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold transition-all active:scale-90",
                  effort === num 
                    ? "bg-[#6EE7B7] text-[#080B11] scale-110 shadow-lg shadow-emerald-500/20" 
                    : "bg-[#121721] text-zinc-500 border border-white/5 hover:border-white/10"
                )}
               >
                 {num}
               </button>
             ))}
          </div>

          <div className="w-full max-w-xs grid grid-cols-2 gap-4">
             <div className="bg-[#121721] p-6 rounded-[2rem] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Time</div>
                <div className="text-2xl font-bold text-white">{formatTime(elapsedSeconds)}</div>
             </div>
             <div className="bg-[#121721] p-6 rounded-[2rem] border border-white/5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sets</div>
                <div className="text-2xl font-bold text-white">{logs.reduce((acc, l) => acc + l.sets.length, 0)}</div>
             </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            disabled={effort === null}
            onClick={handleSaveSession}
            className="w-full h-16 rounded-[2rem] bg-[#6EE7B7] hover:bg-[#5FE7B0] text-[#080B11] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
          >
            Log Session
          </Button>
          <Button 
            variant="ghost"
            onClick={() => setIsFinishing(false)}
            className="w-full h-14 rounded-[2rem] text-zinc-500 font-bold uppercase tracking-widest text-xs"
          >
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#080B11] overflow-hidden">
      <header className="p-8 pb-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          {onExit && (
            <Button 
                variant="ghost" 
                onClick={onExit} 
                className="w-10 h-10 rounded-2xl bg-[#121721] text-zinc-400 hover:text-white p-0 flex items-center justify-center transition-all border border-white/5"
            >
              <ArrowDown className="w-5 h-5 rotate-90" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Session</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Active tracker</p>
          </div>
        </div>

        {startTime && (
          <div className="flex flex-col items-end">
            <div className="text-2xl font-bold text-[#6EE7B7] tracking-tighter tabular-nums">
              {formatTime(elapsedSeconds)}
            </div>
            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Duration</div>
          </div>
        )}
      </header>

      {/* Rest Timer Overlay */}
      {restSeconds > 0 && (
        <div className="mx-6 mb-4 px-6 py-4 bg-[#6EE7B7] rounded-[2rem] flex justify-between items-center animate-in slide-in-from-top-4 duration-500 shadow-lg shadow-emerald-500/20">
          <div className="flex items-center gap-3">
            <Timer className="w-6 h-6 text-[#080B11] animate-pulse" />
            <span className="text-xs font-bold text-[#080B11] uppercase tracking-widest">Rest</span>
          </div>
          <div className="font-bold text-2xl text-[#080B11] tabular-nums">
            {restSeconds}s
          </div>
          <button onClick={() => setRestSeconds(0)} className="text-[10px] font-bold text-[#080B11] underline uppercase tracking-widest p-2">Skip</button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col p-6 pt-0 mt-2">
        <div className="mb-6 shrink-0">
          <Input 
            placeholder="Name your workout..." 
            value={sessionName} 
            onChange={(e) => setSessionName(e.target.value)}
            className="bg-transparent border-b border-white/5 rounded-none h-14 text-white font-bold text-2xl placeholder:text-zinc-800 focus-visible:ring-0 px-0 transition-all focus:border-[#6EE7B7]/50"
          />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-32">
          {logs.map((log, logIndex) => (
            <div key={log.id} className="bg-[#121721] rounded-[2.5rem] border border-white/5 overflow-hidden">
              <div className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-4">
                   <div 
                      className="w-14 h-14 rounded-[1.5rem] bg-white/5 flex items-center justify-center cursor-pointer active:scale-95 transition-all text-[#6EE7B7]"
                      onClick={() => toggleExpand(log.id)}
                   >
                      <ExerciseIcon name={exercises.find(e => e.id === log.exerciseId)?.iconName || 'Dumbbell'} className="w-7 h-7" />
                   </div>
                   
                   <div className="flex-1 flex flex-col overflow-hidden" onClick={() => toggleExpand(log.id)}>
                      <span className="text-lg font-bold text-white truncate leading-none mb-1">
                        {exercises.find(e => e.id === log.exerciseId)?.name || 'Select Exercise'}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {exercises.find(e => e.id === log.exerciseId)?.muscleGroup} • {log.sets.length} units
                      </span>
                   </div>

                   <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveLog(log.id)} className="w-10 h-10 rounded-xl text-zinc-800 hover:text-red-500/50 hover:bg-red-500/5">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                   </div>
                </div>

                {expandedLogs[log.id] && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-300 space-y-6">
                    <div className="flex items-center gap-3">
                       <Checkbox 
                          id={`bw-${log.id}`} 
                          checked={log.isBodyweight} 
                          onCheckedChange={(c) => handleToggleBodyweight(log.id, !!c)}
                          className="border-zinc-800 rounded-[6px]"
                       />
                       <Label htmlFor={`bw-${log.id}`} className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest cursor-pointer">Use bodyweight</Label>
                    </div>

                    <div className="space-y-3">
                      {log.sets.map((set, setIndex) => (
                        <div key={setIndex} className={cn("flex items-center gap-3 group transition-all", set.completed && "opacity-40 grayscale-[0.5]")}>
                          <button 
                            onClick={() => handleCompleteSet(log.id, setIndex)}
                            className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90",
                              set.completed 
                                ? "bg-[#6EE7B7] text-[#080B11] shadow-lg shadow-emerald-500/20" 
                                : "bg-white/5 text-zinc-600 hover:bg-white/10"
                            )}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <div className="flex-1 flex gap-3">
                            {!log.isBodyweight && (
                              <div className="relative flex-1">
                                <Input 
                                  type="number"
                                  value={set.weight || ''} 
                                  onChange={(e) => handleUpdateSet(log.id, setIndex, 'weight', Number(e.target.value))}
                                  className="bg-white/5 border-none rounded-2xl text-center h-12 text-sm font-bold text-white px-8 focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50"
                                  placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-600 pointer-events-none">KG</span>
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-600 pointer-events-none">W</span>
                              </div>
                            )}
                            <div className="relative flex-1">
                              <Input 
                                type="number"
                                value={set.reps || ''} 
                                onChange={(e) => handleUpdateSet(log.id, setIndex, 'reps', Number(e.target.value))}
                                className="bg-white/5 border-none rounded-2xl text-center h-12 text-sm font-bold text-white px-8 focus-visible:ring-1 focus-visible:ring-[#6EE7B7]/50"
                                placeholder="0"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-600 pointer-events-none">REPS</span>
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-600 pointer-events-none">R</span>
                            </div>
                          </div>
                          <button onClick={() => handleRemoveSet(log.id, setIndex)} className="text-zinc-900 hover:text-red-500/50 p-2 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button 
                      variant="ghost" 
                      onClick={() => handleAddSet(log.id)}
                      className="w-full h-12 rounded-2xl bg-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-[#6EE7B7] hover:bg-[#6EE7B7]/5 transition-all"
                    >
                      New entry
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-12 right-12 flex gap-4 z-30">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="flex-1 h-16 rounded-[2rem] bg-white text-[#080B11] font-black uppercase tracking-widest shadow-2xl active:scale-[0.98] transition-all"
            >
              Add movement
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#121721] p-0 border-white/5 text-white rounded-[3rem] overflow-hidden max-w-md h-[85vh] flex flex-col">
            <DialogHeader className="p-8 pb-4">
              <div className="flex justify-between items-center">
                <DialogTitle className="text-2xl font-bold tracking-tight">
                  {showManualEntry ? 'Custom' : 'Add Movement'}
                </DialogTitle>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowManualEntry(!showManualEntry)}
                  className="text-[10px] font-bold uppercase tracking-widest text-[#6EE7B7] hover:text-[#5FE7B0]"
                >
                  {showManualEntry ? '← DB' : '+ Custom'}
                </Button>
              </div>
            </DialogHeader>
            
            {showManualEntry ? (
              <div className="flex-1 px-8 pb-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Exercise Name</Label>
                    <Input 
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      placeholder="e.g. Incline DB Press"
                      className="bg-[#1A202C] border-none rounded-2xl h-16 text-white font-bold text-lg px-6"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Target Muscle</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setNewExMuscle(m)}
                          className={cn(
                            "h-14 rounded-2xl text-[11px] font-bold uppercase tracking-widest border transition-all",
                            newExMuscle === m 
                            ? "bg-[#6EE7B7] border-[#6EE7B7] text-[#080B11]" 
                            : "bg-[#1A202C] border-transparent text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (!newExName) return;
                    handleAddDBExercise({
                      id: `custom-${Date.now()}`,
                      name: newExName,
                      muscleGroup: newExMuscle,
                      isBodyweight: false,
                    });
                    setNewExName('');
                    setShowManualEntry(false);
                  }}
                  className="w-full h-16 rounded-[2rem] bg-[#6EE7B7] text-[#080B11] font-black uppercase tracking-widest shadow-2xl"
                >
                  Add Custom
                </Button>
              </div>
            ) : (
              <>
                <div className="px-8 pb-4 shrink-0">
                   <div className="flex items-center bg-[#1A202C] rounded-[1.5rem] px-5 h-16 space-x-3 mb-6">
                      <Search className="w-5 h-5 text-zinc-500" />
                      <Input 
                        placeholder="Search movements..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none p-0 text-lg font-bold placeholder:text-zinc-700 focus-visible:ring-0"
                      />
                   </div>
                   
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                      {(['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setFilterMuscle(m)}
                          className={cn(
                            "px-5 py-2.5 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all shrink-0",
                            filterMuscle === m 
                            ? "bg-[#6EE7B7] border-[#6EE7B7] text-[#080B11]" 
                            : "bg-white/5 border-transparent text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-2 no-scrollbar">
                   {filteredExercises.length === 0 ? (
                     <div className="py-20 text-center space-y-4">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-zinc-800">
                          <Search className="w-10 h-10" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No movements found</p>
                        </div>
                     </div>
                   ) : (
                     filteredExercises.map(ex => (
                       <div 
                         key={ex.id}
                         onClick={() => handleAddDBExercise(ex)}
                         className="bg-white/5 p-5 rounded-[2rem] border border-transparent flex items-center justify-between cursor-pointer hover:bg-white/10 hover:border-white/5 transition-all group active:scale-[0.98]"
                       >
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-[#6EE7B7] group-hover:scale-110 transition-transform">
                              <ExerciseIcon name={ex.isBodyweight ? 'Activity' : 'Dumbbell'} className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-bold text-white text-base truncate">{ex.name}</span>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                {ex.muscleGroup} • {ex.isBodyweight ? 'BW' : 'Weighted'}
                              </span>
                            </div>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#6EE7B7] transition-all">
                           <Plus className="w-4 h-4 text-zinc-500 group-hover:text-[#080B11]" />
                         </div>
                       </div>
                     ))
                   )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        <Button 
          onClick={() => setIsFinishing(true)}
          disabled={logs.length === 0}
          className="h-16 px-8 rounded-[2rem] bg-[#6EE7B7] text-[#080B11] font-black uppercase tracking-widest hover:bg-[#5FE7B0] disabled:opacity-30 transition-all shadow-xl shadow-emerald-500/20"
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
