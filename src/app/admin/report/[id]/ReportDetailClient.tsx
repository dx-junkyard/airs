'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faImage,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import Button from '@/components/ui/Button/Button';
import Dd from '@/components/ui/Dl/Dd';
import MarkdownContent from '@/components/ui/MarkdownContent/MarkdownContent';
import Dl from '@/components/ui/Dl/Dl';
import Dt from '@/components/ui/Dl/Dt';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import ErrorText from '@/components/ui/ErrorText/ErrorText';
import ImageUploader from '@/components/ui/ImageUploader/ImageUploader';
import Input from '@/components/ui/Input/Input';
import Label from '@/components/ui/Label/Label';
import RequirementBadge from '@/components/ui/RequirementBadge/RequirementBadge';
import Select from '@/components/ui/Select/Select';
import Textarea from '@/components/ui/Textarea/Textarea';
import Dialog from '@/components/ui/Dialog/Dialog';
import DialogBody from '@/components/ui/Dialog/DialogBody';
import ImageModal from '@/components/ui/ImageModal/ImageModal';
import { uploadReportImage } from '@/features/report/actions';
import ClickableStatusBadge from '@/features/report/components/ClickableStatusBadge';
import {
  VALID_ANIMAL_TYPES,
  getAnimalTypeLabel,
  type AnimalTypeConfig,
} from '@/server/domain/constants/animalTypes';
import type { ReportStatusValue } from '@/server/domain/constants/reportStatuses';
import {
  animalTypeAtom,
  addressAtom,
  phoneNumberAtom,
  latitudeAtom,
  longitudeAtom,
  imageUrlsAtom,
  imagesAtom,
  descriptionAtom,
  statusAtom,
  staffIdAtom,
  geofenceErrorAtom,
  initFormFromReportAtom,
  resetFormAtom,
} from '@/features/report/atoms/reportEditAtoms';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import { rules, validateField } from '@/hooks/forms/core/validation';
import useUpdateReport from '@/hooks/mutations/useUpdateReport';
import useDeleteReport from '@/hooks/mutations/useDeleteReport';
import useReverseGeocode from '@/hooks/mutations/useReverseGeocode';
import { formatDateTime, formatReportDateTime } from '@/features/common/utils/dateFormatter';

// FullscreenReportMapを動的インポート（埋め込み表示用、SSR無効）
const FullscreenReportMap = dynamic(
  () => import('@/features/map/components/FullscreenReportMap'),
  {
    ssr: false,
    loading: () => (
      <div
        className={`h-[300px] w-full animate-pulse rounded-lg bg-solid-gray-100`}
      />
    ),
  }
);

// EditableLocationMapを動的インポート（編集モード用、SSR無効）
const EditableLocationMap = dynamic(
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

// ReportTimelineを動的インポート（グループ通報のタイムライン表示用、SSR無効）
const ReportTimeline = dynamic(
  () => import('@/features/event/components/ReportTimeline'),
  { ssr: false }
);

// ArrowPolylineを動的インポート（タイムライン矢印表示用、SSR無効）
const ArrowPolyline = dynamic(
  () => import('@/features/map/extensions/ArrowPolyline'),
  { ssr: false }
);

/** 関連イベント情報 */
interface RelatedEvent {
  id: string;
  reportCount: number;
  representativeReport?: {
    animalType: string;
    address: string;
  };
  reports: {
    id: string;
    animalType: string;
    latitude: number;
    longitude: number;
    address: string;
    createdAt: string;
    status: string;
  }[];
}

interface ReportDetailClientProps {
  /** SSRで取得したレポートデータ */
  report: ReportDto;
  /** 関連イベント情報（存在する場合） */
  event: RelatedEvent | null;
  /** SSRで取得した有効獣種 */
  enabledAnimalTypes: AnimalTypeConfig[];
  /** SSRで取得した職員一覧 */
  staffs: StaffDto[];
  /** SSRで取得した選択中の職員ID */
  selectedStaffId: string | null;
}

export default function ReportDetailClient({
  report,
  event,
  enabledAnimalTypes,
  staffs,
  selectedStaffId,
}: ReportDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deleteDialogRef = useRef<HTMLDialogElement>(null);

  // 画像カルーセル状態
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 画像モーダル状態
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const [modalImageDescription, setModalImageDescription] = useState<
    string | undefined
  >(undefined);
  const [modalImageAlt, setModalImageAlt] = useState<string>('画像');

  const handleImageClick = useCallback(
    (url: string, index: number) => {
      setModalImageUrl(url);
      setModalImageDescription(report.images[index]?.description || undefined);
      setModalImageAlt(`通報画像${index + 1}`);
    },
    [report.images]
  );

  const handleModalClose = useCallback(() => {
    setModalImageUrl(null);
    setModalImageDescription(undefined);
  }, []);

  // 編集用の獣種オプション: 有効な獣種 + 現在のレポートの獣種（無効化されていても含める）
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

  // Mutation hooks
  const updateMutation = useUpdateReport(report.id);
  const deleteMutation = useDeleteReport();

  // 更新後のリフレッシュ完了でmutation状態をリセット
  useEffect(() => {
    if (updateMutation.isSuccess) {
      updateMutation.reset();
    }
  }, [report.status, report.staffId, report.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // 派生状態: mutation状態から計算
  const isDeleting = deleteMutation.isPending;

  // 地図表示用: イベントに所属する場合はグループ内の全通報を表示
  const mapReports = useMemo(() => {
    if (!event || event.reports.length === 0) return [report];
    // イベントの通報をReportDto互換に変換し、自身の通報も含める
    const eventReportIds = new Set(event.reports.map((r) => r.id));
    // 自身の通報がイベント内に含まれている場合は、自身のReportDtoを優先使用
    const otherReports: ReportDto[] = event.reports
      .filter((r) => r.id !== report.id)
      .map((r) => ({
        ...r,
        phoneNumber: undefined,
        images: [],
        description: undefined,
        hasOnlyDate: false,
        updatedAt: r.createdAt,
        deletedAt: null,
        staffId: undefined,
        staffName: undefined,
      }));
    return eventReportIds.has(report.id) ? [report, ...otherReports] : [report];
  }, [event, report]);

  // カルーセルでフォーカスされた通報
  const [focusedReportId, setFocusedReportId] = useState<string | null>(null);

  const focusedReport = useMemo(() => {
    if (!focusedReportId) return null;
    return mapReports.find((r) => r.id === focusedReportId) ?? null;
  }, [focusedReportId, mapReports]);

  // タイムライン矢印用のポイントリスト（時系列順）
  const arrowPoints = useMemo(() => {
    if (!event || event.reports.length < 2) return [];
    return [...event.reports]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((r) => ({ id: r.id, lat: r.latitude, lng: r.longitude }));
  }, [event]);

  // フォームデータ（Jotai atoms）
  const [animalType, setAnimalType] = useAtom(animalTypeAtom);
  const [address, setAddress] = useAtom(addressAtom);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [latitude, setLatitude] = useAtom(latitudeAtom);
  const [longitude, setLongitude] = useAtom(longitudeAtom);
  const [imageUrls, setImageUrls] = useAtom(imageUrlsAtom);
  const images = useAtomValue(imagesAtom);
  const [description, setDescription] = useAtom(descriptionAtom);
  const [status, setStatus] = useAtom(statusAtom);
  const [editStaffId, setEditStaffId] = useAtom(staffIdAtom);
  const [geofenceError, setGeofenceError] = useAtom(geofenceErrorAtom);
  const initFormFromReport = useSetAtom(initFormFromReportAtom);
  const resetForm = useSetAtom(resetFormAtom);

  // リバースジオコーディング（ジオフェンスチェック付き）
  const { mutate: fetchAddress, isPending: isAddressPending } =
    useReverseGeocode({
      onSuccess: (result) => {
        setAddress(result.address);
        setGeofenceError(null);
      },
      onGeofenceError: (_result, prefix) => {
        setGeofenceError(
          `取得された住所が対象地域（${prefix}）と一致しません。`
        );
      },
    });

  // 地図ピン移動時の処理
  const handleEditMapLocationChange = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat.toFixed(6));
      setLongitude(lng.toFixed(6));
      setGeofenceError(null);
      fetchAddress({ latitude: lat, longitude: lng });
    },
    [setLatitude, setLongitude, setGeofenceError, fetchAddress]
  );
  const selectedStaffName = useMemo(
    () => staffs.find((staff) => staff.id === selectedStaffId)?.name,
    [staffs, selectedStaffId]
  );

  // バリデーション
  const validate = () => {
    const newErrors: Record<string, string> = {};

    // 獣種
    const animalTypeError = validateField(animalType, [
      rules.required('獣種は必須です'),
      rules.custom(
        (value) => VALID_ANIMAL_TYPES.includes(value as any),
        '有効な獣種を選択してください'
      ),
    ]);
    if (animalTypeError) newErrors.animalType = animalTypeError;

    // 住所
    const addressError = validateField(address, [
      rules.required('住所は必須です'),
    ]);
    if (addressError) newErrors.address = addressError;

    // 緯度
    const latError = validateField(latitude, [
      rules.required('緯度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -90 && num <= 90;
      }, '緯度は-90から90の範囲で入力してください'),
    ]);
    if (latError) newErrors.latitude = latError;

    // 経度
    const lngError = validateField(longitude, [
      rules.required('経度は必須です'),
      rules.custom((value) => {
        const num = parseFloat(value as string);
        return !isNaN(num) && num >= -180 && num <= 180;
      }, '経度は-180から180の範囲で入力してください'),
    ]);
    if (lngError) newErrors.longitude = lngError;

    // 画像URLs（任意だが、URLがある場合は有効性チェック）
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
  const handleSave = () => {
    if (!validate()) return;
    if (geofenceError) return;

    const formDataObj = new FormData();
    formDataObj.append('animalType', animalType);
    formDataObj.append('address', address);
    if (phoneNumber) formDataObj.append('phoneNumber', phoneNumber);
    formDataObj.append('latitude', latitude);
    formDataObj.append('longitude', longitude);
    formDataObj.append('images', JSON.stringify(images));
    if (description) formDataObj.append('description', description);
    formDataObj.append('status', status);
    formDataObj.append('staffId', editStaffId);

    updateMutation.mutate(formDataObj, {
      onSuccess: () => {
        setIsEditing(false);
        setErrors({});
        router.refresh();
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

  // 担当者アサイン処理
  const handleAssignStaff = () => {
    if (!selectedStaffId) return;
    const formDataObj = new FormData();
    formDataObj.append('staffId', selectedStaffId);

    updateMutation.mutate(formDataObj, {
      onSuccess: () => {
        router.refresh();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* 一覧に戻るナビゲーション + アクションボタン */}
      <div className="flex items-center justify-between gap-2">
        {!isEditing && (
          <button
            type="button"
            onClick={() => router.back()}
            className={`
              flex items-center gap-1 text-sm text-blue-600
              hover:underline
            `}
          >
            <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
            一覧に戻る
          </button>
        )}
        {!isEditing ? (
          <Button
            size="md"
            variant="solid-fill"
            onClick={() => {
              initFormFromReport(report); // 最新のreportからatomを初期化
              setIsEditing(true);
            }}
          >
            編集
          </Button>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                size="md"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setErrors({});
                  resetForm();
                }}
              >
                キャンセル
              </Button>
              <Button
                size="md"
                variant="solid-fill"
                onClick={handleSave}
                disabled={
                  updateMutation.isPending ||
                  !!geofenceError ||
                  isAddressPending
                }
              >
                {updateMutation.isPending ? '保存中...' : '保存'}
              </Button>
            </div>
          </>
        )}
      </div>

      <ErrorAlert message={errors.submit} />

      {/* 基本情報 + 詳細情報（表示モード） */}
      {!isEditing && (
        <div
          className={`
            rounded-lg border border-solid-gray-200 bg-white p-6 shadow-sm
          `}
        >
          <h2 className="mb-4 text-xl font-semibold text-blue-900">基本情報</h2>
          <div
            className={`
              flex gap-4
              max-md:flex-col
            `}
          >
            {/* 左: 画像カルーセル */}
            <div className="min-w-0 flex-1">
              {report.images.length > 0 ? (
                <div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        handleImageClick(
                          report.images[currentImageIndex].url,
                          currentImageIndex
                        )
                      }
                      className={`
                        w-full cursor-pointer overflow-hidden rounded-lg border
                        border-solid-gray-200 transition-opacity
                        hover:opacity-80
                      `}
                    >
                      <Image
                        src={report.images[currentImageIndex].url}
                        alt={`通報画像${currentImageIndex + 1}`}
                        width={288}
                        height={288}
                        className="aspect-square w-full object-cover"
                        unoptimized
                      />
                    </button>
                    {report.images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === 0 ? report.images.length - 1 : prev - 1
                            )
                          }
                          className={`
                            absolute top-1/2 left-2 -translate-y-1/2
                            rounded-full bg-black/40 p-1.5 text-white
                            transition-colors
                            hover:bg-black/60
                          `}
                        >
                          <FontAwesomeIcon
                            icon={faChevronLeft}
                            className="size-3"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentImageIndex((prev) =>
                              prev === report.images.length - 1 ? 0 : prev + 1
                            )
                          }
                          className={`
                            absolute top-1/2 right-2 -translate-y-1/2
                            rounded-full bg-black/40 p-1.5 text-white
                            transition-colors
                            hover:bg-black/60
                          `}
                        >
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            className="size-3"
                          />
                        </button>
                      </>
                    )}
                  </div>
                  {report.images.length > 1 && (
                    <div className="mt-2 flex justify-center gap-1.5">
                      {report.images.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          className={`
                            size-2 rounded-full transition-colors
                            ${
                              index === currentImageIndex
                                ? `bg-blue-600`
                                : `bg-solid-gray-300`
                            }
                          `}
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-center text-xs text-solid-gray-500">
                    クリックで拡大（{currentImageIndex + 1}/
                    {report.images.length}）
                  </p>
                </div>
              ) : (
                <div
                  className={`
                    flex aspect-square flex-col items-center justify-center
                    gap-2 rounded-lg bg-solid-gray-50 p-8
                  `}
                >
                  <FontAwesomeIcon
                    icon={faImage}
                    className="text-3xl text-solid-gray-300"
                  />
                  <span className="text-sm text-solid-gray-400">
                    画像がありません
                  </span>
                </div>
              )}
            </div>
            {/* 中: 小地図（正方形） */}
            <div className="min-w-0 flex-1">
              <div
                className={`
                  aspect-square w-full overflow-hidden rounded-lg border
                  border-solid-gray-200
                `}
              >
                <FullscreenReportMap
                  reports={[report]}
                  interactionMode="popup"
                  isAdmin
                  showLegend={false}
                  showSearchControl={false}
                  showHeatmapLayer={false}
                  disableClustering
                  height="100%"
                  initialCenter={
                    report.latitude && report.longitude
                      ? { lat: report.latitude, lng: report.longitude }
                      : undefined
                  }
                  initialZoom={12}
                  selectedReport={report}
                  highlightedReportId={report.id}
                  showFullscreenControl={false}
                  showStatusBorder
                />
              </div>
              <p className="mt-1 text-sm text-solid-gray-600">
                {report.address}
              </p>
            </div>
            {/* 右: 情報 */}
            <div className="min-w-0 flex-1">
              <Dl className="space-y-3">
                <div>
                  <Dt>獣種</Dt>
                  <Dd>{getAnimalTypeLabel(report.animalType)}</Dd>
                </div>
                <div>
                  <Dt>ステータス</Dt>
                  <Dd>
                    <ClickableStatusBadge
                      reportId={report.id}
                      status={report.status as ReportStatusValue}
                    />
                  </Dd>
                </div>
                {report.phoneNumber && (
                  <div>
                    <Dt>電話番号</Dt>
                    <Dd>{report.phoneNumber}</Dd>
                  </div>
                )}
                <div>
                  <Dt>
                    担当者
                    {!report.staffName && (
                      <span className="ml-1 text-solid-gray-500">
                        （未割り当て）
                      </span>
                    )}
                  </Dt>
                  <Dd>
                    <div className="flex items-center gap-2">
                      {report.staffName}
                      {selectedStaffId &&
                        report.staffId !== selectedStaffId && (
                          <Button
                            size="sm"
                            variant="solid-fill"
                            onClick={() => handleAssignStaff()}
                            aria-disabled={
                              updateMutation.isPending ||
                              updateMutation.isSuccess ||
                              undefined
                            }
                            className="aria-disabled:bg-solid-gray-300!"
                          >
                            {updateMutation.isPending
                              ? '変更中...'
                              : selectedStaffName
                                ? `${selectedStaffName}が担当する`
                                : '自分が担当する'}
                          </Button>
                        )}
                    </div>
                  </Dd>
                </div>
                <div>
                  <Dt>通報日時</Dt>
                  <Dd>{formatReportDateTime(report.createdAt, report.hasOnlyDate)}</Dd>
                </div>
                {event && (
                  <div>
                    <Dt>関連通報グループ</Dt>
                    <Dd>
                      <span
                        className={`
                          inline-flex items-center gap-2 rounded-md bg-blue-50
                          px-3 py-1.5 text-blue-700
                        `}
                      >
                        <FontAwesomeIcon
                          icon={faLayerGroup}
                          className="size-4"
                        />
                        <span>{event.reportCount}件の通報</span>
                      </span>
                    </Dd>
                  </div>
                )}
                {report.deletedAt && (
                  <div>
                    <Dt>削除日時</Dt>
                    <Dd className="text-red-600">
                      {formatDateTime(report.deletedAt)}
                    </Dd>
                  </div>
                )}
                <div>
                  <Dt>説明</Dt>
                  <Dd>
                    {report.description ? (
                      <MarkdownContent content={report.description} />
                    ) : (
                      <span className="text-solid-gray-500">説明なし</span>
                    )}
                  </Dd>
                </div>
              </Dl>
            </div>
          </div>
        </div>
      )}

      {/* 目撃地点の推移（イベント所属時のみ表示） */}
      {!isEditing && event && (
        <div
          className={`
            rounded-lg border border-solid-gray-200 bg-white p-6 shadow-sm
          `}
        >
          <h2 className="text-xl font-semibold text-blue-900">
            目撃地点の推移
          </h2>
          <p className="mt-1 text-sm text-solid-gray-600">{report.address}</p>
          <p className="mt-1 mb-4 text-sm text-solid-gray-500">
            同一グループの通報{event.reportCount}
            件を時系列で表示しています。カードやマーカーを選択すると関連する経路がハイライトされます。選択中は上下キーで移動できます。
          </p>
          <div
            className={`
              flex gap-4
              max-md:flex-col
            `}
          >
            {/* 左: タイムライン */}
            <div
              className={`
                shrink-0 overflow-x-hidden overflow-y-auto px-2 py-4
                max-md:max-h-60
                md:h-[500px] md:w-56
              `}
            >
              <ReportTimeline
                reports={event.reports}
                selectedReportId={focusedReportId ?? report.id}
                onSelect={(r) => setFocusedReportId(r.id)}
              />
            </div>
            {/* 右: 地図 */}
            <div className="relative h-[500px] min-w-0 flex-1">
              <FullscreenReportMap
                reports={mapReports}
                interactionMode="popup"
                onMarkerClick={(r) => setFocusedReportId(r.id)}
                isAdmin
                showLegend={false}
                showSearchControl={false}
                showHeatmapLayer={false}
                disableClustering
                height="500px"
                initialCenter={
                  report.latitude && report.longitude
                    ? { lat: report.latitude, lng: report.longitude }
                    : undefined
                }
                initialZoom={16}
                selectedReport={focusedReport ?? report}
                highlightedReportId={report.id}
                focusedReport={focusedReport}
                mapChildren={
                  arrowPoints.length >= 2 ? (
                    <ArrowPolyline
                      points={arrowPoints}
                      highlightId={focusedReportId ?? report.id}
                    />
                  ) : null
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* 編集モード */}
      {isEditing && (
        <>
          {/* 基本情報（編集） */}
          <div
            className={`
              rounded-lg border border-solid-gray-200 bg-white p-6 shadow-sm
            `}
          >
            <h2 className="mb-6 text-xl font-semibold text-blue-900">
              基本情報
            </h2>
            <div className="space-y-6">
              {/* 獣種 */}
              <div>
                <Label htmlFor="animalType" className="mb-2 block">
                  獣種 <RequirementBadge>必須</RequirementBadge>
                </Label>
                <Select
                  id="animalType"
                  value={animalType}
                  onChange={(e) => setAnimalType(e.target.value)}
                  blockSize="md"
                  className="w-full"
                >
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

              {/* 電話番号 */}
              <div>
                <Label htmlFor="phoneNumber" className="mb-2 block">
                  電話番号 <span className="text-solid-gray-600">(任意)</span>
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  blockSize="md"
                  className="w-full"
                />
              </div>

              {/* ステータス */}
              <div>
                <Label htmlFor="status" className="mb-2 block">
                  ステータス <RequirementBadge>必須</RequirementBadge>
                </Label>
                <Select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  blockSize="md"
                  className="w-full"
                >
                  <option value="waiting">確認待ち</option>
                  <option value="completed">確認完了</option>
                </Select>
              </div>

              {/* 担当者 */}
              <div>
                <Label htmlFor="staffId" className="mb-2 block">
                  担当者 <span className="text-solid-gray-600">(任意)</span>
                </Label>
                <Select
                  id="staffId"
                  value={editStaffId}
                  onChange={(e) => setEditStaffId(e.target.value)}
                  blockSize="md"
                  className="w-full"
                >
                  <option value="">未割り当て</option>
                  {staffs.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {/* 位置情報（編集） */}
          <div
            className={`
              rounded-lg border border-solid-gray-200 bg-white p-6 shadow-sm
            `}
          >
            <h2 className="mb-6 text-xl font-semibold text-blue-900">
              位置情報
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="mb-1 block">
                  地図から選択 <RequirementBadge>必須</RequirementBadge>
                </Label>
                <p className="mb-2 text-sm text-solid-gray-600">
                  地図をクリックまたはマーカーをドラッグして位置を選択できます
                </p>
              </div>
              <EditableLocationMap
                latitude={parseFloat(latitude) || report.latitude || 35.6762}
                longitude={
                  parseFloat(longitude) || report.longitude || 139.6503
                }
                label="目撃位置"
                height="300px"
                editable
                onLocationChange={handleEditMapLocationChange}
                showCoordinates
              />
              <div>
                <Label htmlFor="edit-address" className="mb-2 block">
                  住所 <RequirementBadge>必須</RequirementBadge>
                </Label>
                <Input
                  id="edit-address"
                  value={isAddressPending ? '住所を取得中...' : address}
                  onChange={() => undefined}
                  blockSize="md"
                  className="w-full"
                  disabled={isAddressPending}
                  readOnly
                />
                <p className="mt-1 text-sm text-solid-gray-600">
                  住所は地図のピン位置から自動取得されます。手動編集はできません。
                </p>
                {(geofenceError || errors.address) && (
                  <ErrorText className="mt-1">
                    {geofenceError || errors.address}
                  </ErrorText>
                )}
              </div>
            </div>
          </div>

          {/* 詳細情報（編集） */}
          <div
            className={`
              rounded-lg border border-solid-gray-200 bg-white p-6 shadow-sm
            `}
          >
            <h2 className="mb-6 text-xl font-semibold text-blue-900">
              詳細情報
            </h2>
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
              <div>
                <Label htmlFor="description" className="mb-2 block">
                  説明 <span className="text-solid-gray-600">(任意)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  className="w-full"
                />
                {errors.description && (
                  <ErrorText className="mt-1">{errors.description}</ErrorText>
                )}
              </div>
            </div>
          </div>

          {/* 危険操作 */}
          <div className={`rounded-lg border border-red-200 bg-red-50 p-4`}>
            <h3 className="text-base font-semibold text-red-700">危険操作</h3>
            <p className="mt-1 text-sm text-red-700">
              通報を削除すると元に戻せません。内容を確認してから実行してください。
            </p>
            <div className="mt-3">
              <Button
                size="md"
                variant="outline"
                onClick={() => deleteDialogRef.current?.showModal()}
                className={`
                  border-red-300 text-red-600
                  hover:bg-red-50
                `}
              >
                削除
              </Button>
            </div>
          </div>
        </>
      )}

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
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              size="md"
              variant="solid-fill"
              onClick={handleDelete}
              disabled={isDeleting}
              className={`
                bg-red-600
                hover:bg-red-700
              `}
            >
              {isDeleting ? '削除中...' : '削除する'}
            </Button>
          </div>
        </DialogBody>
      </Dialog>

      {/* 画像拡大モーダル */}
      <ImageModal
        imageUrl={modalImageUrl}
        description={modalImageDescription}
        alt={modalImageAlt}
        onClose={handleModalClose}
      />
    </div>
  );
}
