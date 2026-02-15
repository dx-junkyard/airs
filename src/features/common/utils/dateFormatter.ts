/**
 * 日時フォーマットユーティリティ
 *
 * SSR/CSRで一貫した日時表示を実現するため、明示的にtimeZoneを指定する。
 * toLocaleString() はサーバーとクライアントで異なるタイムゾーン設定により
 * 異なる結果を返し、React Hydration Error #418 の原因となるため、
 * 常に 'Asia/Tokyo' を指定して統一する。
 */

const TIMEZONE = 'Asia/Tokyo';
const LOCALE = 'ja-JP';

/**
 * 日時を「YYYY/MM/DD HH:mm:ss」形式でフォーマット
 * toLocaleString('ja-JP') の代替
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * 日時を「YYYY/MM/DD HH:mm」形式でフォーマット（秒なし）
 */
export function formatDateTimeShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * 日付を「M/D」形式でフォーマット
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    month: 'numeric',
    day: 'numeric',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * 時刻を「HH:mm」形式でフォーマット
 */
export function formatTimeShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * 日付を「YYYY/MM/DD」形式でフォーマット（時刻なし）
 */
export function formatDateOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(LOCALE, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: TIMEZONE,
  }).format(d);
}

/**
 * hasOnlyDateフラグに応じて日付のみ or 日時表示を切り替える
 */
export function formatReportDateTime(
  date: Date | string,
  hasOnlyDate: boolean
): string {
  return hasOnlyDate
    ? `${formatDateOnly(date)} (時刻不明)`
    : formatDateTime(date);
}
