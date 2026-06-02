import { parseDate } from '@internationalized/date';
import type { DateValue } from 'react-aria-components';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` → React Aria `DateValue` (filtre / form string alanları için) */
export function isoDateStringToDateValue(iso: string | null | undefined): DateValue | null {
  const raw = iso?.trim() ?? '';
  if (!raw || !ISO_DATE.test(raw)) return null;
  try {
    return parseDate(raw);
  } catch {
    return null;
  }
}

/** React Aria `DateValue` → `YYYY-MM-DD` (API / URL query uyumu) */
export function dateValueToIsoDateString(value: DateValue | null | undefined): string {
  if (!value) return '';
  return value.toString();
}
