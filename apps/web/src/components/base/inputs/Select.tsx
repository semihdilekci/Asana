'use client';

import { ChevronDown } from '@untitledui/icons';
import {
  Button,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  type SelectProps as AriaSelectProps,
} from 'react-aria-components';

import { cx, sortCx } from '@/utils/cx';

import { disabledStyles, focusRing } from '../styles';

const selectStyles = sortCx({
  root: 'flex flex-col gap-1.5',
  label: 'text-xs font-semibold text-text-tertiary tracking-wide',
  trigger: cx(
    'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-transparent bg-bg-primary px-4 text-left text-sm text-text-primary shadow-sm',
    'hover:shadow-md',
    focusRing,
    disabledStyles,
  ),
  value: 'truncate data-[placeholder]:text-text-quaternary',
  popover:
    'max-h-60 min-w-[var(--trigger-width)] overflow-auto rounded-md border border-border-secondary bg-bg-primary py-1 shadow-lg',
  item: cx(
    'cursor-pointer px-4 py-2 text-sm text-text-primary outline-none',
    'data-[focused]:bg-brand-600/7 data-[selected]:bg-brand-50 data-[selected]:text-brand-700',
  ),
});

export interface SelectOption {
  id: string;
  label: string;
}

export interface SelectProps extends Omit<AriaSelectProps<SelectOption>, 'children' | 'className'> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export function Select({
  label,
  options,
  placeholder = 'Seçiniz',
  className,
  ...props
}: SelectProps) {
  return (
    <AriaSelect className={cx(selectStyles.root, className)} {...props}>
      <Label className={selectStyles.label}>{label}</Label>
      <Button className={selectStyles.trigger}>
        <SelectValue className={selectStyles.value}>
          {({ selectedText, defaultChildren }) => selectedText ?? defaultChildren ?? placeholder}
        </SelectValue>
        <ChevronDown aria-hidden className="size-4 shrink-0 text-text-tertiary" />
      </Button>
      <Popover className={selectStyles.popover}>
        <ListBox items={options} className="outline-none">
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className={selectStyles.item}>
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}
