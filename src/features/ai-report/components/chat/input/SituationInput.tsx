'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button/Button';

interface SituationInputProps {
  onSubmit: (text: string) => void;
}

export const SituationInput: React.FC<SituationInputProps> = ({ onSubmit }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-solid-gray-700">
          目撃した状況を教えてください
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: 畑の近くを歩いていた、道路を横断していた"
          rows={3}
          className={`
            w-full resize-none rounded-lg border border-solid-gray-300 px-3 py-2
            text-solid-gray-900
            placeholder:text-solid-gray-400
            focus:border-blue-500 focus:ring-1 focus:ring-blue-500
            focus:outline-none
          `}
        />
      </div>
      <Button onClick={handleSubmit} size="lg" aria-disabled={!text.trim()}>
        次へ
      </Button>
    </div>
  );
};

export default SituationInput;
