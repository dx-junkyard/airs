'use client';

import {
  useMemo,
  useState,
  useCallback,
  useSyncExternalStore,
  useDeferredValue,
  useEffect,
  useRef,
} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAtomValue } from 'jotai';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import {
  useQueryStates,
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from 'nuqs';
import Button from '@/components/ui/Button/Button';
import Dialog from '@/components/ui/Dialog/Dialog';
import DialogBody from '@/components/ui/Dialog/DialogBody';
import type { ReportDto } from '@/server/application/dtos/ReportDto';
import type { StaffDto } from '@/server/application/dtos/StaffDto';
import type {
  AnimalTypeValue,
  AnimalTypeConfig,
} from '@/server/domain/constants/animalTypes';
import type { ReportStatusValue } from '@/server/domain/constants/reportStatuses';
import {
  DEFAULT_MAP_DEFAULT_DATA_RANGE,
  getMapDefaultDataRangeDateRange,
  type MapDefaultDataRangeValue,
} from '@/server/domain/constants/mapDefaultDataRange';
import { isAdminMode } from '@/config/admin-mode';
import { useReports } from '@/hooks/queries/useReports';
import { MAP_MIN_ZOOM, MAP_MAX_ZOOM, MAP_DEFAULT_ZOOM } from '@/constants/map';
import { Z_MAP_CONTROLS } from '@/constants/z-index';
import AiResetButton from '@/features/map/components/AiResetButton';
import MapLayerPanel, {
  type LayerState,
  type LayerTab,
} from '@/features/map/components/MapLayerPanel';
import ReportDataPanel from '@/features/map/components/ReportDataPanel';
import {
  mapDefaultDataRangeFromSettingAtom,
  defaultDisplayEndDateAtom,
} from '@/features/system-setting/atoms/systemSettingAtom';

// 地図コンポーネントはSSRを無効化して読み込み
const FullscreenReportMap = dynamic(
  () => import('@/features/map/components/FullscreenReportMap'),
  {
    ssr: false,
    loading: () => (
      <div
        className={`flex size-full items-center justify-center bg-solid-gray-50`}
      >
        <div className="text-solid-gray-600">地図を読み込み中...</div>
      </div>
    ),
  }
);

interface MapPageProps {
  /** 全通報データ */
  reports: ReportDto[];
  /** 親に埋め込まれる（高さを親に委ねる） */
  isEmbedded?: boolean;
  /** SSRで取得した有効獣種 */
  enabledAnimalTypes?: AnimalTypeConfig[];
  /** 分析AIのおすすめ質問（システム設定から取得） */
  suggestedQuestions?: string[];
  /** システム設定から取得したデフォルト中心座標 */
  defaultCenter?: { lat: number; lng: number };
  /** システム設定から取得した地図デフォルト表示期間 */
  mapDefaultDataRange?: MapDefaultDataRangeValue;
  /** 職員マスタ（管理者モード時、職員フィルター用） */
  staffs?: StaffDto[];
}

// Empty subscribe function for useSyncExternalStore (no subscription needed)
const emptySubscribe = () => () => {};

/**
 * Hook to detect if the component is running inside an iframe.
 * Uses useSyncExternalStore to avoid useEffect setState pattern.
 */
function useIsInIframe(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.self !== window.top,
    () => false // Server snapshot
  );
}

/**
 * 地図ページのメインクライアントコンポーネント
 * レイヤーパネル、地図、データパネルを統合
 * iframe埋め込みにも対応（embed=true または iframe内判定）
 */
const MapPage = ({
  reports: reportsProp,
  isEmbedded = false,
  enabledAnimalTypes = [],
  suggestedQuestions,
  defaultCenter,
  mapDefaultDataRange,
  staffs,
}: MapPageProps) => {
  // iframe内かどうかを判定
  const isInIframe = useIsInIframe();
  const mapDefaultDataRangeFromSetting = useAtomValue(
    mapDefaultDataRangeFromSettingAtom
  );
  const displayEndDate = useAtomValue(defaultDisplayEndDateAtom);
  // 選択された通報
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);


  // displayStaffs: 空文字=全表示、'none'=全非表示、カンマ区切り=指定職員のみ表示
  // 常に全職員表示をデフォルトとする
  const defaultDisplayStaffs = '';

  // URLクエリでレイヤー状態と地図状態を管理
  const [params, setParams] = useQueryStates(
    {
      // iframe埋め込みモード
      embed: parseAsBoolean.withDefault(false),
      // 表示モード（iframe用）
      mode: parseAsStringLiteral(['default', 'timeline'] as const).withDefault(
        'default'
      ),
      interaction: parseAsStringLiteral(['popup', 'none'] as const).withDefault(
        'popup'
      ),
      legend: parseAsBoolean.withDefault(true),
      fullscreen: parseAsBoolean.withDefault(true),
      // レイヤー状態（ステータス） - パネルまたはクエリで制御
      statusWaiting: parseAsBoolean.withDefault(true),
      statusCompleted: parseAsBoolean.withDefault(true),
      // レイヤー状態（獣種） - 非表示の獣種キーをカンマ区切りで保持
      hiddenAnimals: parseAsString.withDefault(''),
      // レイヤー状態（可視化）
      layerCluster: parseAsBoolean.withDefault(true),
      layerHeatmap: parseAsBoolean.withDefault(true),
      clustering: parseAsBoolean.withDefault(true),
      layerFacilities: parseAsBoolean.withDefault(true),
      layerAiLandmarks: parseAsBoolean.withDefault(true),
      // レイヤー状態（職員フィルター） - 表示する職員IDをカンマ区切りで保持（空=全表示、'none'=全非表示）
      displayStaffs: parseAsString.withDefault(defaultDisplayStaffs),
      // パネルのタブ
      tab: parseAsStringLiteral([
        'layers',
        'ai',
        'statistics',
        'tools',
        'admin',
      ] as const).withDefault('layers'),
      // パネル開閉状態
      panelOpen: parseAsBoolean.withDefault(true),
      dataPanelOpen: parseAsBoolean.withDefault(true),
      dataPanelHeight: parseAsInteger.withDefault(192), // データパネルの高さ（px）
      // レイヤーパネル幅（px）
      panelWidth: parseAsInteger.withDefault(384),
      // 地図状態
      startDate: parseAsString.withDefault(''),
      endDate: parseAsString.withDefault(''),
      lat: parseAsFloat,
      lng: parseAsFloat,
      zoom: parseAsInteger,
    },
    {
      history: 'replace',
      shallow: true,
    }
  );

  // iframe埋め込みモードの判定
  // isEmbedded（親に埋め込まれる）、params.embed、isInIframe のいずれかで埋め込みモード
  const isEmbedMode = isEmbedded || params.embed || isInIframe;
  const defaultRangePreset =
    mapDefaultDataRange ?? mapDefaultDataRangeFromSetting;
  const effectiveDefaultRangePreset = defaultRangePreset
    ? defaultRangePreset
    : DEFAULT_MAP_DEFAULT_DATA_RANGE;
  const defaultDateRange = useMemo(
    () => getMapDefaultDataRangeDateRange(effectiveDefaultRangePreset, new Date(), displayEndDate),
    [effectiveDefaultRangePreset, displayEndDate]
  );
  const hasUserDateFilter = Boolean(params.startDate || params.endDate);
  const activeStartDate = hasUserDateFilter
    ? params.startDate
    : (defaultDateRange.startDate ?? '');
  const activeEndDate = hasUserDateFilter
    ? params.endDate
    : (defaultDateRange.endDate ?? '');

  // 通報一覧を期間条件で再取得（スタンドアロン表示時のみ有効）
  // initialDataはデフォルト日付範囲の時のみ使用（ユーザーが日付変更した場合はサーバーから再取得）
  const { data: cachedReports } = useReports(
    undefined,
    !isEmbedded && !hasUserDateFilter ? reportsProp : undefined,
    {
      enabled: !isEmbedded,
      startDate: activeStartDate || undefined,
      endDate: activeEndDate || undefined,
    }
  );
  const reports = !isEmbedded && cachedReports ? cachedReports : reportsProp;

  // モバイルではレイヤーパネルをデフォルトで閉じる
  const initialPanelCloseRef = useRef(false);
  useEffect(() => {
    if (initialPanelCloseRef.current) return;
    initialPanelCloseRef.current = true;
    if (window.innerWidth < 768 && params.panelOpen) {
      setParams({ panelOpen: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時のみ実行
  }, []);

  // データパネル高さのローカルコピー（params の変更が反映されるまでの遅延を吸収）
  const [localDataPanelHeight, setLocalDataPanelHeight] = useState<number>(
    params.dataPanelHeight
  );

  // params 側が変わった場合はローカルを同期（外部から変更されたとき）
  useEffect(() => {
    setLocalDataPanelHeight(params.dataPanelHeight);
  }, [params.dataPanelHeight]);

  // hiddenAnimals パラメータからセットを作成
  const hiddenAnimalsSet = useMemo(
    () =>
      new Set(
        params.hiddenAnimals
          ? params.hiddenAnimals.split(',').filter(Boolean)
          : []
      ),
    [params.hiddenAnimals]
  );

  // displayStaffs パラメータからセットを作成（空=全表示、'none'=全非表示）
  const displayStaffsSet = useMemo(() => {
    if (params.displayStaffs === 'none') return new Set<string>(); // 明示的に全非表示
    if (!params.displayStaffs) return null; // null = 全表示
    return new Set(params.displayStaffs.split(',').filter(Boolean));
  }, [params.displayStaffs]);

  // LayerState形式に変換（有効獣種から動的に構築）
  const layers: LayerState = useMemo(() => {
    const animalTypes = {} as Record<AnimalTypeValue, boolean>;
    enabledAnimalTypes.forEach((t) => {
      animalTypes[t.id] = !hiddenAnimalsSet.has(t.id);
    });

    // 職員フィルター（admin時のみ）
    const staffIdsMap: Record<string, boolean> = {};
    if (isAdminMode && staffs) {
      staffs.forEach((s) => {
        staffIdsMap[s.id] =
          displayStaffsSet === null || displayStaffsSet.has(s.id);
      });
      staffIdsMap['__unassigned__'] =
        displayStaffsSet === null || displayStaffsSet.has('__unassigned__');
    }

    return {
      statuses: {
        waiting: params.statusWaiting,
        completed: params.statusCompleted,
      },
      animalTypes,
      visualizations: {
        cluster: params.layerCluster,
        heatmap: params.layerHeatmap,
      },
      staffIds: isAdminMode ? staffIdsMap : undefined,
      clustering: params.clustering,
      sharedFacilities: params.layerFacilities,
      aiLandmarks: params.layerAiLandmarks,
    };
  }, [
    params.statusWaiting,
    params.statusCompleted,
    params.layerCluster,
    params.layerHeatmap,
    params.clustering,
    params.layerFacilities,
    params.layerAiLandmarks,
    enabledAnimalTypes,
    hiddenAnimalsSet,
    displayStaffsSet,
    staffs,
  ]);

  // レイヤー状態変更ハンドラ（100msデバウンスで連続更新を抑制）
  const layerChangeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const handleLayerChange = useCallback(
    (newLayers: LayerState) => {
      if (layerChangeTimerRef.current) {
        clearTimeout(layerChangeTimerRef.current);
      }
      layerChangeTimerRef.current = setTimeout(() => {
        // 非表示の獣種をカンマ区切りで保存
        const hiddenAnimals = Object.entries(newLayers.animalTypes)
          .filter(([, visible]) => !visible)
          .map(([key]) => key);
        // 表示する職員をカンマ区切りで保存（全表示なら空文字、全非表示なら'none'）
        let displayStaffsValue = '';
        if (newLayers.staffIds) {
          const allVisible = Object.values(newLayers.staffIds).every(Boolean);
          if (!allVisible) {
            const visible = Object.entries(newLayers.staffIds)
              .filter(([, v]) => v)
              .map(([key]) => key);
            displayStaffsValue =
              visible.length > 0 ? visible.join(',') : 'none';
          }
        }
        setParams({
          statusWaiting: newLayers.statuses.waiting,
          statusCompleted: newLayers.statuses.completed,
          hiddenAnimals:
            hiddenAnimals.length > 0 ? hiddenAnimals.join(',') : '',
          layerCluster: newLayers.visualizations.cluster,
          layerHeatmap: newLayers.visualizations.heatmap,
          clustering: newLayers.clustering ?? true,
          layerFacilities: newLayers.sharedFacilities ?? true,
          layerAiLandmarks: newLayers.aiLandmarks ?? true,
          displayStaffs: displayStaffsValue,
        });
      }, 100);
    },
    [setParams]
  );

  // パネル開閉切り替え
  const handlePanelToggle = () => {
    setParams({ panelOpen: !params.panelOpen });
  };

  // Leaflet map インスタンス参照（先に宣言しておく）
  const mapRef = useRef<import('leaflet').Map | null>(null);
  // マップが未作成時に幅変更が起きた場合の保留パン量（px）
  const pendingPanRef = useRef<number | null>(null);

  // レイヤーパネル幅変更ハンドラ
  const handlePanelWidthChange = (width: number) => {
    const newWidth = Math.round(width);
    const prevWidth = params.panelWidth ?? newWidth;
    setParams({ panelWidth: newWidth });
    // 記録をグローバルに残す（BaseReportMap が後で参照できるように）
    try {
      (window as any).__panelWidthChange = {
        prevWidth,
        newWidth,
        ts: Date.now(),
      };
    } catch (e) {
      // ignore
    }

    const map = mapRef.current;
    if (!map) {
      // マップ未作成時は幅差から推定パン量を保留しておく
      const panX = (newWidth - prevWidth) / 2; // 右パネル想定
      pendingPanRef.current = panX;
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      return;
    }

    try {
      // 現在の中心のコンテナ座標を取得
      const centerLatLng = map.getCenter();
      const centerPointBefore = map.latLngToContainerPoint(centerLatLng);

      // 少し待って DOM 更新を反映させてから invalidateSize と差分パンを行う
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {
          // ignore
        }

        const centerPointAfter = map.latLngToContainerPoint(centerLatLng);
        const deltaPoint = centerPointAfter.subtract(centerPointBefore);
        if (deltaPoint.x !== 0 || deltaPoint.y !== 0) {
          try {
            map.panBy(deltaPoint.multiplyBy(-1), {
              animate: true,
              duration: 0.2,
            });
          } catch (e) {
            // ignore
          }
        }
      }, 60);
    } catch (e) {
      // フォールバック
      setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    }
  };

  const handleMapCreated = (m: import('leaflet').Map) => {
    mapRef.current = m;
    // map 作成後に保留されているパンがあれば適用
    if (pendingPanRef.current != null) {
      const pan = pendingPanRef.current;
      pendingPanRef.current = null;
      setTimeout(() => {
        try {
          m.invalidateSize();
        } catch (e) {
          // ignore
        }
        try {
          m.panBy([pan, 0], { animate: true, duration: 0.2 });
        } catch (e) {
          // ignore
        }
      }, 60);
    }
  };

  // データパネル開閉切り替え
  const handleDataPanelToggle = () => {
    setParams({ dataPanelOpen: !params.dataPanelOpen });

    // データパネルの開閉でレイアウトが変わるため、地図のサイズを再計算
    // 少し遅延させてDOMの更新を待つ
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 100);
  };

  // データパネル高さ変更
  const handleDataPanelHeightChange = (height: number) => {
    // まずローカルstateに反映して即時に地図側に渡す（即時センタリング対応）
    setLocalDataPanelHeight(height);
    // URLクエリにも反映（永続化）
    setParams({ dataPanelHeight: height });
    // パネル高さの変更に伴い地図のサイズやcontainer座標が変わるため、
    // 少し遅延してから resize イベントを発火して地図を更新させる
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
  };

  // タイムライン切替確認ダイアログ
  const timelineDialogRef = useRef<HTMLDialogElement>(null);

  // 地図モード切り替え
  const handleMapModeToggle = () => {
    if (params.mode === 'default') {
      // default → timeline: クラスタリングまたはヒートマップがONなら確認ダイアログ
      if (params.clustering || params.layerHeatmap) {
        timelineDialogRef.current?.showModal();
        return;
      }
    }
    const toTimeline = params.mode === 'default';
    setParams({
      mode: toTimeline ? 'timeline' : 'default',
      // モバイルではタイムライン有効時にパネルを閉じる（地図が隠れるため）
      ...(toTimeline && window.innerWidth < 768 && { panelOpen: false }),
    });
  };

  // 地図状態変更ハンドラ
  const handleMapStateChange = (
    center: { lat: number; lng: number },
    zoom: number
  ) => {
    setParams({
      lat: center.lat,
      lng: center.lng,
      zoom: Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, zoom)),
    });
  };

  const handleApplyDateRange = useCallback(
    (startDate: string, endDate: string) => {
      setParams({
        startDate,
        endDate,
      });
      setSelectedReport(null);
    },
    [setParams]
  );

  // AIフィルタ変更コールバック: data-filtersイベントからのフィルタ条件をURLパラメータに適用
  const handleAiFilterChange = useCallback(
    (filters: Record<string, unknown>) => {
      const updates: Record<string, unknown> = {};

      if (filters.startDate != null) updates.startDate = filters.startDate;
      if (filters.endDate != null) updates.endDate = filters.endDate;

      if (Array.isArray(filters.statuses)) {
        updates.statusWaiting = (filters.statuses as string[]).includes(
          'waiting'
        );
        updates.statusCompleted = (filters.statuses as string[]).includes(
          'completed'
        );
      }

      if (Array.isArray(filters.animalTypes)) {
        const hidden = enabledAnimalTypes
          .map((t) => t.id)
          .filter((id) => !(filters.animalTypes as string[]).includes(id));
        updates.hiddenAnimals = hidden.length > 0 ? hidden.join(',') : '';
      }

      // 職員フィルター
      if (Array.isArray(filters.staffIds)) {
        const ids = filters.staffIds as string[];
        updates.displayStaffs = ids.length > 0 ? ids.join(',') : 'none';
      }

      if (Object.keys(updates).length > 0) setParams(updates);

      // 地図移動（Leaflet APIで直接）
      const lat = filters.lat as number | null;
      const lng = filters.lng as number | null;
      const zoom = filters.zoom as number | null;
      if (lat != null && lng != null && mapRef.current) {
        mapRef.current.flyTo(
          [lat, lng],
          zoom ?? mapRef.current.getZoom(),
          { duration: 0.8 }
        );
      }
    },
    [setParams, enabledAnimalTypes]
  );

  // フィルタリングされた通報リスト
  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      // ステータスフィルター
      const statusEnabled = layers.statuses[report.status as ReportStatusValue];
      if (!statusEnabled) return false;

      // 獣種フィルター
      const animalEnabled =
        layers.animalTypes[report.animalType as AnimalTypeValue];
      if (!animalEnabled) return false;

      // 職員フィルター（admin時のみ）
      if (layers.staffIds) {
        const staffKey = report.staffId ?? '__unassigned__';
        const staffEnabled = layers.staffIds[staffKey] ?? true;
        if (!staffEnabled) return false;
      }

      return true;
    });
  }, [reports, layers.statuses, layers.animalTypes, layers.staffIds]);

  // フィルタリング結果を遅延値にして、高速な連続フィルター変更時に
  // Leaflet MarkerClusterGroupのレイヤー更新を非ブロッキングにする
  const deferredFilteredReports = useDeferredValue(filteredReports);

  // 各獣種の件数を計算（ステータスフィルターのみ適用）
  const animalCounts = useMemo(() => {
    const counts = {} as Record<AnimalTypeValue, number>;
    enabledAnimalTypes.forEach((t) => {
      counts[t.id] = 0;
    });

    reports.forEach((report) => {
      const statusEnabled = layers.statuses[report.status as ReportStatusValue];
      if (statusEnabled) {
        const animalType = report.animalType as AnimalTypeValue;
        if (animalType in counts) {
          counts[animalType]++;
        }
      }
    });

    return counts;
  }, [reports, layers.statuses, enabledAnimalTypes]);

  // 各職員の担当件数を計算（ステータス・獣種フィルター適用後）
  const staffCounts = useMemo(() => {
    if (!isAdminMode || !staffs) return undefined;
    const counts: Record<string, number> = { __unassigned__: 0 };
    staffs.forEach((s) => {
      counts[s.id] = 0;
    });
    reports.forEach((report) => {
      const statusEnabled = layers.statuses[report.status as ReportStatusValue];
      if (!statusEnabled) return;
      const animalEnabled =
        layers.animalTypes[report.animalType as AnimalTypeValue];
      if (!animalEnabled) return;
      const key = report.staffId ?? '__unassigned__';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [reports, layers.statuses, layers.animalTypes, staffs]);

  // 各ステータスの件数を計算（獣種フィルターのみ適用）
  const statusCounts = useMemo(() => {
    const counts: Record<ReportStatusValue, number> = {
      waiting: 0,
      completed: 0,
    };

    reports.forEach((report) => {
      // 獣種フィルターのみ適用
      const animalEnabled =
        layers.animalTypes[report.animalType as AnimalTypeValue];
      if (animalEnabled) {
        const status = report.status as ReportStatusValue;
        counts[status] = (counts[status] ?? 0) + 1;
      }
    });

    return counts;
  }, [reports, layers.animalTypes]);

  // 初期表示位置（URLパラメータ優先、なければシステム設定のデフォルト座標）
  // lat/lngが0の可能性もあるため、nullチェックを使用
  const initialCenter =
    params.lat != null && params.lng != null
      ? { lat: params.lat, lng: params.lng }
      : defaultCenter;
  // URLでlat/lngが指定されている場合、zoomもデフォルト値を設定（自動境界調整をスキップするため）
  const initialZoom =
    params.zoom != null
      ? Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, params.zoom))
      : params.lat != null && params.lng != null
        ? MAP_DEFAULT_ZOOM
        : undefined;

  // 通報選択ハンドラ（データパネルから）
  const handleReportSelect = (report: ReportDto) => {
    setSelectedReport(report);
    // 地図の移動はSelectedReportTrackerが自動的に行う
  };

  // エリアクリック時の地図移動ハンドラ（統計パネルから）
  const handleAreaClick = useCallback((lat: number, lng: number) => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.flyTo([lat, lng], 14, { duration: 0.8 });
    } catch {
      // ignore
    }
  }, []);

  return (
    <div
      className={isEmbedded ? 'flex h-full flex-col' : 'flex h-screen flex-col'}
    >
      {/* 地図エリア */}
      <div className="relative flex-1">
        <FullscreenReportMap
          reports={deferredFilteredReports}
          mapMode={params.mode}
          interactionMode={params.interaction}
          initialCenter={initialCenter}
          initialZoom={initialZoom}
          onMapCreated={handleMapCreated}
          onMapStateChange={handleMapStateChange}
          isPanelOpen={!isEmbedMode && params.panelOpen}
          panelOffsetPx={
            !isEmbedMode && params.panelOpen ? params.panelWidth : 0
          }
          showFullscreenControl={params.fullscreen}
          showLegend={false}
          isIframe={isEmbedMode}
          height={isEmbedded ? '100%' : undefined}
          showClusterLayer={layers.visualizations.cluster}
          showHeatmapLayer={layers.visualizations.heatmap}
          disableClustering={!(layers.clustering ?? true)}
          selectedReport={selectedReport}
          onMarkerClick={(report) => setSelectedReport(report)}
          bottomOffsetPx={params.dataPanelOpen ? localDataPanelHeight : 0}
          enabledAnimalTypes={enabledAnimalTypes}
          showSearchControl={!isEmbedMode}
          dateFilterStart={activeStartDate}
          dateFilterEnd={activeEndDate}
          onDateFilterApply={handleApplyDateRange}
          isAdmin={isAdminMode}
          displayStaffIds={displayStaffsSet}
          uiOverlay={
            !isEmbedMode && (
              <>
                {/* ダッシュボードへ戻るボタン（Leafletズームコントロール・フルスクリーンボタンの下に配置） */}
                <Link
                  href="/"
                  className={`
                    text-solid-gra transition-col o rs
                    hover:text-
                    solid-gray-900 absolute top-[124px] left-[10px] flex
                    items-center gap-2 rounded-full bg-white/90 p-2 text-sm
                    font-medium shadow-md backdrop-blur-sm
                    hover:bg-white
                  `}
                  style={{ zIndex: Z_MAP_CONTROLS }}
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="size-3" />
                </Link>

                {/* レイヤーパネル */}
                <MapLayerPanel
                  layers={layers}
                  onLayerChange={handleLayerChange}
                  isOpen={params.panelOpen}
                  onToggle={handlePanelToggle}
                  initialWidth={params.panelWidth}
                  onWidthChange={handlePanelWidthChange}
                  animalCounts={animalCounts}
                  statusCounts={statusCounts}
                  dataPanelOpen={params.dataPanelOpen}
                  onDataPanelToggle={handleDataPanelToggle}
                  mapMode={params.mode}
                  onMapModeToggle={handleMapModeToggle}
                  activeTab={params.tab as LayerTab}
                  onTabChange={(tab) => {
                    setParams({ tab });
                    setSelectedReport(null);
                  }}
                  enabledAnimalTypes={enabledAnimalTypes}
                  suggestedQuestions={suggestedQuestions}
                  isAdmin={isAdminMode}
                  staffs={staffs}
                  staffCounts={staffCounts}
                  filteredReports={filteredReports}
                  onAreaClick={handleAreaClick}
                  onAiFilterChange={handleAiFilterChange}
                />

                {/* AI解除ボタン（管理者モード・AI抽出結果あり時のみ） */}
                {isAdminMode && (
                  <AiResetButton
                    bottomOffsetPx={
                      params.dataPanelOpen ? localDataPanelHeight : 0
                    }
                    rightOffsetPx={
                      params.panelOpen ? params.panelWidth : 0
                    }
                  />
                )}

                {/* データパネル（オーバーレイ） */}
                {params.dataPanelOpen && (
                  <ReportDataPanel
                    reports={filteredReports}
                    selectedReport={selectedReport}
                    onReportSelect={handleReportSelect}
                    initialHeight={params.dataPanelHeight}
                    onHeightChange={handleDataPanelHeightChange}
                    onClose={handleDataPanelToggle}
                    panelOpen={params.panelOpen}
                    panelWidth={params.panelWidth}
                  />
                )}
              </>
            )
          }
        />
      </div>

      {/* タイムライン切替確認ダイアログ */}
      <Dialog ref={timelineDialogRef}>
        <DialogBody>
          <h2 className="mb-4 text-xl font-semibold text-blue-900">
            タイムライン表示に切り替え
          </h2>
          <p className="mb-6 text-center text-solid-gray-700">
            タイムライン表示では、クラスタリングとヒートマップをオフにすることを推奨します。オフにしますか？
          </p>
          <div className="flex justify-end gap-2">
            <Button
              size="md"
              variant="outline"
              onClick={() => {
                timelineDialogRef.current?.close();
                setParams({
                  mode: 'timeline',
                  ...(window.innerWidth < 768 && { panelOpen: false }),
                });
              }}
            >
              変更しない
            </Button>
            <Button
              size="md"
              variant="solid-fill"
              onClick={() => {
                timelineDialogRef.current?.close();
                setParams({
                  mode: 'timeline',
                  clustering: false,
                  layerHeatmap: false,
                  ...(window.innerWidth < 768 && { panelOpen: false }),
                });
              }}
            >
              オフにする
            </Button>
          </div>
        </DialogBody>
      </Dialog>
    </div>
  );
};

export default MapPage;
