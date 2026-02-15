/**
 * Postback action定数
 *
 * URL query string形式: action=XXX&value=YYY
 */

// Step 1: 動物種選択
export const ACTION_SELECT_ANIMAL = 'select_animal';

// Step 2: 写真
export const ACTION_OPEN_CAMERA = 'open_camera';
export const ACTION_SKIP_PHOTO = 'skip_photo';
export const ACTION_ADD_PHOTO = 'add_photo';

// Step 2b: 画像解説確認
export const ACTION_CONFIRM_DESC = 'confirm_desc';
export const ACTION_REJECT_DESC = 'reject_desc';

// Step 3c: 行動カテゴリ選択
export const ACTION_SELECT_ACTION = 'select_action';

// Step 3d: 行動詳細質問回答
export const ACTION_ANSWER_QUESTION = 'answer_question';

// Step 3e: 行動詳細確認
export const ACTION_CONFIRM_DETAIL = 'confirm_detail';
export const ACTION_RESTART_DETAIL = 'restart_detail';

// Step 4: 日時
export const ACTION_DATETIME_NOW = 'datetime_now';
export const ACTION_SELECT_DATETIME = 'select_datetime';

// Step 5: 位置 - ランドマーク選択
export const ACTION_SELECT_LANDMARK = 'select_landmark';
export const ACTION_SKIP_LANDMARK = 'skip_landmark';

// Step 6: 通報確認
export const ACTION_CONFIRM_REPORT = 'confirm_report';

// Step 6b: 電話番号
export const ACTION_REQUEST_PHONE_NUMBER = 'request_phone_number';
export const ACTION_SKIP_PHONE_NUMBER = 'skip_phone_number';

// 最初からやり直し
export const ACTION_START_OVER = 'start_over';
