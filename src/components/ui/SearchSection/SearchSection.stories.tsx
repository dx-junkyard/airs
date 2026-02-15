import type { Meta, StoryObj } from '@storybook/nextjs';
import { useState } from 'react';

import { SearchSection } from './SearchSection';

const meta: Meta<typeof SearchSection> = {
  title: 'UI/SearchSection',
  component: SearchSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SearchSection>;

export const Default: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    return (
      <SearchSection
        searchFields={[
          {
            type: 'select',
            label: 'ステータス',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'すべて' },
              { value: 'waiting', label: '確認待ち' },
              { value: 'completed', label: '確認完了' },
            ],
          },
          {
            type: 'text',
            label: 'キーワード',
            value: searchQuery,
            onChange: setSearchQuery,
            placeholder: 'サイト内検索',
          },
        ]}
        onSearch={() =>
          alert(`Search: ${searchQuery}, Status: ${statusFilter}`)
        }
      />
    );
  },
};
