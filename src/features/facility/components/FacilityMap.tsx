'use client';

import { useState, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapFullscreenControl } from '@/features/map/extensions/MapFullscreenControl';
import { useQuery } from '@tanstack/react-query';
import 'leaflet/dist/leaflet.css';
import type { FacilityDto } from '@/server/application/dtos/FacilityDto';
import type { NearbyLandmarkDto } from '@/server/application/dtos/NearbyLandmarkDto';
import {
  searchFacilityLandmarks,
  getFacilitiesByStaff,
} from '@/features/facility/actions';
import useRegisterFacility from '@/hooks/mutations/useRegisterFacility';
import useUnregisterFacility from '@/hooks/mutations/useUnregisterFacility';
import useToggleFacilityShared from '@/hooks/mutations/useToggleFacilityShared';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import { MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM } from '@/constants/map';
import { showErrorToast } from '@/features/common/notifications/toast';
import FacilityMarkerLayer from '@/features/facility/components/FacilityMarkerLayer';
import SearchButton from '@/features/facility/components/SearchButton';
import {
  mapOverpassCategoryToKey,
  getFacilityCategoryLabel,
  FACILITY_CATEGORY_OPTIONS,
} from '@/server/domain/constants/facilityCategories';

/** 仮マーカー用アイコン（オレンジ） */
const TempMarkerIcon = L.divIcon({
  className: 'facility-temp-pin',
  html: `<div style="
    width: 28px;
    height: 28px;
    background-color: #f59e0b;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  ">\u{1F4CD}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

interface ClickedPosition {
  lat: number;
  lng: number;
}

/**
 * 地図クリックで手動登録用の仮マーカーを配置するハンドラ
 *
 * Leaflet コントロール（検索ボタン、ズーム等）やポップアップ、マーカー上の
 * クリックは無視し、地図タイル上のクリックのみ処理する。
 */
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const target = (e.originalEvent as MouseEvent)
        ?.target as HTMLElement | null;
      if (
        !target?.isConnected ||
        target.closest(
          '.leaflet-control, .leaflet-popup, .leaflet-marker-icon'
        )
      )
        return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface FacilityMapProps {
  staffId: string;
  /** SSRで取得した施設データ */
  initialFacilities: FacilityDto[];
  /** デフォルト中心座標 */
  defaultCenter: { lat: number; lng: number };
}

/**
 * 周辺施設管理用の地図コンポーネント
 *
 * 地図上で周辺施設を検索し、登録・登録解除・全体共有トグルを操作できる。
 * 地図クリックで施設を手動登録することも可能。
 */
const FacilityMap = ({
  staffId,
  initialFacilities,
  defaultCenter,
}: FacilityMapProps) => {
  // 検索結果
  const [searchResults, setSearchResults] = useState<NearbyLandmarkDto[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 操作中のID追跡（楽観的UI更新用）
  const [registeringIds, setRegisteringIds] = useState<Set<string>>(
    () => new Set()
  );
  const [unregisteringIds, setUnregisteringIds] = useState<Set<string>>(
    () => new Set()
  );

  // 地図クリック手動登録用
  const [clickedPosition, setClickedPosition] =
    useState<ClickedPosition | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualCategory, setManualCategory] = useState('other');
  const [isManualRegistering, setIsManualRegistering] = useState(false);

  // 登録済み施設をTanStack Queryで管理
  const { data: facilities = [] } = useQuery({
    queryKey: queryKeys.facilities.byStaff(staffId),
    queryFn: () => getFacilitiesByStaff(staffId),
    initialData: initialFacilities,
  });

  // Mutations
  const registerMutation = useRegisterFacility(staffId);
  const unregisterMutation = useUnregisterFacility(staffId);
  const toggleSharedMutation = useToggleFacilityShared(staffId);

  // 周辺施設検索
  const handleSearch = useCallback(async (lat: number, lng: number) => {
    setIsSearching(true);
    try {
      const results = await searchFacilityLandmarks(lat, lng, 1000);
      setSearchResults((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const newResults = results.filter((r) => !existingIds.has(r.id));
        return [...prev, ...newResults];
      });
    } catch {
      showErrorToast('施設の検索に失敗しました');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // 施設登録（Overpass API経由）
  const handleRegister = useCallback(
    (landmark: NearbyLandmarkDto) => {
      setRegisteringIds((prev) => new Set(prev).add(landmark.id));
      registerMutation.mutate(
        {
          staffId,
          overpassId: landmark.id,
          name: landmark.name,
          category: mapOverpassCategoryToKey(landmark.category),
          latitude: landmark.latitude,
          longitude: landmark.longitude,
        },
        {
          onSettled: () => {
            setRegisteringIds((prev) => {
              const next = new Set(prev);
              next.delete(landmark.id);
              return next;
            });
          },
        }
      );
    },
    [staffId, registerMutation]
  );

  // 施設登録解除
  const handleUnregister = useCallback(
    (facilityId: string) => {
      setUnregisteringIds((prev) => new Set(prev).add(facilityId));
      unregisterMutation.mutate(facilityId, {
        onSettled: () => {
          setUnregisteringIds((prev) => {
            const next = new Set(prev);
            next.delete(facilityId);
            return next;
          });
        },
      });
    },
    [unregisterMutation]
  );

  // 全体共有トグル
  const handleToggleShared = useCallback(
    (facilityId: string, isShared: boolean) => {
      toggleSharedMutation.mutate({ facilityId, isShared });
    },
    [toggleSharedMutation]
  );

  // 地図クリック → 仮マーカー配置
  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedPosition({ lat, lng });
    setManualName('');
    setManualCategory('other');
  }, []);

  // 手動登録
  const handleManualRegister = useCallback(() => {
    if (!clickedPosition || !manualName.trim()) return;

    setIsManualRegistering(true);
    registerMutation.mutate(
      {
        staffId,
        name: manualName.trim(),
        category: manualCategory,
        latitude: clickedPosition.lat,
        longitude: clickedPosition.lng,
      },
      {
        onSuccess: () => {
          setClickedPosition(null);
          setManualName('');
          setManualCategory('other');
        },
        onSettled: () => {
          setIsManualRegistering(false);
        },
      }
    );
  }, [clickedPosition, manualName, manualCategory, staffId, registerMutation]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-solid-gray-600">
          地図を移動して「周辺施設検索」ボタンで検索、または地図クリックで手動登録できます
        </p>
        {facilities.length > 0 && (
          <span className="text-sm text-solid-gray-500">
            {facilities.length}件の施設が登録済み
          </span>
        )}
      </div>

      <div
        style={{ height: '500px', width: '100%' }}
        className="relative isolate overflow-hidden rounded-lg"
      >
        <MapContainer
          center={[defaultCenter.lat, defaultCenter.lng]}
          zoom={MAP_DEFAULT_ZOOM + 2}
          maxZoom={MAP_MAX_ZOOM}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={MAP_MAX_ZOOM}
          />
          <MapFullscreenControl />

          <MapClickHandler onMapClick={handleMapClick} />

          <FacilityMarkerLayer
            searchResults={searchResults}
            facilities={facilities}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            onToggleShared={handleToggleShared}
            registeringIds={registeringIds}
            unregisteringIds={unregisteringIds}
          />

          {/* 手動登録用の仮マーカー */}
          {clickedPosition && (
            <Marker
              position={[clickedPosition.lat, clickedPosition.lng]}
              icon={TempMarkerIcon}
              ref={(ref) => {
                if (ref) {
                  queueMicrotask(() => ref.openPopup());
                }
              }}
            >
              <Popup
                closeButton={true}
                closeOnClick={false}
                eventHandlers={{
                  remove: () => setClickedPosition(null),
                }}
              >
                <div className="min-w-[240px]">
                  <div className="mb-2 font-bold">施設を手動登録</div>
                  <div className="mb-2">
                    <label className="mb-1 block text-xs text-solid-gray-600">
                      施設名
                    </label>
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="施設名を入力"
                      className={`
                        w-full rounded border border-solid-gray-300 px-2 py-1
                        text-sm
                        focus:border-blue-500 focus:outline-none
                      `}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="mb-1 block text-xs text-solid-gray-600">
                      カテゴリ
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {FACILITY_CATEGORY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setManualCategory(opt.id)}
                          title={opt.label}
                          className={`
                            rounded p-1 text-center text-base transition-colors
                            ${
                              manualCategory === opt.id
                                ? 'bg-blue-100 ring-2 ring-blue-500'
                                : `
                                  bg-solid-gray-50
                                  hover:bg-solid-gray-100
                                `
                            }
                          `}
                        >
                          {opt.emoji}
                        </button>
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-solid-gray-500">
                      {getFacilityCategoryLabel(manualCategory)}
                    </p>
                  </div>
                  <div
                    className="flex gap-2"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={handleManualRegister}
                      disabled={!manualName.trim() || isManualRegistering}
                      className={`
                        flex-1 rounded bg-green-600 px-3 py-1.5 text-xs
                        font-medium text-white transition-colors
                        hover:bg-green-700
                        disabled:opacity-50
                      `}
                    >
                      {isManualRegistering ? '登録中...' : '登録'}
                    </button>
                    <button
                      onClick={() => setClickedPosition(null)}
                      className={`
                        flex-1 rounded bg-solid-gray-200 px-3 py-1.5 text-xs
                        font-medium text-solid-gray-700 transition-colors
                        hover:bg-solid-gray-300
                      `}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          <SearchButton onSearch={handleSearch} isSearching={isSearching} />
        </MapContainer>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-4 text-xs text-solid-gray-600">
        <div className="flex items-center gap-1">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: '#7c3aed' }}
          />
          未登録施設
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: '#16a34a' }}
          />
          登録済み施設
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: '#f59e0b' }}
          />
          手動登録（クリック）
        </div>
      </div>
    </div>
  );
};

export default FacilityMap;
