'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faChevronDown,
  faChevronRight,
  faEye,
  faEyeSlash,
  faFire,
  faTimes,
  faChartPie,
  faCircleNodes,
  faObjectGroup,
  faMapMarkerAlt,
  faRobot,
} from '@fortawesome/free-solid-svg-icons';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSetAtom } from 'jotai';
import {
  sharedFacilityLayerVisibleAtom,
  aiLandmarkLayerVisibleAtom,
} from '@/features/map/atoms/facilityLayerVisibilityAtom';
import AnalysisChatContainer from '@/features/analysis/components/chat/AnalysisChatContainer';
import type { LayerContext } from '@/features/analysis/hooks/useAnalysisChat';
import MapStatisticsPanel from '@/features/map/components/MapStatisticsPanel';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  ANIMAL_TYPES,
  ANIMAL_CATEGORY_GROUPS,
  type AnimalTypeConfig,
  type AnimalTypeValue,
} from '@/server/domain/constants/animalTypes';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import {
  REPORT_STATUS_LABELS,
  type ReportStatusValue,
} from '@/server/domain/constants/reportStatuses';
import { Z_MAP_PANEL } from '@/constants/z-index';

/** ステータスの色定義（Tailwindのカスタム色に合わせて） */
const STATUS_COLORS: Record<ReportStatusValue, string> = {
  waiting: '#EC0000', // error-1
  completed: '#0057DB', // blue-600
};

/** 可視化レイヤーの種類 */
export type VisualizationLayer = 'cluster' | 'heatmap';

/** タブの種類 */
export type LayerTab = 'layers' | 'ai' | 'statistics';

interface LayerState {
  statuses: Record<ReportStatusValue, boolean>;
  animalTypes: Record<AnimalTypeValue, boolean>;
  visualizations: Record<VisualizationLayer, boolean>;
  staffIds?: Record<string, boolean>;
  /** クラスタリング（グルーピング）が有効か */
  clustering?: boolean;
  /** 共有施設レイヤーの表示 */
  sharedFacilities?: boolean;
  /** AI検索ランドマークレイヤーの表示 */
  aiLandmarks?: boolean;
}

interface MapLayerPanelProps {
  /** 現在のレイヤー状態 */
  layers: LayerState;
  /** レイヤー状態変更時のコールバック */
  onLayerChange: (layers: LayerState) => void;
  /** パネル開閉状態 */
  isOpen: boolean;
  /** パネル開閉切り替え */
  onToggle: () => void;

  /** 各獣種の件数 */
  animalCounts?: Record<AnimalTypeValue, number>;
  /** 各ステータスの件数 */
  statusCounts?: Record<ReportStatusValue, number>;
  /** データパネル開閉状態 */
  dataPanelOpen?: boolean;
  /** データパネル開閉切り替え */
  onDataPanelToggle?: () => void;
  /** 地図モード: default / timeline */
  mapMode?: 'default' | 'timeline';
  /** 地図モード切り替え */
  onMapModeToggle?: () => void;
  /** パネルの初期幅（px） */
  initialWidth?: number;
  /** 幅変更時のコールバック */
  onWidthChange?: (width: number) => void;
  /** 現在のアクティブタブ（制御用） */
  activeTab?: LayerTab;
  /** タブ変更時のコールバック（制御用） */
  onTabChange?: (tab: LayerTab) => void;
  /** 有効な獣種一覧（指定時はこの獣種のみ表示） */
  enabledAnimalTypes?: AnimalTypeConfig[];
  /** 分析AIのおすすめ質問（システム設定から取得） */
  suggestedQuestions?: string[];
  /** 管理者モードか */
  isAdmin?: boolean;
  /** 職員マスタ（管理者モード時、職員フィルター用） */
  staffs?: StaffDto[];
  /** 各職員の担当通報件数 */
  staffCounts?: Record<string, number>;
  /** フィルタ済み通報データ（統計パネル用） */
  filteredReports?: ReportDto[];
  /** エリアクリック時のコールバック（地図のflyTo用） */
  onAreaClick?: (lat: number, lng: number) => void;
  /** AIフィルター変更時のコールバック */
  onAiFilterChange?: (filters: Record<string, unknown>) => void;
}

/**
 * GIS風レイヤーパネルコンポーネント
 * ステータスと獣種でレイヤーのオン/オフを制御
 */
const MapLayerPanel = ({
  layers,
  onLayerChange,
  isOpen,
  onToggle,

  animalCounts,
  statusCounts,
  dataPanelOpen = false,
  onDataPanelToggle,
  mapMode = 'default',
  onMapModeToggle,
  initialWidth,
  onWidthChange,
  activeTab: controlledActiveTab,
  onTabChange,
  enabledAnimalTypes,
  suggestedQuestions,
  isAdmin = false,
  staffs,
  staffCounts,
  filteredReports,
  onAreaClick,
  onAiFilterChange,
}: MapLayerPanelProps) => {
  const setSharedFacilityVisible = useSetAtom(sharedFacilityLayerVisibleAtom);
  const setAiLandmarkVisible = useSetAtom(aiLandmarkLayerVisibleAtom);

  // layers の施設表示フラグを atom に同期
  useEffect(() => {
    setSharedFacilityVisible(layers.sharedFacilities !== false);
  }, [layers.sharedFacilities, setSharedFacilityVisible]);

  useEffect(() => {
    setAiLandmarkVisible(layers.aiLandmarks !== false);
  }, [layers.aiLandmarks, setAiLandmarkVisible]);

  const [statusGroupOpen, setStatusGroupOpen] = useState(true);
  const [animalGroupOpen, setAnimalGroupOpen] = useState(true);
  const [visualizationGroupOpen, setVisualizationGroupOpen] = useState(true);
  const [staffGroupOpen, setStaffGroupOpen] = useState(true);
  const [facilityGroupOpen, setFacilityGroupOpen] = useState(true);
  const [categoryGroupOpen, setCategoryGroupOpen] = useState<
    Record<string, boolean>
  >({});
  // タブ状態（制御/非制御ハイブリッド）
  const [internalActiveTab, setInternalActiveTab] =
    useState<LayerTab>('layers');
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tab: LayerTab) => {
    onTabChange?.(tab);
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
  };
  const [width, setWidth] = useState<number>(initialWidth ?? 384);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // スマホ判定（sm: 640px未満）
  const isMobile = !useMediaQuery('(min-width: 640px)');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 親からのinitialWidth変更を内部stateに同期
    setWidth(initialWidth ?? 384);
  }, [initialWidth]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX; // 左に動かすとプラス
      const newWidth = Math.max(
        200,
        Math.min(window.innerWidth - 200, startWidthRef.current + deltaX)
      );
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onWidthChange?.(width);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, width, onWidthChange]);

  // 獣種ごとの件数が渡された場合、総件数を算出して表示に使う
  const totalReportsCount = animalCounts
    ? Object.values(animalCounts).reduce((acc, v) => acc + v, 0)
    : undefined;

  // enabledAnimalTypes が指定されている場合、そのキーのセットを作成
  const enabledKeySet = useMemo(
    () =>
      enabledAnimalTypes ? new Set(enabledAnimalTypes.map((c) => c.id)) : null,
    [enabledAnimalTypes]
  );

  // カテゴリグループを enabledAnimalTypes でフィルタリング
  const filteredCategoryGroups = useMemo(
    () =>
      ANIMAL_CATEGORY_GROUPS.map((group) => ({
        ...group,
        keys: enabledKeySet
          ? group.keys.filter((key) => enabledKeySet.has(key))
          : group.keys,
      })).filter((group) => group.keys.length > 0),
    [enabledKeySet]
  );

  /** ステータスレイヤーの切り替え */
  const toggleStatus = (status: ReportStatusValue) => {
    onLayerChange({
      ...layers,
      statuses: {
        ...layers.statuses,
        [status]: !layers.statuses[status],
      },
    });
  };

  /** 獣種レイヤーの切り替え */
  const toggleAnimalType = (animalType: AnimalTypeValue) => {
    onLayerChange({
      ...layers,
      animalTypes: {
        ...layers.animalTypes,
        [animalType]: !layers.animalTypes[animalType],
      },
    });
  };

  /** 可視化レイヤーの切り替え */
  const toggleVisualization = (visualization: VisualizationLayer) => {
    onLayerChange({
      ...layers,
      visualizations: {
        ...layers.visualizations,
        [visualization]: !layers.visualizations[visualization],
      },
    });
  };

  /** ステータスグループ全体の切り替え */
  const toggleAllStatuses = () => {
    const allEnabled = Object.values(layers.statuses).every(Boolean);
    const newStatuses = Object.keys(layers.statuses).reduce(
      (acc, key) => ({
        ...acc,
        [key]: !allEnabled,
      }),
      {} as Record<ReportStatusValue, boolean>
    );
    onLayerChange({ ...layers, statuses: newStatuses });
  };

  /** 獣種グループ全体の切り替え */
  const toggleAllAnimalTypes = () => {
    const allEnabled = Object.values(layers.animalTypes).every(Boolean);
    const newAnimalTypes = Object.keys(layers.animalTypes).reduce(
      (acc, key) => ({
        ...acc,
        [key]: !allEnabled,
      }),
      {} as Record<AnimalTypeValue, boolean>
    );
    onLayerChange({ ...layers, animalTypes: newAnimalTypes });
  };

  /** カテゴリ内の獣種を一括切り替え */
  const toggleCategoryAnimalTypes = (keys: AnimalTypeValue[]) => {
    const allEnabled = keys.every((key) => layers.animalTypes[key]);
    const newAnimalTypes = { ...layers.animalTypes };
    keys.forEach((key) => {
      newAnimalTypes[key] = !allEnabled;
    });
    onLayerChange({ ...layers, animalTypes: newAnimalTypes });
  };

  /** 職員フィルターの切り替え */
  const toggleStaffId = (staffId: string) => {
    const currentStaffIds = layers.staffIds ?? {};
    onLayerChange({
      ...layers,
      staffIds: {
        ...currentStaffIds,
        [staffId]: !(currentStaffIds[staffId] ?? true),
      },
    });
  };

  /** 職員フィルター全体の切り替え */
  const toggleAllStaffs = () => {
    const currentStaffIds = layers.staffIds ?? {};
    const allEnabled =
      staffs?.every((s) => currentStaffIds[s.id] ?? true) ?? true;
    const newStaffIds: Record<string, boolean> = {};
    staffs?.forEach((s) => {
      newStaffIds[s.id] = !allEnabled;
    });
    // 未割当も含める
    newStaffIds['__unassigned__'] = !allEnabled;
    onLayerChange({ ...layers, staffIds: newStaffIds });
  };

  // AIチャット用のレイヤーコンテキストを構築
  const layerContext: LayerContext | undefined = useMemo(() => {
    if (!isAdmin) return undefined;

    const activeStatuses = Object.entries(layers.statuses)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    const activeAnimalTypes = Object.entries(layers.animalTypes)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);

    let activeStaffIds: string[] | null = null;
    if (layers.staffIds) {
      const allEnabled = Object.values(layers.staffIds).every(Boolean);
      if (!allEnabled) {
        activeStaffIds = Object.entries(layers.staffIds)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key);
      }
    }

    return { activeStatuses, activeAnimalTypes, activeStaffIds };
  }, [isAdmin, layers.statuses, layers.animalTypes, layers.staffIds]);

  return (
    <>
      {/* パネル閉じた状態のトグルボタン */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={`
            absolute top-4 right-4 flex size-12 items-center justify-center
            rounded-lg bg-white shadow-lg transition-colors
            hover:bg-solid-gray-50
          `}
          style={{ zIndex: Z_MAP_PANEL }}
          aria-label="レイヤーパネルを開く"
        >
          <FontAwesomeIcon
            icon={faLayerGroup}
            className="size-5 text-solid-gray-700"
          />
        </button>
      )}

    <div
      className={`
        absolute top-0 right-0 flex h-full flex-col border-l
        border-solid-gray-200 bg-white shadow-lg
        ${!isOpen ? 'hidden' : ''}
      `}
      style={{
        zIndex: Z_MAP_PANEL,
        width: isMobile ? '100%' : `${width}px`,
      }}
    >
      {/* 左端のリサイズハンドル */}
      <div
        onMouseDown={handleMouseDownResize}
        className={`
          absolute top-0 bottom-0 left-0 z-20 -ml-2 w-2 cursor-ew-resize
        `}
        aria-hidden={true}
      />
      {/* ヘッダー */}
      <div
        className={`
          flex shrink-0 items-center gap-2 border-b border-solid-gray-200 px-4
          py-3
        `}
      >
        {/* タブ */}
        <div
          className={`flex flex-1 items-center gap-1 rounded-md bg-transparent`}
        >
          <button
            onClick={() => setActiveTab('layers')}
            className={`
              flex flex-1 items-center justify-center gap-1.5 rounded-md px-2
              py-1 text-sm font-semibold whitespace-nowrap transition-colors
              ${
                activeTab === 'layers'
                  ? 'bg-solid-gray-100 text-solid-gray-900'
                  : `
                    text-solid-gray-600
                    hover:bg-solid-gray-50
                  `
              }
            `}
          >
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="size-3.5 shrink-0"
            />
            レイヤー
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`
              flex flex-1 items-center justify-center gap-1.5 rounded-md px-2
              py-1 text-sm font-semibold whitespace-nowrap transition-colors
              ${
                activeTab === 'statistics'
                  ? 'bg-solid-gray-100 text-solid-gray-900'
                  : `
                    text-solid-gray-600
                    hover:bg-solid-gray-50
                  `
              }
            `}
          >
            <FontAwesomeIcon icon={faChartPie} className="size-3.5 shrink-0" />
            統計
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('ai')}
              className={`
                flex flex-1 items-center justify-center gap-1.5 rounded-md px-2
                py-1 text-sm font-semibold whitespace-nowrap transition-colors
                ${
                  activeTab === 'ai'
                    ? 'bg-solid-gray-100 text-solid-gray-900'
                    : `
                      text-solid-gray-600
                      hover:bg-solid-gray-50
                    `
                }
              `}
            >
              <FontAwesomeIcon
                icon={faCircleNodes}
                className={`size-3.5 shrink-0`}
              />
              分析AI
            </button>
          )}
        </div>
        {/* 閉じるボタン（右側） */}
        <button
          onClick={onToggle}
          className={`
            shrink-0 rounded p-1 transition-colors
            hover:bg-solid-gray-100
          `}
          aria-label="レイヤーパネルを閉じる"
        >
          <FontAwesomeIcon
            icon={faTimes}
            className="size-4 text-solid-gray-600"
          />
        </button>
      </div>

      {/* 本文：レイヤー / AI / ツール / 管理 */}
      {/* レイヤータブ（表示） */}
      {activeTab === 'layers' && (
        <>
          {/* レイヤーリスト */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* 通報ステータスグループ */}
            <div className="mb-4">
              <div
                className={`
                  flex w-full items-center justify-between rounded px-2 py-1.5
                  transition-colors
                  hover:bg-solid-gray-50
                `}
              >
                <button
                  onClick={() => setStatusGroupOpen(!statusGroupOpen)}
                  className="flex flex-1 items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={statusGroupOpen ? faChevronDown : faChevronRight}
                    className="size-3 text-solid-gray-500"
                  />
                  <span className="text-sm font-semibold text-solid-gray-800">
                    通報ステータス
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAllStatuses();
                  }}
                  className={`
                    rounded px-1.5 py-0.5 text-xs transition-colors
                    hover:bg-solid-gray-200
                  `}
                  aria-label="ステータス全切替"
                >
                  <FontAwesomeIcon
                    icon={
                      Object.values(layers.statuses).every(Boolean)
                        ? faEye
                        : faEyeSlash
                    }
                    className="size-3 text-solid-gray-500"
                  />
                </button>
              </div>

              {statusGroupOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  {(
                    Object.entries(REPORT_STATUS_LABELS) as [
                      ReportStatusValue,
                      string,
                    ][]
                  ).map(([status, label]) => (
                    <label
                      key={status}
                      className={`
                        flex cursor-pointer items-center gap-2 rounded px-2
                        py-1.5 transition-colors
                        hover:bg-solid-gray-50
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={layers.statuses[status]}
                        onChange={() => toggleStatus(status)}
                        className="sr-only"
                      />
                      <div
                        className={`
                          flex size-4 items-center justify-center rounded
                          border-2 transition-colors
                        `}
                        style={{
                          borderColor: STATUS_COLORS[status],
                          backgroundColor: layers.statuses[status]
                            ? STATUS_COLORS[status]
                            : 'transparent',
                        }}
                      >
                        {layers.statuses[status] && (
                          <svg
                            className="size-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-solid-gray-700">
                        {label}
                      </span>
                      {/** ステータス別件数をラベル横に表示 */}
                      {typeof statusCounts !== 'undefined' && (
                        <span className="ml-2 text-xs text-solid-gray-500">
                          ({statusCounts[status] ?? 0})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 職員フィルターグループ（管理者のみ） */}
            {isAdmin && staffs && staffs.length > 0 && (
              <div className="mb-4">
                <div
                  className={`
                    flex w-full items-center justify-between rounded px-2 py-1.5
                    transition-colors
                    hover:bg-solid-gray-50
                  `}
                >
                  <button
                    onClick={() => setStaffGroupOpen(!staffGroupOpen)}
                    className="flex flex-1 items-center gap-2"
                  >
                    <FontAwesomeIcon
                      icon={staffGroupOpen ? faChevronDown : faChevronRight}
                      className="size-3 text-solid-gray-500"
                    />
                    <span className="text-sm font-semibold text-solid-gray-800">
                      担当職員
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAllStaffs();
                    }}
                    className={`
                      rounded px-1.5 py-0.5 text-xs transition-colors
                      hover:bg-solid-gray-200
                    `}
                    aria-label="職員全切替"
                  >
                    <FontAwesomeIcon
                      icon={
                        staffs.every(
                          (s) => (layers.staffIds ?? {})[s.id] ?? true
                        ) &&
                        ((layers.staffIds ?? {})['__unassigned__'] ?? true)
                          ? faEye
                          : faEyeSlash
                      }
                      className="size-3 text-solid-gray-500"
                    />
                  </button>
                </div>

                {staffGroupOpen && (
                  <div className="mt-1 ml-4 space-y-1">
                    {/* 未割当 */}
                    <label
                      className={`
                        flex cursor-pointer items-center gap-2 rounded px-2
                        py-1.5 transition-colors
                        hover:bg-solid-gray-50
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={
                          (layers.staffIds ?? {})['__unassigned__'] ?? true
                        }
                        onChange={() => toggleStaffId('__unassigned__')}
                        className="sr-only"
                      />
                      <div
                        className={`
                          flex size-4 items-center justify-center rounded
                          border-2 transition-colors
                        `}
                        style={{
                          borderColor: '#6b7280',
                          backgroundColor:
                            ((layers.staffIds ?? {})['__unassigned__'] ?? true)
                              ? '#6b7280'
                              : 'transparent',
                        }}
                      >
                        {((layers.staffIds ?? {})['__unassigned__'] ??
                          true) && (
                          <svg
                            className="size-3 text-white"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm text-solid-gray-700">
                        未割当
                      </span>
                      {staffCounts && (
                        <span className="ml-1 text-xs text-solid-gray-500">
                          ({staffCounts['__unassigned__'] ?? 0})
                        </span>
                      )}
                    </label>

                    {/* 各職員 */}
                    {staffs.map((staff) => {
                      const checked = (layers.staffIds ?? {})[staff.id] ?? true;
                      return (
                        <label
                          key={staff.id}
                          className={`
                            flex cursor-pointer items-center gap-2 rounded px-2
                            py-1.5 transition-colors
                            hover:bg-solid-gray-50
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleStaffId(staff.id)}
                            className="sr-only"
                          />
                          <div
                            className={`
                              flex size-4 items-center justify-center rounded
                              border-2 transition-colors
                            `}
                            style={{
                              borderColor: '#059669',
                              backgroundColor: checked
                                ? '#059669'
                                : 'transparent',
                            }}
                          >
                            {checked && (
                              <svg
                                className="size-3 text-white"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6L5 9L10 3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-solid-gray-700">
                            {staff.name}
                          </span>
                          {staffCounts && (
                            <span className="ml-1 text-xs text-solid-gray-500">
                              ({staffCounts[staff.id] ?? 0})
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 表示レイヤーグループ */}
            <div>
              <div
                className={`
                  flex w-full items-center justify-between rounded px-2 py-1.5
                  transition-colors
                  hover:bg-solid-gray-50
                `}
              >
                <button
                  onClick={() =>
                    setVisualizationGroupOpen(!visualizationGroupOpen)
                  }
                  className="flex flex-1 items-center gap-2"
                >
                  <FontAwesomeIcon
                    icon={
                      visualizationGroupOpen ? faChevronDown : faChevronRight
                    }
                    className="size-3 text-solid-gray-500"
                  />
                  <span className="text-sm font-semibold text-solid-gray-800">
                    表示レイヤー
                  </span>
                </button>
              </div>

              {visualizationGroupOpen && (
                <div className="mt-1 ml-4 space-y-1">
                  <label
                    className={`
                      flex cursor-pointer items-center gap-2 rounded px-2 py-1.5
                      transition-colors
                      hover:bg-solid-gray-50
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={layers.visualizations.heatmap}
                      onChange={() => toggleVisualization('heatmap')}
                      className="sr-only"
                    />
                    <div
                      className={`
                        flex size-4 items-center justify-center rounded border-2
                        transition-colors
                        ${
                          layers.visualizations.heatmap
                            ? 'border-orange-600 bg-orange-600'
                            : 'border-solid-gray-400'
                        }
                      `}
                    >
                      {layers.visualizations.heatmap && (
                        <svg
                          className="size-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`
                        flex items-center gap-1.5 text-sm text-solid-gray-700
                      `}
                    >
                      <FontAwesomeIcon
                        icon={faFire}
                        className="size-3.5 text-orange-600"
                        aria-hidden="true"
                      />
                      ヒートマップ
                    </span>
                  </label>

                  {/* クラスタリング */}
                  <label
                    className={`
                      flex cursor-pointer items-center gap-2 rounded px-2 py-1.5
                      transition-colors
                      hover:bg-solid-gray-50
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={layers.clustering !== false}
                      onChange={() =>
                        onLayerChange({
                          ...layers,
                          clustering: !(layers.clustering !== false),
                        })
                      }
                      className="sr-only"
                    />
                    <div
                      className={`
                        flex size-4 items-center justify-center rounded border-2
                        transition-colors
                        ${
                          layers.clustering !== false
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-solid-gray-400'
                        }
                      `}
                    >
                      {layers.clustering !== false && (
                        <svg
                          className="size-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6L5 9L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`
                        flex items-center gap-1.5 text-sm text-solid-gray-700
                      `}
                    >
                      <FontAwesomeIcon
                        icon={faObjectGroup}
                        className="size-3.5 text-purple-600"
                        aria-hidden="true"
                      />
                      クラスタリング
                    </span>
                  </label>

                  {/* 周辺施設（ツリー構造） */}
                  <div>
                    <div
                      className={`
                        flex items-center gap-2 rounded px-2 py-1.5
                        transition-colors
                        hover:bg-solid-gray-50
                      `}
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={
                            layers.sharedFacilities !== false ||
                            layers.aiLandmarks !== false
                          }
                          ref={(el) => {
                            if (el) {
                              const sharedOn =
                                layers.sharedFacilities !== false;
                              const aiOn = layers.aiLandmarks !== false;
                              el.indeterminate = sharedOn !== aiOn;
                            }
                          }}
                          onChange={() => {
                            const allOn =
                              layers.sharedFacilities !== false &&
                              layers.aiLandmarks !== false;
                            onLayerChange({
                              ...layers,
                              sharedFacilities: !allOn,
                              aiLandmarks: !allOn,
                            });
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`
                            flex size-4 items-center justify-center rounded
                            border-2 transition-colors
                            ${
                              layers.sharedFacilities !== false &&
                              layers.aiLandmarks !== false
                                ? 'border-violet-600 bg-violet-600'
                                : layers.sharedFacilities !== false ||
                                    layers.aiLandmarks !== false
                                  ? 'border-violet-600 bg-violet-300'
                                  : 'border-solid-gray-400'
                            }
                          `}
                        >
                          {layers.sharedFacilities !== false &&
                            layers.aiLandmarks !== false && (
                              <svg
                                className="size-3 text-white"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6L5 9L10 3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          {(layers.sharedFacilities !== false) !==
                            (layers.aiLandmarks !== false) && (
                            <svg
                              className="size-3 text-white"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6H10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                      <button
                        onClick={() => setFacilityGroupOpen(!facilityGroupOpen)}
                        className="flex items-center"
                      >
                        <FontAwesomeIcon
                          icon={
                            facilityGroupOpen ? faChevronDown : faChevronRight
                          }
                          className="size-2.5 text-solid-gray-500"
                        />
                      </button>
                      <span
                        className={`
                          flex flex-1 items-center gap-1.5 text-sm
                          text-solid-gray-700
                        `}
                      >
                        周辺施設
                      </span>
                    </div>

                    {facilityGroupOpen && (
                      <div
                        className={`
                          mt-1 ml-6 space-y-0.5 border-l-2 border-solid-gray-200
                          pl-3
                        `}
                      >
                        {/* 登録済み周辺施設 */}
                        <label
                          className={`
                            flex cursor-pointer items-center gap-2 rounded px-2
                            py-1 transition-colors
                            hover:bg-solid-gray-50
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={layers.sharedFacilities !== false}
                            onChange={() =>
                              onLayerChange({
                                ...layers,
                                sharedFacilities: !(
                                  layers.sharedFacilities !== false
                                ),
                              })
                            }
                            className="sr-only"
                          />
                          <div
                            className={`
                              flex size-4 items-center justify-center rounded
                              border-2 transition-colors
                              ${
                                layers.sharedFacilities !== false
                                  ? 'border-violet-600 bg-violet-600'
                                  : 'border-solid-gray-400'
                              }
                            `}
                          >
                            {layers.sharedFacilities !== false && (
                              <svg
                                className="size-3 text-white"
                                viewBox="0 0 12 12"
                                fill="none"
                              >
                                <path
                                  d="M2 6L5 9L10 3"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm text-solid-gray-700">
                            登録済み
                          </span>
                        </label>

                        {/* AI検索周辺施設 */}
                        {isAdmin && (
                          <label
                            className={`
                              flex cursor-pointer items-center gap-2 rounded
                              px-2 py-1 transition-colors
                              hover:bg-solid-gray-50
                            `}
                          >
                            <input
                              type="checkbox"
                              checked={layers.aiLandmarks !== false}
                              onChange={() =>
                                onLayerChange({
                                  ...layers,
                                  aiLandmarks: !(layers.aiLandmarks !== false),
                                })
                              }
                              className="sr-only"
                            />
                            <div
                              className={`
                                flex size-4 items-center justify-center rounded
                                border-2 transition-colors
                                ${
                                  layers.aiLandmarks !== false
                                    ? 'border-indigo-500 bg-indigo-500'
                                    : 'border-solid-gray-400'
                                }
                              `}
                            >
                              {layers.aiLandmarks !== false && (
                                <svg
                                  className="size-3 text-white"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                >
                                  <path
                                    d="M2 6L5 9L10 3"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`
                                flex items-center gap-1.5 text-sm
                                text-solid-gray-700
                              `}
                            >
                              AI検索
                              <span className="text-[10px] text-solid-gray-400">
                                (一時)
                              </span>
                            </span>
                          </label>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 通報地点（ツリー構造） */}
                  <div>
                    <div
                      className={`
                        flex items-center gap-2 rounded px-2 py-1.5
                        transition-colors
                        hover:bg-solid-gray-50
                      `}
                    >
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={layers.visualizations.cluster}
                          onChange={() => toggleVisualization('cluster')}
                          className="sr-only"
                        />
                        <div
                          className={`
                            flex size-4 items-center justify-center rounded
                            border-2 transition-colors
                            ${
                              layers.visualizations.cluster
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-solid-gray-400'
                            }
                          `}
                        >
                          {layers.visualizations.cluster && (
                            <svg
                              className="size-3 text-white"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                      <button
                        onClick={() => setAnimalGroupOpen(!animalGroupOpen)}
                        className="flex items-center"
                      >
                        <FontAwesomeIcon
                          icon={
                            animalGroupOpen ? faChevronDown : faChevronRight
                          }
                          className="size-2.5 text-solid-gray-500"
                        />
                      </button>
                      <span className="flex-1 text-sm text-solid-gray-700">
                        通報地点
                        {typeof totalReportsCount === 'number' && (
                          <span className="ml-2 text-xs text-solid-gray-500">
                            ({totalReportsCount})
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAllAnimalTypes();
                        }}
                        className={`
                          rounded px-1.5 py-0.5 text-xs transition-colors
                          hover:bg-solid-gray-200
                        `}
                        aria-label="獣種全切替"
                      >
                        <FontAwesomeIcon
                          icon={
                            Object.values(layers.animalTypes).every(Boolean)
                              ? faEye
                              : faEyeSlash
                          }
                          className="size-3 text-solid-gray-500"
                        />
                      </button>
                    </div>

                    {/* 獣種フィルター（カテゴリグループ構造） */}
                    {animalGroupOpen && (
                      <div
                        className={`
                          mt-1 ml-6 space-y-1 border-l-2 border-solid-gray-200
                          pl-3
                        `}
                      >
                        {filteredCategoryGroups.map((group) => {
                          const isCategoryOpen =
                            categoryGroupOpen[group.category] ?? true;
                          const allInGroupEnabled = group.keys.every(
                            (key) => layers.animalTypes[key]
                          );
                          const someInGroupEnabled = group.keys.some(
                            (key) => layers.animalTypes[key]
                          );
                          const groupCount = animalCounts
                            ? group.keys.reduce(
                                (sum, key) => sum + (animalCounts[key] ?? 0),
                                0
                              )
                            : undefined;

                          return (
                            <div key={group.category}>
                              {/* カテゴリヘッダー */}
                              <div
                                className={`
                                  flex items-center gap-2 rounded px-2 py-1
                                  transition-colors
                                  hover:bg-solid-gray-50
                                `}
                              >
                                <label
                                  className={`
                                    flex cursor-pointer items-center gap-2
                                  `}
                                >
                                  <input
                                    type="checkbox"
                                    checked={allInGroupEnabled}
                                    ref={(el) => {
                                      if (el) {
                                        el.indeterminate =
                                          someInGroupEnabled &&
                                          !allInGroupEnabled;
                                      }
                                    }}
                                    onChange={() =>
                                      toggleCategoryAnimalTypes(group.keys)
                                    }
                                    className="sr-only"
                                  />
                                  <div
                                    className={`
                                      flex size-4 items-center justify-center
                                      rounded border-2 transition-colors
                                      ${
                                        allInGroupEnabled
                                          ? 'border-blue-600 bg-blue-600'
                                          : someInGroupEnabled
                                            ? 'border-blue-600 bg-blue-300'
                                            : 'border-solid-gray-400'
                                      }
                                    `}
                                  >
                                    {allInGroupEnabled && (
                                      <svg
                                        className="size-3 text-white"
                                        viewBox="0 0 12 12"
                                        fill="none"
                                      >
                                        <path
                                          d="M2 6L5 9L10 3"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    )}
                                    {someInGroupEnabled &&
                                      !allInGroupEnabled && (
                                        <svg
                                          className="size-3 text-white"
                                          viewBox="0 0 12 12"
                                          fill="none"
                                        >
                                          <path
                                            d="M2 6H10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                          />
                                        </svg>
                                      )}
                                  </div>
                                </label>
                                <button
                                  onClick={() =>
                                    setCategoryGroupOpen((prev) => ({
                                      ...prev,
                                      [group.category]: !isCategoryOpen,
                                    }))
                                  }
                                  className="flex items-center"
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      isCategoryOpen
                                        ? faChevronDown
                                        : faChevronRight
                                    }
                                    className="size-2.5 text-solid-gray-500"
                                  />
                                </button>
                                <span
                                  className={`
                                    flex-1 text-xs font-semibold
                                    text-solid-gray-600
                                  `}
                                >
                                  {group.label}
                                  {typeof groupCount === 'number' && (
                                    <span
                                      className={`
                                        ml-1 font-normal text-solid-gray-500
                                      `}
                                    >
                                      ({groupCount})
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* カテゴリ内の獣種リスト */}
                              {isCategoryOpen && (
                                <div className="ml-6 space-y-0.5">
                                  {group.keys.map((type) => {
                                    const config = ANIMAL_TYPES[type];
                                    return (
                                      <label
                                        key={type}
                                        className={`
                                          flex cursor-pointer items-center gap-2
                                          rounded px-2 py-1 transition-colors
                                          hover:bg-solid-gray-50
                                        `}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={layers.animalTypes[type]}
                                          onChange={() =>
                                            toggleAnimalType(type)
                                          }
                                          className="sr-only"
                                        />
                                        <div
                                          className={`
                                            flex size-4 items-center
                                            justify-center rounded border-2
                                            transition-colors
                                          `}
                                          style={{
                                            borderColor: config.color,
                                            backgroundColor: layers.animalTypes[
                                              type
                                            ]
                                              ? config.color
                                              : 'transparent',
                                          }}
                                        >
                                          {layers.animalTypes[type] && (
                                            <svg
                                              className="size-3 text-white"
                                              viewBox="0 0 12 12"
                                              fill="none"
                                            >
                                              <path
                                                d="M2 6L5 9L10 3"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          )}
                                        </div>
                                        <span className="mr-1 text-base">
                                          {config.emoji}
                                        </span>
                                        <span
                                          className={`
                                            text-sm text-solid-gray-700
                                          `}
                                        >
                                          {config.label}
                                        </span>
                                        {animalCounts && (
                                          <span
                                            className={`
                                              ml-1 text-xs text-solid-gray-500
                                            `}
                                          >
                                            ({animalCounts[type] ?? 0})
                                          </span>
                                        )}
                                      </label>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* フッター（トップへのリンク） */}
          <div className="shrink-0 space-y-2 border-t border-solid-gray-200 p-4">
            {/* タイムライン切り替えボタン */}
            {onMapModeToggle && (
              <button
                onClick={onMapModeToggle}
                className={`
                  flex w-full items-center justify-center gap-2 rounded-lg px-4
                  py-2 text-sm font-medium transition-colors
                  ${
                    mapMode === 'timeline'
                      ? `
                        bg-blue-100 text-blue-700
                        hover:bg-blue-200
                      `
                      : `
                        bg-solid-gray-100 text-solid-gray-700
                        hover:bg-solid-gray-200
                      `
                  }
                `}
              >
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {mapMode === 'timeline'
                  ? 'タイムライン表示中'
                  : 'タイムライン表示'}
              </button>
            )}

            {/* データテーブルトグルボタン */}
            {onDataPanelToggle && (
              <button
                onClick={onDataPanelToggle}
                className={`
                  flex w-full items-center justify-center gap-2 rounded-lg px-4
                  py-2 text-sm font-medium transition-colors
                  ${
                    dataPanelOpen
                      ? `
                        bg-solid-gray-200 text-solid-gray-800
                        hover:bg-solid-gray-300
                      `
                      : `
                        bg-solid-gray-100 text-solid-gray-700
                        hover:bg-solid-gray-200
                      `
                  }
                `}
              >
                <svg
                  className="size-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {dataPanelOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  )}
                </svg>
                データテーブル
              </button>
            )}
          </div>
        </>
      )}

      {/* 統計分析タブ */}
      {activeTab === 'statistics' && filteredReports && (
        <MapStatisticsPanel
          filteredReports={filteredReports}
          onAreaClick={onAreaClick}
        />
      )}

      {/* AIチャット（管理者のみ。CSS表示/非表示でチャット履歴を保持） */}
      {isAdmin && (
        <div
          className={`
            flex-1 overflow-hidden
            ${activeTab === 'ai' ? '' : 'hidden'}
          `}
        >
          <AnalysisChatContainer
            suggestedQuestions={suggestedQuestions}
            layerContext={layerContext}
            onFilterChange={onAiFilterChange}
          />
        </div>
      )}
    </div>
    </>
  );
};

export default MapLayerPanel;

export type { LayerState };
