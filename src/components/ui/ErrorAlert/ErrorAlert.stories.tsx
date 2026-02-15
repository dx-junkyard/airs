import type { Meta, StoryObj } from '@storybook/nextjs';

import { ErrorAlert } from './ErrorAlert';

const meta: Meta<typeof ErrorAlert> = {
  title: 'UI/ErrorAlert',
  component: ErrorAlert,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorAlert>;

export const Default: Story = {
  args: {
    message: '保存に失敗しました',
  },
};

export const LongMessage: Story = {
  args: {
    message:
      'データの保存中にエラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。',
  },
};

export const NoMessage: Story = {
  args: {
    message: undefined,
  },
};
