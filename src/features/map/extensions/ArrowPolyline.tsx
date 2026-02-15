'use client';

import { useMemo } from 'react';
import { Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';

interface ArrowPoint {
  id: string;
  lat: number;
  lng: number;
}

interface ArrowPolylineProps {
  /** 時系列順のポイントリスト */
  points: ArrowPoint[];
  /** ハイライト対象のポイントID（接続セグメントを濃く表示） */
  highlightId?: string | null;
  /** 線の色 */
  color?: string;
  /** 線の太さ */
  weight?: number;
  /** 通常時の透明度 */
  opacity?: number;
}

/**
 * 2点間の角度を計算（度、コンパス方位）
 */
function bearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * 矢印アイコンを生成
 */
function createArrowIcon(angle: number, color: string, iconOpacity: number) {
  return L.divIcon({
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    html: `<svg width="12" height="12" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(${angle}deg); opacity: ${iconOpacity}">
      <path d="M6 0 L12 10 L6 7 L0 10 Z" fill="${color}" />
    </svg>`,
  });
}

interface Segment {
  fromId: string;
  toId: string;
  from: [number, number];
  to: [number, number];
  mid: [number, number];
  angle: number;
}

/**
 * タイムライン順に通報を矢印付きの線で結ぶレイヤー
 *
 * highlightId が指定されている場合、そのポイントに接続するセグメントを濃く、
 * それ以外を薄く表示する。
 */
const ArrowPolyline = ({
  points,
  highlightId,
  color = '#6366f1',
  weight = 2,
  opacity = 0.7,
}: ArrowPolylineProps) => {
  const segments = useMemo((): Segment[] => {
    if (points.length < 2) return [];
    return points.slice(0, -1).map((pt, i) => {
      const next = points[i + 1];
      return {
        fromId: pt.id,
        toId: next.id,
        from: [pt.lat, pt.lng] as [number, number],
        to: [next.lat, next.lng] as [number, number],
        mid: [
          (pt.lat + next.lat) / 2,
          (pt.lng + next.lng) / 2,
        ] as [number, number],
        angle: bearing(pt.lat, pt.lng, next.lat, next.lng),
      };
    });
  }, [points]);

  if (segments.length === 0) return null;

  return (
    <>
      {segments.map((seg, i) => {
        const isHighlighted =
          !highlightId ||
          seg.fromId === highlightId ||
          seg.toId === highlightId;
        const segOpacity = isHighlighted ? opacity : opacity * 0.25;
        const segWeight = isHighlighted ? weight : weight * 0.8;

        return (
          <Polyline
            key={`seg-${i}`}
            positions={[seg.from, seg.to]}
            pathOptions={{
              color,
              weight: segWeight,
              opacity: segOpacity,
              dashArray: '6 4',
            }}
          />
        );
      })}
      {segments.map((seg, i) => {
        const isHighlighted =
          !highlightId ||
          seg.fromId === highlightId ||
          seg.toId === highlightId;
        const iconOpacity = isHighlighted ? 1 : 0.25;

        return (
          <Marker
            key={`arrow-${i}`}
            position={seg.mid}
            icon={createArrowIcon(seg.angle, color, iconOpacity)}
            interactive={false}
          />
        );
      })}
    </>
  );
};

export default ArrowPolyline;
