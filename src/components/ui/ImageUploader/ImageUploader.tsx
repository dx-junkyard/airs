'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';

export interface ImageUploaderProps {
  /**
   * 現在の画像URL一覧
   */
  imageUrls: string[];
  /**
   * 画像URLが変更された時のコールバック
   */
  onImagesChange: (urls: string[]) => void;
  /**
   * 画像をアップロードする関数
   * @param file アップロードするファイル
   * @returns アップロードされた画像のURL、失敗時はnull
   */
  onUpload: (file: File) => Promise<string | null>;
  /**
   * 最大アップロード可能枚数
   * @default 10
   */
  maxImages?: number;
  /**
   * 無効状態
   */
  disabled?: boolean;
  /**
   * エラーメッセージ
   */
  error?: string;
}

/**
 * 画像アップロードコンポーネント
 *
 * ドラッグ＆ドロップまたはクリックで画像をアップロードし、
 * プレビューと削除機能を提供します。
 */
const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUrls,
  onImagesChange,
  onUpload,
  maxImages = 10,
  disabled = false,
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canAddMore = imageUrls.length < maxImages;

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setUploadError('画像ファイルのみアップロードできます');
        return;
      }

      if (!canAddMore) {
        setUploadError(`最大${maxImages}枚までアップロードできます`);
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        const url = await onUpload(file);
        if (url) {
          onImagesChange([...imageUrls, url]);
        } else {
          setUploadError('アップロードに失敗しました');
        }
      } catch {
        setUploadError('アップロードに失敗しました');
      } finally {
        setIsUploading(false);
      }
    },
    [canAddMore, imageUrls, maxImages, onImagesChange, onUpload]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // input をリセットして同じファイルを再選択可能に
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading && canAddMore) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isUploading && canAddMore) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled || isUploading || !canAddMore) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const newUrls = imageUrls.filter((_, index) => index !== indexToRemove);
    onImagesChange(newUrls);
  };

  const isDisabled = disabled || isUploading || !canAddMore;

  return (
    <div className="space-y-4">
      {/* 画像プレビュー一覧 */}
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {imageUrls.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative"
            >
              <Image
                src={url}
                alt={`アップロード画像 ${index + 1}`}
                width={120}
                height={120}
                className={`
                  size-[120px] rounded-lg border border-solid-gray-200
                  object-cover
                `}
                unoptimized
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={`
                    absolute -top-2 -right-2 flex size-6 items-center
                    justify-center rounded-full bg-red-600 text-white shadow-md
                    transition-opacity
                    group-hover:opacity-100
                    hover:bg-red-700
                    md:opacity-0
                  `}
                  aria-label={`画像${index + 1}を削除`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-4"
                  >
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* アップロードエリア */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          rounded-lg border-2 border-dashed bg-solid-gray-50 p-6 text-center
          transition-colors
          ${
            isDragging
              ? 'border-blue-900 bg-blue-50'
              : `
                border-solid-gray-200
                ${!isDisabled ? `
                  cursor-pointer
                  hover:border-blue-900 hover:bg-blue-50
                ` : ''}
              `
          }
          ${isDisabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isDisabled}
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-8 text-solid-gray-400"
          >
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <div className="text-sm text-solid-gray-700">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <div
                  className={`
                    size-4 animate-spin rounded-full border-2 border-blue-900
                    border-t-transparent
                  `}
                />
                <span>アップロード中...</span>
              </div>
            ) : !canAddMore ? (
              <div className="text-solid-gray-500">
                最大枚数（{maxImages}枚）に達しました
              </div>
            ) : (
              <>
                <div className="font-medium">
                  クリックまたはドラッグ＆ドロップ
                </div>
                <div className="text-xs text-solid-gray-500">
                  画像ファイルをアップロード（{imageUrls.length}/{maxImages}枚）
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* エラーメッセージ */}
      {(uploadError || error) && (
        <p className="text-sm text-red-600">{uploadError || error}</p>
      )}
    </div>
  );
};

export default ImageUploader;
