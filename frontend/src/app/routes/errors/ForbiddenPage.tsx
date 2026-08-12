import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { clearSession } = useAuthStore();

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center sf-slide-up">
      <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
        <ShieldAlert className="w-12 h-12 text-amber-500" />
      </div>
      <h1 className="text-7xl font-bold text-foreground mb-4 tracking-tighter">403</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4 tracking-tight">Access Forbidden</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        You do not have permission to access this resource. Please contact your farm administrator or log in with a different account.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="gap-2 h-11 px-8 rounded-full text-base">
          Back to Dashboard
        </Button>
        <Button onClick={handleLogout} className="gap-2 h-11 px-8 rounded-full text-base bg-foreground text-background hover:bg-foreground/90">
          <LogOut className="w-4 h-4" /> Switch Account
        </Button>
      </div>
    </div>
  );
}
