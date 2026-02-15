'use server';

import DIContainer from '@/server/infrastructure/di/container';
import GetReportsUseCase from '@/server/application/use-cases/report/GetReportsUseCase';
import GetReportUseCase from '@/server/application/use-cases/report/GetReportUseCase';
import UpdateReportUseCase from '@/server/application/use-cases/report/UpdateReportUseCase';
import DeleteReportUseCase from '@/server/application/use-cases/report/DeleteReportUseCase';
import SearchReportsUseCase from '@/server/application/use-cases/report/SearchReportsUseCase';
import FilterReportsByStatusUseCase from '@/server/application/use-cases/report/FilterReportsByStatusUseCase';
import FilterReportsByAnimalTypeUseCase from '@/server/application/use-cases/report/FilterReportsByAnimalTypeUseCase';
import GetReportStatisticsUseCase from '@/server/application/use-cases/report/GetReportStatisticsUseCase';
import SearchReportsWithPaginationUseCase from '@/server/application/use-cases/report/SearchReportsWithPaginationUseCase';
import type { SearchReportsResult } from '@/server/application/use-cases/report/SearchReportsWithPaginationUseCase';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { CreateReportDto } from '@/server/application/dtos/CreateReportDto';
import type { UpdateReportDto } from '@/server/application/dtos/UpdateReportDto';
import type { ReportStatisticsDto } from '@/server/application/dtos/ReportStatisticsDto';
import type { StructuredAddress } from '@/server/domain/models/geo/StructuredAddressModel';
import { revalidatePath } from 'next/cache';
import { verifyReportToken } from '@/server/infrastructure/auth/reportToken';
import { isAdmin, requireAdmin } from '@/features/common/utils/isAdmin';
import type { MapDefaultDataRangeValue } from '@/server/domain/constants/mapDefaultDataRange';

function isStructuredAddress(value: unknown): value is StructuredAddress {
  if (!value || typeof value !== 'object') return false;
  const addr = value as Record<string, unknown>;
  return (
    typeof addr.prefecture === 'string' &&
    typeof addr.city === 'string' &&
    typeof addr.oaza === 'string' &&
    typeof addr.aza === 'string' &&
    typeof addr.detail === 'string' &&
    typeof addr.full === 'string' &&
    typeof addr.areaKey === 'string' &&
    (addr.houseNumber === undefined || typeof addr.houseNumber === 'string')
  );
}

/**
 * トークンによるアクセス制御を検証する
 * - tokenありの場合: 検証してreportIdの一致を確認
 * - tokenなしの場合: adminモードのみ許可
 */
async function verifyAccess(id: string, token?: string): Promise<void> {
  if (token) {
    const payload = await verifyReportToken(token);
    if (payload.reportId !== id) {
      throw new Error('トークンが無効です');
    }
    return;
  }

  if (!isAdmin()) {
    throw new Error('アクセス権限がありません');
  }
}

/**
 * 画像アップロード結果
 */
export interface UploadReportImageResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * すべてのReportを取得
 * @param sortOrder ソート順（'asc' | 'desc'）省略時は降順
 */
export async function getReports(
  sortOrder?: string,
  options?: {
    mapDefaultDataRange?: MapDefaultDataRangeValue;
    startDate?: string;
    endDate?: string;
  }
): Promise<ReportDto[]> {
  const repository = DIContainer.getReportRepository();
  const useCase = new GetReportsUseCase(repository);
  const startDate = options?.startDate ? new Date(options.startDate) : undefined;
  const endDate = options?.endDate ? new Date(options.endDate) : undefined;

  return await useCase.execute({
    sortOrder,
    startDate,
    endDate,
    mapDefaultDataRange: options?.mapDefaultDataRange,
  });
}

/**
 * 検索パラメータ
 */
export interface SearchReportsParams {
  query?: string;
  status?: string;
  animalType?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  sortOrder?: string;
  page: number;
  limit: number;
}

/**
 * フィルタリング・ソート・ページネーション付きでReportを検索
 */
export async function searchReportsWithPagination(
  params: SearchReportsParams
): Promise<SearchReportsResult> {
  const repository = DIContainer.getReportRepository();
  const useCase = new SearchReportsWithPaginationUseCase(repository);
  return await useCase.execute(params);
}

/**
 * IDでReportを取得
 */
export async function getReport(id: string): Promise<ReportDto | null> {
  const repository = DIContainer.getReportRepository();
  const useCase = new GetReportUseCase(repository);
  const result = await useCase.execute(id);
  return result ?? null;
}

/**
 * Reportを検索
 */
export async function searchReports(query: string): Promise<ReportDto[]> {
  const repository = DIContainer.getReportRepository();
  const useCase = new SearchReportsUseCase(repository);
  return await useCase.execute(query);
}

/**
 * ステータスでReportをフィルタリング
 */
export async function filterReportsByStatus(
  status: string
): Promise<ReportDto[]> {
  const repository = DIContainer.getReportRepository();
  const useCase = new FilterReportsByStatusUseCase(repository);
  return await useCase.execute(status);
}

/**
 * 獣種でReportをフィルタリング
 */
export async function filterReportsByAnimalType(
  animalType: string
): Promise<ReportDto[]> {
  const repository = DIContainer.getReportRepository();
  const useCase = new FilterReportsByAnimalTypeUseCase(repository);
  return await useCase.execute(animalType);
}

/**
 * Reportを作成
 */
export async function createReport(formData: FormData): Promise<ReportDto> {
  // FormData → DTO変換
  // imagesはJSON配列として受け取る [{url, description}, ...]
  // imageUrlsが渡された場合は後方互換性のため変換する
  const imagesStr = formData.get('images') as string;
  let images: Array<{ url: string; description: string }> = [];

  if (imagesStr) {
    try {
      images = JSON.parse(imagesStr);
    } catch {
      images = [];
    }
  } else if (formData.has('imageUrls')) {
    // 後方互換性: imageUrls文字列からimages配列を構築
    const imageUrlsStr = formData.get('imageUrls') as string;
    let urls: string[];
    try {
      urls = JSON.parse(imageUrlsStr);
    } catch {
      urls = imageUrlsStr
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
    }
    images = urls.map((url) => ({ url, description: '' }));
  }

  const description = formData.get('description') as string;
  const normalizedAddressJson = formData.get('normalizedAddress');
  let normalizedAddress: StructuredAddress | undefined;
  if (typeof normalizedAddressJson === 'string' && normalizedAddressJson) {
    try {
      const parsed: unknown = JSON.parse(normalizedAddressJson);
      normalizedAddress = isStructuredAddress(parsed) ? parsed : undefined;
    } catch {
      normalizedAddress = undefined;
    }
  }

  const dto: CreateReportDto = {
    animalType: formData.get('animalType') as string,
    latitude: formData.get('latitude') as string,
    longitude: formData.get('longitude') as string,
    address: formData.get('address') as string,
    phoneNumber: (formData.get('phoneNumber') as string) || undefined,
    images,
    description:
      description && description.trim() ? description.trim() : undefined,
    normalizedAddress,
  };

  // 通報登録（作成・クラスタリング・担当者自動アサイン）
  const service = DIContainer.getReportRegistrationService();
  const result = await service.execute(dto);

  // キャッシュ無効化
  revalidatePath('/');
  revalidatePath('/admin/report');


  return result;
}

/**
 * Reportを更新
 */
export async function updateReport(
  id: string,
  formData: FormData,
  token?: string
): Promise<ReportDto> {
  await verifyAccess(id, token);

  // FormData → DTO変換
  const dto: UpdateReportDto = {};

  if (formData.has('animalType'))
    dto.animalType = formData.get('animalType') as string;
  if (formData.has('latitude'))
    dto.latitude = formData.get('latitude') as string;
  if (formData.has('longitude'))
    dto.longitude = formData.get('longitude') as string;
  if (formData.has('address')) dto.address = formData.get('address') as string;
  if (formData.has('phoneNumber'))
    dto.phoneNumber = formData.get('phoneNumber') as string;
  if (formData.has('description'))
    dto.description = formData.get('description') as string;
  if (formData.has('status')) dto.status = formData.get('status') as string;
  if (formData.has('staffId')) {
    const staffIdValue = formData.get('staffId') as string;
    dto.staffId = staffIdValue === '' ? null : staffIdValue;
  }

  // images処理
  if (formData.has('images')) {
    const imagesStr = formData.get('images') as string;
    try {
      dto.images = JSON.parse(imagesStr);
    } catch {
      dto.images = [];
    }
  }

  // Use Case実行
  const repository = DIContainer.getReportRepository();
  const useCase = new UpdateReportUseCase(repository);
  const result = await useCase.execute(id, dto);

  // staffIdが設定されている場合、関連EventのstaffIdも更新
  if (dto.staffId !== undefined) {
    try {
      const eventClusteringRepository =
        DIContainer.getEventClusteringRepository();
      const eventId = await eventClusteringRepository.findEventIdByReportId(id);
      if (eventId) {
        await eventClusteringRepository.updateEventStaffId(
          eventId,
          dto.staffId
        );
      }
    } catch (error) {
      console.error('Event staffId更新に失敗:', error);
    }
  }

  // キャッシュ無効化
  revalidatePath('/');
  revalidatePath('/admin/report');
  revalidatePath(`/admin/report/${id}`);


  return result;
}

/**
 * Reportを削除（論理削除）
 */
export async function deleteReport(
  id: string,
  token?: string
): Promise<boolean> {
  await verifyAccess(id, token);

  const repository = DIContainer.getReportRepository();
  const useCase = new DeleteReportUseCase(repository);
  const result = await useCase.execute(id);

  // キャッシュ無効化
  revalidatePath('/');
  revalidatePath('/admin/report');

  return result;
}

/**
 * 統計取得パラメータ
 */
export interface GetReportStatisticsParams {
  startDate?: string; // ISO 8601 形式
  endDate?: string; // ISO 8601 形式
}

/**
 * Report統計情報を取得
 */
export async function getReportStatistics(
  params?: GetReportStatisticsParams
): Promise<ReportStatisticsDto> {
  const repository = DIContainer.getReportRepository();
  const useCase = new GetReportStatisticsUseCase(repository);

  const startDate = params?.startDate ? new Date(params.startDate) : undefined;
  const endDate = params?.endDate ? new Date(params.endDate) : undefined;

  return await useCase.execute({ startDate, endDate });
}

/**
 * ステータスの優先度マップ
 * 数値が大きいほど上位（後続）のステータス
 */
const STATUS_PRIORITY: Record<string, number> = {
  waiting: 0,
  completed: 1,
};

/**
 * 複数のReportのステータスを一括更新
 * 現在より上位のステータスへの変更のみ適用（下位への変更はスキップ）
 * @param ids 通報IDの配列
 * @param status 新しいステータス
 * @param staffId 担当職員ID（オプション）
 */
export async function updateReportsStatusInBatch(
  ids: string[],
  status: string,
  staffId?: string | null
): Promise<{
  success: boolean;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
}> {
  requireAdmin();

  const repository = DIContainer.getReportRepository();
  const useCase = new UpdateReportUseCase(repository);
  const getUseCase = new GetReportUseCase(repository);
  const errors: string[] = [];
  let updatedCount = 0;
  let skippedCount = 0;
  const updatedEventIds = new Set<string>();

  const targetPriority = STATUS_PRIORITY[status];
  if (targetPriority === undefined) {
    return {
      success: false,
      updatedCount: 0,
      skippedCount: 0,
      errors: ['無効なステータスです'],
    };
  }

  for (const id of ids) {
    try {
      // 現在のステータスを取得
      const report = await getUseCase.execute(id);
      if (!report) {
        errors.push(`ID: ${id} - 通報が見つかりません`);
        continue;
      }

      const currentPriority = STATUS_PRIORITY[report.status] ?? 0;

      // 上位ステータスへの変更のみ許可
      if (targetPriority <= currentPriority) {
        skippedCount++;
        continue;
      }

      // ステータスとstaffIdを更新
      const updateDto: { status: string; staffId?: string | null } = { status };
      if (staffId !== undefined) {
        updateDto.staffId = staffId;
      }
      await useCase.execute(id, updateDto);
      updatedCount++;

      // 関連するEventのstaffIdも更新
      if (staffId !== undefined) {
        const eventClusteringRepository =
          DIContainer.getEventClusteringRepository();
        const eventId =
          await eventClusteringRepository.findEventIdByReportId(id);
        if (eventId) {
          updatedEventIds.add(eventId);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '不明なエラー';
      errors.push(`ID: ${id} - ${message}`);
    }
  }

  // 関連するEventのstaffIdを更新
  if (staffId !== undefined && updatedEventIds.size > 0) {
    const eventClusteringRepository =
      DIContainer.getEventClusteringRepository();
    for (const eventId of updatedEventIds) {
      try {
        await eventClusteringRepository.updateEventStaffId(eventId, staffId);
      } catch (error) {
        console.error(`Event ${eventId} のstaffId更新に失敗:`, error);
      }
    }
  }

  // キャッシュ無効化
  revalidatePath('/');
  revalidatePath('/admin/report');


  return { success: errors.length === 0, updatedCount, skippedCount, errors };
}

/**
 * 通報用画像をアップロードしてURLを取得
 *
 * @param formData アップロードする画像を含むFormData
 * @returns アップロード結果
 */
export async function uploadReportImage(
  formData: FormData
): Promise<UploadReportImageResult> {
  try {
    const file = formData.get('image') as File;
    if (!file) {
      return {
        success: false,
        error: '画像ファイルが指定されていません',
      };
    }

    const imageRepository = DIContainer.getImageRepository();
    const url = await imageRepository.upload(file, file.name);

    return { success: true, url };
  } catch (error) {
    console.error('画像アップロードエラー:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'アップロードに失敗しました',
    };
  }
}
