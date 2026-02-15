import type { Meta, StoryObj } from '@storybook/nextjs';
import AdvancedFilterToggleButton from './AdvancedFilterToggleButton';

const meta = {
  title: 'UI/Search/AdvancedFilterToggleButton',
  component: AdvancedFilterToggleButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '詳細フィルターが開いているかどうか',
    },
    label: {
      control: 'text',
      description: 'ボタンラベル',
    },
  },
} satisfies Meta<typeof AdvancedFilterToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  args: {
    isOpen: false,
    onToggle: () => console.log('Toggle'),
  },
};

export const Open: Story = {
  args: {
    isOpen: true,
    onToggle: () => console.log('Toggle'),
  },
};

export const CustomLabel: Story = {
  args: {
    isOpen: false,
    onToggle: () => console.log('Toggle'),
    label: '絞り込み',
  },
};
