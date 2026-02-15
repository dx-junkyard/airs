import React, { useRef, useState } from 'react';

interface PhotoUploadInputProps {
  onUpload: (file: File) => void;
  onSkip?: () => void;
  isUploading?: boolean;
}

export const PhotoUploadInput: React.FC<PhotoUploadInputProps> = ({
  onUpload,
  onSkip,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          cursor-pointer rounded-lg border-2 border-dashed bg-solid-gray-50 p-6
          text-center transition-colors
          ${
          isDragging
            ? 'border-blue-900 bg-blue-50'
            : `
              border-solid-gray-200
              hover:border-blue-900 hover:bg-blue-50
            `
        }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
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
                <div className={`
                  size-4 animate-spin rounded-full border-2 border-blue-900
                  border-t-transparent
                `} />
                <span>アップロード中...</span>
              </div>
            ) : (
              <>
                <div className="font-medium">
                  クリックまたはドラッグ＆ドロップ
                </div>
                <div className="text-xs text-solid-gray-500">
                  画像ファイルをアップロード
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          disabled={isUploading}
          className={`
            mt-2 w-full rounded-lg border border-solid-gray-300 bg-white px-4
            py-2 text-sm text-solid-gray-600 transition-colors
            hover:bg-solid-gray-50
            disabled:cursor-not-allowed disabled:opacity-50
          `}
        >
          写真なしで続ける
        </button>
      )}
    </>
  );
};

export default PhotoUploadInput;
