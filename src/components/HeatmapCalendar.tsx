import { useMemo } from 'react';
import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

import { useStoreData } from '@/hooks/useStoreData';
import { capitalizeText } from '@/lib/display';
import { cn } from '@/lib/utils';
import { toDayKey } from '@/lib/dates';

export function HeatmapCalendar() {
  const data = useStoreData();
  const today = useMemo(() => new Date(), []);

  const calendarData = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start, end });
    const startDayOfWeek = getDay(start);
    const activeDays = new Set(data.sessions.map((session) => session.dayKey));
    const padding = Array.from({ length: startDayOfWeek }).map(() => null);

    const days = daysInMonth.map((date) => {
      const dayKey = toDayKey(date);
      return {
        date,
        dayKey,
        dayOfMonth: format(date, 'd', { locale: es }),
        isActive: activeDays.has(dayKey),
        isToday: dayKey === toDayKey(today),
      };
    });

    return {
      padding,
      days,
      monthName: capitalizeText(format(today, "MMMM 'de' yyyy", { locale: es })),
      monthPrefix: format(today, 'yyyy-MM', { locale: es }),
    };
  }, [data.sessions, today]);

  const weekdays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const monthSessions = data.sessions.filter((session) => session.performedAt.startsWith(calendarData.monthPrefix)).length;

  return (
    <div className="rounded-[2.5rem] border border-white/6 bg-[#101827] p-5">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Consistency</p>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-white">{calendarData.monthName}</h3>
        </div>
        <div className="rounded-[1.5rem] border border-white/8 bg-[#0b1320] px-4 py-3 text-right">
          <p className="text-2xl font-black text-white">{monthSessions}</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">Sesiones</p>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekdays.map((day) => (
          <div key={day} className="mb-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-600">
            {day}
          </div>
        ))}

        {calendarData.padding.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square rounded-[1rem] bg-transparent" />
        ))}

        {calendarData.days.map((day) => (
          <div
            key={day.dayKey}
            className={cn(
              'aspect-square rounded-[1rem] border border-transparent text-xs font-black transition-all flex items-center justify-center',
              day.isActive
                ? 'bg-[#6EE7B7] text-[#08111C] shadow-[0_12px_28px_rgba(110,231,183,0.16)]'
                : day.isToday
                  ? 'border-white/10 bg-white/5 text-white'
                  : 'bg-[#0b1320] text-zinc-600',
            )}
          >
            {day.dayOfMonth}
          </div>
        ))}
      </div>
    </div>
  );
}
