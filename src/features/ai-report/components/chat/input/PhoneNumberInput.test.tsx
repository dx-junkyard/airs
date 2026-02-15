import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import PhoneNumberInput, { validatePhoneNumber } from './PhoneNumberInput';

describe('validatePhoneNumber', () => {
  it('returns true for empty string', () => {
    expect(validatePhoneNumber('')).toBe(true);
  });

  it('returns true for valid phone number without hyphens', () => {
    expect(validatePhoneNumber('09012345678')).toBe(true);
  });

  it('returns true for valid phone number with hyphens', () => {
    expect(validatePhoneNumber('090-1234-5678')).toBe(true);
  });

  it('returns true for valid landline number', () => {
    expect(validatePhoneNumber('0312345678')).toBe(true);
  });

  it('returns false for number not starting with 0', () => {
    expect(validatePhoneNumber('1234567890')).toBe(false);
  });

  it('returns false for too short number', () => {
    expect(validatePhoneNumber('090123')).toBe(false);
  });

  it('returns false for too long number', () => {
    expect(validatePhoneNumber('090123456789')).toBe(false);
  });

  it('returns false for non-numeric characters', () => {
    expect(validatePhoneNumber('090abcdefgh')).toBe(false);
  });
});

describe('PhoneNumberInput', () => {
  it('renders input field and buttons', () => {
    render(<PhoneNumberInput onSubmit={vi.fn()} onSkip={vi.fn()} />);

    expect(
      screen.getByPlaceholderText('例: 090-1234-5678')
    ).toBeInTheDocument();
    expect(screen.getByText('スキップ')).toBeInTheDocument();
    expect(screen.getByText('送信')).toBeInTheDocument();
  });

  it('calls onSkip when skip button is clicked', async () => {
    const onSkip = vi.fn();
    render(<PhoneNumberInput onSubmit={vi.fn()} onSkip={onSkip} />);

    await userEvent.click(screen.getByText('スキップ'));

    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('calls onSubmit with valid phone number', async () => {
    const onSubmit = vi.fn();
    render(<PhoneNumberInput onSubmit={onSubmit} onSkip={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText('例: 090-1234-5678'),
      '090-1234-5678'
    );
    await userEvent.click(screen.getByText('送信'));

    expect(onSubmit).toHaveBeenCalledWith('090-1234-5678');
  });

  it('shows validation error for invalid phone number', async () => {
    render(<PhoneNumberInput onSubmit={vi.fn()} onSkip={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText('例: 090-1234-5678'),
      '123'
    );
    await userEvent.click(screen.getByText('送信'));

    expect(
      screen.getByText('電話番号の形式が正しくありません')
    ).toBeInTheDocument();
  });

  it('calls onSkip when submit is clicked with empty input', async () => {
    const onSkip = vi.fn();
    render(<PhoneNumberInput onSubmit={vi.fn()} onSkip={onSkip} />);

    await userEvent.click(screen.getByText('送信'));

    expect(onSkip).toHaveBeenCalledOnce();
  });

  it('accepts phone number without hyphens', async () => {
    const onSubmit = vi.fn();
    render(<PhoneNumberInput onSubmit={onSubmit} onSkip={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText('例: 090-1234-5678'),
      '09012345678'
    );
    await userEvent.click(screen.getByText('送信'));

    expect(onSubmit).toHaveBeenCalledWith('09012345678');
  });

  it('clears error when user starts typing after validation error', async () => {
    render(<PhoneNumberInput onSubmit={vi.fn()} onSkip={vi.fn()} />);

    const input = screen.getByPlaceholderText('例: 090-1234-5678');

    // Trigger validation error
    await userEvent.type(input, '123');
    await userEvent.click(screen.getByText('送信'));
    expect(
      screen.getByText('電話番号の形式が正しくありません')
    ).toBeInTheDocument();

    // Start typing to clear error
    await userEvent.type(input, '4');
    expect(
      screen.queryByText('電話番号の形式が正しくありません')
    ).not.toBeInTheDocument();
  });

  it('does not call onSubmit for invalid phone number', async () => {
    const onSubmit = vi.fn();
    render(<PhoneNumberInput onSubmit={onSubmit} onSkip={vi.fn()} />);

    await userEvent.type(
      screen.getByPlaceholderText('例: 090-1234-5678'),
      '999'
    );
    await userEvent.click(screen.getByText('送信'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
