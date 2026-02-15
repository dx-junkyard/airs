import { useMutation } from '@tanstack/react-query';
import { reverseGeocode } from '@/features/ai-report/actions';
import type { StructuredAddress } from '@/server/domain/models/geo/StructuredAddressModel';

interface ReverseGeocodeParams {
  latitude: number;
  longitude: number;
}

interface UseReverseGeocodeOptions {
  onSuccess?: (result: {
    address: string;
    normalizedAddress?: StructuredAddress;
  }) => void;
  onError?: (error: Error) => void;
  /** ジオフェンス対象外だった場合のコールバック */
  onGeofenceError?: (
    result: {
      address: string;
      normalizedAddress?: StructuredAddress;
    },
    prefix: string
  ) => void;
}

/**
 * リバースジオコーディング用のMutation
 *
 * 緯度経度から住所を取得する。
 * サーバー側でジオフェンスチェックも行い、対象外の場合はonGeofenceErrorを呼び出す。
 */
function useReverseGeocode(options?: UseReverseGeocodeOptions) {
  return useMutation({
    mutationFn: async ({ latitude, longitude }: ReverseGeocodeParams) => {
      const result = await reverseGeocode(latitude, longitude);

      if (!result.success || !result.address) {
        throw new Error(result.error || '住所の取得に失敗しました');
      }

      return result;
    },

    onSuccess: (result) => {
      const successResult = {
        address: result.address!,
        normalizedAddress: result.normalizedAddress,
      };
      options?.onSuccess?.(successResult);

      if (result.geofenceBlocked) {
        options?.onGeofenceError?.(successResult, result.geofencePrefix!);
      }
    },

    onError: (error: Error) => {
      console.error('リバースジオコーディングエラー:', error);
      options?.onError?.(error);
    },
  });
}

export default useReverseGeocode;
