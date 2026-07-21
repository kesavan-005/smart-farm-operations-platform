import { useNavigate } from 'react-router-dom';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function OfflinePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [checking, setChecking] = useState(false);

  const checkConnection = () => {
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      if (navigator.onLine) {
        toast({
          title: 'Connected',
          description: 'You are back online. Synchronizing data...',
        });
        navigate('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Still Offline',
          description: 'Could not establish network connection. Please verify your internet settings.',
        });
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center sf-slide-up">
      <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-12 h-12 text-amber-500" />
      </div>
      <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">Offline Mode</h1>
      <h2 className="text-xl font-semibold text-muted-foreground mb-4">No Internet Connection</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Smart Farm is currently offline. You can continue updating farms, fields, and crops; your changes are securely cached on your device and will sync automatically when your connection is restored.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={checkConnection} disabled={checking} className="gap-2 h-11 px-8 rounded-full text-base bg-primary text-primary-foreground hover:bg-primary/90">
          <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
          Check Connection
        </Button>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="gap-2 h-11 px-8 rounded-full text-base">
          <Home className="w-4 h-4" /> Continue Offline
        </Button>
      </div>
    </div>
  );
}
