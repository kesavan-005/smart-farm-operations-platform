// AuthLayout — premium split-panel layout
// Left: branding hero with animated pattern. Right: auth card.
// Mobile: single column with hero banner.

import { type ReactNode } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { Leaf, Sprout, Sun, Droplets } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { language, toggleLanguage } = useLanguageStore();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* ========== Left Hero Panel (Desktop) ========== */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Floating decorative elements */}
        <div className="absolute top-20 left-16 w-20 h-20 rounded-full bg-white/5 sf-animate-in" style={{ animationDelay: '200ms' }} />
        <div className="absolute top-48 right-20 w-32 h-32 rounded-full bg-white/5 sf-animate-in" style={{ animationDelay: '400ms' }} />
        <div className="absolute bottom-32 left-24 w-24 h-24 rounded-full bg-white/5 sf-animate-in" style={{ animationDelay: '600ms' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo / Brand */}
          <div className="sf-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Leaf className="w-6 h-6 text-emerald-200" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Smart Farm</span>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8 sf-slide-up" style={{ animationDelay: '100ms' }}>
            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Intelligent Farm<br />Operations Platform
            </h1>
            <p className="text-lg text-emerald-100/80 max-w-md leading-relaxed">
              Manage your farms, fields, and crops with AI-powered insights. 
              Built for the modern farmer.
            </p>

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-4 max-w-sm">
              <FeatureChip icon={Sprout} label="Crop Intelligence" />
              <FeatureChip icon={Droplets} label="Smart Irrigation" />
              <FeatureChip icon={Sun} label="Weather Insights" />
              <FeatureChip icon={Leaf} label="Soil Analytics" />
            </div>
          </div>

          {/* Footer */}
          <div className="sf-animate-in" style={{ animationDelay: '300ms' }}>
            <p className="text-sm text-emerald-200/50">
              © 2026 Smart Farm Platform. Built with ❤️ for agriculture.
            </p>
          </div>
        </div>
      </div>

      {/* ========== Right Auth Panel ========== */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Mobile Hero Banner */}
        <div className="lg:hidden bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <Leaf className="w-5 h-5 text-emerald-200" />
            </div>
            <span className="text-lg font-bold text-white">Smart Farm</span>
          </div>
          <p className="text-sm text-emerald-100/70">Intelligent Farm Operations Platform</p>
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8 lg:py-12">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg text-sm font-medium
                       bg-card text-muted-foreground border border-border
                       hover:bg-accent hover:text-accent-foreground
                       transition-colors duration-150 shadow-sm"
            aria-label="Switch language"
            type="button"
          >
            {language === 'en' ? 'தமிழ்' : 'English'}
          </button>

          <div className="w-full max-w-[420px] sf-slide-up">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-100/80 bg-white/5 rounded-lg px-3 py-2.5 backdrop-blur-sm border border-white/5">
      <Icon className="w-4 h-4 text-emerald-300 shrink-0" />
      <span className="font-medium">{label}</span>
    </div>
  );
}
