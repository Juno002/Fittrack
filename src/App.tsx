/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/views/Dashboard';
import { Log } from '@/views/Log';
import { Stats } from '@/views/Stats';
import { Train } from '@/views/Train';
import { Workouts } from '@/views/Workouts';

export default function App() {
  const [activeTab, setActiveTab] = useState('today');
  const { activeSession, setActiveSession } = useStore();

  if (activeSession) {
    return (
      <Workouts 
        defaultLogs={activeSession.logs}
        defaultName={activeSession.name}
        defaultStartTime={activeSession.startTime}
        onExit={() => setActiveSession(null)}
      />
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'today' && <Dashboard />}
      {activeTab === 'exercises' && <Train />}
      {activeTab === 'log' && <Log />}
      {activeTab === 'stats' && <Stats />}
    </Layout>
  );
}
