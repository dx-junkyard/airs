import {
  ANIMAL_TYPES,
  type AnimalTypeValue,
} from '@/server/domain/constants/animalTypes';

/**
 * Animal type icons mapping
 */
export const ANIMAL_TYPE_ICONS: Record<AnimalTypeValue, string> = Object.fromEntries(
  Object.entries(ANIMAL_TYPES).map(([key, config]) => [key, config.emoji])
) as Record<AnimalTypeValue, string>;

/**
 * Bot messages for chat flow
 */
export const CHAT_BOT_MESSAGES = {
  welcome: '獣害報告システムです。通報ありがとうございます。',
  animalTypeQuestion: 'どの動物の被害を受けましたか？',
  photoPrompt:
    '写真があると被害状況の確認に役立ちます。\n\n写真をアップロードするか、「写真なしで続ける」を選択してください。',
  situationPrompt:
    '目撃した状況を教えてください。\n\n例: 畑の近くを歩いていた、道路を横断していた',
  datetimePrompt: '目撃した日時を教えてください。',
  locationPrompt:
    '被害が発生した場所を教えてください。\n\n地図上でピンを置いて位置を送信してください。',
  reportGenerated: '以下の内容で整理しました。ご確認ください。',
  correctionPrompt: 'どこが違いますか？教えてください。',
  reportRegenerated: '修正しました。再度ご確認ください。',
  phoneNumberPrompt:
    '通報をすぐ確認して欲しい場合は電話番号を入力してください。\n\nスキップすることもできます。',
  completion:
    '通報を受け付けました。ありがとうございます。\n\n担当者が確認次第、対応いたします。',
} as const;
