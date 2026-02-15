import type { Meta, StoryObj } from '@storybook/nextjs';

import { FormActions } from './FormActions';

const meta: Meta<typeof FormActions> = {
  title: 'UI/FormActions',
  component: FormActions,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormActions>;

export const Default: Story = {
  args: {
    submitLabel: '作成する',
    cancelLabel: 'キャンセル',
    cancelHref: '/inquiry',
  },
};

export const Submitting: Story = {
  args: {
    submitLabel: '保存する',
    cancelLabel: 'キャンセル',
    cancelHref: '/inquiry',
    isSubmitting: true,
  },
};

export const AlignLeft: Story = {
  args: {
    submitLabel: '送信する',
    cancelLabel: '戻る',
    onCancel: () => alert('Cancelled'),
    align: 'left',
  },
};

export const AlignCenter: Story = {
  args: {
    submitLabel: '登録する',
    cancelHref: '/',
    align: 'center',
  },
};
