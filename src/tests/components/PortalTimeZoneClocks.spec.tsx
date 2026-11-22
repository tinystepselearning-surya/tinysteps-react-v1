import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PortalTimeZoneClocks, { formatPortalClock } from '../../components/common/PortalTimeZoneClocks';

describe('local and IST portal clocks', () => {
  afterEach(() => vi.useRealTimers());

  it('uses the same instant and follows Pacific DST automatically', () => {
    const before = new Date('2026-11-01T08:50:00.000Z');
    const after = new Date('2026-11-01T09:25:00.000Z');
    expect(formatPortalClock(before, 'America/Los_Angeles')).toMatchObject({
      time: '01:50 AM',
      abbreviation: 'PDT',
    });
    expect(formatPortalClock(after, 'America/Los_Angeles')).toMatchObject({
      time: '01:25 AM',
      abbreviation: 'PST',
    });
    expect(formatPortalClock(before, 'Asia/Kolkata')).toMatchObject({
      time: '02:20 PM',
      abbreviation: 'IST',
    });
  });

  it('updates both times without making a network request and lets the teacher refresh their zone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T08:50:00.000Z'));
    const refresh = vi.fn();
    render(<PortalTimeZoneClocks
      timeZone="America/Los_Angeles"
      zoneSource="profile"
      onRefreshTimeZone={refresh}
    />);

    expect(screen.getByTestId('portal-local-clock').textContent).toContain('01:50 AM');
    expect(screen.getByTestId('portal-local-clock').textContent).toContain('PDT');
    expect(screen.getByTestId('portal-india-clock').textContent).toContain('02:20 PM');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh saved time zone' }));
    expect(refresh).toHaveBeenCalledOnce();

    act(() => {
      vi.setSystemTime(new Date('2026-11-01T09:25:00.000Z'));
      vi.advanceTimersByTime(15_000);
    });
    expect(screen.getByTestId('portal-local-clock').textContent).toContain('01:25 AM');
    expect(screen.getByTestId('portal-local-clock').textContent).toContain('PST');
    expect(screen.getByTestId('portal-india-clock').textContent).toContain('02:55 PM');
  });

  it('has a device-zone clock for parents without a refresh or Firestore dependency', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-22T12:00:00.000Z'));
    render(<PortalTimeZoneClocks />);
    expect(screen.getByTestId('portal-local-clock').textContent).toContain('device');
    expect(screen.queryByRole('button', { name: 'Refresh saved time zone' })).toBeNull();
    expect(screen.getByTestId('portal-india-clock').textContent).toContain('05:30 PM');
  });
});
