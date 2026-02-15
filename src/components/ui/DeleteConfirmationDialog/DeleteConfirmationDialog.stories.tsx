import type { Meta, StoryObj } from '@storybook/nextjs';
import { useRef } from 'react';

import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

const meta: Meta<typeof DeleteConfirmationDialog> = {
  title: 'UI/DeleteConfirmationDialog',
  component: DeleteConfirmationDialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof DeleteConfirmationDialog>;

export const Default: Story = {
  render: (args) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    return (
      <div>
        <button
          onClick={() => dialogRef.current?.showModal()}
          className={`
            rounded bg-blue-600 px-4 py-2 text-white
            hover:bg-blue-700
          `}
        >
          ダイアログを開く
        </button>
        <DeleteConfirmationDialog {...args} dialogRef={dialogRef} />
      </div>
    );
  },
  args: {
    isDeleting: false,
    onConfirm: () => alert('削除が確認されました'),
    onCancel: () => alert('キャンセルされました'),
  },
};

export const CustomLabels: Story = {
  render: (args) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    return (
      <div>
        <button
          onClick={() => dialogRef.current?.showModal()}
          className={`
            rounded bg-blue-600 px-4 py-2 text-white
            hover:bg-blue-700
          `}
        >
          ダイアログを開く
        </button>
        <DeleteConfirmationDialog {...args} dialogRef={dialogRef} />
      </div>
    );
  },
  args: {
    title: 'ファイルを削除しますか？',
    message: 'このファイルを削除すると、関連するデータも全て削除されます。',
    confirmLabel: '完全に削除',
    cancelLabel: '戻る',
    isDeleting: false,
    onConfirm: () => alert('削除が確認されました'),
    onCancel: () => alert('キャンセルされました'),
  },
};

export const Deleting: Story = {
  render: (args) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    return (
      <div>
        <button
          onClick={() => dialogRef.current?.showModal()}
          className={`
            rounded bg-blue-600 px-4 py-2 text-white
            hover:bg-blue-700
          `}
        >
          ダイアログを開く
        </button>
        <DeleteConfirmationDialog {...args} dialogRef={dialogRef} />
      </div>
    );
  },
  args: {
    isDeleting: true,
    onConfirm: () => alert('削除が確認されました'),
    onCancel: () => alert('キャンセルされました'),
  },
};
