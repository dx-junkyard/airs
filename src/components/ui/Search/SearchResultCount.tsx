export interface SearchResultCountProps {
  /** 検索結果の件数 */
  count: number;
  /** 単位ラベル（デフォルト: "件"） */
  label?: string;
  /** プレフィックスラベル（デフォルト: "検索結果:"） */
  prefix?: string;
}

/**
 * 検索結果件数（Server Component）
 *
 * 検索結果の件数表示を担当。純粋なテキスト表示でSSR対応。
 */
export default function SearchResultCount({
  count,
  label = '件',
  prefix = '検索結果:',
}: SearchResultCountProps) {
  return (
    <div className="px-2 pb-3 text-right">
      <span className="text-xs font-medium text-solid-gray-600">{prefix}</span>
      <span className="text-sm font-semibold text-blue-900">{count}</span>
      <span className="text-xs text-solid-gray-600">{label}</span>
    </div>
  );
}
