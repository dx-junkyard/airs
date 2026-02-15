import type { ReportDto } from '@/server/application/dtos/ReportDto';

/**
 * SQL結果行→ReportDto変換マッパー
 *
 * GeminiのSQL生成時にカラム名クォートが不安定なため、
 * PostgreSQLの識別子正規化（小文字化）でキー名に揺れが発生する。
 * camelCase / lowercase / snake_case のキー名揺れを吸収し、
 * latitude+longitudeを持つ行をReportDtoに変換する。
 */

type SqlRow = Record<string, unknown>;

/**
 * フィールドごとの候補キー名マッピング
 */
const COLUMN_ALIASES: Record<string, string[]> = {
  id: ['id'],
  animalType: ['animalType', 'animaltype', 'animal_type'],
  latitude: ['latitude'],
  longitude: ['longitude'],
  address: ['address'],
  phoneNumber: ['phoneNumber', 'phonenumber', 'phone_number'],
  description: ['description'],
  status: ['status'],
  staffId: ['staffId', 'staffid', 'staff_id'],
  staffName: ['staffName', 'staffname', 'staff_name'],
  eventId: ['eventId', 'eventid', 'event_id'],
  eventReportCount: [
    'eventReportCount',
    'eventreportcount',
    'event_report_count',
  ],
  createdAt: ['createdAt', 'createdat', 'created_at'],
  updatedAt: ['updatedAt', 'updatedat', 'updated_at'],
  deletedAt: ['deletedAt', 'deletedat', 'deleted_at'],
  imageUrls: ['imageUrls', 'imageurls', 'image_urls'],
};

/**
 * 候補キー名を順に試して値を取得する
 */
function resolveValue(row: SqlRow, field: string): unknown {
  const aliases = COLUMN_ALIASES[field];
  if (!aliases) return undefined;
  for (const alias of aliases) {
    if (alias in row) return row[alias];
  }
  return undefined;
}

class SqlResultToReportMapper {
  /**
   * SQL結果行の配列をReportDto[]に変換する。
   * latitude+longitudeを持つ行のみを変換対象とする。
   */
  static convertRows(rows: SqlRow[]): ReportDto[] {
    if (!Array.isArray(rows) || rows.length === 0) return [];

    return rows
      .filter((row) => {
        const lat = resolveValue(row, 'latitude');
        const lng = resolveValue(row, 'longitude');
        return typeof lat === 'number' && typeof lng === 'number';
      })
      .map((row, index) => ({
        id: String(resolveValue(row, 'id') ?? `ai-result-${index}`),
        animalType: String(resolveValue(row, 'animalType') ?? 'other'),
        latitude: resolveValue(row, 'latitude') as number,
        longitude: resolveValue(row, 'longitude') as number,
        address: String(resolveValue(row, 'address') ?? ''),
        phoneNumber: resolveValue(row, 'phoneNumber')
          ? String(resolveValue(row, 'phoneNumber'))
          : undefined,
        images: [],
        description: resolveValue(row, 'description')
          ? String(resolveValue(row, 'description'))
          : undefined,
        status: String(resolveValue(row, 'status') ?? 'waiting'),
        staffId: resolveValue(row, 'staffId')
          ? String(resolveValue(row, 'staffId'))
          : undefined,
        staffName: resolveValue(row, 'staffName')
          ? String(resolveValue(row, 'staffName'))
          : undefined,
        eventId: resolveValue(row, 'eventId')
          ? String(resolveValue(row, 'eventId'))
          : undefined,
        eventReportCount:
          typeof resolveValue(row, 'eventReportCount') === 'number'
            ? (resolveValue(row, 'eventReportCount') as number)
            : undefined,
        hasOnlyDate: resolveValue(row, 'hasOnlyDate') === true,
        createdAt: resolveValue(row, 'createdAt')
          ? String(resolveValue(row, 'createdAt'))
          : new Date().toISOString(),
        updatedAt: resolveValue(row, 'updatedAt')
          ? String(resolveValue(row, 'updatedAt'))
          : new Date().toISOString(),
        deletedAt: resolveValue(row, 'deletedAt')
          ? String(resolveValue(row, 'deletedAt'))
          : null,
      }));
  }
}

export default SqlResultToReportMapper;
