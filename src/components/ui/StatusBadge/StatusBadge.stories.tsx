import type { Meta, StoryObj } from '@storybook/nextjs';

import StatusBadge from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

// 通報ステータス
export const Waiting: Story = {
  render: () => <StatusBadge status="waiting" />,
};

export const Completed: Story = {
  render: () => <StatusBadge status="completed" />,
};

// 全ステータス一覧
export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <StatusBadge status="waiting" />
      <StatusBadge status="completed" />
    </div>
  ),
};
