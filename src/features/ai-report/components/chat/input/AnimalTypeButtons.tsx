import React from 'react';
import type { AnimalTypeValue } from '@/features/ai-report/types';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';

interface AnimalTypeButtonsProps {
  onSelect: (type: AnimalTypeValue) => void;
  enabledAnimalTypes: AnimalTypeConfig[];
}

export const AnimalTypeButtons: React.FC<AnimalTypeButtonsProps> = ({
  onSelect,
  enabledAnimalTypes,
}) => {
  const options = enabledAnimalTypes.map((config) => ({
    id: config.id,
    label: config.label,
    icon: config.emoji,
    value: config.id,
  }));

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.value as AnimalTypeValue)}
          className={`
            flex items-center gap-2 rounded-lg border border-solid-gray-200
            bg-white px-4 py-3 text-sm font-medium text-solid-gray-900
            transition-all
            hover:border-blue-900 hover:bg-blue-50
            active:scale-95
          `}
        >
          <span className="text-xl">{option.icon}</span>
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AnimalTypeButtons;
