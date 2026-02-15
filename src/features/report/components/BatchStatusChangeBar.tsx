'use client';

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckDouble,
  faTimes,
  faSpinner,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import Button from '@/components/ui/Button/Button';
import {
  batchSelectModeAtom,
  selectedCountAtom,
  selectedReportIdsArrayAtom,
  selectAllAtom,
  clearSelectionAtom,
  exitBatchModeAtom,
} from '@/features/report/atoms/reportBatchSelectAtoms';
import useBatchStatusChange from '@/hooks/mutations/useBatchStatusChange';

interface BatchStatusChangeBarProps {
  /** 表示されている全てのレポートID */
  allReportIds: string[];
  /** 選択中の職員ID */
  selectedStaffId: string | null;
  /** ステータス変更成功後のコールバック */
  onSuccess?: () => void;
}

const BatchStatusChangeBar = ({
  allReportIds,
  selectedStaffId,
  onSuccess,
}: BatchStatusChangeBarProps) => {
  const [batchMode, setBatchMode] = useAtom(batchSelectModeAtom);
  const selectedCount = useAtomValue(selectedCountAtom);
  const selectedIds = useAtomValue(selectedReportIdsArrayAtom);
  const selectAll = useSetAtom(selectAllAtom);
  const clearSelection = useSetAtom(clearSelectionAtom);
  const exitBatchMode = useSetAtom(exitBatchModeAtom);

  const mutation = useBatchStatusChange();

  const handleSelectAll = () => {
    selectAll(allReportIds);
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  const handleExitBatchMode = () => {
    exitBatchMode();
  };

  const handleStatusChange = (status: 'completed') => {
    if (selectedIds.length === 0) return;

    mutation.mutate(
      { ids: selectedIds, status, staffId: selectedStaffId },
      {
        onSuccess: () => {
          exitBatchMode();
          onSuccess?.();
        },
      }
    );
  };

  // 一括選択モードオフの場合：開始ボタンのみ表示
  if (!batchMode) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setBatchMode(true)}
        >
          <FontAwesomeIcon icon={faCheckDouble} className="mr-1.5 size-3.5" />
          一括選択
        </Button>
      </div>
    );
  }

  // 一括選択モードオンの場合：操作バー表示
  const isAllSelected = selectedCount === allReportIds.length;
  const isDisabled = selectedCount === 0 || mutation.isPending;

  return (
    <div className={`
      flex flex-wrap items-center gap-3 rounded-lg border border-blue-200
      bg-blue-50 px-4 py-3
    `}>
      {/* 選択数表示 */}
      <span className="text-sm font-medium text-blue-900">
        {selectedCount}件選択中
      </span>

      {/* 全選択/解除ボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={isAllSelected ? handleClearSelection : handleSelectAll}
      >
        {isAllSelected ? '全解除' : '全選択'}
      </Button>

      {/* 区切り線 */}
      <div className="h-6 w-px bg-blue-200" />

      {/* 確認完了にするボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleStatusChange('completed')}
        disabled={isDisabled}
        className={`
          border-green-500 text-green-700
          hover:bg-green-50
        `}
      >
        {mutation.isPending ? (
          <FontAwesomeIcon icon={faSpinner} className={`
            mr-1.5 size-3.5 animate-spin
          `} />
        ) : (
          <FontAwesomeIcon icon={faCheck} className="mr-1.5 size-3.5" />
        )}
        確認完了にする
      </Button>

      {/* 閉じるボタン */}
      <Button
        variant="text"
        size="sm"
        onClick={handleExitBatchMode}
        className="ml-auto"
      >
        <FontAwesomeIcon icon={faTimes} className="mr-1 size-3.5" />
        閉じる
      </Button>
    </div>
  );
};

export default BatchStatusChangeBar;
