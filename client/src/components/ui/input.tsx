import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, style, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            'flex h-9 w-full rounded-lg border px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus-visible:ring-red-500',
            className
          )}
          style={{
            background: 'var(--surface)',
            borderColor: error ? undefined : 'var(--border)',
            color: 'var(--foreground)',
            ...style,
          }}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
