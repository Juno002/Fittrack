import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Cancelar',
  tone = 'default',
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-[2.5rem] border-white/6 bg-[#101827] p-6 text-white">
        <DialogHeader className="space-y-3">
          <div className={cn(
            'flex size-12 items-center justify-center rounded-[1.4rem]',
            tone === 'danger' ? 'bg-red-500/12 text-red-400' : 'bg-[#6EE7B7]/10 text-[#6EE7B7]',
          )}>
            <AlertTriangle className="size-5" />
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight text-white">{title}</DialogTitle>
          <p className="text-sm leading-relaxed text-zinc-400">{description}</p>
        </DialogHeader>

        <div className="mt-6 grid gap-3">
          <Button
            className={cn(
              'h-14 rounded-[1.75rem] text-[10px] font-black uppercase tracking-[0.3em]',
              tone === 'danger'
                ? 'bg-red-500 text-white hover:bg-red-400'
                : 'bg-[#6EE7B7] text-[#08111C] hover:bg-[#62e6b0]',
            )}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="ghost"
            className="h-12 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 hover:bg-white/5 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
