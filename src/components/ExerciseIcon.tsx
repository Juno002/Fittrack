import type { ComponentType } from 'react';
import {
  Accessibility,
  Activity,
  ArrowDown,
  ArrowUp,
  Dumbbell,
  Flame,
  Footprints,
  Timer,
  type LucideProps,
} from 'lucide-react';

import type { ExerciseIconName } from '@/store/types';

interface ExerciseIconProps extends LucideProps {
  name?: ExerciseIconName;
  className?: string;
}

const ICON_MAP = {
  Accessibility,
  Activity,
  ArrowDown,
  ArrowUp,
  Dumbbell,
  Flame,
  Footprints,
  Timer,
} satisfies Record<ExerciseIconName, ComponentType<LucideProps>>;

export function ExerciseIcon({ name, ...props }: ExerciseIconProps) {
  const Icon = ICON_MAP[name ?? 'Dumbbell'];
  return <Icon {...props} />;
}
