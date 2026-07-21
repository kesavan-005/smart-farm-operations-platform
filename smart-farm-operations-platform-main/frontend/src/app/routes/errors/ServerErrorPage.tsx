import { useNavigate } from 'react-router-dom';
import { RefreshCcw, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center sf-slide-up">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <ServerCrash className="w-12 h-12 text-destructive" />
      </div>
      <h1 className="text-7xl font-bold text-foreground mb-4 tracking-tighter">500</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Internal Server Error</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Something went wrong on our end. Our team has been notified. Please try again in a few minutes.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2 h-11 px-8 rounded-full text-base">
          <RefreshCcw className="w-4 h-4" /> Try Again
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="gap-2 h-11 px-8 rounded-full text-base">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
