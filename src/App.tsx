import { lazy, Suspense, useEffect, useRef, useState } from 'react';

import { Layout, type AppTab } from '@/components/Layout';
import { useStore } from '@/store';
import { Onboarding } from '@/views/Onboarding';

const DashboardView = lazy(() => import('./views/Dashboard').then((module) => ({ default: module.Dashboard })));
const MapView = lazy(() => import('./views/Map').then((module) => ({ default: module.Map })));
const TrainView = lazy(() => import('./views/Train').then((module) => ({ default: module.Train })));
const LogView = lazy(() => import('./views/Log').then((module) => ({ default: module.Log })));
const StatsView = lazy(() => import('./views/Stats').then((module) => ({ default: module.Stats })));
const ProfileView = lazy(() => import('./views/Profile').then((module) => ({ default: module.Profile })));
const WorkoutsView = lazy(() => import('./views/Workouts').then((module) => ({ default: module.Workouts })));

function ViewFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#07101A] text-sm font-semibold text-zinc-500">
      Cargando HomeFit Recovery...
    </div>
  );
}

export default function App() {
  const draftSession = useStore((state) => state.draftSession);
  const onboarded = useStore((state) => state.settings.onboarded);
  const draftId = draftSession?.id ?? null;
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isWorkoutOpen, setIsWorkoutOpen] = useState(Boolean(draftSession));
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  if (isProfileOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <ProfileView onBack={() => setIsProfileOpen(false)} />
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
        {activeTab === 'home' ? (
          <DashboardView
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onNavigate={setActiveTab}
          />
        ) : null}
        {activeTab === 'map' ? <MapView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'train' ? <TrainView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'log' ? <LogView onOpenWorkout={() => setIsWorkoutOpen(true)} /> : null}
        {activeTab === 'progress' ? <StatsView /> : null}
      </Suspense>
    </Layout>
  );
}
