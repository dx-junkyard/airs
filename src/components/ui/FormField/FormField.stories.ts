import type { Meta, StoryObj } from '@storybook/nextjs';

import { FormField } from './FormField';

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const InputRequired: Story = {
  args: {
    id: 'name',
    label: '氏名',
    type: 'input',
    inputType: 'text',
    value: '',
    onChange: () => {},
    required: true,
    placeholder: '山田 太郎',
    supportText: 'フルネームで入力してください',
  },
};

export const InputOptional: Story = {
  args: {
    id: 'phone',
    label: '電話番号',
    type: 'input',
    inputType: 'tel',
    value: '',
    onChange: () => {},
    optional: true,
    placeholder: '090-1234-5678',
    supportText: '緊急時の連絡先として使用します',
  },
};

export const InputWithError: Story = {
  args: {
    id: 'email',
    label: 'メールアドレス',
    type: 'input',
    inputType: 'email',
    value: 'invalid-email',
    onChange: () => {},
    required: true,
    error: '有効なメールアドレスを入力してください',
  },
};

export const TextareaField: Story = {
  args: {
    id: 'content',
    label: '通報内容',
    type: 'textarea',
    value: '',
    onChange: () => {},
    required: true,
    placeholder: '通報内容を詳しく入力してください',
    rows: 8,
    supportText:
      'できるだけ具体的に状況を説明してください。必要に応じてエラーメッセージや操作手順なども記載してください。',
  },
};

export const SelectField: Story = {
  args: {
    id: 'category',
    label: 'カテゴリ',
    type: 'select',
    value: 'general',
    onChange: () => {},
    required: true,
    options: [
      { value: 'general', label: '一般的な通報' },
      { value: 'technical', label: '技術的な問題' },
      { value: 'billing', label: '請求・支払いに関する通報' },
      { value: 'complaint', label: '苦情・要望' },
      { value: 'other', label: 'その他' },
    ],
    supportText: '通報の種類を選択してください',
  },
};

export const DateField: Story = {
  args: {
    id: 'receivedAt',
    label: '受付日',
    type: 'input',
    inputType: 'date',
    value: '2024-01-01',
    onChange: () => {},
    required: true,
    supportText: '通報を受け付けた日付を選択してください',
  },
};
