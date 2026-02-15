'use client';

import { useRef, useState } from 'react';

export function useDeleteConfirmation() {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openDialog = () => dialogRef.current?.showModal();
  const closeDialog = () => dialogRef.current?.close();

  const handleDelete = async (
    deleteAction: () => Promise<void>,
    onSuccess?: () => void
  ) => {
    setIsDeleting(true);
    try {
      await deleteAction();
      closeDialog();
      onSuccess?.();
    } catch (error) {
      alert('削除に失敗しました');
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return { dialogRef, isDeleting, openDialog, closeDialog, handleDelete };
}
