'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseDate } from '@internationalized/date';
import {
  Button,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Popover,
} from 'react-aria-components';
import type { DateValue } from 'react-aria-components';
import { useMap } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import L from 'leaflet';
import { createRoot, type Root } from 'react-dom/client';

interface DateFilterUIProps {
  startDate: string;
  endDate: string;
  errorMessage: string | null;
  onDateRangeChange: (startDate: string, endDate: string) => void;
}

interface SingleDatePickerProps {
  ariaLabel: string;
  value: DateValue | null;
  minValue?: DateValue;
  maxValue?: DateValue;
  placement: 'bottom start' | 'bottom end';
  onChange: (value: DateValue | null) => void;
}

function SingleDatePicker({
  ariaLabel,
  value,
  minValue,
  maxValue,
  placement,
  onChange,
}: SingleDatePickerProps) {
  return (
    <DatePicker
      aria-label={ariaLabel}
      value={value}
      minValue={minValue}
      maxValue={maxValue}
      onChange={onChange}
      shouldForceLeadingZeros
      className="w-auto shrink-0"
    >
      <Group
        className={`
          inline-flex h-7 items-center gap-0.5 rounded bg-transparent px-0.5
          text-sm text-solid-gray-800
        `}
      >
        <DateInput
          aria-label={ariaLabel}
          className="inline-flex w-auto min-w-0 items-center"
        >
          {(segment) => (
            <DateSegment
              segment={segment}
              className={`
                rounded px-0.5 text-solid-gray-800 tabular-nums outline-none
                data-[placeholder]:text-solid-gray-420
              `}
            />
          )}
        </DateInput>
        <Button
          aria-label={`${ariaLabel}のカレンダーを開く`}
          className={`
            ml-0 rounded p-0.5 text-solid-gray-600
            hover:bg-solid-gray-100
          `}
        >
          <FontAwesomeIcon icon={faCalendar} className="size-3" />
        </Button>
      </Group>

      <Popover
        placement={placement}
        shouldFlip
        offset={6}
        containerPadding={8}
        className={`
          z-[1200] max-w-[calc(100vw-1rem)] rounded-md border
          border-[rgba(0,0,0,0.2)] bg-white p-2 shadow-lg
        `}
      >
        <Dialog className="outline-none">
          <Calendar className="w-fit">
            <header className="mb-2 flex items-center justify-between">
              <Button
                slot="previous"
                className={`
                  rounded p-1 text-solid-gray-700
                  hover:bg-solid-gray-100
                `}
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </Button>
              <Heading className="text-sm font-medium text-solid-gray-900" />
              <Button
                slot="next"
                className={`
                  rounded p-1 text-solid-gray-700
                  hover:bg-solid-gray-100
                `}
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </Button>
            </header>
            <CalendarGrid className="border-collapse">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell
                    className="size-8 text-center text-xs text-solid-gray-600"
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
                      flex size-8 items-center justify-center rounded text-xs
                      text-solid-gray-800
                      hover:bg-solid-gray-100
                      data-[disabled]:pointer-events-none
                      data-[disabled]:text-solid-gray-300
                      data-[outside-month]:text-solid-gray-300
                      data-[selected]:bg-blue-900 data-[selected]:text-white
                    `}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </DatePicker>
  );
}

function DateFilterUI({
  startDate,
  endDate,
  errorMessage,
  onDateRangeChange,
}: DateFilterUIProps) {
  const parsedStartDate = useMemo(() => {
    if (!startDate) return null;
    try {
      return parseDate(startDate);
    } catch {
      return null;
    }
  }, [startDate]);

  const parsedEndDate = useMemo(() => {
    if (!endDate) return null;
    try {
      return parseDate(endDate);
    } catch {
      return null;
    }
  }, [endDate]);

  return (
    <I18nProvider locale="ja-JP">
      <div className="space-y-1">
        <div
          className={`
            leaflet-bar inline-flex h-9 max-w-full items-center gap-1 rounded-md
            border border-[#808080] bg-white px-1 text-sm text-solid-gray-800
          `}
        >
          <SingleDatePicker
            ariaLabel="開始日"
            value={parsedStartDate}
            maxValue={parsedEndDate ?? undefined}
            placement="bottom start"
            onChange={(value) => onDateRangeChange(value?.toString() ?? '', endDate)}
          />
          <span className="shrink-0 text-solid-gray-500">~</span>
          <SingleDatePicker
            ariaLabel="終了日"
            value={parsedEndDate}
            minValue={parsedStartDate ?? undefined}
            placement="bottom end"
            onChange={(value) => onDateRangeChange(startDate, value?.toString() ?? '')}
          />
        </div>

        {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      </div>
    </I18nProvider>
  );
}

interface ReportDateFilterControlProps {
  startDate: string;
  endDate: string;
  onApplyDateRange: (startDate: string, endDate: string) => void;
}

/**
 * 地図左上に表示する日付範囲フィルターコントロール
 */
export default function ReportDateFilterControl({
  startDate,
  endDate,
  onApplyDateRange,
}: ReportDateFilterControlProps) {
  const map = useMap();
  const rootRef = useRef<Root | null>(null);
  const [draftStartDate, setDraftStartDate] = useState(startDate);
  const [draftEndDate, setDraftEndDate] = useState(endDate);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const applyDateRange = useCallback(
    (nextStartDate: string, nextEndDate: string) => {
      if (nextStartDate && nextEndDate && nextStartDate > nextEndDate) {
        setErrorMessage('開始日は終了日以前を指定してください');
        return;
      }

      setErrorMessage(null);
      onApplyDateRange(nextStartDate, nextEndDate);
    },
    [onApplyDateRange]
  );

  const handleDateRangeChange = useCallback(
    (nextStartDate: string, nextEndDate: string) => {
      setDraftStartDate(nextStartDate);
      setDraftEndDate(nextEndDate);
      applyDateRange(nextStartDate, nextEndDate);
    },
    [applyDateRange]
  );

  useEffect(() => {
    const CustomDateControl = L.Control.extend({
      onAdd: function () {
        const container = L.DomUtil.create('div', 'leaflet-control-date-filter');
        container.style.cssText = `
          position: absolute;
          top: 10px;
          left: 50px;
          z-index: 1000;
          width: auto;
          max-width: calc(100vw - 96px);
        `;

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        rootRef.current = createRoot(container);
        return container;
      },
      onRemove: function () {
        if (!rootRef.current) return;
        const root = rootRef.current;
        rootRef.current = null;
        setTimeout(() => root.unmount(), 0);
      },
    });

    const control = new CustomDateControl({ position: 'topleft' });
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map]);

  useEffect(() => {
    if (!rootRef.current) return;

    rootRef.current.render(
      <DateFilterUI
        startDate={draftStartDate}
        endDate={draftEndDate}
        errorMessage={errorMessage}
        onDateRangeChange={handleDateRangeChange}
      />
    );
  }, [draftStartDate, draftEndDate, errorMessage, handleDateRangeChange]);

  return null;
}
