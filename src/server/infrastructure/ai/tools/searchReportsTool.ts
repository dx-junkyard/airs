import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import SqlQueryExecutor from '@/server/infrastructure/repositories/SqlQueryExecutor';

/** 許可されたステータス値 */
const VALID_STATUSES = new Set(['waiting', 'completed']);

/** 許可された獣種値 */
const VALID_ANIMAL_TYPES = new Set([
  'monkey', 'deer', 'wild_boar', 'bear', 'raccoon_dog', 'fox', 'badger',
  'masked_palm_civet', 'hare', 'serow', 'marten', 'weasel', 'dog', 'cat',
  'raccoon', 'nutria', 'muntjac', 'formosan_squirrel', 'american_mink',
  'mongoose', 'siberian_weasel',
  'pheasant', 'crow', 'bulbul', 'starling', 'sparrow', 'duck', 'heron',
  'cormorant', 'kite', 'pigeon',
  'other',
]);

/** CUID形式の検証パターン */
const CUID_PATTERN = /^c[a-z0-9]{24,}$/;

/** ISO日付形式の検証パターン (YYYY-MM-DD) */
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * ズームレベルから検索半径（メートル）を算出
 */
function zoomToRadius(zoom: number): number {
  if (zoom >= 18) return 200;
  if (zoom >= 16) return 500;
  if (zoom >= 15) return 1000;
  if (zoom >= 14) return 2000;
  if (zoom >= 13) return 5000;
  if (zoom >= 12) return 10000;
  if (zoom >= 10) return 50000;
  if (zoom >= 8) return 100000;
  return 500000;
}

/**
 * 文字列値をSQLリテラルとして安全にエスケープ
 * シングルクォートをエスケープし、SQL文字列リテラルとして返す
 */
function toSqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}

// Input schema for the searchReports tool
const searchReportsInputSchema = z.object({
  startDate: z.string().optional().describe('開始日 (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('終了日 (YYYY-MM-DD)'),
  statuses: z
    .array(z.string())
    .optional()
    .describe("ステータス (例: ['waiting'])"),
  animalTypes: z
    .array(z.string())
    .optional()
    .describe("獣種 (例: ['monkey', 'deer'])"),
  lat: z.number().optional().describe('検索中心の緯度'),
  lng: z.number().optional().describe('検索中心の経度'),
  zoom: z
    .number()
    .optional()
    .describe(
      '地図のズームレベル (6-18)。ズームレベルから検索半径を自動決定'
    ),
  staffIds: z
    .array(z.string())
    .optional()
    .describe(
      "担当職員ID (例: ['clxxx']。'__unassigned__'で未割当を指定)"
    ),
});

type SearchReportsInput = z.infer<typeof searchReportsInputSchema>;

/**
 * 通報検索ツール
 *
 * フィルタ条件を指定して通報を検索する。結果は自動的に地図のフィルタに反映される。
 */
export const searchReportsTool = tool({
  description: `フィルタ条件を指定して通報を検索します。結果は自動的に地図のフィルタに反映されます。
通報データの検索・地図表示には必ずこのツールを使用してください。

パラメータ:
- startDate/endDate: 期間を絞り込む (YYYY-MM-DD)
- statuses: ステータスで絞り込む ('waiting', 'completed')
- animalTypes: 獣種で絞り込む ('monkey', 'deer', 'wild_boar', 'bear' 等)
- lat/lng/zoom: 地理的範囲で絞り込む（ズームレベルから検索半径を自動決定）
- staffIds: 担当職員で絞り込む（'__unassigned__'で未割当を指定）

削除済みレコードは自動的に除外されます。`,
  inputSchema: zodSchema(searchReportsInputSchema),
  execute: async (input: SearchReportsInput) => {
    const conditions: string[] = ['r."deletedAt" IS NULL'];

    // ステータスフィルター
    if (input.statuses && input.statuses.length > 0) {
      const validStatuses = input.statuses.filter((s) =>
        VALID_STATUSES.has(s)
      );
      if (validStatuses.length > 0) {
        const values = validStatuses.map(toSqlString).join(', ');
        conditions.push(`r.status IN (${values})`);
      }
    }

    // 獣種フィルター
    if (input.animalTypes && input.animalTypes.length > 0) {
      const validTypes = input.animalTypes.filter((t) =>
        VALID_ANIMAL_TYPES.has(t)
      );
      if (validTypes.length > 0) {
        const values = validTypes.map(toSqlString).join(', ');
        conditions.push(`r."animalType" IN (${values})`);
      }
    }

    // 期間フィルター
    if (input.startDate && ISO_DATE_PATTERN.test(input.startDate)) {
      conditions.push(`r."createdAt" >= ${toSqlString(input.startDate)}`);
    }
    if (input.endDate && ISO_DATE_PATTERN.test(input.endDate)) {
      conditions.push(
        `r."createdAt" <= ${toSqlString(input.endDate + 'T23:59:59')}`
      );
    }

    // 地理的範囲フィルター
    if (input.lat != null && input.lng != null) {
      const radius =
        input.zoom != null ? zoomToRadius(input.zoom) : 10000;
      conditions.push(
        `ST_DWithin(r.location, ST_SetSRID(ST_MakePoint(${input.lng}, ${input.lat}), 4326)::geography, ${radius})`
      );
    }

    // 職員フィルター
    if (input.staffIds && input.staffIds.length > 0) {
      const hasUnassigned = input.staffIds.includes('__unassigned__');
      const validStaffIds = input.staffIds.filter(
        (id) => id !== '__unassigned__' && CUID_PATTERN.test(id)
      );

      const staffConditions: string[] = [];
      if (validStaffIds.length > 0) {
        const values = validStaffIds.map(toSqlString).join(', ');
        staffConditions.push(`r."staffId" IN (${values})`);
      }
      if (hasUnassigned) {
        staffConditions.push(`r."staffId" IS NULL`);
      }
      if (staffConditions.length > 0) {
        conditions.push(`(${staffConditions.join(' OR ')})`);
      }
    }

    const whereClause = conditions.join(' AND ');
    const sql = `SELECT r.id, r."animalType", r.latitude, r.longitude, r.address, r.status, r."staffId", s.name AS "staffName", r."createdAt" FROM reports r LEFT JOIN staffs s ON s.id = r."staffId" AND s."deletedAt" IS NULL WHERE ${whereClause} ORDER BY r."createdAt" DESC`;

    const executor = new SqlQueryExecutor();
    const result = await executor.execute(sql);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        data: null,
        rowCount: 0,
      };
    }

    return {
      success: true,
      data: result.data,
      rowCount: result.rowCount,
      error: null,
    };
  },
});
