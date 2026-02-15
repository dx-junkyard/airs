'use client';

import { useMap } from 'react-leaflet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

interface SearchButtonProps {
  /** 検索実行コールバック（地図の中心座標を渡す） */
  onSearch: (lat: number, lng: number) => void;
  /** 検索中フラグ */
  isSearching: boolean;
}

/**
 * 地図右下の「周辺施設検索」ボタン
 *
 * useMap()で地図の中心座標を取得してonSearchに渡す。
 */
const SearchButton = ({ onSearch, isSearching }: SearchButtonProps) => {
  const map = useMap();

  const handleClick = () => {
    const center = map.getCenter();
    onSearch(center.lat, center.lng);
  };

  return (
    <div className="leaflet-bottom leaflet-right" style={{ zIndex: 1000 }}>
      <div className="leaflet-control mr-4 mb-4">
        <button
          onClick={handleClick}
          disabled={isSearching}
          className={`
            flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm
            font-medium text-white shadow-lg transition-colors
            hover:bg-blue-700
            disabled:opacity-50
          `}
        >
          <FontAwesomeIcon
            icon={faSearch}
            className={isSearching ? 'animate-spin' : ''}
          />
          {isSearching ? '検索中...' : '周辺施設検索'}
        </button>
      </div>
    </div>
  );
};

export default SearchButton;
