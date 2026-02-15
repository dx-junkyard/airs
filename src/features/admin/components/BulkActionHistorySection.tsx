import { Card } from '@/components/ui/Card/Card';
import type { BulkActionDto } from '@/server/application/dtos/BulkActionDto';

/**
 * actionKeyから表示用ラベルに変換
 */
function actionKeyLabel(actionKey: string): string {
  switch (actionKey) {
    case 'csv-import':
      return 'CSV一括インポート';
    default:
      return actionKey;
  }
}

/**
 * ステータスのバッジ表示
 */
function StatusBadge({ status }: { status: BulkActionDto['status'] }) {
  const config: Record<
    BulkActionDto['status'],
    { label: string; className: string }
  > = {
    pending: {
      label: '待機中',
      className: 'bg-solid-gray-100 text-solid-gray-600',
    },
    processing: {
      label: '実行中',
      className: 'bg-blue-100 text-blue-700',
    },
    completed: {
      label: '完了',
      className: 'bg-green-100 text-green-700',
    },
    failed: {
      label: '失敗',
      className: 'bg-red-100 text-red-700',
    },
  };

  const { label, className } = config[status] ?? config.failed;

  return (
    <span
      className={`
        inline-block rounded px-1.5 py-0.5 text-xs font-medium
        ${className}
      `}
    >
      {label}
    </span>
  );
}

/**
 * 日時フォーマット
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${h}:${min}`;
}

/**
 * 一括操作履歴セクション
 *
 * 最新10件のBulkAction履歴をテーブルで表示する。
 * SSRで取得したデータをpropsとして受け取る。
 */
export default function BulkActionHistorySection({
  history,
}: {
  history: BulkActionDto[];
}) {
  return (
    <Card
      id="bulk-action-history"
      title="一括操作履歴"
      padding="lg"
      className="scroll-mt-28"
    >
      {history.length === 0 ? (
        <p className="text-sm text-solid-gray-420">
          実行履歴はありません。
        </p>
      ) : (
        <div className={`
          -mx-4 overflow-x-auto px-4
          sm:mx-0 sm:px-0
        `}>
          <table className="min-w-[540px] text-left text-sm">
            <thead>
              <tr
                className={`
                  border-b border-solid-gray-200 text-xs text-solid-gray-420
                `}
              >
                <th className="pr-4 pb-2 font-medium">日時</th>
                <th className="pr-4 pb-2 font-medium">アクション</th>
                <th className="pr-4 pb-2 font-medium">実行者</th>
                <th className="pr-4 pb-2 font-medium">ステータス</th>
                <th className="pr-4 pb-2 text-right font-medium">成功</th>
                <th className="pb-2 text-right font-medium">失敗</th>
              </tr>
            </thead>
            <tbody>
              {history.map((action) => (
                <tr
                  key={action.id}
                  className={`
                    border-b border-solid-gray-100
                    last:border-b-0
                  `}
                >
                  <td className={`
                    py-2 pr-4 whitespace-nowrap text-solid-gray-600
                  `}>
                    {formatDate(action.createdAt)}
                  </td>
                  <td className={`
                    py-2 pr-4 whitespace-nowrap text-solid-gray-600
                  `}>
                    {actionKeyLabel(action.actionKey)}
                  </td>
                  <td className={`
                    py-2 pr-4 whitespace-nowrap text-solid-gray-600
                  `}>
                    {action.staffName ?? '-'}
                  </td>
                  <td className="py-2 pr-4">
                    <StatusBadge status={action.status} />
                  </td>
                  <td className="py-2 pr-4 text-right text-solid-gray-600">
                    {action.successCount}
                  </td>
                  <td className="py-2 text-right text-solid-gray-600">
                    {action.errorCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
