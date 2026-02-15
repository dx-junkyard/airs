'use client';

import ErrorText from '@/components/ui/ErrorText/ErrorText';
import Button from '@/components/ui/Button/Button';
import {
  ANIMAL_TYPES,
  ANIMAL_CATEGORY_GROUPS,
} from '@/server/domain/constants/animalTypes';

interface AnimalTypeSelectorProps {
  value: string[];
  onChange: (keys: string[]) => void;
  error?: string;
}

const ALL_KEYS = ANIMAL_CATEGORY_GROUPS.flatMap((g) => g.keys);

export default function AnimalTypeSelector({
  value,
  onChange,
  error,
}: AnimalTypeSelectorProps) {
  const selectedSet = new Set(value);

  const handleToggle = (key: string) => {
    if (selectedSet.has(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const handleSelectAll = () => {
    onChange([...ALL_KEYS]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleSelectAll}
        >
          全選択
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={handleDeselectAll}
        >
          全解除
        </Button>
      </div>

      <div className="space-y-6">
        {ANIMAL_CATEGORY_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-oln-14B-100 mb-2 text-solid-gray-800">
              {group.label}
            </p>
            <div
              className={`
                grid grid-cols-2 gap-2
                sm:grid-cols-3
                md:grid-cols-4
              `}
            >
              {group.keys.map((key) => {
                const config = ANIMAL_TYPES[key];
                const checked = selectedSet.has(key);
                return (
                  <label
                    key={key}
                    className={`
                      flex cursor-pointer items-center gap-2 rounded border px-3
                      py-2 text-sm transition-colors
                      ${
                        checked
                          ? 'border-blue-500 bg-blue-50'
                          : `
                            border-solid-gray-200 bg-white
                            hover:bg-solid-gray-50
                          `
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggle(key)}
                      className="size-4 rounded border-solid-gray-300"
                    />
                    <span>
                      {config.emoji} {config.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && <ErrorText className="mt-2">{error}</ErrorText>}
    </div>
  );
}
