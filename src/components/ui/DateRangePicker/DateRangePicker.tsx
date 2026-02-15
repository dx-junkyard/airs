'use client';

import { type ReactNode } from 'react';
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker as AriaDateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Popover,
  RangeCalendar,
} from 'react-aria-components';
import type { DateValue, RangeValue } from 'react-aria-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCalendar,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export type DateRangePickerProps = {
  label?: ReactNode;
  'aria-label'?: string;
  value: RangeValue<DateValue> | null;
  onChange: (value: RangeValue<DateValue> | null) => void;
  isDisabled?: boolean;
  className?: string;
};

const DateRangePicker = (props: DateRangePickerProps) => {
  const {
    label,
    'aria-label': ariaLabel,
    value,
    onChange,
    isDisabled,
    className,
  } = props;

  return (
    <I18nProvider locale="ja-JP">
      <AriaDateRangePicker
        value={value}
        onChange={onChange}
        isDisabled={isDisabled}
        shouldForceLeadingZeros
        aria-label={!label ? (ariaLabel ?? '期間選択') : undefined}
        className={`
          flex flex-col gap-1
          ${className ?? ''}
        `}
      >
      {label && (
        <span className="text-oln-16N-100 text-solid-gray-900">{label}</span>
      )}
      <Group
        className={`
          rounded-8 inline-flex h-12 items-center gap-2 border
          border-solid-gray-600 bg-white px-3
          focus-within:border-black focus-within:ring-[calc(2/16*1rem)]
          focus-within:ring-yellow-300 focus-within:outline-4
          focus-within:outline-offset-[calc(2/16*1rem)]
          focus-within:outline-black focus-within:outline-solid
          hover:border-solid-gray-900
          data-[disabled]:border-solid-gray-300 data-[disabled]:bg-solid-gray-50
          data-[disabled]:text-solid-gray-420
        `}
      >
        <DateInput slot="start" aria-label="開始日" className="flex items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={`
                rounded px-0.5 text-solid-gray-800 tabular-nums outline-none
                focus:bg-blue-900 focus:text-white
                data-[placeholder]:text-solid-gray-420
              `}
            />
          )}
        </DateInput>
        <span className="text-solid-gray-600">~</span>
        <DateInput slot="end" aria-label="終了日" className="flex items-center">
          {(segment) => (
            <DateSegment
              segment={segment}
              className={`
                rounded px-0.5 text-solid-gray-800 tabular-nums outline-none
                focus:bg-blue-900 focus:text-white
                data-[placeholder]:text-solid-gray-420
              `}
            />
          )}
        </DateInput>
        <Button
          className={`
            ml-auto rounded p-1 text-solid-gray-600
            hover:bg-solid-gray-100 hover:text-solid-gray-900
            focus:outline-none
            data-[disabled]:pointer-events-none
            data-[disabled]:text-solid-gray-300
          `}
        >
          <FontAwesomeIcon icon={faCalendar} />
        </Button>
      </Group>
      <Popover
        className={`
          max-w-[calc(100vw-2rem)] rounded-lg border border-solid-gray-200
          bg-white p-3 shadow-lg
          sm:max-w-none sm:p-4
        `}
      >
        <Dialog className="outline-none">
          <RangeCalendar className="w-fit">
            <header className="mb-4 flex items-center justify-between">
              <Button
                slot="previous"
                className={`
                  rounded p-2 text-solid-gray-600
                  hover:bg-solid-gray-100 hover:text-solid-gray-900
                  focus:ring-2 focus:ring-yellow-300 focus:outline-none
                `}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <Heading className="text-oln-16B-100 text-solid-gray-900" />
              <Button
                slot="next"
                className={`
                  rounded p-2 text-solid-gray-600
                  hover:bg-solid-gray-100 hover:text-solid-gray-900
                  focus:ring-2 focus:ring-yellow-300 focus:outline-none
                `}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
            </header>
            <CalendarGrid className="border-collapse">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell
                    className={`
                      size-8 text-center text-sm font-medium text-solid-gray-600
                      sm:size-10
                    `}
                  >
                    {day}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell
                    date={date}
                    className={`
                      flex size-8 cursor-pointer items-center justify-center
                      text-sm text-solid-gray-800
                      hover:bg-solid-gray-100
                      focus:ring-2 focus:ring-yellow-300 focus:outline-none
                      data-[disabled]:pointer-events-none
                      data-[disabled]:text-solid-gray-300
                      data-[outside-month]:text-solid-gray-300
                      data-[selected]:bg-blue-100
                      data-[selected]:text-solid-gray-800
                      data-[selection-end]:rounded-r-full
                      data-[selection-end]:bg-blue-900
                      data-[selection-end]:text-white
                      data-[selection-start]:rounded-l-full
                      data-[selection-start]:bg-blue-900
                      data-[selection-start]:text-white
                      sm:size-10
                    `}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
      </AriaDateRangePicker>
    </I18nProvider>
  );
};

export default DateRangePicker;
