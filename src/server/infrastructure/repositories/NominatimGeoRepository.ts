import type { IGeoRepository } from '@/server/domain/repositories/IGeoRepository';
import ReverseGeocodeResultModel from '@/server/domain/models/geo/ReverseGeocodeResultModel';
import StructuredAddressModel from '@/server/domain/models/geo/StructuredAddressModel';
import Location from '@/server/domain/value-objects/Location';
import Address from '@/server/domain/value-objects/Address';
import type NearbyLandmark from '@/server/domain/value-objects/NearbyLandmark';
import {
  normalizeAddressFromNominatim,
  type NominatimAddressComponents,
} from '@/server/infrastructure/geo/normalizeAddress';
import { searchNearbyLandmarksByOverpass } from '@/server/infrastructure/geo/searchNearbyLandmarksByOverpass';

/**
 * Nominatim逆ジオコーディングAPIレスポンス
 */
interface NominatimReverseGeocodeResponse {
  address?: NominatimAddressComponents;
}

const NOMINATIM_RATE_LIMIT_MS = 1100;
let lastNominatimRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nominatim逆ジオコーディング + Overpass API（OSM）を使用した IGeoRepository実装
 */
class NominatimGeoRepository implements IGeoRepository {
  async reverseGeocode(location: Location): Promise<ReverseGeocodeResultModel> {
    const elapsed = Date.now() - lastNominatimRequestAt;
    if (elapsed < NOMINATIM_RATE_LIMIT_MS) {
      await sleep(NOMINATIM_RATE_LIMIT_MS - elapsed);
    }
    lastNominatimRequestAt = Date.now();

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=jsonv2&addressdetails=1&accept-language=ja&zoom=18`,
      {
        headers: {
          'User-Agent':
            process.env.NOMINATIM_USER_AGENT ??
            'AIRS/1.0 (wildlife-report-system)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim APIエラー: ${response.status}`);
    }

    const data: NominatimReverseGeocodeResponse = await response.json();
    const normalizedAddress = StructuredAddressModel.create(
      normalizeAddressFromNominatim({
        address: data.address,
      })
    );

    if (!normalizedAddress.hasRequiredComponents()) {
      throw new Error('住所が見つかりませんでした');
    }

    const address = Address.create(normalizedAddress.value.full);
    return ReverseGeocodeResultModel.create({ address, normalizedAddress });
  }

  async searchNearbyLandmarks(
    location: Location,
    radiusMeters: number
  ): Promise<NearbyLandmark[]> {
    return searchNearbyLandmarksByOverpass(location, radiusMeters);
  }
}

export default NominatimGeoRepository;
