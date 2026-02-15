import type { Meta, StoryObj } from '@storybook/nextjs';

import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: 'カードの内容がここに表示されます。',
  },
};

export const WithTitle: Story = {
  args: {
    title: '基本情報',
    children: 'タイトル付きのカードです。',
  },
};

export const SmallPadding: Story = {
  args: {
    title: '小さいパディング',
    children: 'パディングが小さいカードです。',
    padding: 'sm',
  },
};

export const LargePadding: Story = {
  args: {
    title: '大きいパディング',
    children: 'パディングが大きいカードです。',
    padding: 'lg',
  },
};

export const WithComplexContent: Story = {
  args: {
    title: '通報詳細',
    children: `複数行のコンテンツを含むカードです。

    これは段落1です。

    これは段落2です。`,
  },
};
