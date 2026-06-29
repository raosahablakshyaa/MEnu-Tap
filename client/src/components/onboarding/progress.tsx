'use client';

import { cn } from '@/lib/utils';

const STEPS = [
  'Basic Info',
  'Business',
  'Address',
  'Details',
  'Branding',
  'Plan',
  'Payment',
];

export function OnboardingProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const isActive = step === currentStep;
          const isComplete = step < currentStep;
          return (
            <div key={label} className="flex flex-1 flex-col items-center">
              <div className="flex w-full items-center">
                {i > 0 && (
                  <div className={cn('h-0.5 flex-1', isComplete || isActive ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700')} />
                )}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all',
                    isComplete && 'bg-orange-500 text-white',
                    isActive && 'bg-orange-500 text-white ring-4 ring-orange-500/20',
                    !isComplete && !isActive && 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700'
                  )}
                >
                  {isComplete ? '✓' : step}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1', isComplete ? 'bg-orange-500' : 'bg-zinc-200 dark:bg-zinc-700')} />
                )}
              </div>
              <span className={cn('mt-2 hidden text-xs sm:block', isActive ? 'font-semibold text-orange-500' : 'text-zinc-400')}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
