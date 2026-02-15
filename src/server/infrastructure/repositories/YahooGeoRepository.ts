import type { IGeoRepository } from '@/server/domain/repositories/IGeoRepository';
import ReverseGeocodeResultModel from '@/server/domain/models/geo/ReverseGeocodeResultModel';
import StructuredAddressModel from '@/server/domain/models/geo/StructuredAddressModel';
import Location from '@/server/domain/value-objects/Location';
import Address from '@/server/domain/value-objects/Address';
import type NearbyLandmark from '@/server/domain/value-objects/NearbyLandmark';
import {
  normalizeAddressFromYahoo,
  type YahooAddressElement,
} from '@/server/infrastructure/geo/normalizeAddress';
import { searchNearbyLandmarksByOverpass } from '@/server/infrastructure/geo/searchNearbyLandmarksByOverpass';

interface YahooReverseGeocodeFeatureProperty {
  Address?: string;
  AddressElement?: YahooAddressElement[];
}

interface YahooReverseGeocodeFeature {
  Property?: YahooReverseGeocodeFeatureProperty;
}

interface YahooReverseGeocodeResponse {
  Feature?: YahooReverseGeocodeFeature[];
  Error?: {
    Message?: string;
  };
}

/**
 * Yahoo逆ジオコーダー + Overpass API（OSM）を使用した IGeoRepository実装
 */
class YahooGeoRepository implements IGeoRepository {
  async reverseGeocode(location: Location): Promise<ReverseGeocodeResultModel> {
    const appId = process.env.YAHOO_GEOCODING_APP_ID;
    if (!appId) {
      throw new Error('YAHOO_GEOCODING_APP_ID が未設定です');
    }

    const response = await fetch(
      `https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?appid=${encodeURIComponent(appId)}&output=json&lat=${location.latitude}&lon=${location.longitude}`
    );

    if (!response.ok) {
      throw new Error(`Yahoo逆ジオコーダーAPIエラー: ${response.status}`);
    }

    const data: YahooReverseGeocodeResponse = await response.json();
    if (data.Error?.Message) {
      throw new Error(`Yahoo逆ジオコーダーAPIエラー: ${data.Error.Message}`);
    }

    const property = data.Feature?.[0]?.Property;
    const normalizedAddress = StructuredAddressModel.create(
      normalizeAddressFromYahoo({
        address: property?.Address,
        addressElements: property?.AddressElement,
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

export default YahooGeoRepository;
