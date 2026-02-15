import type { Meta, StoryObj } from '@storybook/nextjs';
import { faList, faMap } from '@fortawesome/free-solid-svg-icons';
import FilterBar from './FilterBar';
import AdvancedFilterToggleButton from './AdvancedFilterToggleButton';
import ViewModeToggle from './ViewModeToggle';
import AdvancedFiltersPanel, { AdvancedFilterItem } from './AdvancedFiltersPanel';
import Select from '@/components/ui/Select/Select';

const meta = {
  title: 'UI/Search/FilterBar',
  component: FilterBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const statusOptions = [
  { value: 'all', label: '全ステータス' },
  { value: 'waiting', label: '確認待ち' },
  { value: 'completed', label: '確認完了' },
];

const animalTypeOptions = [
  { value: 'all', label: '全獣種' },
  { value: 'monkey', label: 'サル' },
  { value: 'deer', label: 'シカ' },
  { value: 'wild_boar', label: 'イノシシ' },
  { value: 'bear', label: 'クマ' },
  { value: 'other', label: 'その他' },
];

export const Default: Story = {
  args: {
    search: {
      value: '',
      placeholder: '住所や説明で検索',
      onSearch: (value) => console.log('Search:', value),
    },
    filters: [
      {
        id: 'status',
        ariaLabel: 'ステータスで絞り込み',
        value: 'all',
        options: statusOptions,
        onChange: (value) => console.log('Status:', value),
      },
      {
        id: 'animalType',
        ariaLabel: '獣種で絞り込み',
        value: 'all',
        options: animalTypeOptions,
        onChange: (value) => console.log('Animal type:', value),
      },
    ],
  },
};

export const WithActions: Story = {
  args: {
    search: {
      value: '',
      placeholder: '住所や説明で検索',
      onSearch: (value) => console.log('Search:', value),
    },
    filters: [
      {
        id: 'status',
        ariaLabel: 'ステータスで絞り込み',
        value: 'all',
        options: statusOptions,
        onChange: (value) => console.log('Status:', value),
      },
    ],
    actions: (
      <>
        <AdvancedFilterToggleButton
          isOpen={false}
          onToggle={() => console.log('Toggle advanced')}
        />
        <ViewModeToggle
          value="list"
          onChange={(value) => console.log('View mode:', value)}
          options={[
            { value: 'list', label: 'リスト', icon: faList },
            { value: 'map', label: '地図', icon: faMap },
          ]}
        />
      </>
    ),
  },
};

export const WithAdvancedPanel: Story = {
  args: {
    search: {
      value: '',
      placeholder: '住所や説明で検索',
      onSearch: (value) => console.log('Search:', value),
    },
    filters: [
      {
        id: 'status',
        ariaLabel: 'ステータスで絞り込み',
        value: 'all',
        options: statusOptions,
        onChange: (value) => console.log('Status:', value),
      },
    ],
    actions: (
      <AdvancedFilterToggleButton
        isOpen={true}
        onToggle={() => console.log('Toggle advanced')}
      />
    ),
    advancedPanel: (
      <AdvancedFiltersPanel isOpen={true}>
        <AdvancedFilterItem label="並び順:" htmlFor="sort-order" grow>
          <Select id="sort-order" className={`
            w-full
            sm:w-auto sm:min-w-40
          `}>
            <option value="desc">通報日時の降順</option>
            <option value="asc">通報日時の昇順</option>
          </Select>
        </AdvancedFilterItem>
      </AdvancedFiltersPanel>
    ),
  },
};

export const FiltersOnly: Story = {
  args: {
    filters: [
      {
        id: 'animalType',
        ariaLabel: '獣種で絞り込み',
        value: 'all',
        options: animalTypeOptions,
        onChange: (value) => console.log('Animal type:', value),
      },
    ],
  },
};
