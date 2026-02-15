'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button/Button';

interface CorrectionInputProps {
  onSubmit: (text: string) => void;
}

export const CorrectionInput: React.FC<CorrectionInputProps> = ({
  onSubmit,
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
      setText('');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-solid-gray-700">
          修正したい内容を教えてください
        </p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="例: 時間が違います。11時頃でした"
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
        修正を送信
      </Button>
    </div>
  );
};

export default CorrectionInput;
