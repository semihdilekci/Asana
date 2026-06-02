'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { useControlledState } from '@react-stately/utils';
import { Calendar as CalendarIcon } from '@untitledui/icons';
import type { DatePickerProps as AriaDatePickerProps, DateValue } from 'react-aria-components';
import { DatePicker as AriaDatePicker, Dialog, Group, Popover } from 'react-aria-components';

import { Button, type ButtonSize } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';

import { Calendar } from './calendar';

const highlightedDates = [today(getLocalTimeZone())];

export interface DatePickerProps extends AriaDatePickerProps<DateValue> {
  /** Onay / iptal alt çubuğu (Untitled UI örneği); kapalıyken seçimde popover kapanır */
  showFooter?: boolean;
  onApply?: () => void;
  onCancel?: () => void;
  size?: ButtonSize;
  placeholder?: string;
}

/**
 * Untitled UI DatePicker — React Aria + secondary tetikleyici.
 * @example
 * const [value, setValue] = useState<DateValue | null>(today(getLocalTimeZone()));
 * <DatePicker aria-label="Tarih" value={value} onChange={setValue} />
 */
export function DatePicker({
  value: valueProp,
  defaultValue,
  onChange,
  showFooter = false,
  onApply,
  onCancel,
  size = 'sm',
  placeholder = 'Tarih seçin',
  ...props
}: DatePickerProps) {
  const [value, setValue] = useControlledState(valueProp, defaultValue ?? null, onChange);

  const label = value
    ? value.toDate(getLocalTimeZone()).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : placeholder;

  return (
    <AriaDatePicker {...props} value={value} onChange={setValue} shouldCloseOnSelect={!showFooter}>
      <Group className="inline-flex">
        <Button color="secondary" size={size} className="gap-2" data-testid="date-picker-trigger">
          <CalendarIcon className="size-4 shrink-0 text-text-quaternary" aria-hidden />
          <span>{label}</span>
        </Button>
      </Group>
      <Popover
        offset={8}
        placement="bottom start"
        className={({ isEntering, isExiting }) =>
          cx(
            'z-50 rounded-xl border border-border-secondary bg-bg-primary shadow-lg outline-none',
            isEntering &&
              'animate-in fade-in duration-150 ease-out placement-bottom:slide-in-from-top-0.5',
            isExiting &&
              'animate-out fade-out duration-100 ease-in placement-bottom:slide-out-to-top-0.5',
          )
        }
      >
        <Dialog className="p-4 outline-none">
          {({ close }) => (
            <>
              <Calendar highlightedDates={highlightedDates} />
              {showFooter ? (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border-secondary pt-3">
                  <Button
                    slot={null}
                    color="secondary"
                    size="md"
                    onPress={() => {
                      onCancel?.();
                      close();
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    slot={null}
                    color="primary"
                    size="md"
                    onPress={() => {
                      onApply?.();
                      close();
                    }}
                  >
                    Uygula
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
