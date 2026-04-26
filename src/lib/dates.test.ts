import { describe, expect, it } from 'vitest';

import { dayKeyToIso, parseDayKey, toDayKey } from '@/lib/dates';

describe('day key utilities', () => {
  it('keeps the same local day on roundtrip', () => {
    const dayKey = '2026-04-26';

    expect(toDayKey(parseDayKey(dayKey))).toBe(dayKey);
  });

  it('creates noon-based ISO timestamps that roundtrip to the same day key', () => {
    const dayKey = '2026-04-27';

    expect(toDayKey(dayKeyToIso(dayKey))).toBe(dayKey);
  });
});
