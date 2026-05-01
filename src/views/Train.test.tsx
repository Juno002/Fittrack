import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useStore, createInitialAppStoreData } from '@/store';
import { Train } from '@/views/Train';

describe('Train visuals', () => {
  beforeEach(() => {
    localStorage.clear();
    useStore.getState().hydrateAppStoreData(createInitialAppStoreData());
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the technical exercise visual in the catalog cards', async () => {
    render(<Train onOpenWorkout={() => {}} onOpenProfile={() => {}} />);

    expect(await screen.findByRole('img', { name: /visual de flexiones \(push-ups\)/i })).toBeInTheDocument();
  });
});
