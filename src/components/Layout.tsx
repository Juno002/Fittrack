import { ReactNode } from 'react';
import { LayoutGrid, Dumbbell, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const navItems = [
    { id: 'today', label: 'HOY', icon: LayoutGrid },
    { id: 'exercises', label: 'EJERCICIOS', icon: Dumbbell },
    { id: 'log', label: 'REGISTRO', icon: Clock },
    { id: 'stats', label: 'PROGRESO', icon: TrendingUp },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#080B11] text-white font-sans">
      <main className="flex-1 overflow-hidden max-w-md mx-auto w-full relative">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-[#080B11]/80 backdrop-blur-3xl border-t border-white/5 px-6 py-2 flex justify-between items-center max-w-md mx-auto w-full z-50 h-24">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all duration-500 rounded-[1.5rem] py-3 px-1 flex-1",
                isActive ? "bg-white/5" : "hover:bg-white/5"
              )}
            >
              <div className={cn(
                "transition-all duration-500",
                isActive ? "text-[#6EE7B7] scale-110" : "text-zinc-600 group-hover:text-zinc-400"
              )}>
                <Icon className={cn("w-6 h-6", isActive && "animate-in zoom-in-90")} />
              </div>
              <span className={cn(
                "text-[9px] font-bold tracking-widest transition-all duration-500 uppercase",
                isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"
              )}>
                {item.id}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
