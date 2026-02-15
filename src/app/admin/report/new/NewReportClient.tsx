'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card/Card';
import Divider from '@/components/ui/Divider/Divider';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import { FormActions } from '@/components/ui/FormActions/FormActions';
import { FormField } from '@/components/ui/FormField/FormField';
import ImageUploader from '@/components/ui/ImageUploader/ImageUploader';
import Label from '@/components/ui/Label/Label';
import RequirementBadge from '@/components/ui/RequirementBadge/RequirementBadge';
import Select from '@/components/ui/Select/Select';
import {
  reportFormAtoms,
  reportValidationRules,
  type ReportFormValues,
} from '@/features/report/forms/reportFormAtoms';
import { uploadReportImage } from '@/features/report/actions';
import useCreateReport from '@/hooks/mutations/useCreateReport';
import useJotaiForm from '@/hooks/forms/useJotaiForm';
import useJotaiFormField from '@/hooks/forms/useJotaiFormField';
import useReverseGeocode from '@/hooks/mutations/useReverseGeocode';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';

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

// フィールドコンポーネント（再レンダリング最適化）
function AnimalTypeField({
  enabledAnimalTypes,
}: {
  enabledAnimalTypes: AnimalTypeConfig[];
}) {
  const { value, error, onChange } = useJotaiFormField<string>({
    fieldAtoms: reportFormAtoms.fields.animalType,
    rules: reportValidationRules.animalType,
    defaultValue: reportFormAtoms.initialValues.animalType,
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <Label htmlFor="animalType" className="mb-1 block">
        獣種 <RequirementBadge>必須</RequirementBadge>
      </Label>
      <p className="mb-2 text-sm text-solid-gray-600">
        目撃した動物の種類を選択してください
      </p>
      <Select
        id="animalType"
        name="animalType"
        value={value}
        onChange={handleChange}
        isError={!!error}
      >
        <option value="">選択してください</option>
        {enabledAnimalTypes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </Select>
      {error && <p className="mt-1 text-sm text-error-1">{error}</p>}
    </div>
  );
}

function PhoneNumberField() {
  const { value, onChange } = useJotaiFormField<string>({
    fieldAtoms: reportFormAtoms.fields.phoneNumber,
    rules: reportValidationRules.phoneNumber,
    defaultValue: reportFormAtoms.initialValues.phoneNumber,
  });

  return (
    <FormField
      id="phoneNumber"
      label="電話番号"
      type="input"
      inputType="tel"
      value={value}
      onChange={onChange}
      placeholder="090-1234-5678"
      optional
      supportText="緊急時の連絡先として使用します"
    />
  );
}

function DescriptionField() {
  const { value, error, onChange } = useJotaiFormField<string>({
    fieldAtoms: reportFormAtoms.fields.description,
    rules: reportValidationRules.description,
    defaultValue: reportFormAtoms.initialValues.description,
  });

  return (
    <FormField
      id="description"
      label="説明"
      type="textarea"
      value={value}
      onChange={onChange}
      placeholder="動物の目撃状況や被害状況などを詳しく入力してください"
      rows={6}
      required
      supportText="できるだけ具体的に状況を説明してください"
      error={error ?? undefined}
    />
  );
}

interface LocationMapFieldProps {
  onLocationChange?: (lat: number, lng: number) => void;
  defaultCenter: { latitude: number; longitude: number };
}

function LocationMapField({
  onLocationChange,
  defaultCenter,
}: LocationMapFieldProps) {
  const { value: latitude, onChange: onLatChange } = useJotaiFormField<string>({
    fieldAtoms: reportFormAtoms.fields.latitude,
    rules: reportValidationRules.latitude,
    defaultValue: reportFormAtoms.initialValues.latitude,
  });

  const { value: longitude, onChange: onLngChange } =
    useJotaiFormField<string>({
      fieldAtoms: reportFormAtoms.fields.longitude,
      rules: reportValidationRules.longitude,
      defaultValue: reportFormAtoms.initialValues.longitude,
    });

  const handleLocationChange = (lat: number, lng: number) => {
    onLatChange(lat.toFixed(6));
    onLngChange(lng.toFixed(6));
    onLocationChange?.(lat, lng);
  };

  // 有効な座標かどうかを判定
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasValidCoords = !isNaN(lat) && !isNaN(lng);

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1 block">
          地図から選択 <RequirementBadge>必須</RequirementBadge>
        </Label>
        <p className="mb-2 text-sm text-solid-gray-600">
          地図をクリックまたはマーカーをドラッグして位置を選択できます
        </p>
      </div>
      <LocationMap
        latitude={hasValidCoords ? lat : defaultCenter.latitude}
        longitude={hasValidCoords ? lng : defaultCenter.longitude}
        label="目撃位置"
        height="300px"
        editable
        onLocationChange={handleLocationChange}
        showCoordinates
      />
    </div>
  );
}

interface NewReportClientProps {
  enabledAnimalTypes: AnimalTypeConfig[];
  defaultCenter: { latitude: number; longitude: number };
}

export default function NewReportClient({
  enabledAnimalTypes,
  defaultCenter,
}: NewReportClientProps) {
  const {
    mutate: createReportMutation,
    isPending,
    isError,
    error,
  } = useCreateReport();

  const { errors, isValid, validateAll, getFormData, values, setFieldValue } =
    useJotaiForm<ReportFormValues>(reportFormAtoms);

  // 画像アップロード状態
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  // ジオフェンスエラー状態
  const [geofenceError, setGeofenceError] = useState<string | null>(null);
  const [normalizedAddress, setNormalizedAddress] = useState<{
    address: string;
    value: {
      prefecture: string;
      city: string;
      oaza: string;
      aza: string;
      detail: string;
      full: string;
      areaKey: string;
      houseNumber?: string;
    };
  } | null>(null);

  // リバースジオコーディング（ジオフェンスチェック付き）
  const { mutate: fetchAddress, isPending: isAddressPending } =
    useReverseGeocode({
      onSuccess: (result) => {
        setFieldValue('address', result.address);
        if (result.normalizedAddress !== undefined) {
          setNormalizedAddress({
            address: result.address,
            value: result.normalizedAddress,
          });
        } else {
          setNormalizedAddress(null);
        }
        setGeofenceError(null);
      },
      onGeofenceError: (_result, prefix) => {
        setGeofenceError(
          `取得された住所が対象地域（${prefix}）と一致しません。`
        );
      },
    });

  // ピン移動時の処理
  const handleMapLocationChange = (lat: number, lng: number) => {
    setGeofenceError(null);
    setNormalizedAddress(null);
    fetchAddress({ latitude: lat, longitude: lng });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAll()) return;
    if (geofenceError) return;

    // 画像のバリデーション
    if (uploadedImageUrls.length === 0) {
      setImageError('画像を1つ以上アップロードしてください');
      return;
    }
    setImageError(null);

    // FormDataを構築し、imageUrlsの代わりにimages JSON配列を設定
    const formData = getFormData();
    formData.delete('imageUrls');
    const images = uploadedImageUrls.map((url) => ({ url, description: '' }));
    formData.append('images', JSON.stringify(images));
    if (normalizedAddress && values.address === normalizedAddress.address) {
      formData.append(
        'normalizedAddress',
        JSON.stringify(normalizedAddress.value)
      );
    }

    createReportMutation(formData);
  };

  // エラーメッセージ一覧（重複排除）
  const validationErrors = Array.from(
    new Set(
      [geofenceError, imageError, ...Object.values(errors)].filter(
        (msg): msg is string => !!msg
      )
    )
  );

  // 各セクションにエラーがあるかを判定
  const sectionHasError: Record<string, boolean> = {
    'basic-info': !!(errors.animalType || errors.phoneNumber),
    'location-info': !!(
      errors.latitude ||
      errors.longitude ||
      errors.address ||
      geofenceError
    ),
    'detail-info': !!(errors.description || imageError),
  };
  return (
    <div className="space-y-6">
      <ErrorAlert
        message={
          validationErrors.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5">
              {validationErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : isError ? (
            error?.message
          ) : undefined
        }
      />

      <nav aria-label="フォームセクション">
        <ol className="flex items-center justify-center gap-0">
          {[
            {
              id: 'basic-info',
              label: '基本情報',
              shortLabel: '基本',
              step: 1,
            },
            {
              id: 'location-info',
              label: '位置情報',
              shortLabel: '位置',
              step: 2,
            },
            {
              id: 'detail-info',
              label: '詳細情報',
              shortLabel: '詳細',
              step: 3,
            },
          ].map((section, index) => {
            const hasError = sectionHasError[section.id];
            return (
              <li key={section.id} className="flex items-center">
                <a
                  href={`#${section.id}`}
                  className={`
                    flex items-center gap-2 rounded-lg px-3 py-2 text-sm
                    font-medium transition-colors
                    ${
                      hasError
                        ? 'text-error-1'
                        : `
                          text-solid-gray-600
                          hover:text-blue-900
                        `
                    }
                  `}
                >
                  <span
                    className={`
                      flex size-7 shrink-0 items-center justify-center
                      rounded-full border-2 bg-white text-xs font-bold
                      ${
                        hasError
                          ? 'border-error-1 text-error-1'
                          : 'border-blue-900 text-blue-900'
                      }
                    `}
                  >
                    {section.step}
                  </span>
                  <span className="sm:hidden">{section.shortLabel}</span>
                  <span
                    className={`
                      hidden
                      sm:inline
                    `}
                  >
                    {section.label}
                  </span>
                </a>
                {index < 2 && (
                  <div
                    className={`
                      mx-1 h-0.5 w-8 bg-solid-gray-300
                      sm:w-12
                    `}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card
          title="基本情報"
          padding="lg"
          id="basic-info"
          className="scroll-mt-28"
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            通報の基本情報を入力してください。必須項目は必ず入力が必要です。
          </p>

          <div className="space-y-6">
            <AnimalTypeField enabledAnimalTypes={enabledAnimalTypes} />
            <PhoneNumberField />
          </div>
        </Card>

        <Divider />

        <Card
          title="位置情報"
          padding="lg"
          id="location-info"
          className="scroll-mt-28"
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            目撃場所の位置情報を入力してください。地図のピンを移動すると住所が自動入力されます。
          </p>

          <LocationMapField
            onLocationChange={handleMapLocationChange}
            defaultCenter={defaultCenter}
          />

          <div className="mt-4">
            <FormField
              id="address"
              label="住所"
              type="input"
              inputType="text"
              value={isAddressPending ? '住所を取得中...' : values.address}
              onChange={() => undefined}
              placeholder="地図のピンを移動すると自動で取得されます"
              required
              supportText="住所は地図のピン位置から自動取得されます。手動編集はできません。"
              error={geofenceError ?? errors.address ?? undefined}
              disabled={isAddressPending}
              readOnly
            />
          </div>
        </Card>

        <Divider />

        <Card
          title="詳細情報"
          padding="lg"
          id="detail-info"
          className="scroll-mt-28"
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            目撃状況や被害状況などの詳細を入力してください。
          </p>

          <div className="space-y-6">
            <div>
              <Label className="mb-1 block">
                画像 <RequirementBadge>必須</RequirementBadge>
              </Label>
              <p className="mb-2 text-sm text-solid-gray-600">
                クリックまたはドラッグ＆ドロップで画像をアップロードしてください（1つ以上必須）
              </p>
              <ImageUploader
                imageUrls={uploadedImageUrls}
                onImagesChange={(urls) => {
                  setUploadedImageUrls(urls);
                  if (urls.length > 0) {
                    setImageError(null);
                  }
                }}
                onUpload={async (file) => {
                  const formDataObj = new FormData();
                  formDataObj.append('image', file);
                  const result = await uploadReportImage(formDataObj);
                  return result.success ? (result.url ?? null) : null;
                }}
                maxImages={10}
                error={imageError ?? undefined}
              />
            </div>
            <DescriptionField />
          </div>
        </Card>

        <Divider />

        <FormActions
          submitLabel="作成する"
          cancelLabel="キャンセル"
          onCancel={() => window.history.back()}
          isSubmitting={isPending}
          submitDisabled={!isValid || !!geofenceError || isAddressPending}
        />
      </form>
    </div>
  );
}
