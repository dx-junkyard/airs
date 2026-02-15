import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ActionCategory } from '@/features/ai-report/types/actionDetail';
import { ACTION_CATEGORIES } from '@/features/ai-report/types/actionDetail';
import { getActionCategoryIcon } from '@/features/ai-report/utils/actionCategoryIconMap';

interface ActionCategoryButtonsProps {
  onSelect: (category: ActionCategory, label: string, icon: string) => void;
}

export const ActionCategoryButtons: React.FC<ActionCategoryButtonsProps> = ({
  onSelect,
}) => {
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-solid-gray-600">
        動物の行動を選んでください
      </p>
      <div className={`
        grid grid-cols-2 gap-2
        sm:grid-cols-4
      `}>
        {ACTION_CATEGORIES.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelect(category.id, category.label, category.icon)}
            className={`
              flex flex-col items-center gap-1 rounded-lg border
              border-solid-gray-200 bg-white p-3 text-sm font-medium
              text-solid-gray-900 transition-all
              hover:border-blue-900 hover:bg-blue-50
              active:scale-95
            `}
          >
            <FontAwesomeIcon
              icon={getActionCategoryIcon(category.id)}
              className="size-5 text-solid-gray-700"
              aria-hidden="true"
            />
            <span className="font-medium">{category.label}</span>
            <span className="text-xs text-solid-gray-500">
              {category.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionCategoryButtons;
