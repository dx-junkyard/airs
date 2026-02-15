import type { Meta, StoryObj } from '@storybook/nextjs';
import ActiveFilterDisplay from './ActiveFilterDisplay';

const meta = {
  title: 'UI/Search/ActiveFilterDisplay',
  component: ActiveFilterDisplay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActiveFilterDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleFilter: Story = {
  args: {
    filters: [
      {
        key: 'status',
        label: 'ステータス: 確認待ち',
        onRemove: () => console.log('Remove status'),
      },
    ],
    onClearAll: () => console.log('Clear all'),
  },
};

export const MultipleFilters: Story = {
  args: {
    filters: [
      {
        key: 'status',
        label: 'ステータス: 確認待ち',
        onRemove: () => console.log('Remove status'),
      },
      {
        key: 'animalType',
        label: '獣種: サル',
        onRemove: () => console.log('Remove animal type'),
      },
      {
        key: 'query',
        label: '検索: "東京"',
        onRemove: () => console.log('Remove query'),
      },
    ],
    onClearAll: () => console.log('Clear all'),
  },
};

export const WithDateRange: Story = {
  args: {
    filters: [
      {
        key: 'status',
        label: 'ステータス: 確認待ち',
        onRemove: () => console.log('Remove status'),
      },
      {
        key: 'dateRange',
        label: '期間: 2024-01-01 ~ 2024-06-30',
        onRemove: () => console.log('Remove date range'),
      },
    ],
    onClearAll: () => console.log('Clear all'),
  },
};

export const Empty: Story = {
  args: {
    filters: [],
    onClearAll: () => console.log('Clear all'),
  },
};

export const CustomLabels: Story = {
  args: {
    filters: [
      {
        key: 'category',
        label: 'カテゴリ: 通報グループ',
        onRemove: () => console.log('Remove category'),
      },
    ],
    onClearAll: () => console.log('Clear all'),
    prefix: '絞り込み条件:',
    clearAllLabel: 'リセット',
  },
};
