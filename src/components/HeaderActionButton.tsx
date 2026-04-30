import type { ReactNode } from 'react';

interface HeaderActionButtonProps {
  onClick: () => void;
  ariaLabel: string;
  children: ReactNode;
}

export function HeaderActionButton({ onClick, ariaLabel, children }: HeaderActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex size-12 items-center justify-center rounded-[1.5rem] border border-white/6 bg-[#111827]/88 text-zinc-300 transition-all hover:border-white/12 hover:text-white"
    >
      {children}
    </button>
  );
}
