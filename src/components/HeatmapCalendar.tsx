import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from 'date-fns';

import { useStoreData } from '@/hooks/useStoreData';
import { cn } from '@/lib/utils';
import { toDayKey } from '@/lib/dates';

export function HeatmapCalendar() {
  const data = useStoreData();
  const today = useMemo(() => new Date(), []);
  
  const calendarData = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start); // 0 = Sunday, 1 = Monday...
    
    // We want Monday = 0 for the grid, or just stick to Sunday = 0
    // Let's stick to Sunday = 0 for standard US calendars
    
    const activeDays = new Set(data.sessions.map(s => s.dayKey));
    
    const padding = Array.from({ length: startDayOfWeek }).map(() => null);
    
    const days = daysInMonth.map(date => {
      const dayKey = toDayKey(date);
      return {
        date,
        dayKey,
        dayOfMonth: format(date, 'd'),
        isActive: activeDays.has(dayKey),
        isToday: dayKey === toDayKey(today),
      };
    });
    
    return { padding, days, monthName: format(today, 'MMMM yyyy') };
  }, [data.sessions, today]);

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="rounded-[2.5rem] border border-white/5 bg-[#121721] p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Consistency</p>
          <h3 className="mt-1 text-lg font-black tracking-tight text-white">{calendarData.monthName}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-white">{data.sessions.filter(s => s.performedAt.startsWith(format(today, 'yyyy-MM'))).length}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Sessions</p>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day, i) => (
          <div key={`weekday-${i}`} className="text-center text-[10px] font-bold text-zinc-600 mb-2">
            {day}
          </div>
        ))}
        
        {calendarData.padding.map((_, i) => (
          <div key={`padding-${i}`} className="aspect-square rounded-xl bg-transparent" />
        ))}
        
        {calendarData.days.map((day) => (
          <div
            key={day.dayKey}
            className={cn(
              'aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all',
              day.isActive 
                ? 'bg-[#6EE7B7] text-[#080B11] shadow-lg shadow-emerald-500/20' 
                : day.isToday
                  ? 'border border-white/20 bg-white/5 text-white'
                  : 'bg-black/20 text-zinc-600'
            )}
          >
            {day.dayOfMonth}
          </div>
        ))}
      </div>
    </div>
  );
}
