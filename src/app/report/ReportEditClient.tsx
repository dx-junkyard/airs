'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Button from '@/components/ui/Button/Button';
import { Card } from '@/components/ui/Card/Card';
import Dialog from '@/components/ui/Dialog/Dialog';
import DialogBody from '@/components/ui/Dialog/DialogBody';
import Divider from '@/components/ui/Divider/Divider';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import ErrorText from '@/components/ui/ErrorText/ErrorText';
import { FormField } from '@/components/ui/FormField/FormField';
import ImageUploader from '@/components/ui/ImageUploader/ImageUploader';
import Label from '@/components/ui/Label/Label';
import Select from '@/components/ui/Select/Select';
import {
  uploadReportImage,
  deleteReport,
  updateReport,
} from '@/features/report/actions';
import {
  animalTypeAtom,
  latitudeAtom,
  longitudeAtom,
  addressAtom,
  imageUrlsAtom,
  imagesAtom,
  descriptionAtom,
  geofenceErrorAtom,
  initFormFromReportAtom,
  resetFormAtom,
} from '@/features/report/atoms/reportEditAtoms';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { rules, validateField } from '@/hooks/forms/core/validation';
import {
  VALID_ANIMAL_TYPES,
  getAnimalTypeLabel,
  type AnimalTypeConfig,
} from '@/server/domain/constants/animalTypes';
import useReverseGeocode from '@/hooks/mutations/useReverseGeocode';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/server/infrastructure/cache/query-keys';
import {
  showSuccessToast,
  showErrorToast,
} from '@/features/common/notifications/toast';

// LocationMapを動的インポート（SSR無効）
const LocationMap = dynamic(
  () => import('@/components/ui/LocationMap/LocationMap'),
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

interface ReportEditClientProps {
  report: ReportDto;
  token: string;
  enabledAnimalTypes: AnimalTypeConfig[];
}

export default function ReportEditClient({
  report,
  token,
  enabledAnimalTypes,
}: ReportEditClientProps) {
  const router = useRouter();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Jotai atomsをSSRデータで初期化
  const initFormFromReport = useSetAtom(initFormFromReportAtom);
  const resetForm = useSetAtom(resetFormAtom);

  useEffect(() => {
    initFormFromReport(report);
    return () => {
      resetForm();
    };
  }, [report, initFormFromReport, resetForm]);

  // フォームフィールドatoms
  const [animalType, setAnimalType] = useAtom(animalTypeAtom);
  const [latitude, setLatitude] = useAtom(latitudeAtom);
  const [longitude, setLongitude] = useAtom(longitudeAtom);
  const [address, setAddress] = useAtom(addressAtom);
  const [imageUrls, setImageUrls] = useAtom(imageUrlsAtom);
  const images = useAtomValue(imagesAtom);
  const [description, setDescription] = useAtom(descriptionAtom);
  const [geofenceError, setGeofenceError] = useAtom(geofenceErrorAtom);

  // 編集用の獣種オプション: 有効な獣種 + 現在のレポートの獣種
  const animalTypeOptions = useMemo(() => {
    const currentType = report.animalType;
    if (enabledAnimalTypes.some((t) => t.id === currentType)) {
      return enabledAnimalTypes;
    }
    // 現在の獣種が有効リストにない場合は末尾に追加（無効であることを明示）
    return [
      ...enabledAnimalTypes,
      {
        id: currentType,
        label: `${getAnimalTypeLabel(currentType)}（無効）`,
        emoji: '',
        color: '#6B7280',
        category: 'other' as const,
      },
    ];
  }, [enabledAnimalTypes, report.animalType]);

  // リバースジオコーディング（ジオフェンスチェック付き）
  const reverseGeocodeMutation = useReverseGeocode({
    onSuccess: (result) => {
      setAddress(result.address);
      setGeofenceError(null);
    },
    onGeofenceError: (_result, prefix) => {
      setGeofenceError(`取得された住所が対象地域（${prefix}）と一致しません。`);
    },
  });

  // ピン移動時の処理
  const handleLocationChange = (newLat: number, newLng: number) => {
    setLatitude(newLat.toFixed(6));
    setLongitude(newLng.toFixed(6));
    reverseGeocodeMutation.mutate({
      latitude: newLat,
      longitude: newLng,
    });
  };

  // Mutation hooks
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await updateReport(report.id, formData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.all,
      });
      showSuccessToast('通報を更新しました');
    },
    onError: (error: Error) => {
      showErrorToast(
        error.message || '更新に失敗しました。もう一度お試しください。'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await deleteReport(id, token);
    },
    onSuccess: (_data, id) => {
      queryClient.removeQueries({
        queryKey: queryKeys.reports.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.reports.lists(),
      });
      showSuccessToast('通報を削除しました');
      router.push('/');
    },
    onError: (error: Error) => {
      showErrorToast(
        error.message || '削除に失敗しました。もう一度お試しください。'
      );
    },
  });

  // バリデーション
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const animalTypeError = validateField(animalType, [
      rules.required('獣種は必須です'),
      rules.custom(
        (value) => VALID_ANIMAL_TYPES.includes(value as any),
        '有効な獣種を選択してください'
      ),
    ]);
    if (animalTypeError) newErrors.animalType = animalTypeError;

    const addressError = validateField(address, [
      rules.required('住所は必須です'),
    ]);
    if (addressError) newErrors.address = addressError;

    const latError = validateField(latitude, [
      rules.required('緯度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -90 && num <= 90;
      }, '緯度は-90から90の範囲で入力してください'),
    ]);
    if (latError) newErrors.latitude = latError;

    const lngError = validateField(longitude, [
      rules.required('経度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -180 && num <= 180;
      }, '経度は-180から180の範囲で入力してください'),
    ]);
    if (lngError) newErrors.longitude = lngError;

    if (imageUrls.length > 0) {
      const invalidUrl = imageUrls.find((url) => !/^https?:\/\/.+$/.test(url));
      if (invalidUrl) {
        newErrors.imageUrls = '無効なURLが含まれています';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (geofenceError) return;

    const formDataObj = new FormData();
    formDataObj.append('animalType', animalType);
    formDataObj.append('address', address);
    formDataObj.append('latitude', latitude);
    formDataObj.append('longitude', longitude);
    formDataObj.append('images', JSON.stringify(images));
    if (description) formDataObj.append('description', description);

    updateMutation.mutate(formDataObj, {
      onSuccess: () => {
        setErrors({});
        router.push('/');
      },
      onError: () => {
        setErrors({ submit: '保存に失敗しました。もう一度お試しください。' });
      },
    });
  };

  // 削除処理
  const handleDelete = () => {
    deleteMutation.mutate(report.id, {
      onSettled: () => {
        deleteDialogRef.current?.close();
      },
    });
  };

  // 有効な座標かどうか
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="space-y-6">
      <ErrorAlert message={errors.submit} />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 基本情報 */}
        <Card title="基本情報" padding="lg">
          <p className="mb-6 text-sm text-solid-gray-600">
            通報の基本情報を修正してください。
          </p>
          <div className="space-y-6">
            <div>
              <label
                htmlFor="animalType"
                className="mb-1 block text-sm font-medium text-solid-gray-800"
              >
                獣種<span className="text-error-1">*</span>
              </label>
              <p className="mb-2 text-sm text-solid-gray-600">
                目撃した動物の種類を選択してください
              </p>
              <Select
                id="animalType"
                name="animalType"
                value={animalType}
                onChange={(e) => setAnimalType(e.target.value)}
                isError={!!errors.animalType}
              >
                <option value="">選択してください</option>
                {animalTypeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </Select>
              {errors.animalType && (
                <ErrorText className="mt-1">{errors.animalType}</ErrorText>
              )}
            </div>
          </div>
        </Card>

        <Divider />

        {/* 位置情報 */}
        <Card title="位置情報" padding="lg">
          <p className="mb-4 text-sm text-solid-gray-600">
            地図をクリックまたはマーカーをドラッグして位置を修正してください。住所は自動で更新されます。
          </p>
          {hasValidCoords && (
            <LocationMap
              latitude={lat}
              longitude={lng}
              label="選択位置"
              height="400px"
              editable
              showCoordinates
              onLocationChange={handleLocationChange}
            />
          )}
          <div className="mt-4">
            <FormField
              id="address"
              label="住所"
              type="input"
              inputType="text"
              value={
                reverseGeocodeMutation.isPending ? '住所を取得中...' : address
              }
              onChange={() => undefined}
              placeholder="地図のピンを移動すると自動で取得されます"
              required
              supportText="住所は地図のピン位置から自動取得されます。手動編集はできません。"
              error={geofenceError ?? errors.address}
              disabled={reverseGeocodeMutation.isPending}
              readOnly
            />
          </div>
        </Card>

        <Divider />

        {/* 詳細情報 */}
        <Card title="詳細情報" padding="lg">
          <p className="mb-6 text-sm text-solid-gray-600">
            画像や説明を修正してください。
          </p>
          <div className="space-y-6">
            {/* 画像アップロード */}
            <div>
              <Label className="mb-2 block">
                画像 <span className="text-solid-gray-600">(任意)</span>
              </Label>
              <ImageUploader
                imageUrls={imageUrls}
                onImagesChange={(urls) => setImageUrls(urls)}
                onUpload={async (file) => {
                  const formDataObj = new FormData();
                  formDataObj.append('image', file);
                  const result = await uploadReportImage(formDataObj);
                  return result.success ? (result.url ?? null) : null;
                }}
                maxImages={10}
                error={errors.imageUrls}
              />
            </div>

            {/* 説明 */}
            <FormField
              id="description"
              label="説明"
              type="textarea"
              value={description}
              onChange={setDescription}
              placeholder="動物の目撃状況や被害状況などを詳しく入力してください"
              rows={6}
              optional
              supportText="できるだけ具体的に状況を説明してください"
              error={errors.description}
            />
          </div>
        </Card>

        <Divider />

        {/* アクションボタン */}
        <div className="flex items-center justify-between">
          <Button
            size="md"
            variant="text"
            type="button"
            onClick={() => deleteDialogRef.current?.showModal()}
            className={`
              text-red-600
              hover:bg-red-50
            `}
          >
            この通報を削除
          </Button>
          <div className="flex gap-4">
            <Button
              size="md"
              variant="outline"
              type="button"
              onClick={() => router.push('/')}
            >
              キャンセル
            </Button>
            <Button
              size="md"
              variant="solid-fill"
              type="submit"
              disabled={
                updateMutation.isPending ||
                !!geofenceError ||
                reverseGeocodeMutation.isPending
              }
              aria-disabled={
                updateMutation.isPending ||
                !!geofenceError ||
                reverseGeocodeMutation.isPending
              }
            >
              {updateMutation.isPending ? '保存中...' : '保存する'}
            </Button>
          </div>
        </div>
      </form>

      {/* 削除確認ダイアログ */}
      <Dialog ref={deleteDialogRef}>
        <DialogBody>
          <h3 className="mb-4 text-lg font-semibold text-blue-900">
            通報を削除しますか？
          </h3>
          <p className="mb-6 text-solid-gray-700">
            この操作は取り消せません。本当に削除してもよろしいですか？
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="md"
              variant="outline"
              onClick={() => deleteDialogRef.current?.close()}
              disabled={deleteMutation.isPending}
            >
              キャンセル
            </Button>
            <Button
              size="md"
              variant="solid-fill"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className={`
                bg-red-600
                hover:bg-red-700
              `}
            >
              {deleteMutation.isPending ? '削除中...' : '削除する'}
            </Button>
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
}
