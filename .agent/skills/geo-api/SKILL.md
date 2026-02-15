---
name: geo-api
description: Guide for implementing geocoding and nearby landmark search using free APIs (Yahoo Reverse Geocoder, GSI Reverse Geocoder, Overpass API, Nominatim) instead of Google Maps Platform. Covers reverse geocoding, nearby landmark search, forward geocoding, and implementation patterns.
---

# 地理情報API（Yahoo / 国土地理院 / Overpass API / Nominatim）

逆ジオコーディング、周辺ランドマーク検索、順ジオコーディングの実装パターン。「逆ジオコーディング」「周辺検索」「住所取得」「ランドマーク」「Overpass」「GSI」「Yahoo」「Nominatim」時に使用。

## 概要

Google Maps Platform の代わりに、以下の無料APIを使用してジオコーディング・施設検索を行う。

| 用途 | API | ライセンス |
|------|-----|-----------|
| 逆ジオコーディング（推奨） | Yahoo Reverse Geocoder | Yahoo API規約に準拠 |
| 逆ジオコーディング | 国土地理院 逆ジオコーダー | 制限なし（政府API） |
| 周辺ランドマーク検索 | Overpass API (OSM) | ODbL（保存可） |
| 順ジオコーディング | OSM Nominatim | ODbL（1req/s制限） |

## 逆ジオコーディング（Yahoo Reverse Geocoder）

### エンドポイント

```
GET https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?appid={APP_ID}&output=json&lat={lat}&lon={lon}
```

### 必須環境変数

```
YAHOO_GEOCODING_APP_ID
```

### レスポンス例（抜粋）

```json
{
  "Feature": [
    {
      "Property": {
        "Address": "東京都青梅市東青梅３丁目５",
        "AddressElement": [
          { "Level": "prefecture", "Name": "東京都" },
          { "Level": "city", "Name": "青梅市" },
          { "Level": "oaza", "Name": "東青梅" },
          { "Level": "aza", "Name": "３丁目" },
          { "Level": "detail1", "Name": "５" }
        ]
      }
    }
  ]
}
```

### 実装ルール

- 構造化は `AddressElement` の `Level` を使って抽出する。
- `detail1` は街区までのため、`2-8` のような後段が必要な場合は `Property.Address` の末尾を補完に使う。
- `houseNumber` は `AddressElement(detail*)` と `Property.Address` の両方から復元する。
- `prefecture` と `city` が欠ける場合は取得失敗として扱う。

### 実装参照

- `src/server/infrastructure/repositories/YahooGeoRepository.ts`
- `src/server/infrastructure/geo/normalizeAddress.ts` の `normalizeAddressFromYahoo`

### 仕様ドキュメント

- <https://developer.yahoo.co.jp/webapi/map/openlocalplatform/v1/reversegeocoder.html>

## 逆ジオコーディング（国土地理院API）

### エンドポイント

```
GET https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat={lat}&lon={lon}
```

### レスポンス

```json
{
  "results": {
    "muniCd": "13205",
    "lv01Nm": "東青梅五丁目"
  }
}
```

### 住所の構築

```typescript
import { MUNICIPALITY_MAP } from '@/server/infrastructure/geo/municipalityCodes';

// muniCd → 都道府県+市区町村名
const municipality = MUNICIPALITY_MAP[data.results.muniCd]; // "東京都青梅市"
const address = municipality + data.results.lv01Nm;          // "東京都青梅市東青梅五丁目"
```

### 注意点

- 番地レベルの精度はない（丁目まで）
- `MUNICIPALITY_MAP` は `src/server/infrastructure/geo/municipalityCodes.ts` に定義
- データソース: <https://maps.gsi.go.jp/js/muni.js>

## 周辺ランドマーク検索（Overpass API）

### エンドポイント

```
POST https://overpass-api.de/api/interpreter
Content-Type: application/x-www-form-urlencoded
Body: data={OverpassQL}
```

### クエリ例（半径100m以内の施設）

```
[out:json][timeout:10];
(
  nwr["amenity"~"school|hospital|police|..."](around:100,{lat},{lon});
  nwr["leisure"~"park|playground|..."](around:100,{lat},{lon});
  nwr["tourism"~"museum|attraction|..."](around:100,{lat},{lon});
  nwr["shop"](around:100,{lat},{lon});
);
out center;
```

### レスポンスの座標取得

- `node`: `element.lat`, `element.lon`
- `way`/`relation`: `element.center.lat`, `element.center.lon`（`out center;` が必要）

### 注意点

- `[timeout:10]` でタイムアウトを設定すること
- 名前（`tags.name`）がない要素はスキップ
- ODbL ライセンスのため、データの保存・AI入力が可能

## 順ジオコーディング（Nominatim API）

### エンドポイント

```
GET https://nominatim.openstreetmap.org/search?q={address}&format=json&limit=1&countrycodes=jp
```

### 必須ヘッダー

```
User-Agent: AIRS-SeedScript/1.0 (wildlife-report-system)
```

### 利用制限

- **1リクエスト/秒**（必ずスリープを入れること）
- User-Agent ヘッダー必須

### 実装パターン

```typescript
await new Promise((resolve) => setTimeout(resolve, 1100));
const response = await fetch(url, {
  headers: { 'User-Agent': 'AIRS-SeedScript/1.0 (wildlife-report-system)' },
});
```

## 実装箇所

| 機能 | ファイル |
|------|---------|
| 逆ジオコーディング | `src/features/ai-report/actions.ts` → `reverseGeocode()` |
| ランドマーク検索 | `src/features/ai-report/actions.ts` → `searchNearbyLandmarks()` |
| 順ジオコーディング（seed用） | `tmp/seed.ts` → `fetchGeocode()` |
| 市区町村コードマップ | `src/server/infrastructure/geo/municipalityCodes.ts` |
