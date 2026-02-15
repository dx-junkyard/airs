export interface NormalizedAddress {
  prefecture: string;
  city: string;
  oaza: string;
  aza: string;
  detail: string;
  full: string;
  areaKey: string;
  houseNumber?: string;
}

export interface NominatimAddressComponents {
  state?: string;
  province?: string;
  region?: string;
  state_district?: string;
  'ISO3166-2-lvl4'?: string;
  city?: string;
  municipality?: string;
  town?: string;
  village?: string;
  county?: string;
  borough?: string;
  district?: string;
  suburb?: string;
  quarter?: string;
  neighbourhood?: string;
  city_district?: string;
  hamlet?: string;
  residential?: string;
  city_block?: string;
  road?: string;
  house_number?: string;
}

export interface YahooAddressElement {
  Name?: string;
  Kana?: string;
  Level?: string;
  Code?: string;
}

const PREFECTURE_PATTERN = /^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/;
const CHOME_PATTERN =
  /^(.+?)([0-9０-９〇零一二三四五六七八九十百千]+(?:丁目|丁))(.*)$/;
const PREFECTURE_BY_JP_CODE: Record<string, string> = {
  '01': '北海道',
  '02': '青森県',
  '03': '岩手県',
  '04': '宮城県',
  '05': '秋田県',
  '06': '山形県',
  '07': '福島県',
  '08': '茨城県',
  '09': '栃木県',
  '10': '群馬県',
  '11': '埼玉県',
  '12': '千葉県',
  '13': '東京都',
  '14': '神奈川県',
  '15': '新潟県',
  '16': '富山県',
  '17': '石川県',
  '18': '福井県',
  '19': '山梨県',
  '20': '長野県',
  '21': '岐阜県',
  '22': '静岡県',
  '23': '愛知県',
  '24': '三重県',
  '25': '滋賀県',
  '26': '京都府',
  '27': '大阪府',
  '28': '兵庫県',
  '29': '奈良県',
  '30': '和歌山県',
  '31': '鳥取県',
  '32': '島根県',
  '33': '岡山県',
  '34': '広島県',
  '35': '山口県',
  '36': '徳島県',
  '37': '香川県',
  '38': '愛媛県',
  '39': '高知県',
  '40': '福岡県',
  '41': '佐賀県',
  '42': '長崎県',
  '43': '熊本県',
  '44': '大分県',
  '45': '宮崎県',
  '46': '鹿児島県',
  '47': '沖縄県',
};

function compactAddress(address: string): string {
  return address.replace(/[,\s\u3000]/g, '').replace(/日本$/, '');
}

function splitFallback(address: string): {
  prefecture: string;
  city: string;
  rest: string;
} {
  const prefMatch = address.match(PREFECTURE_PATTERN);
  const prefecture = prefMatch?.[1] ?? '';
  const afterPrefecture = prefecture ? address.slice(prefecture.length) : address;

  const cityMatch = afterPrefecture.match(/^(.+?(?:市|区|町|村))/);
  const city = cityMatch?.[1] ?? '';
  const rest = city ? afterPrefecture.slice(city.length) : afterPrefecture;

  return { prefecture, city, rest };
}

function splitArea(rest: string): { oaza: string; aza: string; detail: string } {
  const chomeMatch = rest.match(CHOME_PATTERN);
  if (chomeMatch) {
    return {
      oaza: chomeMatch[1] || '',
      aza: chomeMatch[2] || '',
      detail: chomeMatch[3] || '',
    };
  }

  const firstDigitIndex = rest.search(/[0-9０-９]/);
  if (firstDigitIndex > 0) {
    return {
      oaza: rest.slice(0, firstDigitIndex),
      aza: '',
      detail: rest.slice(firstDigitIndex),
    };
  }

  if (firstDigitIndex === 0) {
    return {
      oaza: '',
      aza: '',
      detail: rest,
    };
  }

  return {
    oaza: rest,
    aza: '',
    detail: '',
  };
}

function uniqueParts(parts: string[]): string[] {
  const result: string[] = [];
  for (const part of parts) {
    if (!part) continue;
    if (result[result.length - 1] === part) continue;
    result.push(part);
  }
  return result;
}

function mergeHierarchicalParts(parts: string[]): string[] {
  const merged: string[] = [];

  for (const part of parts) {
    const value = compactAddress(part);
    if (!value) continue;

    const sameOrSubsetIndex = merged.findIndex(
      (existing) => existing === value || existing.includes(value)
    );
    if (sameOrSubsetIndex !== -1) {
      continue;
    }

    const supersetIndex = merged.findIndex((existing) => value.includes(existing));
    if (supersetIndex !== -1) {
      merged[supersetIndex] = value;
      continue;
    }

    merged.push(value);
  }

  return merged;
}

function resolvePrefectureFromIsoCode(code?: string): string {
  if (!code) return '';
  const match = code.match(/^JP-(\d{2})$/i);
  if (!match) return '';
  return PREFECTURE_BY_JP_CODE[match[1]] ?? '';
}

function getYahooElementName(
  elements: YahooAddressElement[],
  levels: string[]
): string {
  const candidates = levels.map((level) => level.toLowerCase());
  const match = elements.find((element) =>
    candidates.includes((element.Level ?? '').toLowerCase())
  );
  return compactAddress(match?.Name ?? '');
}

function getYahooDetail(elements: YahooAddressElement[]): string {
  const details = elements
    .filter((element) => (element.Level ?? '').toLowerCase().startsWith('detail'))
    .map((element) => compactAddress(element.Name ?? ''))
    .filter((value) => !!value);

  return compactAddress(details.join(''));
}

/**
 * 生住所文字列を丁目レベルの構造化住所に変換する（フォールバック用）。
 */
export function normalizeAddress(address: string): NormalizedAddress {
  const full = compactAddress(address ?? '');
  if (!full) {
    return {
      prefecture: '',
      city: '',
      oaza: '',
      aza: '',
      detail: '',
      full: '',
      areaKey: '',
      houseNumber: '',
    };
  }

  const base = splitFallback(full);
  const area = splitArea(base.rest);
  const prefecture = base.prefecture.trim();
  const city = base.city.trim();
  const oaza = area.oaza.trim();
  const aza = area.aza.trim();
  const detail = area.detail.trim();
  const areaKey = `${prefecture}${city}${oaza}${aza}` || full;

  return {
    prefecture,
    city,
    oaza,
    aza,
    detail,
    full,
    areaKey,
    houseNumber: '',
  };
}

/**
 * Nominatimのレスポンス構造から構造化住所を生成する。
 * 必須要素（都道府県・市区町村）が欠損する場合は空構造を返す。
 */
export function normalizeAddressFromNominatim(params: {
  address?: NominatimAddressComponents;
}): NormalizedAddress {
  const addr = params.address ?? {};
  const prefecture = compactAddress(
    addr.state ??
      addr.province ??
      addr.region ??
      addr.state_district ??
      resolvePrefectureFromIsoCode(addr['ISO3166-2-lvl4']) ??
      ''
  );
  const city = compactAddress(
    addr.city ??
      addr.state_district ??
      addr.municipality ??
      addr.town ??
      addr.village ??
      addr.county ??
      ''
  );
  const areaSource = mergeHierarchicalParts(
    [
      addr.suburb,
      addr.quarter,
      addr.neighbourhood,
      addr.city_district,
      addr.borough,
      addr.district,
      addr.hamlet,
      addr.residential,
      addr.city_block,
    ].map((part) => part ?? '')
  ).join('');
  const road = compactAddress(addr.road ?? '');
  const houseNumber = compactAddress(addr.house_number ?? '');

  const area = splitArea(areaSource || road);
  const extraRoad = road && road !== areaSource ? road : '';
  const detail = compactAddress(`${area.detail}${extraRoad}${houseNumber}`);
  const areaOrRoad = areaSource || road;
  const fullFromParts = compactAddress(
    uniqueParts([prefecture, city, areaOrRoad, houseNumber]).join(
      ''
    )
  );
  if (!prefecture || !city || !fullFromParts) {
    return {
      prefecture: '',
      city: '',
      oaza: '',
      aza: '',
      detail: '',
      full: '',
      areaKey: '',
      houseNumber: '',
    };
  }

  const oaza = area.oaza.trim();
  const aza = area.aza.trim();
  const areaKey = `${prefecture}${city}${oaza}${aza}` || fullFromParts;

  return {
    prefecture,
    city,
    oaza,
    aza,
    detail,
    full: fullFromParts,
    areaKey,
    houseNumber,
  };
}

/**
 * Yahoo逆ジオコーダーのレスポンス構造から構造化住所を生成する。
 */
export function normalizeAddressFromYahoo(params: {
  address?: string;
  addressElements?: YahooAddressElement[];
}): NormalizedAddress {
  const elements = params.addressElements ?? [];

  const prefecture = getYahooElementName(elements, ['prefecture']);
  const city = getYahooElementName(elements, ['city']);
  const oaza = getYahooElementName(elements, ['oaza']);
  const aza = getYahooElementName(elements, ['aza']);
  const houseNumberFromElements = getYahooDetail(elements);

  const fullFromElements = compactAddress(
    uniqueParts([prefecture, city, oaza, aza, houseNumberFromElements]).join('')
  );
  const full = compactAddress(params.address ?? fullFromElements);
  const areaPrefix = compactAddress(
    uniqueParts([prefecture, city, oaza, aza]).join('')
  );
  const houseNumberFromAddress =
    areaPrefix && full.startsWith(areaPrefix) ? full.slice(areaPrefix.length) : '';
  const houseNumber = houseNumberFromAddress || houseNumberFromElements;
  const detail = houseNumber;

  const fallback = normalizeAddress(full);
  if (!prefecture || !city || !full) {
    return fallback;
  }

  const areaKey = `${prefecture}${city}${oaza}${aza}` || full;

  return {
    prefecture,
    city,
    oaza,
    aza,
    detail,
    full,
    areaKey,
    houseNumber,
  };
}
