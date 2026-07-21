interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[35vh] py-12">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 border-[3px] border-border rounded-full" />
        <div className="absolute inset-0 border-[3px] border-primary rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-sm font-medium text-muted-foreground animate-pulse">{message}</p>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="w-full sf-card p-4 flex gap-3 animate-pulse">
      <div className="w-10 h-10 bg-muted rounded-lg shrink-0" />
      <div className="flex flex-col gap-2 flex-1 justify-center">
        <div className="w-1/3 h-3.5 bg-muted rounded" />
        <div className="w-1/4 h-3 bg-muted/60 rounded" />
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="w-full sf-card p-5 flex flex-col gap-4 animate-pulse h-44">
      <div className="flex justify-between items-start">
        <div className="w-1/2 h-4 bg-muted rounded" />
        <div className="w-8 h-6 bg-muted/60 rounded-md" />
      </div>
      <div className="flex-1 mt-2 space-y-2">
        <div className="w-full h-3 bg-muted/60 rounded" />
        <div className="w-5/6 h-3 bg-muted/40 rounded" />
      </div>
    </div>
  );
}
