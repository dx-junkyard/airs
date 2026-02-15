'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import { MapFullscreenControl } from '@/features/map/extensions/MapFullscreenControl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import {
  MAP_MAX_ZOOM,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_CENTER,
} from '@/constants/map';
import { ClusterLayer } from '@/features/map/extensions/ClusterLayer';
import SharedFacilityLayer from '@/features/map/extensions/SharedFacilityLayer';

// Leafletのデフォルトマーカーアイコンのパス問題を修正
const DefaultIcon = L.icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface EditableLocationMapProps {
  /** 緯度 */
  latitude: number;
  /** 経度 */
  longitude: number;
  /** マーカーのラベル */
  label?: string;
  /** 地図の高さ */
  height?: string;
  /** ズームレベル（デフォルト: MAP_DEFAULT_ZOOM） */
  zoom?: number;
  /** 編集可能モード（クリックで位置選択） */
  editable?: boolean;
  /** 位置変更時のコールバック */
  onLocationChange?: (latitude: number, longitude: number) => void;
  /** 参照用の過去通報データ */
  referenceReports?: ReportDto[];
  /** 凡例を表示するか */
  showLegend?: boolean;
  /** 座標情報を表示するか */
  showCoordinates?: boolean;
}

/**
 * マップクリックイベントを処理するコンポーネント
 */
function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * マップの中心を更新するコンポーネント
 */
function MapCenterUpdater({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude && longitude) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [map, latitude, longitude]);

  return null;
}

/**
 * 座標情報表示コンポーネント
 */
function CoordinateDisplay({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '12px',
        fontFamily: 'monospace',
      }}
    >
      <div>緯度: {latitude.toFixed(6)}</div>
      <div>経度: {longitude.toFixed(6)}</div>
    </div>
  );
}

/**
 * EditableLocationMap コンポーネント（拡張版）
 *
 * LocationMapを拡張し、参照用の過去通報データを表示可能にした編集用地図。
 * 周辺の通報履歴を見ながら、より正確な位置入力ができる。
 *
 * editable=true の場合、地図をクリックまたはマーカーをドラッグして位置を選択できる。
 * referenceReportsを渡すと、周辺の過去通報がクラスタリング表示される。
 */
export const EditableLocationMap = ({
  latitude,
  longitude,
  label = '位置',
  height = '300px',
  zoom = MAP_DEFAULT_ZOOM,
  editable = false,
  onLocationChange,
  referenceReports = [],
  showLegend = false,
  showCoordinates = false,
}: EditableLocationMapProps) => {
  const iconInitialized = useRef(false);

  useEffect(() => {
    // デフォルトアイコンを設定（一度だけ）
    if (!iconInitialized.current) {
      L.Marker.prototype.options.icon = DefaultIcon;
      iconInitialized.current = true;
    }
  }, []);

  // マーカー位置はpropsから直接取得（完全にcontrolled）
  const markerPosition: [number, number] = [latitude, longitude];

  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      onLocationChange?.(lat, lng);
    },
    [onLocationChange]
  );

  // 座標が未設定の場合のデフォルト位置
  const defaultCenter: [number, number] =
    latitude && longitude ? [latitude, longitude] : MAP_DEFAULT_CENTER;

  const cursorClass = editable ? 'cursor-crosshair' : '';

  return (
    <div
      style={{ height, width: '100%' }}
      className={`
        overflow-hidden rounded-lg
        ${cursorClass}
      `}
    >
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        maxZoom={MAP_MAX_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={editable}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={MAP_MAX_ZOOM}
        />
        <MapFullscreenControl />

        {editable && (
          <>
            <MapClickHandler onLocationChange={handleLocationChange} />
            <MapCenterUpdater latitude={latitude} longitude={longitude} />
          </>
        )}

        {/* 参照用: 過去の通報（クラスタリング、薄く表示） */}
        {referenceReports.length > 0 && (
          <ClusterLayer
            reports={referenceReports}
            showPopup={true}
            opacity={0.5}
          />
        )}

        {/* 編集中のマーカー（目立つように通常の不透明度） */}
        {(latitude !== 0 || longitude !== 0) && (
          <Marker
            position={markerPosition}
            icon={DefaultIcon}
            draggable={editable}
            eventHandlers={
              editable
                ? {
                    dragend: (e) => {
                      const marker = e.target;
                      const position = marker.getLatLng();
                      handleLocationChange(position.lat, position.lng);
                    },
                  }
                : undefined
            }
          />
        )}

        {/* 共有施設レイヤー */}
        <SharedFacilityLayer />

        {/* 凡例表示: 削除 */}

        {/* 座標情報表示 */}
        {showCoordinates &&
          latitude !== undefined &&
          longitude !== undefined && (
            <CoordinateDisplay latitude={latitude} longitude={longitude} />
          )}
      </MapContainer>
    </div>
  );
};

export default EditableLocationMap;
