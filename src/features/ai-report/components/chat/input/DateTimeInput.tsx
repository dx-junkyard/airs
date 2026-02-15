'use client';

import React, { useState, useMemo } from 'react';
import Button from '@/components/ui/Button/Button';

/**
 * DateオブジェクトからローカルタイムゾーンのYYYY-MM-DD文字列を生成する。
 * Date.toISOString()はUTCに変換するため、JST深夜帯で日付が1日ずれる問題を回避する。
 */
function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface DateTimeInputProps {
  onSubmit: (dateTime: Date) => void;
}

export const DateTimeInput: React.FC<DateTimeInputProps> = ({ onSubmit }) => {
  const [dateTime, setDateTime] = useState(new Date());

  const now = useMemo(() => new Date(), []);
  const maxDate = toLocalDateString(now);

  const dateValue = toLocalDateString(dateTime);
  const timeValue = dateTime.toTimeString().slice(0, 5);

  // 選択日が今日の場合、時刻の最大値を現在時刻に制限
  const isToday = dateValue === maxDate;
  const maxTime = isToday ? now.toTimeString().slice(0, 5) : undefined;

  // 未来の日時かどうかをチェック
  const isFutureDateTime = dateTime > now;

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(dateTime);
    const [year, month, day] = e.target.value.split('-').map(Number);
    newDate.setFullYear(year, month - 1, day);

    // 日付変更後に未来になる場合は現在時刻に調整
    if (newDate > now) {
      newDate.setHours(now.getHours(), now.getMinutes());
    }

    setDateTime(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(dateTime);
    const [hours, minutes] = e.target.value.split(':').map(Number);
    newDate.setHours(hours, minutes);

    // 未来の時刻は現在時刻に制限
    if (newDate > now) {
      setDateTime(now);
    } else {
      setDateTime(newDate);
    }
  };

  const handleSubmit = () => {
    if (!isFutureDateTime) {
      onSubmit(dateTime);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-solid-gray-700">
          目撃した日時を選択してください
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={dateValue}
            max={maxDate}
            onChange={handleDateChange}
            className={`
              flex-1 rounded-lg border border-solid-gray-300 px-3 py-2
              text-solid-gray-900
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            `}
          />
          <input
            type="time"
            value={timeValue}
            max={maxTime}
            onChange={handleTimeChange}
            className={`
              rounded-lg border border-solid-gray-300 px-3 py-2
              text-solid-gray-900
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            `}
          />
        </div>
        {isFutureDateTime && (
          <p className="mt-1 text-sm text-red-600">
            現在時刻より後の日時は選択できません
          </p>
        )}
      </div>
      <Button
        onClick={handleSubmit}
        size="lg"
        aria-disabled={isFutureDateTime}
      >
        次へ
      </Button>
    </div>
  );
};

export default DateTimeInput;
