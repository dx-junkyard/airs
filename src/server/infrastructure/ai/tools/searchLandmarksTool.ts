import { tool, zodSchema } from 'ai';
import { z } from 'zod';
import DIContainer from '@/server/infrastructure/di/container';
import SearchNearbyLandmarksUseCase from '@/server/application/use-cases/geo/SearchNearbyLandmarksUseCase';

// Input schema for the landmark search tool
const landmarkInputSchema = z.object({
  latitude: z.number().describe('検索中心の緯度'),
  longitude: z.number().describe('検索中心の経度'),
  radiusMeters: z
    .number()
    .optional()
    .describe('検索半径（メートル、デフォルト100）'),
});

type LandmarkInput = z.infer<typeof landmarkInputSchema>;

/**
 * ランドマーク検索ツール
 *
 * 指定した緯度経度の周辺にある施設・ランドマークをOverpass API経由で検索する
 */
export const searchLandmarksTool = tool({
  description: `指定した緯度経度の周辺にあるランドマーク・施設（学校、公園、コンビニ、病院など）を検索します。
Overpass API（OpenStreetMap）を使用して周辺施設情報を取得します。
主に分析の補助情報として活用します（例: 通報集中エリア周辺の施設確認、出没パターンと周辺環境の関連分析）。`,
  inputSchema: zodSchema(landmarkInputSchema),
  execute: async ({
    latitude,
    longitude,
    radiusMeters,
  }: LandmarkInput) => {
    try {
      const geoRepository = DIContainer.getGeoRepository();
      const useCase = new SearchNearbyLandmarksUseCase(geoRepository);
      const landmarks = await useCase.execute(
        latitude,
        longitude,
        radiusMeters ?? 100
      );

      return {
        success: true,
        landmarks,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        landmarks: [],
        error:
          error instanceof Error
            ? error.message
            : 'ランドマーク検索中にエラーが発生しました',
      };
    }
  },
});
