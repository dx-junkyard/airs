import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faAppleAlt,
  faExclamationTriangle,
  faEye,
  faQuestionCircle,
  faRunning,
  faSeedling,
  faUser,
  faWalking,
} from '@fortawesome/free-solid-svg-icons';
import type { ActionCategory } from '@/features/ai-report/types/actionDetail';

const ACTION_CATEGORY_ICON_MAP: Record<ActionCategory, IconDefinition> = {
  movement: faWalking,
  stay: faUser,
  approach: faEye,
  feeding: faAppleAlt,
  threat: faExclamationTriangle,
  escape: faRunning,
  damage: faSeedling,
  other: faQuestionCircle,
};

export function getActionCategoryIcon(category: ActionCategory): IconDefinition {
  return ACTION_CATEGORY_ICON_MAP[category];
}
