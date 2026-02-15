'use client';

import { useEffect, useRef, useCallback, useState, useMemo, type MutableRefObject } from 'react';
import {
  faChevronLeft,
  faChevronRight,
  faPause,
  faPlay,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMap } from 'react-leaflet';
import type {
  TimelineGeoJSON,
  EstimatedDisplayDays,
} from '@/features/report/types/timeline';
import { Z_MAP_TIMELINE } from '@/constants/z-index';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface TimelineLayerProps {
  geojson: TimelineGeoJSON;
  displayDays: EstimatedDisplayDays;
  onDisplayDaysChange: (days: EstimatedDisplayDays) => void;
  onTimeChange?: (time: number) => void;
  panelOffsetPx?: number;
  /** AIチャットからの自動再生フラグ */
  autoPlay?: boolean;
  /** 自動再生が開始された後のコールバック（フラグ消費通知） */
  onAutoPlayConsumed?: () => void;
}

const ONE_DAY = 24 * 60 * 60 * 1000;

// Fallback timestamp for when no geojson features are available.
// Using a module-level constant avoids calling impure Date.now() during render.
const FALLBACK_TIMESTAMP = Date.now();

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(timestamp));
}

function calculateTimeRange(geojson: TimelineGeoJSON | null) {
  if (!geojson || geojson.features.length === 0) return null;
  const times: number[] = [];
  geojson.features.forEach((f) => {
    times.push(new Date(f.properties.start as string).getTime());
    times.push(new Date(f.properties.end as string).getTime());
  });
  return { start: Math.min(...times), end: Math.max(...times) };
}

export default function TimelineLayer({
  geojson,
  displayDays, // Ensure this prop is destructured
  onDisplayDaysChange,
  onTimeChange,
  panelOffsetPx = 0,
  autoPlay = false,
  onAutoPlayConsumed,
}: TimelineLayerProps) {
  const map = useMap();
  // スマホではタイムラインUIを画面下部に配置してドロワー（パネル）に隠れないようにする
  const isMobile = !useMediaQuery('(min-width: 640px)');
  const timeRange = useMemo(() => calculateTimeRange(geojson), [geojson]);
  const hasFeatures = !!(
    geojson &&
    geojson.features &&
    geojson.features.length > 0
  );
  const effectiveRange = useMemo(
    () => timeRange ?? { start: FALLBACK_TIMESTAMP, end: FALLBACK_TIMESTAMP },
    [timeRange]
  );
  const [currentTime, setCurrentTime] = useState<number | null>(
    effectiveRange.start
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const getDefaultSpeed = (days: EstimatedDisplayDays): number => {
    if (days <= 3) return 1;
    if (days <= 7) return 2;
    if (days <= 14) return 4;
    return 8;
  };
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(getDefaultSpeed(displayDays));
  const [leftPx, setLeftPx] = useState<number | null>(null);
  const playRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);
  // rAFスロットリング用: 再生中の高頻度onTimeChange呼び出しを
  // ブラウザのフレームレートに合わせて抑制する
  const pendingTimeRef: MutableRefObject<number | null> = useRef<number | null>(null);

  // rAFスロットリング: 再生中に高頻度で発火するonTimeChangeを
  // requestAnimationFrameで間引き、親の再レンダリングをフレームレートに制限
  const notifyTimeChangeRaf = useCallback(
    (time: number) => {
      if (!onTimeChange) return;
      pendingTimeRef.current = time;
      if (rafIdRef.current !== null) return; // 既にrAFがスケジュール済み
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (pendingTimeRef.current !== null) {
          onTimeChange(pendingTimeRef.current);
          pendingTimeRef.current = null;
        }
      });
    },
    [onTimeChange]
  );

  // Extract primitive values for stable dependencies
  const rangeStart = timeRange?.start;
  const rangeEnd = timeRange?.end;

  // Sync currentTime when timeRange changes (e.g., new geojson data is loaded)
  // This pattern is intentional: we subscribe to timeRange changes and update local state.
  useEffect(() => {
    if (rangeStart !== undefined && rangeEnd !== undefined) {
      setCurrentTime(rangeStart);
      if (hasFeatures) {
        // defer to avoid updating parent state during render phase
        setTimeout(() => onTimeChange?.(rangeStart), 0);
      }
    }
  }, [rangeStart, rangeEnd, hasFeatures, onTimeChange]);

  useEffect(() => {
    return () => {
      if (playRef.current) clearInterval(playRef.current);
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  const startPlayback = useCallback(() => {
    if (playRef.current) clearInterval(playRef.current);

    // Interval base is 500ms for 1x speed
    const interval = 500 / playbackSpeed;

    playRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const base = prev ?? effectiveRange.start;
        const next = base + ONE_DAY;
        if (next > effectiveRange.end) {
          if (hasFeatures) notifyTimeChangeRaf(effectiveRange.start);
          return effectiveRange.start;
        }
        if (hasFeatures) notifyTimeChangeRaf(next);
        return next;
      });
    }, interval);
  }, [playbackSpeed, effectiveRange, hasFeatures, notifyTimeChangeRaf]);

  // Restart playback if speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      startPlayback();
    }
  }, [playbackSpeed, isPlaying, startPlayback]);

  const togglePlay = useCallback(() => {
    if (!hasFeatures) return;
    if (isPlaying) {
      if (playRef.current) {
        clearInterval(playRef.current);
        playRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    // startPlayback is handled by useEffect([isPlaying, playbackSpeed])
  }, [hasFeatures, isPlaying]);

  const step = (dir: -1 | 1) => {
    if (!hasFeatures || currentTime == null) return;
    const next =
      dir === 1
        ? Math.min(effectiveRange.end, currentTime + ONE_DAY)
        : Math.max(effectiveRange.start, currentTime - ONE_DAY);
    setCurrentTime(next);
    // defer to avoid sync parent updates during render
    setTimeout(() => onTimeChange?.(next), 0);
  };

  // helpers to disable/enable map interactions while dragging slider
  const disableMapInteraction = useCallback(() => {
    try {
      map.dragging?.disable();
      map.scrollWheelZoom?.disable();
      map.doubleClickZoom?.disable();
      map.touchZoom?.disable();
    } catch (e) {
      // ignore
    }
  }, [map]);

  const enableMapInteraction = useCallback(() => {
    try {
      map.dragging?.enable();
      map.scrollWheelZoom?.enable();
      map.doubleClickZoom?.enable();
      map.touchZoom?.enable();
    } catch (e) {
      // ignore
    }
  }, [map]);

  // compute left position (px) so the control is centered within the visible map area
  const computeLeft = useCallback(() => {
    try {
      const size = map.getSize();
      // compute visible map width by excluding the right-side panel offset
      const visibleWidth = Math.max(0, size.x - panelOffsetPx);
      // center inside the visible map area
      const centerWithinVisible = Math.round(visibleWidth / 2);
      setLeftPx(centerWithinVisible);
    } catch (e) {
      setLeftPx(null);
    }
  }, [map, panelOffsetPx]);

  // Initial compute and subscribe to resize events.
  // The initial computeLeft() syncs with the external window/map state.
  useEffect(() => {
    computeLeft();
    const handle = () => computeLeft();
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [computeLeft]);

  // AIチャットからの自動再生: autoPlayがtrueでデータがある場合に再生を開始
  useEffect(() => {
    if (autoPlay && hasFeatures && !isPlaying) {
      setIsPlaying(true);
      // フラグ消費を通知
      onAutoPlayConsumed?.();
    }
  }, [autoPlay, hasFeatures, isPlaying, onAutoPlayConsumed]);

  // always render UI; when no data, render disabled controls and a "データがありません" label
  if (currentTime == null) return null;

  return (
    <div
      onDoubleClickCapture={(e) => {
        e.stopPropagation();
        e.preventDefault();
        try {
          // stopImmediatePropagation if available on nativeEvent
          const ne = (e as any).nativeEvent;
          if (ne && typeof ne.stopImmediatePropagation === 'function')
            ne.stopImmediatePropagation();
        } catch (err) {}
      }}
      className={`
        absolute transform rounded-lg bg-white p-3 shadow-lg
        ${isMobile ? 'top-[72px]' : 'top-4'}
      `}
      style={{
        minWidth: isMobile ? '320px' : '320px',
        maxWidth: isMobile ? '95%' : '90%',
        zIndex: Z_MAP_TIMELINE,
        left: isMobile ? 'auto' : leftPx != null ? `${leftPx}px` : '50%',
        right: isMobile ? '16px' : 'auto',
        transform: isMobile ? 'none' : 'translateX(-50%)',
      }}
    >
      <div
        className={`
          mb-2 flex items-center justify-center gap-2 text-sm font-medium
          text-gray-700
        `}
      >
        {hasFeatures && (
          <select
            value={displayDays}
            onChange={(e) => {
              const days = Number(e.target.value) as EstimatedDisplayDays;
              onDisplayDaysChange(days);
              setPlaybackSpeed(getDefaultSpeed(days));
            }}
            className={`
              rounded border border-gray-300 bg-white px-2 py-1 text-xs
              text-gray-700 shadow-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            `}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <option value={3}>過去3日間</option>
            <option value={7}>過去7日間</option>
            <option value={14}>過去14日間</option>
            <option value={30}>過去30日間</option>
          </select>
        )}
        <span>
          {hasFeatures ? formatDate(currentTime) : 'データがありません'}
        </span>
        {hasFeatures && (
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className={`
              rounded border border-gray-300 bg-white px-2 py-1 text-xs
              text-gray-700 shadow-sm
              focus:border-blue-500 focus:ring-1 focus:ring-blue-500
              focus:outline-none
            `}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <option value={0.5}>0.5倍速</option>
            <option value={1}>1倍速</option>
            <option value={2}>2倍速</option>
            <option value={4}>4倍速</option>
            <option value={8}>8倍速</option>
          </select>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          onDoubleClickCapture={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              const ne = (e as any).nativeEvent;
              if (ne && typeof ne.stopImmediatePropagation === 'function')
                ne.stopImmediatePropagation();
            } catch (err) {}
          }}
          onClick={() => step(-1)}
          disabled={!hasFeatures}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`
            rounded bg-gray-100 p-2
            hover:bg-gray-200
          `}
          aria-label="戻る"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="size-3.5" />
        </button>
        <button
          onDoubleClickCapture={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              const ne = (e as any).nativeEvent;
              if (ne && typeof ne.stopImmediatePropagation === 'function')
                ne.stopImmediatePropagation();
            } catch (err) {}
          }}
          onClick={togglePlay}
          disabled={!hasFeatures}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`
            flex size-8 items-center justify-center rounded-full text-white
            ${
              isPlaying
                ? `
                  bg-red-500
                  hover:bg-red-600
                `
                : `
                  bg-blue-500
                  hover:bg-blue-600
                `
            }
          `}
          aria-label={isPlaying ? '停止' : '再生'}
        >
          <FontAwesomeIcon
            icon={isPlaying ? faPause : faPlay}
            className="size-3.5"
          />
        </button>
        <button
          onDoubleClickCapture={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              const ne = (e as any).nativeEvent;
              if (ne && typeof ne.stopImmediatePropagation === 'function')
                ne.stopImmediatePropagation();
            } catch (err) {}
          }}
          onClick={() => step(1)}
          disabled={!hasFeatures}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className={`
            rounded bg-gray-100 p-2
            hover:bg-gray-200
          `}
          aria-label="進"
        >
          <FontAwesomeIcon icon={faChevronRight} className="size-3.5" />
        </button>
        <input
          onDoubleClickCapture={(e) => {
            e.stopPropagation();
            e.preventDefault();
            try {
              const ne = (e as any).nativeEvent;
              if (ne && typeof ne.stopImmediatePropagation === 'function')
                ne.stopImmediatePropagation();
            } catch (err) {}
          }}
          type="range"
          min={effectiveRange.start}
          max={effectiveRange.end}
          value={currentTime}
          onDoubleClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onChange={(e) => {
            const val = Number(e.target.value);
            setCurrentTime(val);
            if (hasFeatures) setTimeout(() => onTimeChange?.(val), 0);
          }}
          disabled={!hasFeatures}
          onPointerDown={() => {
            // prevent map from panning/zooming while dragging the slider
            disableMapInteraction();
          }}
          onPointerUp={() => {
            // re-enable shortly after user releases
            setTimeout(() => enableMapInteraction(), 50);
          }}
          onTouchStart={() => disableMapInteraction()}
          onTouchEnd={() => setTimeout(() => enableMapInteraction(), 50)}
          className={`
            timeline-slider h-2 flex-1 cursor-pointer appearance-none rounded-lg
            bg-gray-200
          `}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-500">
        <span>{formatDate(effectiveRange.start)}</span>
        <span>{formatDate(effectiveRange.end)}</span>
      </div>
    </div>
  );
}
