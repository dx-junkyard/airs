import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { RadioGroup } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Horizontal: Story = {
  render: () => {
    const [value, setValue] = useState('yes');
    return (
      <RadioGroup
        name="contact"
        label="連絡希望"
        value={value}
        onChange={setValue}
        options={[
          { value: 'yes', label: '希望する' },
          { value: 'no', label: '希望しない' },
        ]}
        required
        supportText="折り返しのご連絡を希望する場合は「希望する」を選択してください"
      />
    );
  },
};

export const Vertical: Story = {
  render: () => {
    const [value, setValue] = useState('email');
    return (
      <RadioGroup
        name="method"
        label="連絡方法"
        value={value}
        onChange={setValue}
        options={[
          { value: 'email', label: 'メール' },
          { value: 'phone', label: '電話' },
          { value: 'mail', label: '郵送' },
        ]}
        direction="vertical"
      />
    );
  },
};
