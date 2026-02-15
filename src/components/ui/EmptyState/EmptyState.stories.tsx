import type { Meta, StoryObj } from '@storybook/nextjs';

import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    message: 'データが見つかりませんでした',
  },
};

export const WithDescription: Story = {
  args: {
    message: '通報がありません',
    description: '検索条件を変更するか、フィルターをクリアしてお試しください',
  },
};

export const WithAction: Story = {
  args: {
    message: '通報がありません',
    actionLabel: '一覧に戻る',
    actionHref: '/inquiry',
  },
};

export const WithCallback: Story = {
  args: {
    message: '写真が見つかりませんでした',
    actionLabel: '再読み込み',
    onAction: () => alert('Reload'),
  },
};
