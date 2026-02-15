'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card/Card';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import { FormActions } from '@/components/ui/FormActions/FormActions';
import { FormField } from '@/components/ui/FormField/FormField';
import AnimalTypeSelector from '@/features/system-setting/components/AnimalTypeSelector';
import DataResetSection from '@/features/admin/components/DataResetSection';
import type { SystemSettingDto } from '@/server/application/dtos/SystemSettingDto';
import type { AdminPasswordInfo } from '@/server/domain/repositories/IAdminPasswordRepository';
import useUpdateSystemSetting from '@/hooks/mutations/useUpdateSystemSetting';
import { rules, validateField } from '@/hooks/forms/core/validation';
import { Z_HEADER } from '@/constants/z-index';
import {
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
  MAP_DEFAULT_DATA_RANGE_OPTIONS,
  isMapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';

const LocationMap = dynamic(
  () => import('@/components/ui/LocationMap/EditableLocationMap'),
  { ssr: false, loading: () => <div>地図を読み込み中...</div> }
);

interface SystemSettingClientProps {
  setting: SystemSettingDto;
  selectedStaffId: string | null;
  latestDataResetInfo?: AdminPasswordInfo;
}

/**
 * 獣種JSON文字列をstring[]にパースする。
 * 旧形式（{key, label}[]）と新形式（string[]）の両方に対応。
 */
function parseAnimalTypes(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: string | { key: string }) =>
      typeof item === 'string' ? item : item.key
    );
  } catch {
    return [];
  }
}

/** セクションナビゲーション定義 */
const SETTING_SECTIONS = [
  { id: 'geofencing', label: 'ジオフェンシング設定' },
  { id: 'clustering', label: 'クラスタリング設定' },
  { id: 'animal-types', label: '獣種設定' },
  { id: 'line', label: 'LINE通報設定' },
  { id: 'map', label: '通報設定' },
  { id: 'ai-questions', label: '分析AIおすすめ質問' },
  { id: 'ai-domain-knowledge', label: 'AI分析ドメイン知識' },
  { id: 'access-control', label: '機能制限' },
] as const;

/**
 * おすすめ質問JSON文字列をstring[]にパースする。
 */
function parseSuggestedQuestions(json: string | undefined): string[] {
  try {
    const parsed = JSON.parse(json ?? '[]');
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore
  }
  return [];
}

export default function SystemSettingClient({
  setting,
  selectedStaffId,
  latestDataResetInfo,
}: SystemSettingClientProps) {
  const router = useRouter();
  const updateMutation = useUpdateSystemSetting();

  // サーバー側の保存済み初期値
  const initialValues = useMemo(
    () => ({
      geofenceAddressPrefix: setting.value.geofenceAddressPrefix,
      eventClusteringTimeMinutes: String(
        setting.value.eventClusteringTimeMinutes
      ),
      eventClusteringRadiusMeters: String(
        setting.value.eventClusteringRadiusMeters
      ),
      selectedAnimalTypes: parseAnimalTypes(setting.value.animalTypesJson),
      lineSessionTimeoutHours: String(setting.value.lineSessionTimeoutHours),
      mapDefaultLatitude: String(setting.value.mapDefaultLatitude),
      mapDefaultLongitude: String(setting.value.mapDefaultLongitude),
      mapDefaultDataRange: isMapDefaultDataRangeValue(
        String(setting.value.mapDefaultDataRange)
      )
        ? setting.value.mapDefaultDataRange
        : DEFAULT_MAP_DEFAULT_DATA_RANGE,
      defaultDisplayEndDate: setting.value.defaultDisplayEndDate ?? '',
      suggestedQuestions: parseSuggestedQuestions(
        setting.value.suggestedQuestionsJson
      ),
      domainKnowledgeText: setting.value.domainKnowledgeText ?? '',
    }),
    [setting]
  );

  // フォーム状態
  const [geofenceAddressPrefix, setGeofenceAddressPrefix] = useState(
    initialValues.geofenceAddressPrefix
  );
  const [eventClusteringTimeMinutes, setEventClusteringTimeMinutes] = useState(
    initialValues.eventClusteringTimeMinutes
  );
  const [eventClusteringRadiusMeters, setEventClusteringRadiusMeters] =
    useState(initialValues.eventClusteringRadiusMeters);
  const [selectedAnimalTypes, setSelectedAnimalTypes] = useState<string[]>(
    initialValues.selectedAnimalTypes
  );
  const [lineSessionTimeoutHours, setLineSessionTimeoutHours] = useState(
    initialValues.lineSessionTimeoutHours
  );
  const [mapDefaultLatitude, setMapDefaultLatitude] = useState(
    initialValues.mapDefaultLatitude
  );
  const [mapDefaultLongitude, setMapDefaultLongitude] = useState(
    initialValues.mapDefaultLongitude
  );
  const [mapDefaultDataRange, setMapDefaultDataRange] = useState(
    initialValues.mapDefaultDataRange
  );
  const [defaultDisplayEndDate, setDefaultDisplayEndDate] = useState(
    initialValues.defaultDisplayEndDate
  );
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>(
    initialValues.suggestedQuestions
  );
  const [domainKnowledgeText, setDomainKnowledgeText] = useState(
    initialValues.domainKnowledgeText
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // セクションごとの変更状態を追跡
  const sectionDirtyMap: Record<string, boolean> = useMemo(
    () => ({
      geofencing: geofenceAddressPrefix !== initialValues.geofenceAddressPrefix,
      clustering:
        eventClusteringTimeMinutes !==
          initialValues.eventClusteringTimeMinutes ||
        eventClusteringRadiusMeters !==
          initialValues.eventClusteringRadiusMeters,
      'animal-types':
        JSON.stringify(selectedAnimalTypes) !==
        JSON.stringify(initialValues.selectedAnimalTypes),
      line: lineSessionTimeoutHours !== initialValues.lineSessionTimeoutHours,
      map:
        mapDefaultLatitude !== initialValues.mapDefaultLatitude ||
        mapDefaultLongitude !== initialValues.mapDefaultLongitude ||
        mapDefaultDataRange !== initialValues.mapDefaultDataRange ||
        defaultDisplayEndDate !== initialValues.defaultDisplayEndDate,
      'ai-questions':
        JSON.stringify(suggestedQuestions) !==
        JSON.stringify(initialValues.suggestedQuestions),
      'ai-domain-knowledge':
        domainKnowledgeText !== initialValues.domainKnowledgeText,
    }),
    [
      geofenceAddressPrefix,
      eventClusteringTimeMinutes,
      eventClusteringRadiusMeters,
      selectedAnimalTypes,
      lineSessionTimeoutHours,
      mapDefaultLatitude,
      mapDefaultLongitude,
      mapDefaultDataRange,
      defaultDisplayEndDate,
      suggestedQuestions,
      domainKnowledgeText,
      initialValues,
    ]
  );

  // フォーム全体が変更されたかどうか
  const isDirty = Object.values(sectionDirtyMap).some(Boolean);

  // 変更を元に戻す
  const handleReset = useCallback(() => {
    setGeofenceAddressPrefix(initialValues.geofenceAddressPrefix);
    setEventClusteringTimeMinutes(initialValues.eventClusteringTimeMinutes);
    setEventClusteringRadiusMeters(initialValues.eventClusteringRadiusMeters);
    setSelectedAnimalTypes(initialValues.selectedAnimalTypes);
    setLineSessionTimeoutHours(initialValues.lineSessionTimeoutHours);
    setMapDefaultLatitude(initialValues.mapDefaultLatitude);
    setMapDefaultLongitude(initialValues.mapDefaultLongitude);
    setMapDefaultDataRange(initialValues.mapDefaultDataRange);
    setDefaultDisplayEndDate(initialValues.defaultDisplayEndDate);
    setSuggestedQuestions(initialValues.suggestedQuestions);
    setDomainKnowledgeText(initialValues.domainKnowledgeText);
    setErrors({});
  }, [initialValues]);

  // バリデーション
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const timeError = validateField(eventClusteringTimeMinutes, [
      rules.required('グループ化の時間は必須です'),
      rules.custom(
        (v) => Number(v) >= 1,
        'グループ化の時間は1分以上で設定してください'
      ),
    ]);
    if (timeError) newErrors.eventClusteringTimeMinutes = timeError;

    const radiusError = validateField(eventClusteringRadiusMeters, [
      rules.required('グループ化の半径は必須です'),
      rules.custom(
        (v) => Number(v) >= 1,
        'グループ化の半径は1m以上で設定してください'
      ),
    ]);
    if (radiusError) newErrors.eventClusteringRadiusMeters = radiusError;

    if (selectedAnimalTypes.length === 0) {
      newErrors.animalTypesJson = '獣種を1つ以上選択してください';
    }

    const timeoutError = validateField(lineSessionTimeoutHours, [
      rules.required('セッションタイムアウトは必須です'),
      rules.custom(
        (v) => Number(v) >= 1,
        'セッションタイムアウトは1時間以上で設定してください'
      ),
    ]);
    if (timeoutError) newErrors.lineSessionTimeoutHours = timeoutError;
    if (!isMapDefaultDataRangeValue(mapDefaultDataRange)) {
      newErrors.mapDefaultDataRange = '地図デフォルト表示期間の値が不正です';
    }

    const domainKnowledgeError = validateField(domainKnowledgeText, [
      rules.maxLength(10000, 'ドメイン知識は10,000文字以内で入力してください'),
    ]);
    if (domainKnowledgeError) newErrors.domainKnowledgeText = domainKnowledgeError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append('geofenceAddressPrefix', geofenceAddressPrefix);
    formData.append('eventClusteringTimeMinutes', eventClusteringTimeMinutes);
    formData.append('eventClusteringRadiusMeters', eventClusteringRadiusMeters);
    formData.append('animalTypesJson', JSON.stringify(selectedAnimalTypes));
    formData.append('lineSessionTimeoutHours', lineSessionTimeoutHours);
    formData.append(
      'suggestedQuestionsJson',
      JSON.stringify(suggestedQuestions.filter((q) => q.trim()))
    );
    formData.append('mapDefaultLatitude', mapDefaultLatitude);
    formData.append('mapDefaultLongitude', mapDefaultLongitude);
    formData.append('mapDefaultDataRange', mapDefaultDataRange);
    formData.append('defaultDisplayEndDate', defaultDisplayEndDate);
    formData.append('domainKnowledgeText', domainKnowledgeText);

    updateMutation.mutate(formData, {
      onSuccess: () => {
        router.refresh();
      },
      onError: () => {
        setErrors({
          submit: '保存に失敗しました。もう一度お試しください。',
        });
      },
    });
  };

  const firstError = Object.values(errors).find(Boolean);

  return (
    <div className="space-y-6">
      <ErrorAlert
        message={
          firstError ||
          (updateMutation.isError ? updateMutation.error?.message : undefined)
        }
      />

      {/* セクションナビゲーション（目次） */}
      <nav
        aria-label="設定セクション"
        className={`
          rounded-lg border border-solid-gray-200 bg-solid-gray-50 px-6 py-4
        `}
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {SETTING_SECTIONS.filter(
            (s) => s.id !== 'access-control' || selectedStaffId
          ).map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className={`
                  inline-flex items-center gap-1.5 text-sm text-blue-900
                  underline-offset-2
                  hover:underline
                `}
              >
                {section.label}
                {sectionDirtyMap[section.id] && (
                  <span
                    className={`
                      inline-block size-2 shrink-0 rounded-full bg-blue-600
                    `}
                    role="status"
                    aria-label="未保存の変更があります"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ジオフェンシング設定 */}
        <Card
          id="geofencing"
          title="ジオフェンシング設定"
          padding="lg"
          className={`scroll-mt-28`}
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            通報時の住所を前方一致で検証します。設定した住所で始まらない通報は再入力を求めます。空欄の場合はチェックしません。
          </p>
          <div className="space-y-6">
            <FormField
              id="geofenceAddressPrefix"
              label="前方一致住所"
              type="input"
              inputType="text"
              value={geofenceAddressPrefix}
              onChange={setGeofenceAddressPrefix}
              placeholder="例: 北海道札幌市"
              supportText="通報の住所がこの文字列で始まるかチェックします。空欄の場合はジオフェンシングを無効にします。"
              error={errors.geofenceAddressPrefix}
            />
          </div>
        </Card>

        {/* イベント化設定 */}
        <Card
          id="clustering"
          title="通報グループクラスタリング設定"
          padding="lg"
          className={`scroll-mt-28`}
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            近接する通報を自動的に通報グループとしてグループ化する際の条件を設定します。
          </p>
          <div className="space-y-6">
            <FormField
              id="eventClusteringTimeMinutes"
              label="初回通報からの時間（分）"
              type="input"
              inputType="number"
              value={eventClusteringTimeMinutes}
              onChange={setEventClusteringTimeMinutes}
              placeholder="60"
              required
              supportText="この時間内に届いた通報をグループ化の対象とします。"
              error={errors.eventClusteringTimeMinutes}
            />
            <FormField
              id="eventClusteringRadiusMeters"
              label="半径（メートル）"
              type="input"
              inputType="number"
              value={eventClusteringRadiusMeters}
              onChange={setEventClusteringRadiusMeters}
              placeholder="500"
              required
              supportText="この半径内の通報をグループ化の対象とします。"
              error={errors.eventClusteringRadiusMeters}
            />
          </div>
        </Card>

        {/* 獣種設定 */}
        <Card
          id="animal-types"
          title="獣種設定"
          padding="lg"
          className={`scroll-mt-28`}
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            通報で使用する獣種にチェックを入れてください。
          </p>
          <div className="space-y-6">
            <AnimalTypeSelector
              value={selectedAnimalTypes}
              onChange={setSelectedAnimalTypes}
              error={errors.animalTypesJson}
            />
          </div>
        </Card>

        {/* LINE通報設定 */}
        <Card
          id="line"
          title="LINE通報設定"
          padding="lg"
          className="scroll-mt-28"
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            LINE通報のセッションタイムアウトを設定します。
          </p>
          <div className="space-y-6">
            <FormField
              id="lineSessionTimeoutHours"
              label="セッションタイムアウト（時間）"
              type="input"
              inputType="number"
              value={lineSessionTimeoutHours}
              onChange={setLineSessionTimeoutHours}
              placeholder="24"
              required
              supportText="この時間が経過するとLINE通報のセッションが無効になります。"
              error={errors.lineSessionTimeoutHours}
            />
          </div>
        </Card>

        {/* 通報設定 */}
        <Card id="map" title="通報設定" padding="lg" className="scroll-mt-28">
          <p className="mb-6 text-sm text-solid-gray-600">
            ダッシュボード・地図・通報管理の初期表示時に読み込む通報データの期間を設定します。
          </p>
          <div className="mb-6 space-y-6">
            <FormField
              id="mapDefaultDataRange"
              label="通報のデフォルト表示期間"
              type="select"
              value={mapDefaultDataRange}
              onChange={(value: string) => {
                if (isMapDefaultDataRangeValue(value)) {
                  setMapDefaultDataRange(value);
                }
              }}
              options={MAP_DEFAULT_DATA_RANGE_OPTIONS}
              supportText="全件はデータ量が多い場合に表示が遅くなる可能性があります。"
              error={errors.mapDefaultDataRange}
            />
            <FormField
              id="defaultDisplayEndDate"
              label="期間の終了日"
              type="input"
              inputType="date"
              value={defaultDisplayEndDate}
              onChange={setDefaultDisplayEndDate}
              supportText="未設定の場合は今日が終了日になります。過去の特定期間を表示したい場合に設定してください。"
            />
          </div>
          <p className="mb-4 text-sm font-medium text-solid-gray-700">
            地図のデフォルト中心座標
          </p>
          <p className="mb-4 text-sm text-solid-gray-600">
            地図をクリックまたはマーカーをドラッグして選択してください。
          </p>
          <LocationMap
            latitude={Number(mapDefaultLatitude)}
            longitude={Number(mapDefaultLongitude)}
            label="デフォルト中心"
            height="300px"
            editable
            showCoordinates
            onLocationChange={(lat, lng) => {
              setMapDefaultLatitude(String(lat));
              setMapDefaultLongitude(String(lng));
            }}
          />
        </Card>

        {/* 分析AIおすすめ質問設定 */}
        <Card
          id="ai-questions"
          title="分析AIおすすめ質問"
          padding="lg"
          className={`scroll-mt-28`}
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            分析AIチャットの初期画面に表示されるおすすめ質問を設定します。空欄の行は無視されます。
          </p>
          <div className="space-y-4">
            {suggestedQuestions.map((question, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1">
                  <FormField
                    id={`suggestedQuestion-${index}`}
                    label={`質問 ${index + 1}`}
                    type="input"
                    inputType="text"
                    value={question}
                    onChange={(value: string) => {
                      const updated = [...suggestedQuestions];
                      updated[index] = value;
                      setSuggestedQuestions(updated);
                    }}
                    placeholder="例: 今月の通報の傾向を分析して"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSuggestedQuestions(
                      suggestedQuestions.filter((_, i) => i !== index)
                    );
                  }}
                  className={`
                    mt-6 rounded px-2 py-1 text-sm text-red-600
                    hover:bg-red-50
                  `}
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setSuggestedQuestions([...suggestedQuestions, ''])}
              className={`
                rounded-lg border border-dashed border-solid-gray-300 px-4 py-2
                text-sm text-solid-gray-600
                hover:border-solid-gray-400 hover:bg-solid-gray-50
              `}
            >
              + 質問を追加
            </button>
          </div>
        </Card>

        {/* AI分析ドメイン知識 */}
        <Card
          id="ai-domain-knowledge"
          title="AI分析ドメイン知識"
          padding="lg"
          className={`scroll-mt-28`}
        >
          <p className="mb-6 text-sm text-solid-gray-600">
            AI分析の判断基準となるドメイン知識を設定します。Markdown形式で記述できます。
          </p>
          <div className="space-y-4">
            <FormField
              id="domainKnowledgeText"
              label="ドメイン知識"
              type="textarea"
              value={domainKnowledgeText}
              onChange={setDomainKnowledgeText}
              rows={10}
              placeholder={`例:\n- サルは群れで行動するため、1頭の目撃は近くに群れがいる可能性が高い\n- イノシシは夜行性が強く、夕方〜早朝の通報が多い\n- クマの出没が増える時期は秋（9〜11月）のドングリ不作年\n- 河川沿いはシカの移動経路になりやすい`}
              error={errors.domainKnowledgeText}
            />
            <p className="text-xs text-solid-gray-420">
              この内容はユーザーには表示されません。AIの分析判断の基盤として使用されます。（最大10,000文字）
            </p>
          </div>
        </Card>

        {/* データリセット（独自mutationで動作、type="button"のためform submitに影響しない） */}
        {selectedStaffId && (
          <DataResetSection
            staffId={selectedStaffId}
            latestInfo={latestDataResetInfo}
          />
        )}

        <div
          className={`
            sticky bottom-0 -mx-6 border-t border-solid-gray-200 bg-white/95
            px-6 py-4 backdrop-blur-sm
          `}
          style={{ zIndex: Z_HEADER }}
        >
          <FormActions
            submitLabel="保存する"
            isSubmitting={updateMutation.isPending}
            cancelLabel="変更を元に戻す"
            onCancel={handleReset}
            cancelDisabled={!isDirty}
          />
        </div>
      </form>
    </div>
  );
}
