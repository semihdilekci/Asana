'use client';

import { getLocalTimeZone, isToday } from '@internationalized/date';
import type { CalendarCellProps as AriaCalendarCellProps } from 'react-aria-components';
import { CalendarCell as AriaCalendarCell } from 'react-aria-components';

import { cx } from '@/utils/cx';

interface CalendarCellProps extends AriaCalendarCellProps {
  isHighlighted?: boolean;
}

export function CalendarCell({ date, isHighlighted, ...props }: CalendarCellProps) {
  const isTodayDate = isToday(date, getLocalTimeZone());

  return (
    <AriaCalendarCell
      {...props}
      date={date}
      className={({ isDisabled, isFocusVisible, isSelected, isOutsideMonth }) =>
        cx(
          'relative flex size-10 items-center justify-center rounded-full text-sm outline-none',
          isOutsideMonth && 'opacity-40',
          isDisabled && 'pointer-events-none text-text-quaternary/50',
          !isDisabled && !isSelected && 'cursor-pointer text-text-secondary hover:bg-bg-secondary',
          isSelected && !isDisabled && 'bg-brand-600 font-semibold text-white hover:bg-brand-700',
          isFocusVisible && 'ring-2 ring-brand-300 ring-offset-2',
        )
      }
    >
      {({ formattedDate, isDisabled, isSelected }) => (
        <>
          {formattedDate}
          {(isHighlighted || isTodayDate) && !isSelected && !isDisabled ? (
            <span
              className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand-600"
              aria-hidden
            />
          ) : null}
        </>
      )}
    </AriaCalendarCell>
  );
}
