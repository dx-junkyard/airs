'use client';

import { useEffect, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faStop } from '@fortawesome/free-solid-svg-icons';
import { Card } from '@/components/ui/Card/Card';
import useStartBulkImport from '@/hooks/mutations/useStartBulkImport';
import useLatestBulkAction from '@/hooks/queries/useLatestBulkAction';
import {
  latestBulkActionAtom,
  isBulkActionRunningAtom,
} from '@/features/admin/atoms/bulkActionAtom';
import { validateCsvHeader, cancelBulkAction } from '@/features/admin/actions';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';
import type { BulkImportProgress } from '@/server/application/dtos/BulkActionDto';

/**
 * result JSON が進捗情報（processing中）か判定
 */
function isProgress(
  result: unknown
): result is BulkImportProgress {
  return (
    result !== null &&
    typeof result === 'object' &&
    'phase' in (result as Record<string, unknown>) &&
    (result as Record<string, unknown>).phase !== 'done'
  );
}

/**
 * プログレスバー
 */
function ProgressBar({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className={`
        flex items-center justify-between text-xs text-solid-gray-600
      `}>
        <span>{label}</span>
        <span>
          {done} / {total} 件
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-solid-gray-100">
        <div
          className={`
            h-full rounded-full bg-blue-500 transition-all duration-500
          `}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * 経過時間インジケーター
 * 1分ごとにバーが1本増える視覚的な表示 + テキスト
 */
function ElapsedTimeIndicator({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMs = now - new Date(createdAt).getTime();
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);
  const elapsedSeconds = Math.floor((elapsedMs % 60_000) / 1000);

  return (
    <span className="text-sm text-solid-gray-600">
      {elapsedMinutes > 0
        ? `処理時間：${elapsedMinutes}分${elapsedSeconds}秒`
        : `処理時間：${elapsedSeconds}秒`}
    </span>
  );
}

/**
 * CSV一括インポートセクション
 *
 * CSVファイルを選択し、非同期で通報を一括登録する。
 * ポーリングにより実行中の進行状況のみ表示する。
 * 完了結果は一括操作履歴セクションで確認する。
 */
export default function CsvImportSection() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resetBeforeImport, setResetBeforeImport] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [formatError, setFormatError] = useState<string | null>(null);
  const mutation = useStartBulkImport();
  // ポーリングを駆動（結果はatomに同期される）
  useLatestBulkAction('csv-import');
  const latestAction = useAtomValue(latestBulkActionAtom);
  const isRunning = useAtomValue(isBulkActionRunningAtom);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormatError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // サーバー側でCSVフォーマットを検証
    const text = await file.text();
    const error = await validateCsvHeader(text);

    if (error) {
      setSelectedFile(null);
      setFormatError(error);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
  };

  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!latestAction) return;
    setIsCancelling(true);
    try {
      await cancelBulkAction(latestAction.id);
      showSuccessToast('インポートを中止しました');
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : '中止に失敗しました'
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    mutation.mutate(
      {
        file: selectedFile,
        resetBeforeImport,
        resetPassword: resetBeforeImport ? resetPassword : undefined,
      },
      {
        onSuccess: () => {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
      }
    );
  };

  // 進捗情報の取得（実行中のみ）
  const progress = isRunning && latestAction?.result
    ? isProgress(latestAction.result) ? latestAction.result : null
    : null;

  return (
    <Card
      id="csv-import"
      title="CSV一括インポート"
      padding="lg"
      className="scroll-mt-28"
    >
      <div className="mb-6 space-y-1">
        <p className="text-sm text-solid-gray-600">
          CSVファイルから通報データを一括登録します。ファイルサイズの上限は10MBです。
        </p>
        <p className="text-xs text-solid-gray-420">
          担当者の自動アサインは行われません。インポート後に個別に設定してください。
        </p>
      </div>

      <div className="space-y-4">
        {/* CSVフォーマット */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-solid-gray-600">
            CSVフォーマット
          </p>
          <code
            className={`
              block overflow-x-auto rounded bg-solid-gray-50 px-3 py-2 text-xs
              break-all whitespace-pre-wrap
            `}
          >
            獣種,発生時刻,緯度,経度,住所,画像URL,説明文,電話番号
          </code>
          <ul
            className={`
              list-inside list-disc space-y-1 text-xs text-solid-gray-420
            `}
          >
            <li>獣種: カタカナ（サル, シカ等）またはコード値（monkey, deer等）</li>
            <li>発生時刻: ISO 8601形式（例: 2024-01-15T10:30:00+09:00）</li>
            <li>緯度/経度: 数値（必須）</li>
            <li>住所: 必須</li>
            <li>画像URL: HTTPS URL（任意）</li>
            <li>説明文/電話番号: 任意</li>
          </ul>
        </div>

        {/* ファイル選択 + リセットトグル + 実行ボタン */}
        <div className="flex flex-wrap items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className={`
              text-sm text-solid-gray-600
              file:mr-4 file:rounded-lg file:border file:border-solid-gray-300
              file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium
              file:text-solid-gray-600
              hover:file:bg-solid-gray-50
            `}
          />

          {/* リセットトグル */}
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={resetBeforeImport}
              onClick={() => {
                const next = !resetBeforeImport;
                setResetBeforeImport(next);
                if (!next) setResetPassword('');
              }}
              disabled={mutation.isPending || isRunning}
              className={`
                relative inline-flex h-5 w-9 shrink-0 cursor-pointer
                rounded-full border-2 border-transparent transition-colors
                duration-200
                focus-visible:outline-2 focus-visible:outline-offset-2
                focus-visible:outline-blue-600
                disabled:cursor-not-allowed disabled:opacity-50
                ${resetBeforeImport ? 'bg-red-600' : 'bg-solid-gray-300'}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block size-4 rounded-full bg-white
                  shadow ring-0 transition duration-200
                  ${resetBeforeImport ? 'translate-x-4' : 'translate-x-0'}
                `}
              />
            </button>
            <span className="text-sm text-solid-gray-600">リセット</span>
          </label>

          {/* 実行ボタン */}
          <button
            type="button"
            onClick={handleImport}
            disabled={
              !selectedFile ||
              mutation.isPending ||
              isRunning ||
              (resetBeforeImport && resetPassword.length !== 4)
            }
            className={`
              shrink-0 rounded-lg px-6 py-2 text-sm font-medium text-white
              disabled:cursor-not-allowed disabled:opacity-50
              ${
                resetBeforeImport
                  ? `
                    bg-red-600
                    hover:bg-red-700
                  `
                  : `
                    bg-blue-900
                    hover:bg-blue-800
                  `
              }
            `}
          >
            {mutation.isPending ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="mr-2 animate-spin"
                />
                アップロード中...
              </>
            ) : isRunning ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="mr-2 animate-spin"
                />
                インポート実行中...
              </>
            ) : resetBeforeImport ? (
              'リセット & インポート'
            ) : (
              'インポート'
            )}
          </button>

          {/* 強制終了ボタン（実行中のみ表示） */}
          {isRunning && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              className={`
                shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm
                font-medium text-red-600
                hover:bg-red-50
                disabled:cursor-not-allowed disabled:opacity-50
              `}
            >
              <FontAwesomeIcon icon={faStop} className="mr-1.5" />
              {isCancelling ? '中止中...' : '強制終了'}
            </button>
          )}
        </div>

        {/* フォーマットエラー */}
        {formatError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">{formatError}</p>
          </div>
        )}

        {/* リセット注意書き + パスワード入力 */}
        {resetBeforeImport && (
          <div className="space-y-2">
            <p className="text-xs text-red-600">
              既存の通報・通報グループデータをすべて削除（論理削除）してからインポートします。
            </p>
            <div className="flex items-center gap-2">
              <label
                htmlFor="resetPassword"
                className="text-sm text-solid-gray-600"
              >
                確認コード
              </label>
              <input
                id="resetPassword"
                type="text"
                maxLength={4}
                value={resetPassword}
                onChange={(e) =>
                  setResetPassword(e.target.value.toUpperCase())
                }
                placeholder="4文字"
                disabled={mutation.isPending || isRunning}
                className={`
                  w-24 rounded border border-solid-gray-300 px-2 py-1
                  text-center font-mono text-sm tracking-widest
                  focus:border-blue-500 focus:outline-none
                  disabled:cursor-not-allowed disabled:opacity-50
                `}
              />
              <span className="text-xs text-solid-gray-420">
                データリセットセクションで生成されたコードを入力
              </span>
            </div>
          </div>
        )}

        {/* 経過時間 + 進捗インジケーター（実行中のみ表示） */}
        {isRunning && latestAction && (
          <div className="space-y-3">
            <ElapsedTimeIndicator createdAt={latestAction.createdAt} />
            {progress && (
              <div className="space-y-2">
                <ProgressBar
                  label="通報"
                  done={progress.importSuccess + progress.importError}
                  total={progress.importTotal}
                />
                <ProgressBar
                  label="通報グループ作成"
                  done={progress.clusterDone}
                  total={progress.clusterTotal}
                />
              </div>
            )}
          </div>
        )}

        {/* mutation エラー */}
        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {mutation.error?.message || 'インポートの開始に失敗しました'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
