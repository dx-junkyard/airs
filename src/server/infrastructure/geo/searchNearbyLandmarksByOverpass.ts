import Location from '@/server/domain/value-objects/Location';
import NearbyLandmark from '@/server/domain/value-objects/NearbyLandmark';

const OVERPASS_RATE_LIMIT_MS = 2000;
let lastOverpassRequestAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Overpass APIレスポンスの要素型定義
 */
interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/**
 * OSMアメニティカテゴリマッピング
 */
const AMENITY_CATEGORIES: Record<string, string> = {
  school: '学校',
  university: '大学',
  college: '大学',
  kindergarten: '幼稚園',
  hospital: '病院',
  clinic: '診療所',
  pharmacy: '薬局',
  police: '交番',
  fire_station: '消防署',
  post_office: '郵便局',
  bank: '銀行',
  library: '図書館',
  townhall: '役所',
  parking: '駐車場',
  fuel: 'ガソリンスタンド',
  restaurant: '飲食店',
  cafe: 'カフェ',
  convenience: 'コンビニ',
  supermarket: 'スーパー',
  marketplace: '商業施設',
  place_of_worship: '神社・寺院',
  community_centre: '公民館',
};

/**
 * OSMレジャーカテゴリマッピング
 */
const LEISURE_CATEGORIES: Record<string, string> = {
  park: '公園',
  playground: '遊び場',
  sports_centre: 'スポーツ施設',
  garden: '庭園',
};

/**
 * OSM観光カテゴリマッピング
 */
const TOURISM_CATEGORIES: Record<string, string> = {
  museum: '博物館',
  attraction: '観光施設',
  viewpoint: '展望台',
  hotel: 'ホテル',
};

/**
 * 周辺ランドマーク検索結果の最大件数
 */
const MAX_LANDMARKS = 20;

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 2000;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function getCategoryFromOsmTags(tags: Record<string, string>): string {
  if (tags.amenity && AMENITY_CATEGORIES[tags.amenity]) {
    return AMENITY_CATEGORIES[tags.amenity];
  }
  if (tags.leisure && LEISURE_CATEGORIES[tags.leisure]) {
    return LEISURE_CATEGORIES[tags.leisure];
  }
  if (tags.tourism && TOURISM_CATEGORIES[tags.tourism]) {
    return TOURISM_CATEGORIES[tags.tourism];
  }
  if (tags.shop) {
    return '店舗';
  }

  return 'ランドマーク';
}

export async function searchNearbyLandmarksByOverpass(
  location: Location,
  radiusMeters: number
): Promise<NearbyLandmark[]> {
  const query = `
[out:json][timeout:10];
(
  nwr["amenity"~"school|university|college|kindergarten|hospital|clinic|pharmacy|police|fire_station|post_office|bank|library|townhall|parking|fuel|restaurant|cafe|convenience|supermarket|marketplace|place_of_worship|community_centre"](around:${radiusMeters},${location.latitude},${location.longitude});
  nwr["leisure"~"park|playground|sports_centre|garden"](around:${radiusMeters},${location.latitude},${location.longitude});
  nwr["tourism"~"museum|attraction|viewpoint|hotel"](around:${radiusMeters},${location.latitude},${location.longitude});
  nwr["shop"](around:${radiusMeters},${location.latitude},${location.longitude});
);
out center;`;

  const elapsed = Date.now() - lastOverpassRequestAt;
  if (elapsed < OVERPASS_RATE_LIMIT_MS) {
    await sleep(OVERPASS_RATE_LIMIT_MS - elapsed);
  }
  lastOverpassRequestAt = Date.now();

  let lastError: Error | null = null;
  let data: { elements: OverpassElement[] } | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1));
    }

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (response.ok) {
      data = await response.json();
      break;
    }

    if (!RETRYABLE_STATUSES.has(response.status)) {
      throw new Error(`Overpass APIエラー: ${response.status}`);
    }

    lastError = new Error(`Overpass APIエラー: ${response.status}`);
  }

  if (!data) {
    throw lastError ?? new Error('Overpass APIエラー: リトライ回数超過');
  }

  const landmarks: NearbyLandmark[] = [];
  const seenNames = new Set<string>();

  for (const element of data.elements) {
    const tags = element.tags ?? {};
    const name = tags.name;
    if (!name) continue;

    if (seenNames.has(name)) continue;
    seenNames.add(name);

    const lat = element.lat ?? element.center?.lat;
    const lon = element.lon ?? element.center?.lon;
    if (lat == null || lon == null) continue;

    const elementLocation = Location.create(lat, lon);
    const distance = location.distanceTo(elementLocation);
    const category = getCategoryFromOsmTags(tags);

    landmarks.push(
      NearbyLandmark.create({
        id: `osm_${element.type}_${element.id}`,
        name,
        category,
        distanceMeters: Math.round(distance),
        location: elementLocation,
      })
    );
  }

  landmarks.sort((a, b) => a.distanceMeters - b.distanceMeters);

  return landmarks.slice(0, MAX_LANDMARKS);
}
