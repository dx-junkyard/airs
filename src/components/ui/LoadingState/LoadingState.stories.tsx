import type { Meta, StoryObj } from '@storybook/nextjs';

import { LoadingState } from './LoadingState';

const meta: Meta<typeof LoadingState> = {
  title: 'UI/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {},
};

export const CustomMessage: Story = {
  args: {
    message: 'データを取得しています...',
  },
};

export const ShortHeight: Story = {
  args: {
    minHeight: 'min-h-[200px]',
  },
};
