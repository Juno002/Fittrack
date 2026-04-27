import type { ReactNode } from 'react';
import { Clock3, LayoutGrid, TrendingUp, Trophy } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AppTab = 'today' | 'library' | 'timeline' | 'stats';

interface LayoutProps {
  children: ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  draftName?: string;
  onResumeDraft?: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'today', label: 'Inicio', icon: LayoutGrid },
  { id: 'library', label: 'Entrenar', icon: Trophy },
  { id: 'timeline', label: 'Diario', icon: Clock3 },
  { id: 'stats', label: 'Stats', icon: TrendingUp },
];

export function Layout({
  children,
  activeTab,
  setActiveTab,
  draftName,
  onResumeDraft,
}: LayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-[#080B11] font-sans text-white">
      <main className="relative mx-auto flex w-full max-w-md flex-1 overflow-hidden">
        {children}
      </main>

      {draftName && onResumeDraft ? (
        <div className="fixed bottom-24 left-0 right-0 z-40 mx-auto flex w-full max-w-md justify-center px-6">
          <button
            type="button"
            onClick={onResumeDraft}
            className="flex w-full items-center justify-between rounded-[2rem] border border-[#6EE7B7]/20 bg-[#121721]/95 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur-xl"
          >
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Sesión en borrador</p>
              <p className="mt-1 truncate text-sm font-black text-white">{draftName}</p>
            </div>

            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#6EE7B7]">
              Continuar
            </span>
          </button>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-24 w-full max-w-md items-center justify-between border-t border-white/5 bg-[#080B11]/80 px-5 py-2 backdrop-blur-3xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex flex-1 flex-col items-center gap-1.5 rounded-[1.5rem] px-2 py-3 transition-all duration-300',
                isActive ? 'bg-white/5' : 'hover:bg-white/5',
              )}
            >
              <Icon className={cn('size-5 transition-all', isActive ? 'scale-110 text-[#6EE7B7]' : 'text-zinc-600')} />
              <span className={cn('text-[9px] font-bold uppercase tracking-[0.25em]', isActive ? 'text-white' : 'text-zinc-600')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
