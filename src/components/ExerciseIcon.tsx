import * as Icons from 'lucide-react';
import { LucideProps } from 'lucide-react';

interface ExerciseIconProps extends LucideProps {
  name?: string;
  className?: string;
}

export function ExerciseIcon({ name, ...props }: ExerciseIconProps) {
  // @ts-ignore - dynamic access to icons
  const Icon = (Icons as any)[name || 'Dumbbell'] || Icons.Dumbbell;
  return <Icon {...props} />;
}
