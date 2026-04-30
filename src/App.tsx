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

function ViewFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#07101A] text-sm font-semibold text-zinc-500">
      {label}
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

  const handleSetActiveTab = (tab: AppTab) => {
    setIsProfileOpen(false);
    setActiveTab(tab);
  };
  const activeViewFallbackLabel = isProfileOpen
    ? 'Cargando ajustes...'
    : activeTab === 'home'
      ? 'Cargando inicio...'
      : activeTab === 'map'
        ? 'Cargando mapa...'
        : activeTab === 'train'
          ? 'Cargando catalogo...'
          : activeTab === 'log'
            ? 'Cargando registro...'
            : 'Cargando progreso...';

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
      <Suspense fallback={<ViewFallback label="Cargando entrenamiento..." />}>
        <WorkoutsView onExit={() => setIsWorkoutOpen(false)} />
      </Suspense>
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
      draftName={draftSession ? (draftSession.name.trim() || 'Borrador') : undefined}
      hasDraftSession={Boolean(draftSession)}
      onResumeDraft={draftSession ? () => setIsWorkoutOpen(true) : undefined}
    >
      <Suspense fallback={<ViewFallback label={activeViewFallbackLabel} />}>
        {isProfileOpen ? (
          <ProfileView onBack={() => setIsProfileOpen(false)} />
        ) : null}
        {!isProfileOpen && activeTab === 'home' ? (
          <DashboardView
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onNavigate={handleSetActiveTab}
          />
        ) : null}
        {!isProfileOpen && activeTab === 'map' ? (
          <MapView
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        ) : null}
        {!isProfileOpen && activeTab === 'train' ? (
          <TrainView
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        ) : null}
        {!isProfileOpen && activeTab === 'log' ? (
          <LogView
            onOpenWorkout={() => setIsWorkoutOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
          />
        ) : null}
        {!isProfileOpen && activeTab === 'progress' ? (
          <StatsView onOpenProfile={() => setIsProfileOpen(true)} />
        ) : null}
      </Suspense>
    </Layout>
  );
}
