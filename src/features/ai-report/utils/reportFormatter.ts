import type { ReportDraft } from '@/features/ai-report/types/chat';

/**
 * レポート案をMarkdown形式に変換
 */
export function formatReportAsMarkdown(draft: ReportDraft): string {
  return `- **いつ**: ${draft.when}
- **どこで**: ${draft.where}
- **何が**: ${draft.what}
- **状況**: ${draft.situation}`;
}

/**
 * 日時をフォーマット（例: 2024年1月15日 14:30頃）
 * サーバー側でもJSTで表示されるようtimeZoneを明示的に指定
 */
export function formatDateTime(date: Date): string {
  return (
    new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date) + '頃'
  );
}
