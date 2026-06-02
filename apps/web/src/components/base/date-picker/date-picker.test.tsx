import { getLocalTimeZone, today } from '@internationalized/date';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { dateValueToIsoDateString, isoDateStringToDateValue } from './date-utils';
import { DatePicker } from './date-picker';

describe('date-utils', () => {
  it('ISO tarih dönüşümü', () => {
    const v = isoDateStringToDateValue('2026-05-26');
    expect(v).not.toBeNull();
    expect(dateValueToIsoDateString(v)).toBe('2026-05-26');
  });

  it('geçersiz ISO için null döner', () => {
    expect(isoDateStringToDateValue('')).toBeNull();
    expect(isoDateStringToDateValue('26.05.2026')).toBeNull();
  });
});

describe('<DatePicker>', () => {
  it('tetikleyici secondary buton olarak render edilir', () => {
    const now = today(getLocalTimeZone());
    render(<DatePicker aria-label="Tarih seçici" value={now} onChange={() => undefined} />);
    const trigger = screen.getByTestId('date-picker-trigger');
    expect(trigger.className).toContain('bg-bg-primary');
    expect(trigger.className).toContain('ring-border-primary');
  });
});
