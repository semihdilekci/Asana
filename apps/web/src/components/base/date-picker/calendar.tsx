'use client';

import { getLocalTimeZone, today } from '@internationalized/date';
import { ChevronLeft, ChevronRight } from '@untitledui/icons';
import type { CalendarProps as AriaCalendarProps, DateValue } from 'react-aria-components';
import {
  Calendar as AriaCalendar,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
} from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';

import { CalendarCell } from './calendar-cell';

export interface CalendarProps extends AriaCalendarProps<DateValue> {
  highlightedDates?: DateValue[];
}

export function Calendar({ highlightedDates, className, ...props }: CalendarProps) {
  return (
    <AriaCalendar
      {...props}
      className={(state) =>
        cx(
          'flex w-[280px] flex-col gap-3',
          typeof className === 'function' ? className(state) : className,
        )
      }
    >
      {({ state }) => (
        <>
          <header className="flex items-center justify-between gap-2">
            <Button
              slot="previous"
              color="ghost"
              size="sm"
              className="size-8 min-h-8 p-0"
              aria-label="Önceki ay"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Button>
            <Heading className="flex-1 text-center text-sm font-semibold text-text-secondary" />
            <Button
              slot="next"
              color="ghost"
              size="sm"
              className="size-8 min-h-8 p-0"
              aria-label="Sonraki ay"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Button>
          </header>

          <div className="flex justify-end">
            {/* slot={null} — Calendar yalnızca previous/next slot kabul eder (RAC) */}
            <Button
              slot={null}
              color="secondary"
              size="sm"
              onPress={() => {
                const t = today(getLocalTimeZone());
                state.setValue(t);
                state.setFocusedDate(t);
              }}
            >
              Bugün
            </Button>
          </div>

          <CalendarGrid weekdayStyle="short">
            <CalendarGridHeader>
              {(day) => (
                <CalendarHeaderCell className="pb-1 text-xs font-medium text-text-tertiary">
                  {day.slice(0, 2)}
                </CalendarHeaderCell>
              )}
            </CalendarGridHeader>
            <CalendarGridBody>
              {(date) => (
                <CalendarCell
                  date={date}
                  isHighlighted={highlightedDates?.some((d) => date.compare(d) === 0)}
                />
              )}
            </CalendarGridBody>
          </CalendarGrid>
        </>
      )}
    </AriaCalendar>
  );
}
