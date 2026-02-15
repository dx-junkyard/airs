'use client';

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';
import { MapFullscreenControl } from '@/features/map/extensions/MapFullscreenControl';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button/Button';
import {
  getStaffLocations,
  createStaffLocation,
  deleteStaffLocation,
} from '@/features/staff/actions';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  MAP_MAX_ZOOM,
  MAP_DEFAULT_ZOOM,
  MAP_DEFAULT_CENTER,
} from '@/constants/map';
import SharedFacilityLayer from '@/features/map/extensions/SharedFacilityLayer';

// 保存済みピン用のカスタムアイコン（青）
const StaffPinIcon = L.divIcon({
  className: 'staff-location-pin',
  html: `<div style="
    width: 28px;
    height: 28px;
    background-color: #2563eb;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// 未保存ピン用のカスタムアイコン（オレンジ）
const UnsavedPinIcon = L.divIcon({
  className: 'staff-location-pin-unsaved',
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
  "><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

// 削除予定ピン用のカスタムアイコン（赤・半透明）
const PendingDeletePinIcon = L.divIcon({
  className: 'staff-location-pin-pending-delete',
  html: `<div style="
    width: 28px;
    height: 28px;
    background-color: #ef4444;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
  "><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

interface PendingAdd {
  tempId: string;
  latitude: number;
  longitude: number;
}

export interface StaffLocationMapHandle {
  saveChanges: () => Promise<void>;
  resetChanges: () => void;
}

/**
 * 地図クリックで新しいピンを追加するハンドラ
 */
function MapClickHandler({
  onAddPin,
}: {
  onAddPin: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onAddPin(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface StaffLocationMapProps {
  staffId: string;
  editable: boolean;
  /** SSRで取得済みのピンデータ */
  initialLocations?: StaffLocationDto[];
}

/**
 * StaffLocationMap
 *
 * 職員の担当地域ピンを地図上で管理するコンポーネント。
 * editable=true の場合、地図クリックでピンを追加、ピンのポップアップから削除が可能。
 * ピンの追加・削除はローカル状態で管理し、saveChanges()でまとめてDBへ反映する。
 */
const StaffLocationMap = forwardRef<
  StaffLocationMapHandle,
  StaffLocationMapProps
>(function StaffLocationMap({ staffId, editable, initialLocations }, ref) {
  const iconInitialized = useRef(false);
  const queryClient = useQueryClient();

  // ドラフト状態
  const [pendingAdds, setPendingAdds] = useState<PendingAdd[]>([]);
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(
    () => new Set()
  );

  useEffect(() => {
    if (!iconInitialized.current) {
      iconInitialized.current = true;
    }
  }, []);

  // 担当地域ピン一覧を取得（SSRデータがあればinitialDataとして使用）
  const { data: locations = [], refetch } = useQuery({
    queryKey: queryKeys.staffLocations.byStaff(staffId),
    queryFn: () => getStaffLocations(staffId),
    initialData: initialLocations,
  });

  // 親に公開するメソッド
  useImperativeHandle(ref, () => ({
    async saveChanges() {
      // 追加予定のピンを一括作成
      const createPromises = pendingAdds.map((pin) =>
        createStaffLocation({
          staffId,
          latitude: pin.latitude,
          longitude: pin.longitude,
          label: null,
        })
      );

      // 削除予定のピンを一括削除
      const deletePromises = Array.from(pendingDeletes).map((id) =>
        deleteStaffLocation(id, staffId)
      );

      await Promise.all([...createPromises, ...deletePromises]);

      // ドラフトをクリア
      setPendingAdds([]);
      setPendingDeletes(new Set());

      // データを再取得
      await refetch();
      queryClient.invalidateQueries({
        queryKey: queryKeys.staffLocations.byStaff(staffId),
      });
    },
    resetChanges() {
      setPendingAdds([]);
      setPendingDeletes(new Set());
    },
  }));

  // ピン追加（ローカル）
  const handleAddPin = useCallback(
    (lat: number, lng: number) => {
      if (!editable) return;
      setPendingAdds((prev) => [
        ...prev,
        {
          tempId: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          latitude: lat,
          longitude: lng,
        },
      ]);
    },
    [editable]
  );

  // 未保存ピン削除（ローカル）
  const handleRemovePendingAdd = useCallback((tempId: string) => {
    setPendingAdds((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  // 既存ピンを削除予定にマーク
  const handleMarkForDelete = useCallback((id: string) => {
    setPendingDeletes((prev) => new Set(prev).add(id));
  }, []);

  // 削除予定を取り消し
  const handleUnmarkDelete = useCallback((id: string) => {
    setPendingDeletes((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // 表示するピン: 既存ピン（削除予定含む、見た目は変える） + 追加予定ピン
  const visibleLocations = locations;

  // 地図の初期中心: ピンがあれば最初のピン、なければデフォルト
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : MAP_DEFAULT_CENTER;

  const totalPinCount =
    locations.filter((loc) => !pendingDeletes.has(loc.id)).length +
    pendingAdds.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-blue-900">担当地域</h2>
        {editable && (
          <span className="text-sm text-solid-gray-500">
            地図をクリックしてピンを追加
          </span>
        )}
      </div>
      <p className="text-sm text-solid-gray-600">
        通報が届いた際、最も近いピンを持つ職員が自動的に担当者として割り当てられます。
      </p>
      <div
        style={{ height: '400px', width: '100%' }}
        className="relative isolate overflow-hidden rounded-lg"
      >
        <MapContainer
          center={center}
          zoom={MAP_DEFAULT_ZOOM}
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

          {editable && <MapClickHandler onAddPin={handleAddPin} />}

          {/* 共有施設レイヤー */}
          <SharedFacilityLayer />

          {/* 既存ピン */}
          {visibleLocations.map((loc: StaffLocationDto) => {
            const isMarkedForDelete = pendingDeletes.has(loc.id);
            return (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={isMarkedForDelete ? PendingDeletePinIcon : StaffPinIcon}
              >
                <Popup>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">緯度:</span>{' '}
                      {loc.latitude.toFixed(6)}
                    </div>
                    <div>
                      <span className="font-medium">経度:</span>{' '}
                      {loc.longitude.toFixed(6)}
                    </div>
                    {loc.label && (
                      <div>
                        <span className="font-medium">ラベル:</span>{' '}
                        {loc.label}
                      </div>
                    )}
                    {isMarkedForDelete && (
                      <div className="font-medium text-red-600">
                        削除予定（未保存）
                      </div>
                    )}
                    {editable && !isMarkedForDelete && (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkForDelete(loc.id);
                        }}
                        className={`
                          text-red-600
                          hover:bg-red-50
                        `}
                      >
                        このピンを削除
                      </Button>
                    )}
                    {editable && isMarkedForDelete && (
                      <Button
                        size="sm"
                        variant="text"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnmarkDelete(loc.id);
                        }}
                        className={`
                          text-blue-600
                          hover:bg-blue-50
                        `}
                      >
                        削除を取り消し
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 追加予定ピン（未保存） */}
          {pendingAdds.map((pin) => (
            <Marker
              key={pin.tempId}
              position={[pin.latitude, pin.longitude]}
              icon={UnsavedPinIcon}
            >
              <Popup>
                <div className="space-y-2 text-sm">
                  <div className="font-medium text-amber-600">
                    未保存
                  </div>
                  <div>
                    <span className="font-medium">緯度:</span>{' '}
                    {pin.latitude.toFixed(6)}
                  </div>
                  <div>
                    <span className="font-medium">経度:</span>{' '}
                    {pin.longitude.toFixed(6)}
                  </div>
                  {editable && (
                    <Button
                      size="sm"
                      variant="text"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePendingAdd(pin.tempId);
                      }}
                      className={`
                        text-red-600
                        hover:bg-red-50
                      `}
                    >
                      このピンを取り消し
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      {totalPinCount > 0 && (
        <p className="text-sm text-solid-gray-500">
          {totalPinCount}件の担当地域ピンが設定されています
          {(pendingAdds.length > 0 || pendingDeletes.size > 0) && (
            <span className="ml-1 text-amber-600">
              （未保存の変更があります）
            </span>
          )}
        </p>
      )}
      {totalPinCount === 0 && !editable && (
        <p className="text-sm text-solid-gray-500">
          担当地域ピンが設定されていません
        </p>
      )}
    </div>
  );
});

export default StaffLocationMap;
