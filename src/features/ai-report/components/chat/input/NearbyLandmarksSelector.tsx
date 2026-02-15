'use client';

import React from 'react';
import Button from '@/components/ui/Button/Button';
import type { NearbyLandmark } from '@/features/ai-report/types';

interface NearbyLandmarksSelectorProps {
  landmarks: NearbyLandmark[];
  onSelect: (landmark: NearbyLandmark) => void;
  onSkip: () => void;
  isProcessing?: boolean;
}

export const NearbyLandmarksSelector: React.FC<
  NearbyLandmarksSelectorProps
> = ({ landmarks, onSelect, onSkip, isProcessing = false }) => {
  if (landmarks.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-solid-gray-600">
          周辺100m以内に目印となる施設が見つかりませんでした。
        </p>
        <Button onClick={onSkip} size="lg" disabled={isProcessing}>
          次へ進む
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-solid-gray-700">
        近くのものはどれですか？
      </p>
      <div className="flex flex-col gap-2">
        {landmarks.map((landmark) => (
          <button
            key={landmark.id}
            onClick={() => onSelect(landmark)}
            disabled={isProcessing}
            className={`
              flex items-center justify-between rounded-lg border
              border-solid-gray-200 bg-white px-4 py-3 text-left
              transition-colors
              hover:border-blue-500 hover:bg-blue-50
              disabled:cursor-not-allowed disabled:opacity-50
            `}
          >
            <div className="flex flex-col">
              <span className="font-medium text-solid-gray-900">
                {landmark.name}
              </span>
              <span className="text-xs text-solid-gray-500">
                {landmark.category}
              </span>
            </div>
            <span className="text-sm text-solid-gray-600">
              {landmark.distance}m
            </span>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        size="lg"
        onClick={onSkip}
        disabled={isProcessing}
      >
        該当なし（住所をそのまま使用）
      </Button>
    </div>
  );
};

export default NearbyLandmarksSelector;
