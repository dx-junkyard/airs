'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSetAtom } from 'jotai';
import Button from '@/components/ui/Button/Button';
import { FormField } from '@/components/ui/FormField/FormField';
import { BotMessage } from '@/features/ai-report/components/BotMessage';
import {
  selectedLocationAtom,
  currentStepAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import { BOT_MESSAGES } from '@/features/ai-report/types';
import useReverseGeocode from '@/hooks/mutations/useReverseGeocode';

// EditableLocationMapを動的インポート（SSR無効）
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

// デフォルト位置（東京）
const DEFAULT_LATITUDE = 35.6762;
const DEFAULT_LONGITUDE = 139.6503;

interface LocationStepProps {
  geofencePrefix?: string;
}

/**
 * Step3: 位置選択ステップ
 */
export const LocationStep = ({ geofencePrefix = '' }: LocationStepProps) => {
  const [latitude, setLatitude] = useState(DEFAULT_LATITUDE);
  const [longitude, setLongitude] = useState(DEFAULT_LONGITUDE);
  const [address, setAddress] = useState('');
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

  const setSelectedLocation = useSetAtom(selectedLocationAtom);
  const setCurrentStep = useSetAtom(currentStepAtom);

  const { mutate: fetchAddress, isPending } = useReverseGeocode({
    onSuccess: (result) => {
      setAddress(result.address);
      setNormalizedAddress(result.normalizedAddress ?? null);
      setError(null);
    },
    onError: () => {
      setError('住所の取得に失敗しました。もう一度お試しください。');
      setNormalizedAddress(null);
    },
    onGeofenceError: (_result, prefix) => {
      setError(`取得された住所が対象地域（${prefix}）と一致しません。`);
    },
  });

  const handleLocationChange = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    setError(null);
    setNormalizedAddress(null);
    fetchAddress({ latitude: lat, longitude: lng });
  };

  useEffect(() => {
    fetchAddress({
      latitude: DEFAULT_LATITUDE,
      longitude: DEFAULT_LONGITUDE,
    });
  }, [fetchAddress]);

  // リアルタイムのジオフェンスエラー判定
  const geofenceError =
    geofencePrefix && address.trim() && !address.trim().startsWith(geofencePrefix)
      ? `入力された住所が対象地域（${geofencePrefix}）と一致しません。`
      : null;

  const handleNext = () => {
    if (!address.trim()) {
      setError('地図で位置を選択して住所を取得してください');
      return;
    }

    if (geofenceError) {
      setError(geofenceError);
      return;
    }

      setSelectedLocation({
        latitude,
        longitude,
        address: address.trim(),
        normalizedAddress: normalizedAddress ?? undefined,
      });
    setCurrentStep('confirm');
  };

  const handleBack = () => {
    setCurrentStep('photo');
  };

  return (
    <div className="space-y-6">
      <BotMessage message={BOT_MESSAGES['location']} />

      {/* 地図 */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-solid-gray-700">
          地図で位置を選択
        </label>
        <p className="text-xs text-solid-gray-500">
          地図をクリックするか、マーカーをドラッグして位置を指定してください
        </p>
        <LocationMap
          latitude={latitude}
          longitude={longitude}
          label="被害発生場所"
          height="300px"
          zoom={13}
          editable={true}
          onLocationChange={handleLocationChange}
        />
        <div className="flex gap-4 text-sm text-solid-gray-600">
          <span>緯度: {latitude.toFixed(6)}</span>
          <span>経度: {longitude.toFixed(6)}</span>
        </div>
      </div>

      {/* 住所入力 */}
      <FormField
        id="address"
        label="住所"
        type="input"
        inputType="text"
        value={address}
        onChange={() => undefined}
        placeholder="地図のピン位置から自動取得されます"
        error={geofenceError || error || undefined}
        required
        supportText="住所は地図のピン位置から自動取得されます。手動編集はできません。"
        disabled={isPending}
        readOnly
      />

      {/* ナビゲーションボタン */}
      <div className="flex justify-between gap-3">
        <Button size="md" variant="outline" onClick={handleBack}>
          戻る
        </Button>
        <Button
          size="md"
          variant="solid-fill"
          onClick={handleNext}
          aria-disabled={isPending}
        >
          次へ
        </Button>
      </div>
    </div>
  );
};
