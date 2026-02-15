import type { Meta, StoryObj } from '@storybook/nextjs';

import { FAQSection } from './FAQSection';

const meta: Meta<typeof FAQSection> = {
  title: 'UI/FAQSection',
  component: FAQSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FAQSection>;

export const Default: Story = {
  args: {
    items: [
      {
        question: '通報のステータスを変更するには？',
        answer:
          '通報の詳細ページを開き、ステータス選択欄から変更したいステータスを選択してください。保存ボタンを押すと変更が反映されます。',
      },
      {
        question: '検索結果が表示されない場合は？',
        answer:
          '検索キーワードを変更するか、ステータスフィルターを「すべて」に設定してみてください。それでも見つからない場合は、通報が削除されている可能性があります。',
      },
      {
        question: '通報を削除することはできますか？',
        answer:
          '通報の詳細ページから削除できます。削除した通報は復元できませんので、ご注意ください。',
      },
    ],
  },
};

export const CustomTitle: Story = {
  args: {
    title: 'ヘルプ',
    items: [
      {
        question: 'パスワードを忘れた場合は？',
        answer:
          'ログイン画面の「パスワードを忘れた方」リンクから、パスワードリセットの手続きを行ってください。',
      },
    ],
  },
};
