import type { Meta, StoryObj } from '@storybook/nextjs';

import { PageHeader } from './PageHeader';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  argTypes: {
    actionVariant: {
      control: 'select',
      options: ['solid-fill', 'outline', 'text'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  args: {
    title: 'ページタイトル',
  },
};

export const WithDescription: Story = {
  args: {
    title: '新規通報作成',
    description: '通報情報を入力してください',
  },
};

export const WithActionLink: Story = {
  args: {
    title: '通報詳細',
    description: 'ID: 123',
    actionLabel: '一覧に戻る',
    actionHref: '/inquiry',
    actionVariant: 'outline',
  },
};

export const WithActionButton: Story = {
  args: {
    title: 'データ管理',
    description: 'データを管理します',
    actionLabel: '新規作成',
    onAction: () => alert('新規作成がクリックされました'),
  },
};

export const LongTitleAndDescription: Story = {
  args: {
    title: '非常に長いタイトルのページ見出しのサンプル',
    description:
      'これは非常に長い説明文です。複数行に渡る場合のレイアウトを確認するためのサンプルテキストです。',
    actionLabel: 'アクション',
    actionHref: '#',
  },
};
