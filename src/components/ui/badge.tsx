import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex h-5 w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-surface-2 text-fg',
        outline: 'border-default-border text-fg',
        destructive: 'bg-destructive/10 text-destructive',
        success: 'bg-badge-success-bg text-badge-success',
        warning: 'bg-badge-warning-bg text-badge-warning',
        danger: 'bg-badge-danger-bg text-badge-danger',
        info: 'bg-badge-info-bg text-badge-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({
  className,
  variant = 'default',
  dot,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full bg-current" />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
