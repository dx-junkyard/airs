import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import type {
  BulkImportProgress,
  BulkImportResult,
} from '@/server/application/dtos/BulkActionDto';
import type { CsvRowError } from '@/server/application/dtos/CsvImportResultDto';
import type { IReportRepository } from '@/server/domain/repositories/IReportRepository';
import type { IEventClusteringRepository } from '@/server/domain/repositories/IEventClusteringRepository';
import type { ISystemSettingRepository } from '@/server/domain/repositories/ISystemSettingRepository';
import AnimalTypeLabelResolver from '@/server/domain/services/AnimalTypeLabelResolver';
import CsvReportParser from '@/server/infrastructure/csv/CsvReportParser';
import type { CsvReportRow } from '@/server/infrastructure/csv/CsvReportParser';

/**
 * 進捗報告コールバック
 * progress を受け取り、false を返すと処理を中断する
 */
export type ProgressCallback = (
  progress: BulkImportProgress
) => Promise<boolean>;

/**
 * bulk insert 後の通報基本情報
 */
interface InsertedReport {
  id: string;
  animalType: string;
  latitude: number;
  longitude: number;
  hasOnlyDate: boolean;
  createdAt: Date;
}

/**
 * インメモリ クラスタ（イベント候補）
 */
interface InMemoryCluster {
  reportIds: string[];
  animalType: string;
  centerLat: number;
  centerLng: number;
  latestTime: Date;
  oldestReport: InsertedReport;
}

/**
 * BulkImportReportsUseCase
 *
 * CSVテキストをパースし、バリデーション後に一括登録（bulk insert）。
 * その後クラスタリングを行い、DB にイベント + イベント通報レコードを作成する。
 *
 * Phase 1: 通報の一括登録（bulk insert + PostGIS location列セット）
 * Phase 2: 通報グループのクラスタリング
 *          - 獣種・時間帯: インメモリでearly return
 *          - 距離判定: PostGIS ST_DWithin
 */
class BulkImportReportsUseCase {
  private parser = new CsvReportParser();
  private resolver = new AnimalTypeLabelResolver();

  constructor(
    private reportRepository: IReportRepository,
    private clusteringRepository: IEventClusteringRepository,
    private settingRepository: ISystemSettingRepository
  ) {}

  async execute(
    csvText: string,
    onProgress?: ProgressCallback
  ): Promise<BulkImportResult> {
    // ── Phase 1: CSV パース + バリデーション + bulk insert ──
    const rows = this.parser.parse(csvText);
    const validDtos: CreateReportDto[] = [];
    const errors: CsvRowError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // 1-indexed + header row
      const row = rows[i];
      const validationError = this.validateRow(row);
      if (validationError) {
        errors.push({ row: rowNumber, message: validationError });
      } else {
        validDtos.push(this.toCreateReportDto(row));
      }
    }

    // bulk insert
    const inserted = await this.reportRepository.createMany(validDtos);

    // PostGIS location列を一括セット
    if (inserted.length > 0) {
      await this.reportRepository.updateLocations(
        inserted.map((r) => r.id)
      );
    }

    // Phase 1 完了を通知
    const importProgress: BulkImportProgress = {
      phase: 'importing',
      importTotal: rows.length,
      importSuccess: inserted.length,
      importError: errors.length,
      clusterTotal: inserted.length,
      clusterDone: 0,
    };
    if (onProgress) {
      const ok = await onProgress(importProgress);
      if (!ok) {
        return this.buildResult(importProgress, errors, 0);
      }
    }

    // ── Phase 2: クラスタリング（獣種+時間はインメモリ、距離はPostGIS） ──
    const setting = await this.settingRepository.findLatest();
    const distanceMeters = setting?.eventClusteringRadiusMeters ?? 500;
    const timeMinutes = setting?.eventClusteringTimeMinutes ?? 60;
    const timeWindowMs = timeMinutes * 60 * 1000;

    // hasOnlyDate の通報をクラスタリング対象から除外（時間的近接性が判定不可能なため）
    const clusterCandidates = inserted.filter((r) => !r.hasOnlyDate);

    // createdAt 昇順でソート
    const sorted = [...clusterCandidates].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    );

    // クラスタリング（獣種+時間でearly return → PostGISで距離判定）
    const clusters: InMemoryCluster[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const report = sorted[i];
      let matched = false;

      for (const cluster of clusters) {
        // 獣種フィルタ（インメモリ early return）
        if (cluster.animalType !== report.animalType) continue;

        // 時間帯フィルタ（インメモリ early return）
        const timeDiff = Math.abs(
          report.createdAt.getTime() - cluster.latestTime.getTime()
        );
        if (timeDiff > timeWindowMs) continue;

        // 距離判定（PostGIS ST_DWithin）
        const isNearby = await this.clusteringRepository.isWithinDistance(
          report.id,
          cluster.centerLng,
          cluster.centerLat,
          distanceMeters
        );
        if (!isNearby) continue;

        // マッチ → クラスタに追加
        cluster.reportIds.push(report.id);
        cluster.latestTime = report.createdAt;
        matched = true;
        break;
      }

      if (!matched) {
        // 新規クラスタ（まだ単独 → 後で2件以上ならイベント化）
        clusters.push({
          reportIds: [report.id],
          animalType: report.animalType,
          centerLat: report.latitude,
          centerLng: report.longitude,
          latestTime: report.createdAt,
          oldestReport: report,
        });
      }
    }

    // 2件以上のクラスタをイベントとしてDB登録
    const eventClusters = clusters.filter((c) => c.reportIds.length >= 2);
    let eventsCreated = 0;

    // イベント作成の進捗報告（DB書き込みが実際に遅い部分）
    if (onProgress && eventClusters.length > 0) {
      const ok = await onProgress({
        phase: 'clustering',
        importTotal: rows.length,
        importSuccess: inserted.length,
        importError: errors.length,
        clusterTotal: eventClusters.length,
        clusterDone: 0,
      });
      if (!ok) {
        return this.buildResult(
          {
            ...importProgress,
            phase: 'clustering',
            clusterTotal: eventClusters.length,
            clusterDone: 0,
          },
          errors,
          0
        );
      }
    }

    for (const cluster of eventClusters) {
      // 最初の2件でイベント作成
      const eventId = await this.clusteringRepository.createEventWithReports(
        cluster.reportIds[0],
        cluster.reportIds[1]
      );
      // 3件目以降を追加
      for (let j = 2; j < cluster.reportIds.length; j++) {
        await this.clusteringRepository.addReportToEvent(
          eventId,
          cluster.reportIds[j]
        );
      }
      eventsCreated++;

      // イベント作成ごとに進捗報告 + キャンセルチェック
      if (onProgress) {
        const ok = await onProgress({
          phase: 'clustering',
          importTotal: rows.length,
          importSuccess: inserted.length,
          importError: errors.length,
          clusterTotal: eventClusters.length,
          clusterDone: eventsCreated,
        });
        if (!ok) {
          return this.buildResult(
            {
              ...importProgress,
              phase: 'clustering',
              clusterTotal: eventClusters.length,
              clusterDone: eventsCreated,
            },
            errors,
            eventsCreated
          );
        }
      }
    }

    // イベント0件の場合の最終進捗
    const finalClusterTotal = Math.max(eventClusters.length, 1);
    if (onProgress) {
      await onProgress({
        phase: 'clustering',
        importTotal: rows.length,
        importSuccess: inserted.length,
        importError: errors.length,
        clusterTotal: finalClusterTotal,
        clusterDone: finalClusterTotal,
      });
    }

    return this.buildResult(
      {
        phase: 'clustering',
        importTotal: rows.length,
        importSuccess: inserted.length,
        importError: errors.length,
        clusterTotal: finalClusterTotal,
        clusterDone: finalClusterTotal,
      },
      errors,
      eventsCreated
    );
  }

  private buildResult(
    progress: BulkImportProgress,
    errors: CsvRowError[],
    eventsCreated: number
  ): BulkImportResult {
    return {
      phase: 'done',
      importTotal: progress.importTotal,
      importSuccess: progress.importSuccess,
      importError: progress.importError,
      clusterTotal: progress.clusterTotal,
      clusterDone: progress.clusterDone,
      eventsCreated,
      errors,
    };
  }

  private validateRow(row: CsvReportRow): string | undefined {
    // 獣種: 必須
    if (!row.animalType.trim()) {
      return '獣種は必須です';
    }
    const animalTypeCode = this.resolver.resolve(row.animalType);
    if (!animalTypeCode) {
      return `不明な獣種です: ${row.animalType}`;
    }

    // 目撃日: 必須
    if (!row.sightingDate.trim()) {
      return '目撃日は必須です';
    }
    const dateTimeStr = this.buildDateTimeString(
      row.sightingDate,
      row.sightingTime
    );
    const date = new Date(dateTimeStr);
    if (isNaN(date.getTime())) {
      return `不正な日時形式です: ${row.sightingDate} ${row.sightingTime}`;
    }

    // 緯度: 必須、数値、範囲
    const lat = parseFloat(row.latitude);
    if (!row.latitude.trim() || isNaN(lat)) {
      return '緯度は必須で有効な数値である必要があります';
    }
    if (lat < -90 || lat > 90) {
      return `緯度の範囲が不正です: ${row.latitude}`;
    }

    // 経度: 必須、数値、範囲
    const lng = parseFloat(row.longitude);
    if (!row.longitude.trim() || isNaN(lng)) {
      return '経度は必須で有効な数値である必要があります';
    }
    if (lng < -180 || lng > 180) {
      return `経度の範囲が不正です: ${row.longitude}`;
    }

    // 住所: 必須
    if (!row.address.trim()) {
      return '住所は必須です';
    }

    // 画像URL: 任意、ただしHTTPS URLであること
    if (row.imageUrl.trim()) {
      try {
        const url = new URL(row.imageUrl.trim());
        if (url.protocol !== 'https:') {
          return `画像URLはHTTPSである必要があります: ${row.imageUrl}`;
        }
      } catch {
        return `不正な画像URLです: ${row.imageUrl}`;
      }
    }

    return undefined;
  }

  private buildDateTimeString(
    sightingDate: string,
    sightingTime: string
  ): string {
    const date = sightingDate.trim();
    const time = sightingTime.trim();
    if (time) {
      // HH:mm or HH:mm:ss
      const timePart = time.includes(':') ? time : `${time}:00`;
      return `${date}T${timePart}+09:00`;
    }
    return `${date}T00:00:00+09:00`;
  }

  private toCreateReportDto(row: CsvReportRow): CreateReportDto {
    const animalTypeCode = this.resolver.resolve(row.animalType)!;
    const images = row.imageUrl.trim()
      ? [{ url: row.imageUrl.trim(), description: '' }]
      : [];

    const dateTimeStr = this.buildDateTimeString(
      row.sightingDate,
      row.sightingTime
    );

    return {
      animalType: animalTypeCode,
      latitude: row.latitude.trim(),
      longitude: row.longitude.trim(),
      address: row.address.trim(),
      phoneNumber: row.phoneNumber.trim() || undefined,
      images,
      description: row.description.trim() || undefined,
      hasOnlyDate: row.hasOnlyDate,
      createdAt: new Date(dateTimeStr).toISOString(),
    };
  }
}

export default BulkImportReportsUseCase;
