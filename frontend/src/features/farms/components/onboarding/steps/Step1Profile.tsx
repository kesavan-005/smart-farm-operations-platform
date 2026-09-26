import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { ProfileSchema, type ProfileData } from '../types/OnboardingTypes';
import { useWizardStore } from '../store/useWizardStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getProfileApi } from '@/features/auth/api/authApi';
import { useQuery } from '@tanstack/react-query';

export function Step1Profile() {
  const { t } = useTranslation();
  const { profile, setProfile, nextStep } = useWizardStore();

  const { data: userProfile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfileApi,
    staleTime: Infinity,
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: profile || {
      name: '',
      mobile: '',
      language: 'en'
    }
  });

  useEffect(() => {
    if (userProfile && !profile) {
      setValue('name', userProfile.name || '');
      setValue('mobile', userProfile.phone || '');
      // language usually stored in local storage or profile
    }
  }, [userProfile, profile, setValue]);

  const onSubmit = (data: ProfileData) => {
    setProfile(data);
    nextStep();
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">{t('common.loading', 'Loading...')}</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.name', 'Full Name')} <span className="text-destructive">*</span>
          </label>
          <Input {...register('name')} placeholder={t('onboarding.namePlaceholder', 'Enter your full name')} />
          {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.mobile', 'Mobile Number')} <span className="text-destructive">*</span>
          </label>
          <Input 
            {...register('mobile')} 
            disabled={!!userProfile?.phone} 
            placeholder={t('onboarding.mobilePlaceholder', 'e.g. 9876543210')} 
          />
          {errors.mobile && <p className="text-sm text-destructive mt-1">{errors.mobile.message}</p>}
          {!!userProfile?.phone && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('onboarding.mobileLocked', 'Your mobile number is linked to your account.')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('onboarding.language', 'Preferred Language')}
          </label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            defaultValue={profile?.language || 'en'} 
            onChange={(e) => setValue('language', e.target.value as 'en' | 'ta')}
          >
            <option value="en">English</option>
            <option value="ta">தமிழ் (Tamil)</option>
          </select>
          {errors.language && <p className="text-sm text-destructive mt-1">{errors.language.message}</p>}
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
          {t('common.next', 'Next')}
        </Button>
      </div>
    </form>
  );
}
