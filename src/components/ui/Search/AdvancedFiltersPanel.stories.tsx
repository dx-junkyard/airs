import type { Meta, StoryObj } from '@storybook/nextjs';
import AdvancedFiltersPanel, { AdvancedFilterItem } from './AdvancedFiltersPanel';
import ToggleSwitch from './ToggleSwitch';
import Select from '@/components/ui/Select/Select';
import DateRangePicker from '@/components/ui/DateRangePicker/DateRangePicker';

const meta = {
  title: 'UI/Search/AdvancedFiltersPanel',
  component: AdvancedFiltersPanel,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AdvancedFiltersPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    children: (
      <>
        <AdvancedFilterItem label="期間:" grow>
          <DateRangePicker aria-label="検索期間" value={null} onChange={() => {}} />
        </AdvancedFilterItem>
        <AdvancedFilterItem label="並び順:" htmlFor="sort-order">
          <Select id="sort-order" className={`
            w-full
            sm:w-auto sm:min-w-40
          `}>
            <option value="desc">通報日時の降順</option>
            <option value="asc">通報日時の昇順</option>
          </Select>
        </AdvancedFilterItem>
      </>
    ),
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    children: (
      <AdvancedFilterItem label="並び順:" htmlFor="sort-order">
        <Select id="sort-order" className={`
          w-full
          sm:w-auto sm:min-w-40
        `}>
          <option value="desc">通報日時の降順</option>
          <option value="asc">通報日時の昇順</option>
        </Select>
      </AdvancedFilterItem>
    ),
  },
};

export const WithExtraSection: Story = {
  args: {
    isOpen: true,
    children: (
      <>
        <AdvancedFilterItem label="期間:" grow>
          <DateRangePicker aria-label="検索期間" value={null} onChange={() => {}} />
        </AdvancedFilterItem>
        <AdvancedFilterItem label="並び順:" htmlFor="sort-order">
          <Select id="sort-order" className={`
            w-full
            sm:w-auto sm:min-w-40
          `}>
            <option value="desc">通報日時の降順</option>
            <option value="asc">通報日時の昇順</option>
          </Select>
        </AdvancedFilterItem>
      </>
    ),
    extraSection: (
      <>
        <ToggleSwitch
          id="timeline-toggle"
          label="タイムライン:"
          checked={false}
          onChange={() => {}}
        />
        <AdvancedFilterItem label="表示期間:" htmlFor="display-days">
          <Select id="display-days" className="w-28">
            <option value="3">3日間</option>
            <option value="7">7日間</option>
            <option value="14">14日間</option>
            <option value="30">30日間</option>
          </Select>
        </AdvancedFilterItem>
      </>
    ),
  },
};

export const SortOrderOnly: Story = {
  args: {
    isOpen: true,
    children: (
      <AdvancedFilterItem label="並び順:" htmlFor="sort-order">
        <Select id="sort-order" className={`
          w-full
          sm:w-auto sm:min-w-40
          lg:w-52
        `}>
          <option value="desc">通報日時の降順</option>
          <option value="asc">通報日時の昇順</option>
        </Select>
      </AdvancedFilterItem>
    ),
  },
};
