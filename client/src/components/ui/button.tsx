import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'food-gradient text-white hover:opacity-90 shadow-sm focus-visible:ring-red-400',
        destructive:
          'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-500 shadow-sm',
        outline:
          'border bg-[color:var(--surface)] hover:bg-[color:var(--surface-raised)] focus-visible:ring-[color:var(--ring)]',
        secondary:
          'bg-[color:var(--surface-raised)] text-[color:var(--foreground)] hover:brightness-95 focus-visible:ring-[color:var(--ring)]',
        ghost:
          'hover:bg-[color:var(--surface-raised)] text-[color:var(--foreground-muted)] hover:text-[color:var(--foreground)]',
        link:
          'text-[color:var(--primary)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm:      'h-8 rounded-md px-3 text-xs',
        lg:      'h-10 rounded-lg px-6',
        icon:    'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
