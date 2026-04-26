import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Layout, type AppTab } from '@/components/Layout';
import { useStore } from '@/store';

const DashboardView = lazy(() => import('@/views/Dashboard').then((module) => ({ default: module.Dashboard })));
const TrainView = lazy(() => import('@/views/Train').then((module) => ({ default: module.Train })));
const LogView = lazy(() => import('@/views/Log').then((module) => ({ default: module.Log })));
const StatsView = lazy(() => import('@/views/Stats').then((module) => ({ default: module.Stats })));
const WorkoutsView = lazy(() => import('@/views/Workouts').then((module) => ({ default: module.Workouts })));
import { Onboarding } from '@/views/Onboarding';

function ViewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#080B11] text-sm font-semibold text-zinc-500">
      Cargando Fittrack...
    </div>
  );
}

export default function App() {
  const draftSession = useStore((state) => state.draftSession);
  const onboarded = useStore((state) => state.settings.onboarded);
  const draftId = draftSession?.id ?? null;
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(Boolean(draftSession));
  const previousDraftId = useRef<string | null>(draftId);

  useEffect(() => {
    if (!draftId) {
      setIsWorkoutOpen(false);
      previousDraftId.current = null;
      return;
    }

    if (previousDraftId.current !== draftId) {
      setIsWorkoutOpen(true);
    }

    previousDraftId.current = draftId;
  }, [draftId]);

  if (!onboarded) {
    return <Onboarding />;
  }

  if (draftSession && isWorkoutOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <WorkoutsView onExit={() => setIsWorkoutOpen(false)} />
      </Suspense>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      draftName={draftSession ? (draftSession.name.trim() || 'Borrador') : undefined}
      onResumeDraft={draftSession ? () => setIsWorkoutOpen(true) : undefined}
    >
      <Suspense fallback={<ViewFallback />}>
        {activeTab === 'today' ? <DashboardView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'library' ? <TrainView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'timeline' ? <LogView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'stats' ? <StatsView /> : null}
      </Suspense>
    </Layout>
  );
}
