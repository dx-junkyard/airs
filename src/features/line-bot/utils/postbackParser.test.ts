import { describe, expect, it } from 'vitest';

import {
  buildPostbackData,
  parsePostbackData,
} from '@/features/line-bot/utils/postbackParser';

describe('parsePostbackData', () => {
  it('parses a single key-value pair', () => {
    const result = parsePostbackData('action=select_animal');
    expect(result).toEqual({ action: 'select_animal' });
  });

  it('parses multiple key-value pairs', () => {
    const result = parsePostbackData('action=select_animal&value=monkey');
    expect(result).toEqual({ action: 'select_animal', value: 'monkey' });
  });

  it('returns empty action for an empty string', () => {
    const result = parsePostbackData('');
    expect(result.action).toBeUndefined();
  });

  it('handles URL-encoded special characters', () => {
    const result = parsePostbackData('action=test&value=%E3%82%B5%E3%83%AB');
    expect(result.value).toBe('サル');
  });

  it('handles keys with no value', () => {
    const result = parsePostbackData('action=&value=monkey');
    expect(result.action).toBe('');
    expect(result.value).toBe('monkey');
  });
});

describe('buildPostbackData', () => {
  it('builds a single key-value pair', () => {
    const result = buildPostbackData({ action: 'select_animal' });
    expect(result).toBe('action=select_animal');
  });

  it('builds multiple key-value pairs', () => {
    const result = buildPostbackData({
      action: 'select_animal',
      value: 'monkey',
    });
    expect(result).toContain('action=select_animal');
    expect(result).toContain('value=monkey');
  });

  it('URL-encodes special characters', () => {
    const result = buildPostbackData({ action: 'test', value: 'サル' });
    const parsed = new URLSearchParams(result);
    expect(parsed.get('value')).toBe('サル');
  });
});

describe('round-trip: buildPostbackData → parsePostbackData', () => {
  it('preserves data through build then parse', () => {
    const original = { action: 'select_animal', value: 'wild_boar' };
    const encoded = buildPostbackData(original);
    const decoded = parsePostbackData(encoded);
    expect(decoded).toEqual(original);
  });

  it('preserves data with special characters', () => {
    const original = { action: 'answer_question', qid: 'q1', cid: 'c-2' };
    const encoded = buildPostbackData(original);
    const decoded = parsePostbackData(encoded);
    expect(decoded).toEqual(original);
  });
});
