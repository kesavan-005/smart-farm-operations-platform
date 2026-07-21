import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Phone, Lock, Shield, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginScreen() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  
  const setSession = useAuthStore((state) => state.setSession);
  const { toast } = useToast();

  const [mode, setMode] = useState<'otp_request' | 'otp_verify' | 'password'>('otp_request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/otp/request', { phone });
      setMode('otp_verify');
      toast({ title: t('otpSent'), description: t('otpSentDesc') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/otp/verify', { phone, code });
      setSession(res.data.data.user, res.data.data.tokens.accessToken);
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/login', { phone, password });
      setSession(res.data.data.user, res.data.data.tokens.accessToken);
      navigate(returnTo, { replace: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {mode === 'otp_verify' ? t('verifyIdentity') || 'Verify your identity' : t('loginTitle')}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {mode === 'otp_verify'
            ? t('otpSentDesc') || `We sent a code to ${phone}`
            : t('loginSubtitle')}
        </p>
      </div>

      {/* OTP Request Form */}
      {mode === 'otp_request' && (
        <form onSubmit={handleRequestOtp} className="space-y-5 sf-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('phonePlaceholder') || 'Phone Number'}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 h-11 bg-background"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isLoading ? t('loading') : t('sendOtp')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground uppercase tracking-wider">or</span></div>
          </div>

          <button
            type="button"
            onClick={() => setMode('password')}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <Lock className="w-4 h-4" />
            {t('loginWithPassword')}
          </button>
        </form>
      )}

      {/* OTP Verify Form */}
      {mode === 'otp_verify' && (
        <form onSubmit={handleVerifyOtp} className="space-y-5 sf-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('otpPlaceholder') || 'Verification Code'}</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 h-11 bg-background text-center tracking-[0.3em] text-lg font-mono"
                maxLength={6}
                autoFocus
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {isLoading ? t('loading') : t('verifyOtp')}
          </Button>

          <button
            type="button"
            onClick={() => setMode('otp_request')}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('backToPhone')}
          </button>
        </form>
      )}

      {/* Password Login Form */}
      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-5 sf-slide-up">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('phonePlaceholder') || 'Phone Number'}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="tel"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 h-11 bg-background"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">{t('passwordPlaceholder') || 'Password'}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pl-10 h-11 bg-background"
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium gap-2" disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {isLoading ? t('loading') : t('login')}
          </Button>

          <button
            type="button"
            onClick={() => setMode('otp_request')}
            className="w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('loginWithOtp')}
          </button>
        </form>
      )}

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground">
        {t('noAccount')}{' '}
        <a href="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
          {t('registerHere')}
        </a>
      </p>
    </div>
  );
}
