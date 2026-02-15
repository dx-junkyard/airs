'use client';

import { useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  TransformWrapper,
  TransformComponent,
  useControls,
} from 'react-zoom-pan-pinch';

interface ImageModalProps {
  /** 表示中の画像URL（nullでモーダル非表示） */
  imageUrl: string | null;
  /** 画像の説明文 */
  description?: string;
  /** 画像のalt属性 */
  alt?: string;
  /** モーダルを閉じるコールバック */
  onClose: () => void;
}

/** ズームコントロールボタン */
function ZoomControls() {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute right-2 bottom-2 z-10 flex gap-1">
      <button
        type="button"
        onClick={() => zoomIn()}
        className={`
          flex size-8 items-center justify-center rounded-full bg-black/50
          text-white transition-colors
          hover:bg-black/70
        `}
        aria-label="拡大"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => zoomOut()}
        className={`
          flex size-8 items-center justify-center rounded-full bg-black/50
          text-white transition-colors
          hover:bg-black/70
        `}
        aria-label="縮小"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="size-4"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => resetTransform()}
        className={`
          flex size-8 items-center justify-center rounded-full bg-black/50
          text-white transition-colors
          hover:bg-black/70
        `}
        aria-label="リセット"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M3 12a9 9 0 1 1 3 7" />
          <polyline points="3 22 3 12 13 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * 画像拡大表示モーダル
 *
 * 画像をクリックした際に拡大表示し、下部に説明文を表示する。
 * ホイール・ピンチ・ダブルクリックでズーム、ドラッグでパン可能。
 * HTML <dialog> 要素を使用。
 */
export default function ImageModal({
  imageUrl,
  description,
  alt = '画像',
  onClose,
}: ImageModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (imageUrl) {
      dialogRef.current?.showModal();
    } else {
      dialogRef.current?.close();
    }
  }, [imageUrl]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!imageUrl) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`
        fixed inset-0 m-auto max-h-[90vh] max-w-[90vw] bg-transparent p-0
        backdrop:bg-black/60
      `}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      onClose={onClose}
    >
      <div
        className={`
          flex max-h-[90vh] flex-col overflow-hidden rounded-lg bg-white
        `}
        onClick={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* 画像（ズーム・パン対応） */}
        <div className="relative max-h-[75vh] bg-solid-gray-50">
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={20}
            doubleClick={{ mode: 'toggle', step: 3 }}
            wheel={{ step: 0.1, smoothStep: 0.01 }}
            smooth={false}
          >
            <ZoomControls />
            {/* 閉じるボタン */}
            <button
              type="button"
              onClick={onClose}
              className={`
                absolute top-2 right-2 z-10 flex size-8 items-center
                justify-center rounded-full bg-black/50 text-white
                transition-colors
                hover:bg-black/70
              `}
              aria-label="閉じる"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <TransformComponent
              wrapperStyle={{
                maxHeight: '75vh',
                width: '100%',
              }}
              contentStyle={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <Image
                src={imageUrl}
                alt={alt}
                width={1200}
                height={800}
                className="max-h-[75vh] w-auto object-contain"
                unoptimized
              />
            </TransformComponent>
          </TransformWrapper>
        </div>

        {/* 説明文 */}
        {description && (
          <div className="px-4 py-3">
            <p className="text-sm text-solid-gray-700">{description}</p>
          </div>
        )}
      </div>
    </dialog>
  );
}
