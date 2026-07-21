import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/otp/request', { phone });
      setStep(2);
      toast({ title: t('otpSent'), description: t('otpSentDesc') });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/register', { 
         phone, 
         name, 
         otpCode: code, 
         password,
         preferredLanguage: i18n.language 
      });
      setSession(res.data.data.user, res.data.data.tokens.accessToken);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast({ variant: 'destructive', title: t('error'), description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('registerTitle')}</h1>
        <p className="text-muted-foreground">{t('registerSubtitle')}</p>
      </div>

      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={t('namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              type="tel"
              placeholder={t('phonePlaceholder')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('loading') : t('sendOtp')}
          </Button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder={t('otpPlaceholder')}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={isLoading}
            />
            <Input
              type="password"
              placeholder={t('passwordPlaceholderOptional')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('loading') : t('register')}
          </Button>
        </form>
      )}

      <div className="text-center text-sm text-muted-foreground mt-4">
        {t('haveAccount')} <a href="/login" className="text-primary hover:underline">{t('loginHere')}</a>
      </div>
    </div>
  );
}
