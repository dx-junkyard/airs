import { type RefObject } from 'react';

import Button from '@/components/ui/Button/Button';
import Dialog from '@/components/ui/Dialog/Dialog';
import DialogBody from '@/components/ui/Dialog/DialogBody';

export interface DeleteConfirmationDialogProps {
  dialogRef: RefObject<HTMLDialogElement | null>;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationDialog = ({
  dialogRef,
  title = '削除しますか？',
  message = 'この操作は取り消せません。本当に削除してもよろしいですか？',
  confirmLabel = '削除する',
  cancelLabel = 'キャンセル',
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) => {
  return (
    <Dialog ref={dialogRef}>
      <DialogBody>
        <h2 className="mb-4 text-xl font-semibold text-blue-900">{title}</h2>
        <p className="mb-6 text-solid-gray-700">{message}</p>
        <div className="flex justify-end gap-2">
          <Button size="md" variant="outline" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="md"
            variant="solid-fill"
            onClick={onConfirm}
            disabled={isDeleting}
            className={`
              bg-red-600
              hover:bg-red-700
            `}
          >
            {isDeleting ? '削除中...' : confirmLabel}
          </Button>
        </div>
      </DialogBody>
    </Dialog>
  );
};
