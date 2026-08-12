import { useNavigate } from 'react-router-dom';
import { Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthStore();

  const handleLoginRedirect = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center sf-slide-up">
      <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center mb-6">
        <Lock className="w-12 h-12 text-rose-500" />
      </div>
      <h1 className="text-7xl font-bold text-foreground mb-4 tracking-tighter">401</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Unauthorized Access</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Your current session has expired or you are not authorized to view this resource. Please log in again to authenticate your identity.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleLoginRedirect} className="gap-2 h-11 px-8 rounded-full text-base bg-primary text-primary-foreground hover:bg-primary/90">
          <LogIn className="w-4 h-4" /> Log In
        </Button>
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="gap-2 h-11 px-8 rounded-full text-base">
          Dashboard
        </Button>
      </div>
    </div>
  );
}
