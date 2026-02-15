export interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState = ({
  message = '読み込み中...',
  minHeight = 'min-h-[400px]',
}: LoadingStateProps) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center gap-4
        ${minHeight}
      `}
    >
      <div
        className={`
          size-8 animate-spin rounded-full border-4 border-solid-gray-200
          border-t-blue-600
        `}
      />
      <p className="text-solid-gray-600">{message}</p>
    </div>
  );
};
