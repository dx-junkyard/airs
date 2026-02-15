import React from 'react';
import { useRouter } from 'next/navigation';
import {
  primaryButtonStyles,
  secondaryButtonStyles,
} from '@/components/ui/Chat/styles';

interface CompletionActionsProps {
  onStartOver: () => void;
  reportId?: string;
  reportToken?: string;
  reportLocation?: { latitude: number; longitude: number } | null;
}

export const CompletionActions: React.FC<CompletionActionsProps> = ({
  onStartOver,
  reportToken,
  reportLocation,
}) => {
  const router = useRouter();

  const handleViewReport = () => {
    if (reportToken) {
      router.push(`/report?token=${reportToken}`);
    }
  };

  const handleViewMap = () => {
    if (reportLocation) {
      router.push(
        `/map?lat=${reportLocation.latitude}&lng=${reportLocation.longitude}&zoom=18`
      );
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {reportToken && (
        <button
          type="button"
          onClick={handleViewReport}
          className={primaryButtonStyles.base}
        >
          通報内容を確認・編集
        </button>
      )}
      {reportLocation && (
        <button
          type="button"
          onClick={handleViewMap}
          className={secondaryButtonStyles.base}
        >
          地図で通報場所を確認
        </button>
      )}
      <button
        type="button"
        onClick={onStartOver}
        className={secondaryButtonStyles.base}
      >
        最初からやり直す
      </button>
    </div>
  );
};

export default CompletionActions;
