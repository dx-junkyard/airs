'use client';

import { useState, useRef, useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  BASE_MAPS,
  baseMapIdAtom,
  type BaseMapDefinition,
} from '@/features/map/atoms/baseMapAtom';
import { Z_MAP_CONTROLS } from '@/constants/z-index';

/** サムネイルのサイズ（px） */
const THUMB_SIZE = 64;
/** 展開時の各サムネイルサイズ（px） */
const EXPANDED_THUMB_SIZE = 64;
/** デフォルトの下マージン（px） */
const DEFAULT_BOTTOM = 20;

interface BaseMapSelectorProps {
  /** 下部パネルの高さ（px）。パネルが展開されている場合に動的にbottom位置を調整する */
  bottomOffset?: number;
}

/**
 * ベースマップ切り替えコンポーネント（Google Maps風サムネイルUI）
 *
 * 左下に小さなサムネイルを表示し、クリックで展開して全選択肢を表示する。
 * 選択するとベースマップが切り替わる。
 * bottomOffset が指定されると、下部パネルの上に表示されるよう位置を動的に調整する。
 */
const BaseMapSelector = ({ bottomOffset = 0 }: BaseMapSelectorProps) => {
  const [baseMapId, setBaseMapId] = useAtom(baseMapIdAtom);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentMap =
    BASE_MAPS.find((m) => m.id === baseMapId) ?? BASE_MAPS[0];

  // 外側クリックで閉じる
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const handleSelect = (map: BaseMapDefinition) => {
    setBaseMapId(map.id);
    setIsExpanded(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-3 transition-all duration-300"
      style={{
        bottom: `${DEFAULT_BOTTOM + bottomOffset}px`,
        zIndex: Z_MAP_CONTROLS,
      }}
    >
      {/* 展開時: 選択肢一覧 */}
      {isExpanded && (
        <div
          className={`mb-2 flex gap-2 rounded-lg bg-white p-2 shadow-lg`}
        >
          {BASE_MAPS.map((map) => {
            const isSelected = map.id === baseMapId;
            return (
              <button
                key={map.id}
                onClick={() => handleSelect(map)}
                className="flex flex-col items-center gap-1"
                aria-label={`ベースマップを${map.name}に切り替え`}
              >
                <div
                  className={`
                    overflow-hidden rounded-md border-2 transition-all
                    ${
                      isSelected
                        ? 'border-blue-500 shadow-md'
                        : `
                          border-solid-gray-300
                          hover:border-solid-gray-400
                        `
                    }
                  `}
                  style={{
                    width: `${EXPANDED_THUMB_SIZE}px`,
                    height: `${EXPANDED_THUMB_SIZE}px`,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={map.thumbnailUrl}
                    alt={map.name}
                    width={EXPANDED_THUMB_SIZE}
                    height={EXPANDED_THUMB_SIZE}
                    className="size-full object-cover"
                    loading="eager"
                  />
                </div>
                <span
                  className={`
                    text-xs leading-tight
                    ${
                      isSelected
                        ? 'font-bold text-blue-600'
                        : 'text-solid-gray-700'
                    }
                  `}
                >
                  {map.name}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 折りたたみ時: 現在のベースマップのサムネイル */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          overflow-hidden rounded-md border-2 border-white shadow-lg
          transition-transform
          hover:scale-105
        `}
        style={{
          width: `${THUMB_SIZE}px`,
          height: `${THUMB_SIZE}px`,
        }}
        aria-label="ベースマップを切り替え"
        title={currentMap.name}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentMap.thumbnailUrl}
          alt={currentMap.name}
          width={THUMB_SIZE}
          height={THUMB_SIZE}
          className="size-full object-cover"
          loading="eager"
        />
      </button>
    </div>
  );
};

export default BaseMapSelector;
