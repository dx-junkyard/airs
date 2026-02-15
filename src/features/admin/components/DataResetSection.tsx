'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card/Card';
import useEnableDataReset from '@/hooks/mutations/useEnableDataReset';
import type { AdminPasswordInfo } from '@/server/domain/repositories/IAdminPasswordRepository';

interface DataResetSectionProps {
  staffId: string;
  latestInfo?: AdminPasswordInfo;
}

/**
 * データリセットパスワード生成セクション
 *
 * トグルON→パスワード生成・表示。
 * 生成されたパスワードはCSVインポート時のリセット確認に使用される。
 */
export default function DataResetSection({
  staffId,
  latestInfo,
}: DataResetSectionProps) {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const mutation = useEnableDataReset();

  const handleGenerate = () => {
    if (generatedPassword) {
      setGeneratedPassword(null);
      return;
    }

    mutation.mutate(staffId, {
      onSuccess: (password) => {
        setGeneratedPassword(password);
      },
    });
  };

  return (
    <Card
      id="access-control"
      title="機能制限"
      padding="lg"
      className="scroll-mt-28"
    >
      <p className="mb-6 text-sm text-solid-gray-600">
        一部の機能制限用の確認パスワードを生成します。
      </p>

      {latestInfo && (
        <p className="mb-6 text-sm text-solid-gray-420">
          最終登録: {latestInfo.staffName}（
          {new Date(latestInfo.createdAt).toLocaleString('ja-JP')}）
        </p>
      )}

      <div className="space-y-4">
        {/* 生成ボタン */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className={`
            rounded-lg px-6 py-2.5 text-sm font-medium text-white
            disabled:cursor-not-allowed disabled:opacity-50
            ${
              generatedPassword
                ? `
                  bg-solid-gray-600
                  hover:bg-solid-gray-700
                `
                : `
                  bg-blue-900
                  hover:bg-blue-800
                `
            }
          `}
        >
          {mutation.isPending
            ? 'パスワード生成中...'
            : generatedPassword
              ? 'パスワードを非表示'
              : 'パスワードを生成'}
        </button>

        {/* パスワード表示 */}
        {generatedPassword && (
          <div
            className={`
              rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3
            `}
          >
            <p className="mb-1 text-sm font-medium text-yellow-800">
              確認パスワード
            </p>
            <p
              className={`
                font-mono text-2xl font-bold tracking-widest text-yellow-900
              `}
            >
              {generatedPassword}
            </p>
            <p className="mt-1 text-xs text-yellow-700">
              このパスワードは一部の機能制限で必要です。
            </p>
          </div>
        )}

        {/* エラー表示 */}
        {mutation.isError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-600">
              {mutation.error?.message || 'パスワードの生成に失敗しました'}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
