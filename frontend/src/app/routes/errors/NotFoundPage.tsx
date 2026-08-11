import { useNavigate } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center sf-slide-up">
      <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertTriangle className="w-12 h-12 text-destructive" />
      </div>
      <h1 className="text-7xl font-bold text-foreground mb-4 tracking-tighter">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        The page you are looking for doesn't exist or has been moved. Check the URL or navigate back to the dashboard.
      </p>
      <Button onClick={() => navigate('/dashboard')} className="gap-2 h-11 px-8 rounded-full text-base">
        <Home className="w-4 h-4" /> Back to Dashboard
      </Button>
    </div>
  );
}
