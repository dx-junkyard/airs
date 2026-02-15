import type { Meta, StoryObj } from '@storybook/nextjs';
import SearchResultCount from './SearchResultCount';

const meta = {
  title: 'UI/Search/SearchResultCount',
  component: SearchResultCount,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
      description: '検索結果の件数',
    },
    label: {
      control: 'text',
      description: '単位ラベル',
    },
    prefix: {
      control: 'text',
      description: 'プレフィックスラベル',
    },
  },
} satisfies Meta<typeof SearchResultCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    count: 42,
  },
};

export const ZeroResults: Story = {
  args: {
    count: 0,
  },
};

export const LargeNumber: Story = {
  args: {
    count: 1234,
  },
};

export const CustomLabels: Story = {
  args: {
    count: 15,
    prefix: '表示中:',
    label: 'アイテム',
  },
};
