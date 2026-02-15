import type { Meta, StoryObj } from '@storybook/nextjs';
import ToggleSwitch from './ToggleSwitch';

const meta = {
  title: 'UI/Search/ToggleSwitch',
  component: ToggleSwitch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '現在の値',
    },
    label: {
      control: 'text',
      description: 'ラベル',
    },
    onLabel: {
      control: 'text',
      description: 'オン時のラベル',
    },
    offLabel: {
      control: 'text',
      description: 'オフ時のラベル',
    },
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {
  args: {
    id: 'toggle-off',
    label: 'タイムライン:',
    checked: false,
    onChange: (checked) => console.log('Changed:', checked),
  },
};

export const On: Story = {
  args: {
    id: 'toggle-on',
    label: 'タイムライン:',
    checked: true,
    onChange: (checked) => console.log('Changed:', checked),
  },
};

export const CustomLabels: Story = {
  args: {
    id: 'toggle-custom',
    label: '通知:',
    checked: true,
    onChange: (checked) => console.log('Changed:', checked),
    onLabel: '有効',
    offLabel: '無効',
  },
};

export const LongLabel: Story = {
  args: {
    id: 'toggle-long',
    label: 'リアルタイム更新:',
    checked: false,
    onChange: (checked) => console.log('Changed:', checked),
  },
};
