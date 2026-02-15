import { describe, expect, it } from 'vitest';

import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';
import type { NearbyLandmark } from '@/features/ai-report/types';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import {
  buildActionCategoryMessages,
  buildAnimalTypeMessage,
  buildCompletionMessage,
  buildDateTimeMessage,
  buildLocationMessage,
  buildNearbyLandmarksMessage,
  buildPhoneNumberPromptMessage,
  buildPhotoPromptMessages,
  buildReportDraftMessage,
} from '@/features/line-bot/services/LineMessageBuilder';

describe('buildPhotoPromptMessages', () => {
  it('keeps quick reply on the last message so choices are visible', () => {
    const messages = buildPhotoPromptMessages();
    const lastMessage = messages[messages.length - 1] as {
      quickReply?: { items: unknown[] };
    };

    expect(messages).toHaveLength(1);
    expect(lastMessage.quickReply?.items.length).toBe(3);
  });
});

describe('buildPhoneNumberPromptMessage', () => {
  it('shows two choices and opens keyboard when user chooses to send phone number', () => {
    const message = buildPhoneNumberPromptMessage();
    const items = message.quickReply?.items ?? [];
    const sendAction = items[0]?.action as {
      inputOption?: string;
      fillInText?: string;
    };

    expect(items).toHaveLength(2);
    expect(sendAction.inputOption).toBe('openKeyboard');
    expect(sendAction.fillInText).toBeUndefined();
  });
});

describe('buildActionCategoryMessages', () => {
  it('splits guidance and category choices into two messages', () => {
    const messages = buildActionCategoryMessages();
    const lastMessage = messages[messages.length - 1] as {
      quickReply?: { items: unknown[] };
    };

    expect(messages).toHaveLength(2);
    expect(lastMessage.quickReply?.items.length).toBeGreaterThan(0);
  });

  it('prefixes category labels with emojis', () => {
    const messages = buildActionCategoryMessages();
    const lastMessage = messages[messages.length - 1] as {
      quickReply?: { items: { action: { label: string } }[] };
    };
    const labels = lastMessage.quickReply?.items.map((i) => i.action.label) ?? [];

    // All labels should have emoji prefix (e.g. "🚶 移動")
    expect(labels[0]).toContain('🚶');
    expect(labels[0]).toContain('移動');
  });
});

describe('buildAnimalTypeMessage', () => {
  it('uses default 5 animal types when no enabledTypes provided', () => {
    const message = buildAnimalTypeMessage();
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(5);
    expect(message.text).toBe('どの動物を目撃しましたか？');
  });

  it('uses custom enabled types when provided', () => {
    const enabledTypes: AnimalTypeConfig[] = [
      { id: 'monkey', label: 'サル', emoji: '🐵', color: '#F59E0B', category: 'mammal' },
      { id: 'bear', label: 'クマ', emoji: '🐻', color: '#EF4444', category: 'mammal' },
    ];
    const message = buildAnimalTypeMessage(enabledTypes);
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(2);
  });

  it('falls back to default types when enabledTypes is empty', () => {
    const message = buildAnimalTypeMessage([]);
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(5);
  });
});

describe('buildDateTimeMessage', () => {
  it('has two quick reply items: datetimepicker and "now"', () => {
    const message = buildDateTimeMessage();
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(2);
    expect(message.text).toBe('目撃した日時を教えてください。');
  });

  it('first item is a datetimepicker action', () => {
    const message = buildDateTimeMessage();
    const items = message.quickReply?.items ?? [];
    const firstAction = items[0]?.action as { type: string; mode?: string };

    expect(firstAction.type).toBe('datetimepicker');
    expect(firstAction.mode).toBe('datetime');
  });
});

describe('buildLocationMessage', () => {
  it('has one quick reply item with location action', () => {
    const message = buildLocationMessage();
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(1);
    expect(items[0]?.action).toEqual(
      expect.objectContaining({ type: 'location' })
    );
  });
});

describe('buildNearbyLandmarksMessage', () => {
  const landmarks: NearbyLandmark[] = [
    { id: 'lm1', name: '中央公園', category: '公園', distance: 50, latitude: 35.0, longitude: 139.0 },
    { id: 'lm2', name: '市役所', category: '公共施設', distance: 80, latitude: 35.0, longitude: 139.0 },
  ];

  it('creates quick reply items for each landmark plus a skip item', () => {
    const message = buildNearbyLandmarksMessage(landmarks);
    const items = message.quickReply?.items ?? [];

    // 2 landmarks + 1 skip
    expect(items).toHaveLength(3);
  });

  it('includes landmark info in the message text', () => {
    const message = buildNearbyLandmarksMessage(landmarks);

    expect(message.text).toContain('中央公園');
    expect(message.text).toContain('市役所');
  });
});

describe('buildReportDraftMessage', () => {
  const draft: ReportDraft = {
    when: '2024年1月15日 14:00',
    where: '東京都千代田区',
    what: 'サル',
    situation: '畑の近くで2頭を目撃',
  };

  it('returns a flex message', () => {
    const message = buildReportDraftMessage(draft);

    expect(message.type).toBe('flex');
    expect(message.altText).toBe('通報内容の確認');
  });

  it('has confirm quick reply item only', () => {
    const message = buildReportDraftMessage(draft);
    const items = message.quickReply?.items ?? [];

    expect(items).toHaveLength(1);
  });

  it('contains bubble contents with header and body', () => {
    const message = buildReportDraftMessage(draft);
    const contents = message.contents as { type: string; header: unknown; body: unknown };

    expect(contents.type).toBe('bubble');
    expect(contents.header).toBeDefined();
    expect(contents.body).toBeDefined();
  });

  it('includes correction note in body', () => {
    const message = buildReportDraftMessage(draft);
    const body = (message.contents as { body: { contents: { type: string; text?: string }[] } }).body;
    const noteText = body.contents.find((c) => c.text?.includes('通報後に修正可能'));

    expect(noteText).toBeDefined();
  });
});

describe('buildCompletionMessage', () => {
  it('returns a flex message with start-over quick reply', () => {
    const message = buildCompletionMessage();
    const items = message.quickReply?.items ?? [];

    expect(message.type).toBe('flex');
    expect(items).toHaveLength(1);
  });

  it('includes edit button when editUrl is provided', () => {
    const message = buildCompletionMessage({ editUrl: 'https://example.com/edit' });
    const body = (message.contents as { body: { contents: { type: string; action?: { uri?: string } }[] } }).body;
    const buttons = body.contents.filter((c) => c.type === 'button');

    expect(buttons.length).toBeGreaterThanOrEqual(1);
    expect(buttons[0].action?.uri).toBe('https://example.com/edit');
  });

  it('includes map button when mapUrl is provided', () => {
    const message = buildCompletionMessage({ mapUrl: 'https://example.com/map' });
    const body = (message.contents as { body: { contents: { type: string; action?: { uri?: string } }[] } }).body;
    const buttons = body.contents.filter((c) => c.type === 'button');

    expect(buttons.length).toBe(1);
    expect(buttons[0].action?.uri).toBe('https://example.com/map');
  });

  it('includes both buttons when both URLs are provided', () => {
    const message = buildCompletionMessage({
      editUrl: 'https://example.com/edit',
      mapUrl: 'https://example.com/map',
    });
    const body = (message.contents as { body: { contents: { type: string }[] } }).body;
    const buttons = body.contents.filter((c) => c.type === 'button');

    expect(buttons.length).toBe(2);
  });

  it('has no buttons when no URLs are provided', () => {
    const message = buildCompletionMessage();
    const body = (message.contents as { body: { contents: { type: string }[] } }).body;
    const buttons = body.contents.filter((c) => c.type === 'button');

    expect(buttons.length).toBe(0);
  });
});
