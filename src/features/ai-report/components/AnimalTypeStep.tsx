'use client';

import { useSetAtom } from 'jotai';
import Button from '@/components/ui/Button/Button';
import { BotMessage } from '@/features/ai-report/components/BotMessage';
import {
  selectedAnimalTypeAtom,
  currentStepAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import {
  BOT_MESSAGES,
  type AnimalTypeValue,
} from '@/features/ai-report/types';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';

interface AnimalTypeStepProps {
  enabledAnimalTypes: AnimalTypeConfig[];
}

/**
 * Step1: 動物種選択ステップ
 */
export const AnimalTypeStep = ({ enabledAnimalTypes }: AnimalTypeStepProps) => {
  const setSelectedAnimalType = useSetAtom(selectedAnimalTypeAtom);
  const setCurrentStep = useSetAtom(currentStepAtom);

  const handleSelect = (animalType: AnimalTypeValue) => {
    setSelectedAnimalType(animalType);
    setCurrentStep('photo');
  };

  return (
    <div className="space-y-6">
      <BotMessage message={BOT_MESSAGES['animal-type']} />

      <div
        className={`
          grid grid-cols-2 gap-3
          sm:grid-cols-3
          md:grid-cols-5
        `}
      >
        {enabledAnimalTypes.map((config) => (
          <Button
            key={config.id}
            size="md"
            variant="outline"
            onClick={() => handleSelect(config.id)}
            className="flex-col py-4"
          >
            <span className="text-2xl">{config.emoji}</span>
            <span className="mt-1">{config.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
