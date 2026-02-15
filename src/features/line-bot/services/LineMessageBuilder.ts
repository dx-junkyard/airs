import type { messagingApi } from '@line/bot-sdk';

import {
  getAnimalTypeLabel,
  getAnimalTypeEmoji,
  type AnimalTypeConfig,
} from '@/server/domain/constants/animalTypes';
import type { AnimalTypeValue } from '@/features/ai-report/types';
import type { NearbyLandmark } from '@/features/ai-report/types';
import {
  ACTION_CATEGORIES,
  type QuestionCard,
} from '@/features/ai-report/types/actionDetail';
import type { ReportDraft } from '@/features/ai-report/types/chat';
import { buildPostbackData } from '@/features/line-bot/utils/postbackParser';
import {
  ACTION_SELECT_ANIMAL,
  ACTION_SKIP_PHOTO,
  ACTION_CONFIRM_DESC,
  ACTION_REJECT_DESC,
  ACTION_ADD_PHOTO,
  ACTION_SELECT_ACTION,
  ACTION_ANSWER_QUESTION,
  ACTION_CONFIRM_DETAIL,
  ACTION_RESTART_DETAIL,
  ACTION_DATETIME_NOW,
  ACTION_SELECT_DATETIME,
  ACTION_SELECT_LANDMARK,
  ACTION_SKIP_LANDMARK,
  ACTION_CONFIRM_REPORT,
  ACTION_REQUEST_PHONE_NUMBER,
  ACTION_SKIP_PHONE_NUMBER,
  ACTION_START_OVER,
} from '@/features/line-bot/constants/postbackActions';

/**
 * LINE Message構築ユーティリティ
 */

// 動物種別アイコンのフォールバック用（後方互換）
const ANIMAL_ICONS: Record<string, string> = {
  monkey: '🐒',
  deer: '🦌',
  wild_boar: '🐗',
  bear: '🐻',
  other: '❓',
};

// 行動カテゴリ用絵文字マッピング（LINE表示用）
const ACTION_CATEGORY_EMOJIS: Record<string, string> = {
  movement: '🚶',
  stay: '📍',
  approach: '👀',
  feeding: '🍽️',
  threat: '⚠️',
  escape: '💨',
  damage: '🌾',
  other: '❓',
};

/**
 * テキストメッセージを作成
 */
export function textMessage(text: string): messagingApi.TextMessage {
  return { type: 'text', text };
}

/**
 * Quick Reply付きテキストメッセージを作成
 */
function textWithQuickReply(
  text: string,
  items: messagingApi.QuickReplyItem[]
): messagingApi.TextMessage {
  return {
    type: 'text',
    text,
    quickReply: { items },
  };
}

/**
 * Postback QuickReplyItemを作成
 */
interface PostbackItemOptions {
  displayText?: string;
  inputOption?: 'closeRichMenu' | 'openRichMenu' | 'openKeyboard' | 'openVoice';
  fillInText?: string;
}

function postbackItem(
  label: string,
  data: string,
  options?: PostbackItemOptions
): messagingApi.QuickReplyItem {
  const action: messagingApi.PostbackAction & {
    inputOption?: PostbackItemOptions['inputOption'];
    fillInText?: string;
  } = {
    type: 'postback',
    label: label.slice(0, 20), // LINE Quick Replyラベル上限20文字
    data,
    displayText: options?.displayText ?? label,
  };

  if (options?.inputOption) {
    action.inputOption = options.inputOption;
  }

  if (options?.fillInText) {
    action.fillInText = options.fillInText;
  }

  return {
    type: 'action',
    action,
  };
}

// ============================================================
// Step 1: 動物種選択
// ============================================================

export function buildAnimalTypeMessage(
  enabledTypes?: AnimalTypeConfig[]
): messagingApi.TextMessage {
  if (enabledTypes && enabledTypes.length > 0) {
    const items: messagingApi.QuickReplyItem[] = enabledTypes.map((config) => {
      const label = `${config.emoji} ${config.label}`;
      const data = buildPostbackData({
        action: ACTION_SELECT_ANIMAL,
        value: config.id,
      });
      return postbackItem(label, data);
    });
    return textWithQuickReply('どの動物を目撃しましたか？', items);
  }

  // フォールバック: 基本5種
  const animalTypes: AnimalTypeValue[] = [
    'monkey',
    'deer',
    'wild_boar',
    'bear',
    'other',
  ];

  const items: messagingApi.QuickReplyItem[] = animalTypes.map((type) => {
    const icon = ANIMAL_ICONS[type] ?? getAnimalTypeEmoji(type);
    const label = `${icon} ${getAnimalTypeLabel(type)}`;
    const data = buildPostbackData({
      action: ACTION_SELECT_ANIMAL,
      value: type,
    });
    return postbackItem(label, data);
  });

  return textWithQuickReply('どの動物を目撃しましたか？', items);
}

// ============================================================
// Step 2: 写真アップロード
// ============================================================

export function buildPhotoPromptMessages(): messagingApi.Message[] {
  const items: messagingApi.QuickReplyItem[] = [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'カメラで撮影',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'アルバムから選択',
      },
    },
    postbackItem(
      '📷 写真を持ってない',
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    ),
  ];

  return [
    textWithQuickReply(
      '写真を送信してください。\n※写真解析AIが動物や痕跡を識別します。解析には少し時間がかかる場合があります。',
      items
    ),
  ];
}

export function buildAddPhotoPromptMessage(): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'カメラで撮影',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'アルバムから選択',
      },
    },
    postbackItem(
      '⏭️ 次へ進む',
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    ),
  ];

  return textWithQuickReply('写真を追加しますか？', items);
}

// ============================================================
// Step 2a: 画像解析結果確認
// ============================================================

export function buildImageAnalysisDescriptionMessage(
  description: string
): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    postbackItem('✅ はい', buildPostbackData({ action: ACTION_CONFIRM_DESC })),
    postbackItem(
      '❌ いいえ',
      buildPostbackData({ action: ACTION_REJECT_DESC })
    ),
  ];

  return textWithQuickReply(
    `写真を解析しました。この説明で合っていますか？\n\n「${description}」`,
    items
  );
}

export function buildImageRejectedMessage(
  reason: string
): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    {
      type: 'action',
      action: {
        type: 'camera',
        label: 'カメラで撮影',
      },
    },
    {
      type: 'action',
      action: {
        type: 'cameraRoll',
        label: 'アルバムから選択',
      },
    },
    postbackItem(
      '📷 写真を持ってない',
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    ),
  ];

  return textWithQuickReply(
    `画像を確認しましたが、動物や痕跡を識別できませんでした。\n理由: ${reason}\n\n別の写真を送信するか、「写真を持ってない」を選んでください。`,
    items
  );
}

export function buildImageAddOrContinueMessage(): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    postbackItem(
      '📷 写真を追加',
      buildPostbackData({ action: ACTION_ADD_PHOTO })
    ),
    postbackItem(
      '⏭️ 次へ進む',
      buildPostbackData({ action: ACTION_SKIP_PHOTO })
    ),
  ];

  return textWithQuickReply('他にも写真がありますか？', items);
}

// ============================================================
// Step 3: 状況自由入力
// ============================================================

export function buildSituationPromptMessage(): messagingApi.TextMessage {
  return textMessage(
    '目撃した状況を教えてください。\n（例：「畑の近くで2頭のサルを見かけた」）'
  );
}

// ============================================================
// Step 3c: 行動カテゴリ選択
// ============================================================

export function buildActionCategoryMessage(): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = ACTION_CATEGORIES.map((cat) => {
    const emoji = ACTION_CATEGORY_EMOJIS[cat.id] ?? '';
    const label = `${emoji} ${cat.label}`;
    const data = buildPostbackData({
      action: ACTION_SELECT_ACTION,
      value: cat.id,
    });
    return postbackItem(label, data);
  });

  return textWithQuickReply(
    '動物の行動について詳しく教えてください。\nどのような行動でしたか？',
    items
  );
}

export function buildActionCategoryMessages(): messagingApi.Message[] {
  return [
    textMessage(
      'ありがとうございます。\n※聞き取りAIがこの後の質問を作成します。質問生成に少し時間がかかる場合があります。'
    ),
    buildActionCategoryMessage(),
  ];
}

// ============================================================
// Step 3d: 行動詳細質問
// ============================================================

export function buildQuestionMessage(
  question: QuestionCard
): messagingApi.TextMessage {
  // Quick Reply用の選択肢
  const items: messagingApi.QuickReplyItem[] = question.choices.map(
    (choice) => {
      const data = buildPostbackData({
        action: ACTION_ANSWER_QUESTION,
        qid: question.questionId,
        cid: choice.id,
      });
      return postbackItem(choice.label, data);
    }
  );

  return textWithQuickReply(question.questionText, items);
}

// ============================================================
// Step 3e: 行動詳細確認
// ============================================================

export function buildActionDetailConfirmMessage(
  detail: string
): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    postbackItem(
      '✅ 確定',
      buildPostbackData({ action: ACTION_CONFIRM_DETAIL })
    ),
    postbackItem(
      '🔄 やり直し',
      buildPostbackData({ action: ACTION_RESTART_DETAIL })
    ),
  ];

  return textWithQuickReply(
    `行動詳細:\n\n「${detail}」\n\nこの内容でよろしいですか？`,
    items
  );
}

// ============================================================
// Step 4: 日時入力
// ============================================================

export function buildDateTimeMessage(): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    {
      type: 'action',
      action: {
        type: 'datetimepicker',
        label: '📅 日時を選択',
        data: buildPostbackData({ action: ACTION_SELECT_DATETIME }),
        mode: 'datetime',
      },
    } as messagingApi.QuickReplyItem,
    postbackItem(
      '🕐 たった今',
      buildPostbackData({ action: ACTION_DATETIME_NOW })
    ),
  ];

  return textWithQuickReply('目撃した日時を教えてください。', items);
}

// ============================================================
// Step 5: 位置入力
// ============================================================

export function buildLocationMessage(): messagingApi.TextMessage {
  const items: messagingApi.QuickReplyItem[] = [
    {
      type: 'action',
      action: {
        type: 'location',
        label: '位置情報を送信',
      },
    },
  ];

  return textWithQuickReply(
    '被害が発生した場所を教えてください。\n\n位置情報を送信してください。',
    items
  );
}

// ============================================================
// Step 5a: ランドマーク選択
// ============================================================

export function buildNearbyLandmarksMessage(
  landmarks: NearbyLandmark[]
): messagingApi.TextMessage {
  // LINE quickReplyは最大13アイテム。「該当なし」ボタン分を確保し施設は12件まで
  const limitedLandmarks = landmarks.slice(0, 12);
  const items: messagingApi.QuickReplyItem[] = limitedLandmarks.map((lm) => {
    const label = `${lm.name} (${lm.distance}m)`.slice(0, 20);
    const data = buildPostbackData({
      action: ACTION_SELECT_LANDMARK,
      id: lm.id,
    });
    return postbackItem(label, data);
  });

  items.push(
    postbackItem(
      '⏭️ 該当なし',
      buildPostbackData({ action: ACTION_SKIP_LANDMARK })
    )
  );

  const landmarkText = limitedLandmarks
    .map((lm) => `・${lm.name}（${lm.category}、${lm.distance}m）`)
    .join('\n');

  return textWithQuickReply(
    `周辺の施設が見つかりました。目撃場所に近い施設があれば選択してください。\n\n${landmarkText}`,
    items
  );
}

// ============================================================
// Step 6: 通報ドラフト確認
// ============================================================

export function buildDraftGeneratingMessage(): messagingApi.TextMessage {
  return textMessage('📝 通報内容のサマリを作成中です。');
}

export function buildReportDraftMessage(
  draft: ReportDraft
): messagingApi.FlexMessage {
  const flexMessage: messagingApi.FlexMessage = {
    type: 'flex',
    altText: '通報内容の確認',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 通報内容の確認',
            weight: 'bold',
            size: 'lg',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          buildDraftRow('🕐 いつ', draft.when),
          buildDraftRow('📍 どこで', draft.where),
          buildDraftRow('🐾 何が', draft.what),
          buildDraftRow('📝 状況', draft.situation),
          {
            type: 'text',
            text: '※内容に誤りがあっても通報後に修正可能です',
            size: 'xs',
            color: '#999999',
            wrap: true,
            margin: 'lg',
          } as messagingApi.FlexText,
        ],
      },
    },
    quickReply: {
      items: [
        postbackItem(
          '✅ 送信',
          buildPostbackData({ action: ACTION_CONFIRM_REPORT })
        ),
      ],
    },
  };

  return flexMessage;
}

function buildDraftRow(label: string, value: string): messagingApi.FlexBox {
  return {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'text',
        text: label,
        size: 'sm',
        color: '#666666',
      },
      {
        type: 'text',
        text: value,
        wrap: true,
        size: 'md',
      },
    ],
  };
}

// ============================================================
// Step 6b: 電話番号入力
// ============================================================

export function buildPhoneNumberPromptMessage(): messagingApi.TextMessage {
  return textWithQuickReply('電話番号を入力してください。', [
    postbackItem(
      '電話番号を送る',
      buildPostbackData({ action: ACTION_REQUEST_PHONE_NUMBER }),
      {
        inputOption: 'openKeyboard',
      }
    ),
    postbackItem(
      '電話番号を送らない',
      buildPostbackData({ action: ACTION_SKIP_PHONE_NUMBER })
    ),
  ]);
}

// ============================================================
// Step 7: 完了
// ============================================================

interface CompletionMessageOptions {
  editUrl?: string;
  mapUrl?: string;
}

export function buildCompletionMessage(
  options?: CompletionMessageOptions
): messagingApi.FlexMessage {
  const { editUrl, mapUrl } = options ?? {};

  const bodyContents: messagingApi.FlexComponent[] = [
    {
      type: 'text',
      text: '通報が完了しました',
      wrap: true,
      size: 'md',
    },
    {
      type: 'text',
      text: 'ご協力ありがとうございます。',
      wrap: true,
      size: 'sm',
      color: '#666666',
      margin: 'md',
    },
  ];

  if (editUrl) {
    bodyContents.push({
      type: 'button',
      action: {
        type: 'uri',
        label: '📝 通報内容の確認・編集',
        uri: editUrl,
      },
      style: 'primary',
      margin: 'lg',
      height: 'sm',
    } as messagingApi.FlexButton);
  }

  if (mapUrl) {
    bodyContents.push({
      type: 'button',
      action: {
        type: 'uri',
        label: '🗺️ 地図で通報場所を確認',
        uri: mapUrl,
      },
      style: 'secondary',
      margin: 'sm',
      height: 'sm',
    } as messagingApi.FlexButton);
  }

  return {
    type: 'flex',
    altText: '✅ 通報が完了しました',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '✅ 通報完了',
            weight: 'bold',
            size: 'lg',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: bodyContents,
      },
    },
    quickReply: {
      items: [
        postbackItem(
          '🔄 新しい通報',
          buildPostbackData({ action: ACTION_START_OVER })
        ),
      ],
    },
  };
}

