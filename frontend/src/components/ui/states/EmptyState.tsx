import { ReactNode } from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[35vh] text-center px-6 py-12 sf-card border-dashed sf-slide-up">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-7 h-7 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="gap-1.5 h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4" />
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button onClick={onSecondaryAction} variant="outline" className="h-9 px-5">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
      
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
