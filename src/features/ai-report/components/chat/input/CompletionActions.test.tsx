import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CompletionActions from './CompletionActions';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('CompletionActions', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders start over button always', () => {
    render(<CompletionActions onStartOver={vi.fn()} />);

    expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
  });

  it('renders view report button when reportToken is provided', () => {
    render(<CompletionActions onStartOver={vi.fn()} reportToken="token123" />);

    expect(screen.getByText('通報内容を確認・編集')).toBeInTheDocument();
  });

  it('does not render view report button when reportToken is not provided', () => {
    render(<CompletionActions onStartOver={vi.fn()} />);

    expect(screen.queryByText('通報内容を確認・編集')).not.toBeInTheDocument();
  });

  it('renders map button when reportLocation is provided', () => {
    render(
      <CompletionActions
        onStartOver={vi.fn()}
        reportLocation={{ latitude: 35.6, longitude: 139.7 }}
      />
    );

    expect(screen.getByText('地図で通報場所を確認')).toBeInTheDocument();
  });

  it('does not render map button when reportLocation is null', () => {
    render(<CompletionActions onStartOver={vi.fn()} reportLocation={null} />);

    expect(screen.queryByText('地図で通報場所を確認')).not.toBeInTheDocument();
  });

  it('does not render map button when reportLocation is not provided', () => {
    render(<CompletionActions onStartOver={vi.fn()} />);

    expect(screen.queryByText('地図で通報場所を確認')).not.toBeInTheDocument();
  });

  it('navigates to report page on view report button click', async () => {
    render(<CompletionActions onStartOver={vi.fn()} reportToken="abc123" />);

    await userEvent.click(screen.getByText('通報内容を確認・編集'));

    expect(mockPush).toHaveBeenCalledWith('/report?token=abc123');
  });

  it('navigates to map page with coordinates on map button click', async () => {
    render(
      <CompletionActions
        onStartOver={vi.fn()}
        reportLocation={{ latitude: 35.6, longitude: 139.7 }}
      />
    );

    await userEvent.click(screen.getByText('地図で通報場所を確認'));

    expect(mockPush).toHaveBeenCalledWith('/map?lat=35.6&lng=139.7&zoom=18');
  });

  it('calls onStartOver when restart button is clicked', async () => {
    const onStartOver = vi.fn();
    render(<CompletionActions onStartOver={onStartOver} />);

    await userEvent.click(screen.getByText('最初からやり直す'));

    expect(onStartOver).toHaveBeenCalledOnce();
  });

  it('renders all three buttons when all props are provided', () => {
    render(
      <CompletionActions
        onStartOver={vi.fn()}
        reportToken="token123"
        reportLocation={{ latitude: 35.6, longitude: 139.7 }}
      />
    );

    expect(screen.getByText('通報内容を確認・編集')).toBeInTheDocument();
    expect(screen.getByText('地図で通報場所を確認')).toBeInTheDocument();
    expect(screen.getByText('最初からやり直す')).toBeInTheDocument();
  });
});
