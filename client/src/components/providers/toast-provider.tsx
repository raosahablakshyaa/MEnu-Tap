'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: 'backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/50 dark:border-zinc-700/50',
        },
      }}
    />
  );
}
