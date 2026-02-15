/**
 * 通報ステータス共通定数
 *
 * ステータスのラベルを一元管理
 * 色はデザイントークン（design-tokens.css）で定義: --color-status-*
 * Tailwindクラス: bg-status-*, text-status-*
 */

/** ステータスの値型 */
export type ReportStatusValue = 'waiting' | 'completed';

/** ステータスのラベル */
export const REPORT_STATUS_LABELS: Record<ReportStatusValue, string> = {
  waiting: '確認待ち',
  completed: '確認完了',
} as const;

/**
 * ステータスからラベルを取得
 * @param status ステータス文字列
 * @returns 日本語ラベル
 */
export const getReportStatusLabel = (status: string): string =>
  REPORT_STATUS_LABELS[status as ReportStatusValue] ?? status;

/** 有効なステータス値のリスト */
export const VALID_REPORT_STATUSES = Object.keys(
  REPORT_STATUS_LABELS
) as ReportStatusValue[];
