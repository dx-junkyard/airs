import { createElement } from 'react';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toast from 'react-hot-toast';

/**
 * トースト通知のヘルパー関数
 *
 * react-hot-toastを使用した通知機能を提供します。
 */

/**
 * 成功時のトースト通知を表示
 */
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

/**
 * エラー時のトースト通知を表示
 */
export const showErrorToast = (message: string) => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
  });
};

/**
 * 情報通知のトースト表示
 */
export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: createElement(FontAwesomeIcon, {
      icon: faInfoCircle,
      className: 'size-4 text-blue-600',
    }),
  });
};
