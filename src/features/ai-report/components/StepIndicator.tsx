'use client';

import {
  SIMULATION_STEPS,
  type SimulationStep,
} from '@/features/ai-report/types';

interface StepIndicatorProps {
  currentStep: SimulationStep;
}

/**
 * ステップインジケーター
 * 現在のシミュレーションステップを視覚的に表示
 */
export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const currentStepOrder =
    SIMULATION_STEPS.find((s) => s.id === currentStep)?.order ?? 1;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        {SIMULATION_STEPS.map((step, index) => {
          const isCompleted = step.order < currentStepOrder;
          const isCurrent = step.id === currentStep;
          const isLast = index === SIMULATION_STEPS.length - 1;

          return (
            <div key={step.id} className="flex flex-1 items-center">
              {/* ステップサークル */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex size-8 items-center justify-center rounded-full text-sm
                    font-bold transition-colors
                    ${
                      isCompleted
                        ? 'bg-blue-900 text-white'
                        : isCurrent
                          ? 'bg-blue-900 text-white ring-4 ring-blue-200'
                          : 'bg-solid-gray-200 text-solid-gray-600'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="size-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    step.order
                  )}
                </div>
                <span
                  className={`
                    mt-1 text-xs
                    ${
                      isCurrent
                        ? 'font-bold text-blue-900'
                        : `text-solid-gray-600`
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>

              {/* コネクティングライン */}
              {!isLast && (
                <div
                  className={`
                    mx-2 h-0.5 flex-1
                    ${isCompleted ? 'bg-blue-900' : 'bg-solid-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
