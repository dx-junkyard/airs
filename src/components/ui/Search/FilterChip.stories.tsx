import type { Meta, StoryObj } from '@storybook/nextjs';
import FilterChip from './FilterChip';

const meta = {
  title: 'UI/Search/FilterChip',
  component: FilterChip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onRemove: () => {},
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'フィルターのラベル',
    },
    onRemove: {
      description: '削除ボタンクリック時のコールバック',
    },
  },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'ステータス: 確認待ち',
  },
};

export const AnimalType: Story = {
  args: {
    label: '獣種: サル',
  },
};

export const SearchQuery: Story = {
  args: {
    label: '検索: "東京都"',
  },
};

export const DateRange: Story = {
  args: {
    label: '期間: 2024-01-01 ~ 2024-12-31',
  },
};

export const MultipleChips: Story = {
  args: {
    label: 'ステータス: 確認待ち',
  },
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      <FilterChip label={args.label} onRemove={args.onRemove} />
      <FilterChip label="獣種: サル" onRemove={args.onRemove} />
      <FilterChip label='検索: "山田"' onRemove={args.onRemove} />
    </div>
  ),
};
