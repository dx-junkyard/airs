import { type ReactNode } from 'react';
import Link from 'next/link';

import Button, { type ButtonVariant } from '@/components/ui/Button/Button';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  children?: ReactNode;
}

export const PageHeader = ({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  actionVariant = 'solid-fill',
  children,
}: PageHeaderProps) => {
  return (
    <div
      className={`
        flex flex-col items-start justify-between gap-4
        sm:flex-row sm:items-center
      `}
    >
      <div>
        <h1 className="text-3xl font-bold text-blue-900">{title}</h1>
        {description && (
          <p className="mt-1 text-solid-gray-700">{description}</p>
        )}
      </div>
      {children ? (
        children
      ) : actionLabel ? (
        actionHref ? (
          <Link href={actionHref}>
            <Button size="md" variant={actionVariant}>
              {actionLabel}
            </Button>
          </Link>
        ) : (
          <Button
            size="md"
            variant={actionVariant}
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </Button>
        )
      ) : null}
    </div>
  );
};
