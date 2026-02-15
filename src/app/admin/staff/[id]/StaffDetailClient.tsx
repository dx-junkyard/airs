'use client';

import { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAtom, useSetAtom } from 'jotai';
import Button from '@/components/ui/Button/Button';
import Checkbox from '@/components/ui/Checkbox/Checkbox';
import Dd from '@/components/ui/Dl/Dd';
import Dl from '@/components/ui/Dl/Dl';
import Dt from '@/components/ui/Dl/Dt';
import { ErrorAlert } from '@/components/ui/ErrorAlert/ErrorAlert';
import ErrorText from '@/components/ui/ErrorText/ErrorText';
import Input from '@/components/ui/Input/Input';
import Label from '@/components/ui/Label/Label';
import RequirementBadge from '@/components/ui/RequirementBadge/RequirementBadge';
import Dialog from '@/components/ui/Dialog/Dialog';
import DialogBody from '@/components/ui/Dialog/DialogBody';
import {
  REPORT_STATUS_LABELS,
  VALID_REPORT_STATUSES,
} from '@/server/domain/constants/reportStatuses';
import type { ReportStatusValue } from '@/server/domain/constants/reportStatuses';
import {
  nameAtom,
  emailAtom,
  initFormFromStaffAtom,
  resetFormAtom,
} from '@/features/staff/atoms/staffEditAtoms';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { StaffLocationDto } from '@/server/application/dtos/StaffLocationDto';
import type { StaffLocationMapHandle } from '@/features/staff/components/StaffLocationMap';
import { rules, validateField } from '@/hooks/forms/core/validation';
import { selectStaff } from '@/features/staff/actions';
import { breadcrumbOverridesAtom } from '@/atoms/breadcrumbOverridesAtom';
import useUpdateStaff from '@/hooks/mutations/useUpdateStaff';
import useDeleteStaff from '@/hooks/mutations/useDeleteStaff';
import { formatDateTime } from '@/features/common/utils/dateFormatter';
import PaginatedReportList from '@/features/report/components/PaginatedReportList';
import { useQueryState, parseAsInteger, parseAsString } from 'nuqs';
import { useSearchReports } from '@/hooks/queries/useSearchReports';
import type { SearchReportsParams } from '@/features/report/actions';

const StaffLocationMap = dynamic(
  () => import('@/features/staff/components/StaffLocationMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse rounded-lg bg-solid-gray-100" />
    ),
  }
);

interface StaffDetailClientProps {
  staff: StaffDto;
  selectedStaffId: string | null;
  reports: ReportDto[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  staffLocations: StaffLocationDto[];
}

export default function StaffDetailClient({
  staff,
  selectedStaffId,
  reports,
  totalCount,
  totalPages,
  currentPage,
  staffLocations,
}: StaffDetailClientProps) {
  const router = useRouter();
  const setBreadcrumbOverrides = useSetAtom(breadcrumbOverridesAtom);
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const mapRef = useRef<StaffLocationMapHandle>(null);

  // パンくずに職員名を反映（クライアントサイドナビゲーション用）
  useEffect(() => {
    setBreadcrumbOverrides({ [staff.id]: staff.name });
    return () => setBreadcrumbOverrides({});
  }, [staff.id, staff.name, setBreadcrumbOverrides]);

  // Mutation hooks
  const updateMutation = useUpdateStaff(staff.id);
  const deleteMutation = useDeleteStaff();

  // 担当者選択
  const [isSelectPending, startSelectTransition] = useTransition();
  const isSelected = selectedStaffId === staff.id;

  // 通報一覧ページネーション
  const [reportPage, setReportPage] = useQueryState(
    'reportPage',
    parseAsInteger.withDefault(1).withOptions({ shallow: true })
  );
  const handlePageChange = (newPage: number) => {
    setReportPage(newPage);
  };

  // 通報ステータスフィルター
  // nuqsにデフォルト値を設定しない（null = SSR初期状態、'all' = 全ステータス表示）
  const DEFAULT_REPORT_STATUS = 'waiting';
  const [reportStatus, setReportStatus] = useQueryState(
    'reportStatus',
    parseAsString.withOptions({ shallow: true })
  );

  // useQuery + initialData でキャッシュ管理
  const REPORTS_PER_PAGE = 10;
  // null = SSR初期状態（デフォルトフィルター適用）, 'all' = 全ステータス表示, それ以外 = ユーザー選択
  const effectiveStatus =
    reportStatus === null
      ? DEFAULT_REPORT_STATUS
      : reportStatus === 'all'
        ? undefined
        : reportStatus || undefined;
  const reportSearchParams = useMemo(
    (): SearchReportsParams => ({
      staffId: staff.id,
      status: effectiveStatus,
      page: reportPage,
      limit: REPORTS_PER_PAGE,
      sortOrder: 'desc',
    }),
    [staff.id, effectiveStatus, reportPage]
  );

  // SSR初期データはSSR時のパラメータと一致する場合のみ渡す
  // reportStatus === null（URLパラメータなし）= SSR初期状態
  const isMatchingSsrParams =
    reportStatus === null && reportPage === currentPage;

  const { data: reportsData, isFetching: isReportsFetching } =
    useSearchReports(
      reportSearchParams,
      isMatchingSsrParams
        ? {
            reports,
            totalCount,
            totalPages,
            currentPage,
          }
        : undefined
    );

  // null（初期状態）→ デフォルトのステータスを表示、'all' → 全選択解除、それ以外 → カンマ区切り
  const selectedStatuses = new Set(
    reportStatus === null
      ? DEFAULT_REPORT_STATUS.split(',')
      : reportStatus === 'all'
        ? []
        : reportStatus
          ? reportStatus.split(',').filter(Boolean)
          : []
  );

  const handleStatusToggle = (status: ReportStatusValue) => {
    const next = new Set(selectedStatuses);
    if (next.has(status)) {
      next.delete(status);
    } else {
      next.add(status);
    }
    // 空の場合は'all'を設定（nullにするとデフォルト値に戻ってしまう）
    const value = next.size === 0 ? 'all' : Array.from(next).join(',');
    setReportStatus(value);
    setReportPage(1);
  };

  // 派生状態
  const isDeleting = deleteMutation.isPending;

  // フォームデータ（Jotai atoms）
  const [name, setName] = useAtom(nameAtom);
  const [email, setEmail] = useAtom(emailAtom);
  const initFormFromStaff = useSetAtom(initFormFromStaffAtom);
  const resetForm = useSetAtom(resetFormAtom);

  // バリデーション
  const validate = () => {
    const newErrors: Record<string, string> = {};

    const nameError = validateField(name, [
      rules.required('職員名は必須です'),
      rules.maxLength(100, '職員名は100文字以内で入力してください'),
    ]);
    if (nameError) newErrors.name = nameError;

    const emailError = validateField(email, [
      rules.email('有効なメールアドレスを入力してください'),
      rules.maxLength(254, 'メールアドレスは254文字以内で入力してください'),
    ]);
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 保存処理
  const handleSave = () => {
    if (!validate()) return;

    const formDataObj = new FormData();
    formDataObj.append('name', name);
    formDataObj.append('email', email);

    updateMutation.mutate(formDataObj, {
      onSuccess: async () => {
        try {
          await mapRef.current?.saveChanges();
        } catch {
          setErrors({
            submit:
              '担当地域ピンの保存に失敗しました。もう一度お試しください。',
          });
          return;
        }
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
    deleteMutation.mutate(staff.id, {
      onSettled: () => {
        deleteDialogRef.current?.close();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* アクションボタン */}
      <div className="flex justify-end gap-2">
        {!isEditing ? (
          <Button
            size="md"
            variant="solid-fill"
            onClick={() => {
              initFormFromStaff(staff);
              setIsEditing(true);
            }}
          >
            編集
          </Button>
        ) : (
          <>
            <Button
              size="md"
              variant="solid-fill"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? '保存中...' : '保存'}
            </Button>
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                mapRef.current?.resetChanges();
                setIsEditing(false);
                setErrors({});
                resetForm();
              }}
            >
              キャンセル
            </Button>
            <Button
              size="md"
              variant="text"
              onClick={() => deleteDialogRef.current?.showModal()}
              className={`
                text-red-600
                hover:bg-red-50
              `}
            >
              削除
            </Button>
          </>
        )}
      </div>

      <ErrorAlert message={errors.submit} />

      {/* 職員情報（表示モード） */}
      {!isEditing && (
        <>
          <div
            className={`
              grid grid-cols-1 gap-6 rounded-lg border border-solid-gray-200
              bg-white p-6 shadow-sm
              lg:grid-cols-2
            `}
          >
            <div className="flex flex-col">
              <h2 className="mb-4 text-xl font-semibold text-blue-900">
                職員情報
              </h2>
              <Dl className="space-y-3">
                <div>
                  <Dt>職員名</Dt>
                  <Dd>{staff.name}</Dd>
                </div>
                <div>
                  <Dt>メールアドレス</Dt>
                  <Dd>{staff.email ?? '未設定'}</Dd>
                </div>
                <div>
                  <Dt>作成日時</Dt>
                  <Dd>{formatDateTime(staff.createdAt)}</Dd>
                </div>
                <div>
                  <Dt>更新日時</Dt>
                  <Dd>{formatDateTime(staff.updatedAt)}</Dd>
                </div>
                {staff.deletedAt && (
                  <div>
                    <Dt>削除日時</Dt>
                    <Dd className="text-red-600">
                      {formatDateTime(staff.deletedAt)}
                    </Dd>
                  </div>
                )}
              </Dl>
              <div className="mt-6 border-t border-solid-gray-200 pt-4">
                <h3 className="mb-1 text-sm font-semibold text-blue-900">
                  担当者として設定
                </h3>
                <p className="mb-3 text-sm text-solid-gray-600">
                  この職員を担当者に設定すると、通報作成時に担当者として自動選択されます。
                </p>
                <Button
                  size="md"
                  variant={isSelected ? 'outline' : 'solid-fill'}
                  disabled={isSelectPending}
                  onClick={() => {
                    startSelectTransition(async () => {
                      await selectStaff(isSelected ? null : staff.id);
                      router.refresh();
                    });
                  }}
                >
                  {isSelected ? '担当者解除' : '担当者選択'}
                </Button>
              </div>
            </div>
            <div>
              <StaffLocationMap staffId={staff.id} editable={false} initialLocations={staffLocations} />
            </div>
          </div>

          {/* 担当通報一覧 */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-blue-900">
              担当通報
            </h2>
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <span className="text-sm font-medium text-solid-gray-700">
                ステータス:
              </span>
              {VALID_REPORT_STATUSES.map((status) => (
                <Checkbox
                  key={status}
                  size="sm"
                  checked={selectedStatuses.has(status)}
                  onChange={() => handleStatusToggle(status)}
                >
                  {REPORT_STATUS_LABELS[status]}
                </Checkbox>
              ))}
            </div>
            <div className="relative">
              {isReportsFetching && (
                <div className="absolute inset-0 z-10 bg-white/70 pt-16">
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`
                        size-8 animate-spin rounded-full border-4
                        border-solid-gray-200 border-t-blue-600
                      `}
                    />
                    <p className="text-sm text-solid-gray-600">読み込み中...</p>
                  </div>
                </div>
              )}
              <PaginatedReportList
                reports={reportsData?.reports ?? reports}
                totalCount={reportsData?.totalCount ?? totalCount}
                totalPages={reportsData?.totalPages ?? totalPages}
                currentPage={reportsData?.currentPage ?? currentPage}
                onPageChange={handlePageChange}
                countPrefix=""
              />
            </div>
          </div>
        </>
      )}

      {/* 編集モード */}
      {isEditing && (
        <div
          className={`
            grid grid-cols-1 gap-6 rounded-lg border border-solid-gray-200
            bg-white p-6 shadow-sm
            lg:grid-cols-2
          `}
        >
          <div>
            <h2 className="mb-6 text-xl font-semibold text-blue-900">
              職員情報
            </h2>
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="mb-2 block">
                  職員名 <RequirementBadge>必須</RequirementBadge>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  blockSize="md"
                  className="w-full"
                />
                {errors.name && (
                  <ErrorText className="mt-1">{errors.name}</ErrorText>
                )}
              </div>
              <div>
                <Label htmlFor="email" className="mb-2 block">
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  blockSize="md"
                  className="w-full"
                  placeholder="example@example.com"
                />
                {errors.email && (
                  <ErrorText className="mt-1">{errors.email}</ErrorText>
                )}
              </div>
            </div>
          </div>
          <div>
            <StaffLocationMap ref={mapRef} staffId={staff.id} editable={true} initialLocations={staffLocations} />
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      <Dialog ref={deleteDialogRef}>
        <DialogBody>
          <h3 className="mb-4 text-lg font-semibold text-blue-900">
            職員を削除しますか？
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
    </div>
  );
}
