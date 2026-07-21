import { useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComingSoonPage() {
  const location = useLocation();

  const pageName = location.pathname.split('/').filter(Boolean).pop() ?? 'page';
  const formattedName = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 sf-slide-up">
      <div className="sf-card p-8 md:p-12 max-w-lg w-full flex flex-col items-center border-primary/20 bg-primary/[0.02] dark:bg-primary/5 relative overflow-hidden">
        {/* Decorative background blur */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-background border border-border shadow-sm flex items-center justify-center mb-6 relative z-10">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight relative z-10">
          {formattedName} <span className="text-muted-foreground font-medium">— Coming Soon</span>
        </h2>
        
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8 relative z-10">
          We are currently building this module to bring you powerful new capabilities in the next phase of the Smart Farm platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto relative z-10">
          <Button variant="outline" className="h-10 px-6" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            Notify Me <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
