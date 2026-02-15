import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { FormField } from '@/components/ui/FormField/FormField';
import Button from '@/components/ui/Button/Button';
import type { LocationData } from '@/features/ai-report/types';
import useReverseGeocode from '@/hooks/mutations/useReverseGeocode';

// LocationMapを動的インポート（SSR無効）
const LocationMap = dynamic(
  () => import('@/components/ui/LocationMap/EditableLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div
        className={`
          flex h-[300px] items-center justify-center rounded-lg bg-solid-gray-50
        `}
      >
        <p className="text-solid-gray-600">地図を読み込み中...</p>
      </div>
    ),
  }
);

// デフォルト位置（東京駅）
const DEFAULT_LATITUDE = 35.6762;
const DEFAULT_LONGITUDE = 139.6503;

interface LocationInputProps {
  onSubmit: (location: LocationData) => void;
}

export const LocationInput: React.FC<LocationInputProps> = ({ onSubmit }) => {
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [address, setAddress] = useState('東京都千代田区丸の内1丁目');
  const [normalizedAddress, setNormalizedAddress] = useState<{
    prefecture: string;
    city: string;
    oaza: string;
    aza: string;
    detail: string;
    full: string;
    areaKey: string;
    houseNumber?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { mutate: fetchAddress, isPending } = useReverseGeocode({
    onSuccess: (result) => {
      setAddress(result.address);
      if (result.normalizedAddress !== undefined) {
        setNormalizedAddress(result.normalizedAddress);
      } else {
        setNormalizedAddress(null);
      }
      setError(null);
    },
    onError: (err) => {
      console.error('住所取得エラー:', err);
    },
    onGeofenceError: (_result, prefix) => {
      setError(`取得された住所が対象地域（${prefix}）と一致しません。`);
    },
  });

  const handleLocationChange = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      setError(null);

      // Mutationでリバースジオコーディング
      fetchAddress({ latitude: lat, longitude: lng });
    },
    [fetchAddress]
  );

  const handleSubmit = () => {
    if (!address.trim()) {
      setError('地図で位置を選択して住所を取得してください');
      return;
    }

    if (error) return;

    onSubmit({
      latitude,
      longitude,
      address: address.trim(),
      normalizedAddress: normalizedAddress ?? undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm text-solid-gray-700">
          {isPending
            ? '住所を取得中...'
            : '地図をクリックするか、ピンをドラッグして位置を選択してください'}
        </p>
        <div className="h-[300px] shrink-0">
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            onLocationChange={handleLocationChange}
            editable={!isPending}
            height="300px"
          />
        </div>
        <p className="mt-1 text-xs text-solid-gray-600">
          緯度: {latitude.toFixed(6)}, 経度: {longitude.toFixed(6)}
        </p>
      </div>
      <div>
        <FormField
          id="address"
          label="住所"
          type="input"
          value={address}
          onChange={() => undefined}
          error={error ?? undefined}
          placeholder="地図のピン位置から自動取得されます"
          required
          readOnly
        />
        <p className="mt-1 text-xs text-solid-gray-600">
          ※住所は地図で位置を選択すると自動入力されます（手動編集不可）
        </p>
      </div>
      <Button
        onClick={handleSubmit}
        size="lg"
        aria-disabled={!address.trim() || isPending || !!error}
      >
        {isPending ? '住所を取得中...' : '位置情報を送信'}
      </Button>
    </div>
  );
};

export default LocationInput;
