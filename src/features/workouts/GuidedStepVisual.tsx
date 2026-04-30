import type { ReactNode } from 'react';
import { motion } from 'motion/react';

import type { GuidedStepVisualKey } from '@/lib/guidedWorkout';
import { cn } from '@/lib/utils';

interface GuidedStepVisualProps {
  visualKey?: GuidedStepVisualKey;
  title: string;
  className?: string;
}

interface IllustrationFrameProps {
  ariaLabel: string;
  className?: string;
  children: ReactNode;
}

const FLOATING_GLOW_TRANSITION = {
  duration: 4,
  repeat: Infinity,
  ease: 'easeInOut',
} as const;

// These visuals are owned, code-native illustrations so the guided flow stays
// offline-first without redistributing media from third-party exercise APIs.

function IllustrationFrame({ ariaLabel, className, children }: IllustrationFrameProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#09101b] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.18, 0.35, 0.18], scale: [0.94, 1.06, 0.94] }}
        transition={FLOATING_GLOW_TRANSITION}
        className="absolute -left-6 top-5 size-20 rounded-full bg-white/10 blur-2xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.16, 0.3, 0.16], scale: [1.02, 0.92, 1.02] }}
        transition={{ ...FLOATING_GLOW_TRANSITION, duration: 5 }}
        className="absolute -right-4 bottom-0 size-24 rounded-full bg-white/10 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <svg
          viewBox="0 0 220 140"
          role="img"
          aria-label={ariaLabel}
          className="h-32 w-full"
        >
          {children}
        </svg>
      </motion.div>
    </div>
  );
}

function ArmCirclesVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.18),transparent_60%),linear-gradient(180deg,#0b1522_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="28" y="118" width="164" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
      <circle cx="110" cy="26" r="11" fill="#F7FAFC" />
      <path d="M110 38 V72" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 50 L74 54" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 50 L146 54" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 72 L94 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 72 L126 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <circle cx="62" cy="55" r="18" fill="none" stroke="#6EE7B7" strokeWidth="4" strokeDasharray="5 8" />
      <circle cx="158" cy="55" r="18" fill="none" stroke="#6EE7B7" strokeWidth="4" strokeDasharray="5 8" />
      <path d="M48 44 C56 32 69 32 76 44" fill="none" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
      <path d="M144 44 C151 32 164 32 172 44" fill="none" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="62" cy="55" r="4" fill="#6EE7B7" />
      <circle cx="158" cy="55" r="4" fill="#6EE7B7" />
    </IllustrationFrame>
  );
}

function ShoulderCirclesVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(122,185,255,0.18),transparent_60%),linear-gradient(180deg,#0b1320_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="28" y="118" width="164" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
      <circle cx="110" cy="24" r="11" fill="#F7FAFC" />
      <path d="M110 36 V72" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 48 L82 58" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 48 L138 58" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 72 L94 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 72 L126 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />

      <path
        d="M82 58 C72 50 72 36 82 28"
        fill="none"
        stroke="#7AB9FF"
        strokeWidth="4"
        strokeDasharray="5 8"
        strokeLinecap="round"
      />
      <path
        d="M138 58 C148 50 148 36 138 28"
        fill="none"
        stroke="#7AB9FF"
        strokeWidth="4"
        strokeDasharray="5 8"
        strokeLinecap="round"
      />

      <path
        d="M82 30 L76 34 L83 39"
        fill="none"
        stroke="#A7D4FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M138 30 L144 34 L137 39"
        fill="none"
        stroke="#A7D4FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path d="M110 48 L74 42" stroke="#A7D4FF" strokeWidth="6" strokeLinecap="round" strokeDasharray="6 7" opacity="0.55" />
      <path d="M110 48 L146 42" stroke="#A7D4FF" strokeWidth="6" strokeLinecap="round" strokeDasharray="6 7" opacity="0.55" />

      <motion.circle
        cx="82"
        cy="58"
        r="4"
        fill="#7AB9FF"
        animate={{ y: [0, -1.5, 0], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="138"
        cy="58"
        r="4"
        fill="#7AB9FF"
        animate={{ y: [0, -1.5, 0], opacity: [0.65, 1, 0.65] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.35 }}
      />
    </IllustrationFrame>
  );
}

function OppositeLimbsFloorVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.16),transparent_60%),linear-gradient(180deg,#0c1420_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="16" y="108" width="188" height="3" rx="1.5" fill="rgba(110,231,183,0.35)" />
      <rect x="20" y="112" width="180" height="6" rx="3" fill="rgba(255,255,255,0.14)" />

      <circle cx="52" cy="86" r="10" fill="#F7FAFC" />
      <path d="M62 86 H104" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M104 86 H124" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />

      <path d="M86 82 V42" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M86 82 L68 96" stroke="#A7F3D0" strokeWidth="6" strokeLinecap="round" strokeDasharray="6 7" opacity="0.6" />

      <path d="M124 86 L162 60" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M124 86 L144 102" stroke="#A7F3D0" strokeWidth="6" strokeLinecap="round" strokeDasharray="6 7" opacity="0.6" />

      <path d="M104 86 L92 104" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M92 104 L78 112" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />

      <motion.path
        d="M90 46 C100 36 114 34 126 40"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="3"
        strokeLinecap="round"
        animate={{ pathLength: [0.3, 1, 0.3], opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <path d="M122 38 L130 39 L124 46" fill="none" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

      <motion.circle
        cx="86"
        cy="42"
        r="4"
        fill="#6EE7B7"
        animate={{ y: [0, -1.5, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="162"
        cy="60"
        r="4"
        fill="#6EE7B7"
        animate={{ x: [0, 1.5, 0], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </IllustrationFrame>
  );
}

function GluteReleaseVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(122,185,255,0.18),transparent_60%),linear-gradient(180deg,#0c1420_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="18" y="108" width="184" height="4" rx="2" fill="rgba(122,185,255,0.3)" />
      <rect x="24" y="114" width="172" height="6" rx="3" fill="rgba(255,255,255,0.12)" />
      <circle cx="54" cy="88" r="10" fill="#F7FAFC" />
      <path d="M64 88 H102" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M102 88 H120" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M104 86 L128 100" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M128 100 H158" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M104 86 L126 72" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M126 72 L150 80" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M96 84 L88 102" stroke="#F7FAFC" strokeWidth="7" strokeLinecap="round" />
      <path d="M88 102 L76 110" stroke="#F7FAFC" strokeWidth="7" strokeLinecap="round" />
      <path d="M126 72 C132 64 142 64 148 72" fill="none" stroke="#A7D4FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="112" cy="86" r="16" fill="rgba(122,185,255,0.12)" />
    </IllustrationFrame>
  );
}

function HamstringsAnklesVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.16),transparent_60%),linear-gradient(180deg,#0b1522_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="18" y="110" width="184" height="4" rx="2" fill="rgba(110,231,183,0.28)" />
      <circle cx="84" cy="44" r="10" fill="#F7FAFC" />
      <path d="M88 54 L102 82" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M102 82 L88 106" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M102 82 L158 98" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M158 98 L180 94" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M102 82 L82 98" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M82 98 L64 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M160 90 L176 88 L168 102" fill="none" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 72 C122 64 136 64 148 70" fill="none" stroke="#6EE7B7" strokeWidth="3" strokeDasharray="4 7" strokeLinecap="round" />
    </IllustrationFrame>
  );
}

function ChildPoseVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(122,185,255,0.2),transparent_58%),linear-gradient(180deg,#0c1420_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="26" y="116" width="168" height="6" rx="3" fill="rgba(122,185,255,0.22)" />
      <circle cx="76" cy="86" r="10" fill="#F7FAFC" />
      <path
        d="M84 84 Q108 54 140 62 Q160 67 174 84"
        fill="none"
        stroke="#F7FAFC"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path d="M171 84 L192 86" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M138 93 Q118 104 94 102" fill="none" stroke="#F7FAFC" strokeWidth="9" strokeLinecap="round" />
      <path d="M95 102 L82 95" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <circle cx="130" cy="74" r="26" fill="rgba(122,185,255,0.14)" />
      <circle cx="130" cy="74" r="16" fill="rgba(167,212,255,0.16)" />
    </IllustrationFrame>
  );
}

function ChestOpenerVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(122,185,255,0.18),transparent_58%),linear-gradient(180deg,#0c1420_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="30" y="118" width="160" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
      <circle cx="110" cy="24" r="11" fill="#F7FAFC" />
      <path d="M110 36 V74" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 48 C96 52 88 58 82 68" fill="none" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 48 C124 52 132 58 138 68" fill="none" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 74 L94 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 74 L126 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M84 68 C96 78 124 78 136 68" fill="none" stroke="#A7D4FF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="110" cy="56" r="24" fill="rgba(122,185,255,0.12)" />
    </IllustrationFrame>
  );
}

function TorsoRotationVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(249,176,110,0.2),transparent_58%),linear-gradient(180deg,#11131a_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="30" y="116" width="160" height="5" rx="2.5" fill="rgba(255,255,255,0.12)" />
      <circle cx="78" cy="42" r="10" fill="#F7FAFC" />
      <path d="M78 54 V80" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M60 63 H96" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M78 80 Q96 88 114 94" fill="none" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M114 94 Q134 100 150 92" fill="none" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M150 92 L168 82" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M150 52 C168 60 172 77 160 90"
        fill="none"
        stroke="#F9B06E"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="5 8"
      />
      <path d="M157 51 L169 57 L156 62" fill="none" stroke="#F9B06E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="136" cy="94" r="14" fill="rgba(249,176,110,0.12)" />
    </IllustrationFrame>
  );
}

function UpperBackReleaseVisual({ title, className }: Pick<GuidedStepVisualProps, 'title' | 'className'>) {
  return (
    <IllustrationFrame
      ariaLabel={`Guia visual de ${title}`}
      className={cn(
        'bg-[radial-gradient(circle_at_top,rgba(110,231,183,0.16),transparent_58%),linear-gradient(180deg,#0b1522_0%,#09101b_100%)]',
        className,
      )}
    >
      <rect x="30" y="118" width="160" height="4" rx="2" fill="rgba(255,255,255,0.14)" />
      <circle cx="110" cy="26" r="11" fill="#F7FAFC" />
      <path d="M110 38 C98 52 98 68 110 80" fill="none" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 56 L74 62" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M74 62 L66 72" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 56 L146 62" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M146 62 L154 72" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 80 L96 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M110 80 L124 108" stroke="#F7FAFC" strokeWidth="8" strokeLinecap="round" />
      <path d="M74 62 C92 78 128 78 146 62" fill="none" stroke="#A7F3D0" strokeWidth="3" strokeLinecap="round" />
      <circle cx="110" cy="66" r="22" fill="rgba(110,231,183,0.1)" />
    </IllustrationFrame>
  );
}

export function GuidedStepVisual({ visualKey, title, className }: GuidedStepVisualProps) {
  if (!visualKey) {
    return null;
  }

  switch (visualKey) {
    case 'arm-circles':
      return <ArmCirclesVisual title={title} className={className} />;
    case 'chest-opener':
      return <ChestOpenerVisual title={title} className={className} />;
    case 'child-pose':
      return <ChildPoseVisual title={title} className={className} />;
    case 'glute-release':
      return <GluteReleaseVisual title={title} className={className} />;
    case 'hamstrings-ankles':
      return <HamstringsAnklesVisual title={title} className={className} />;
    case 'opposite-limbs-floor':
      return <OppositeLimbsFloorVisual title={title} className={className} />;
    case 'shoulder-circles':
      return <ShoulderCirclesVisual title={title} className={className} />;
    case 'torso-rotation':
      return <TorsoRotationVisual title={title} className={className} />;
    case 'upper-back-release':
      return <UpperBackReleaseVisual title={title} className={className} />;
    default:
      return null;
  }
}
