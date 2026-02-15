import type { Meta, StoryObj } from '@storybook/nextjs';
import {
  faList,
  faMap,
  faTable,
  faChartBar,
  faGripHorizontal,
} from '@fortawesome/free-solid-svg-icons';
import ViewModeToggle from './ViewModeToggle';

const meta = {
  title: 'UI/Search/ViewModeToggle',
  component: ViewModeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ViewModeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ListMapToggle: Story = {
  args: {
    value: 'list',
    onChange: (value) => console.log('View mode:', value),
    options: [
      { value: 'list', label: 'リスト', icon: faList },
      { value: 'map', label: '地図', icon: faMap },
    ],
  },
};

export const MapSelected: Story = {
  args: {
    value: 'map',
    onChange: (value) => console.log('View mode:', value),
    options: [
      { value: 'list', label: 'リスト', icon: faList },
      { value: 'map', label: '地図', icon: faMap },
    ],
  },
};

export const ThreeOptions: Story = {
  args: {
    value: 'table',
    onChange: (value) => console.log('View mode:', value),
    options: [
      { value: 'list', label: 'リスト', icon: faList },
      { value: 'table', label: 'テーブル', icon: faTable },
      { value: 'chart', label: 'チャート', icon: faChartBar },
    ],
  },
};

export const GridListToggle: Story = {
  args: {
    value: 'grid',
    onChange: (value) => console.log('View mode:', value),
    options: [
      { value: 'list', label: 'リスト', icon: faList },
      { value: 'grid', label: 'グリッド', icon: faGripHorizontal },
    ],
  },
};
