import Link from 'next/link';

import Button from '@/components/ui/Button/Button';

export interface EmptyStateProps {
  message: string;
  /** メインメッセージの下に表示するガイダンステキスト */
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export const EmptyState = ({
  message,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) => {
  return (
    <div className="py-8 text-center">
      <p className="text-solid-gray-600">{message}</p>
      {description && (
        <p className="mt-2 text-sm text-solid-gray-420">{description}</p>
      )}
      {actionLabel && (
        <div className="mt-4">
          {actionHref ? (
            <Link href={actionHref}>
              <Button size="md" variant="solid-fill">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="md" variant="solid-fill" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
