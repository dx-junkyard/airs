/**
 * DataResetリポジトリのインターフェース
 *
 * 通報・イベント・イベント通報の一括soft-deleteを抽象化する。
 */
export interface IDataResetRepository {
  /**
   * reports, events, event_reports の全アクティブレコードをsoft-deleteする
   * トランザクションで一括処理する
   * @returns soft-deleteされた件数
   */
  softDeleteAll(): Promise<{
    reportsCount: number;
    eventsCount: number;
    eventReportsCount: number;
  }>;
}
