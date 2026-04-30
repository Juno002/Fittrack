import type { ReactNode } from 'react';
import { Activity, Clock3, Dumbbell, LayoutGrid, TrendingUp } from 'lucide-react';

import { cn } from '@/lib/utils';

export type AppTab = 'home' | 'map' | 'train' | 'log' | 'progress';

interface LayoutProps {
  children: ReactNode;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  draftName?: string;
  hasDraftSession?: boolean;
  onResumeDraft?: () => void;
}

const NAV_ITEMS: { id: AppTab; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'home', label: 'Inicio', icon: LayoutGrid },
  { id: 'map', label: 'Mapa', icon: Activity },
  { id: 'train', label: 'Entrenar', icon: Dumbbell },
  { id: 'log', label: 'Registro', icon: Clock3 },
  { id: 'progress', label: 'Progreso', icon: TrendingUp },
];

export function Layout({
  children,
  activeTab,
  setActiveTab,
  draftName,
  hasDraftSession = false,
  onResumeDraft,
}: LayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-[#07101A] font-sans text-white">
      <main className="relative mx-auto flex w-full max-w-md flex-1 overflow-hidden">
        {children}
      </main>

      {draftName && onResumeDraft ? (
        <div className="fixed bottom-28 left-0 right-0 z-40 mx-auto flex w-full max-w-md justify-center px-4">
          <button
            type="button"
            onClick={onResumeDraft}
            className="flex w-full items-center justify-between rounded-[2rem] border border-[#6EE7B7]/18 bg-[#0b1320]/92 px-5 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl"
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

      <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto flex h-24 w-full max-w-md items-center justify-between border-t border-white/6 bg-[#07101A]/88 px-3 py-2 backdrop-blur-3xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasActiveDraftBadge = item.id === 'train' && hasDraftSession;
          const buttonLabel = hasActiveDraftBadge
            ? `${item.label}, sesion activa`
            : item.label;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={buttonLabel}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-1.5 rounded-[1.6rem] px-1 py-3 transition-all duration-300',
                isActive ? 'bg-white/6' : 'hover:bg-white/5',
              )}
            >
              <span className="relative">
                <Icon className={cn('size-5 transition-all', isActive ? 'scale-110 text-[#6EE7B7]' : 'text-zinc-600')} />
                {hasActiveDraftBadge ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#6EE7B7] shadow-[0_0_0_3px_rgba(7,16,26,0.9)]"
                  />
                ) : null}
              </span>
              <span className={cn('truncate text-[9px] font-bold uppercase tracking-[0.22em]', isActive ? 'text-white' : 'text-zinc-600')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
