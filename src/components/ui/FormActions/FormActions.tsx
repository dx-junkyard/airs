import Link from 'next/link';

import Button from '@/components/ui/Button/Button';

export interface FormActionsProps {
  submitLabel: string;
  cancelLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitDisabled?: boolean;
  cancelDisabled?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const FormActions = ({
  submitLabel,
  cancelLabel = 'キャンセル',
  cancelHref,
  onCancel,
  isSubmitting = false,
  submitDisabled = false,
  cancelDisabled = false,
  align = 'right',
}: FormActionsProps) => {
  const alignmentClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }[align];

  return (
    <div
      className={`
        flex
        ${alignmentClass}
        gap-4
      `}
    >
      {(cancelHref || onCancel) && (
        <>
          {cancelHref ? (
            <Link href={cancelHref}>
              <Button size="md" variant="outline" type="button">
                {cancelLabel}
              </Button>
            </Link>
          ) : (
            <Button
              size="md"
              variant="outline"
              onClick={onCancel}
              type="button"
              disabled={cancelDisabled}
              aria-disabled={cancelDisabled}
            >
              {cancelLabel}
            </Button>
          )}
        </>
      )}
      <Button
        size="md"
        variant="solid-fill"
        type="submit"
        disabled={isSubmitting || submitDisabled}
        aria-disabled={isSubmitting || submitDisabled}
      >
        {isSubmitting ? '送信中...' : submitLabel}
      </Button>
    </div>
  );
};
