'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { faExpand } from '@fortawesome/free-solid-svg-icons';

const FULLSCREEN_ICON_HTML = icon(faExpand).html.join('');

interface MapFullscreenControlProps {
  /** フルスクリーン対象のコンテナID（省略時はmap containerを使用） */
  containerId?: string;
}

/**
 * 全マップ共通のフルスクリーンコントロール
 *
 * FontAwesome faExpand アイコンを使用し、Leaflet標準のzoomコントロールと
 * 同じ見た目（leaflet-bar）でフルスクリーントグルを提供する。
 */
export function MapFullscreenControl({ containerId }: MapFullscreenControlProps) {
  const map = useMap();

  useEffect(() => {
    const container = containerId
      ? document.getElementById(containerId)
      : map.getContainer();
    if (!container) return;

    const CustomControl = L.Control.extend({
      onAdd: function () {
        const wrapper = L.DomUtil.create(
          'div',
          'leaflet-bar leaflet-control'
        );
        const button = L.DomUtil.create('a', '', wrapper);
        button.href = '#';
        button.role = 'button';
        button.innerHTML = FULLSCREEN_ICON_HTML;
        button.style.fontSize = '18px';
        button.style.width = '30px';
        button.style.height = '30px';
        button.style.lineHeight = '30px';
        button.style.textAlign = 'center';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.cursor = 'pointer';

        const updateControlLabel = (isFullscreen: boolean) => {
          const label = isFullscreen ? '全画面表示を終了' : '全画面表示';
          button.title = label;
          button.setAttribute('aria-label', label);
        };
        updateControlLabel(false);

        L.DomEvent.on(button, 'click', function (e) {
          L.DomEvent.stopPropagation(e);
          L.DomEvent.preventDefault(e);

          if (
            !document.fullscreenElement &&
            !(document as any).webkitFullscreenElement &&
            !(document as any).mozFullScreenElement &&
            !(document as any).msFullscreenElement
          ) {
            if (container.requestFullscreen) {
              container.requestFullscreen();
            } else if ((container as any).webkitRequestFullscreen) {
              (container as any).webkitRequestFullscreen();
            } else if ((container as any).mozRequestFullScreen) {
              (container as any).mozRequestFullScreen();
            } else if ((container as any).msRequestFullscreen) {
              (container as any).msRequestFullscreen();
            }
            button.innerHTML = FULLSCREEN_ICON_HTML;
            updateControlLabel(true);
          } else {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
              (document as any).webkitExitFullscreen();
            } else if ((document as any).mozCancelFullScreen) {
              (document as any).mozCancelFullScreen();
            } else if ((document as any).msExitFullscreen) {
              (document as any).msExitFullscreen();
            }
            button.innerHTML = FULLSCREEN_ICON_HTML;
            updateControlLabel(false);
          }
        });

        return wrapper;
      },
    });

    const control = new CustomControl({ position: 'topleft' });
    control.addTo(map);

    // フルスクリーン切替時に地図サイズを再計算
    const handleFullscreenChange = () => {
      setTimeout(() => {
        if (map && map.getContainer && map.getContainer()) {
          try {
            map.invalidateSize();
          } catch (e) {
            console.warn('Failed to invalidate map size:', e);
          }
        }
      }, 100);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      control.remove();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'mozfullscreenchange',
        handleFullscreenChange
      );
      document.removeEventListener(
        'MSFullscreenChange',
        handleFullscreenChange
      );
    };
  }, [map, containerId]);

  return null;
}

export default MapFullscreenControl;
