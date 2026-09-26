import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerSchema, type RegisterFormValues } from '../lib/authValidation';
import { registerApi } from '../api/authApi';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Lock,
  User,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Check,
  X,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RegisterScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: 'FARMER',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');

  // Real-time password criteria state
  const passwordCriteria = {
    hasMinLen: passwordValue.length >= 8,
    hasUpper: /[A-Z]/.test(passwordValue),
    hasLower: /[a-z]/.test(passwordValue),
    hasNumber: /\d/.test(passwordValue),
    hasSpecial: /[@$!%*?&]/.test(passwordValue),
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    setLoading(true);
    try {
      await registerApi(data);
      setIsSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 409 || err.status === 409) {
        setServerError(t('auth.register.conflictMessage'));
      } else {
        const msg = err.response?.data?.message || err.message || t('auth.register.failureMessage');
        if (msg.includes('Exception') || msg.includes('org.hibernate')) {
          setServerError(t('auth.register.failureMessage'));
        } else {
          setServerError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 sf-stagger">
      {/* Registration Form Card */}
      <div className="sf-card py-6 px-4 sm:py-8 sm:px-8 md:px-10 shadow-2xl rounded-2xl border border-border h-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground whitespace-normal break-words">
            {t('auth.register.title')}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground whitespace-normal break-words">
            {t('auth.register.subtitle')}
          </p>
        </div>

          {isSuccess ? (
            <div className="text-center py-6 space-y-6 sf-slide-up">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                {t('auth.register.successMessage')}
              </h3>
              <Button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex justify-center items-center gap-2 min-h-[44px] text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {t('auth.login')} <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              {serverError && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3 text-destructive text-xs sf-slide-up">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <div className="whitespace-normal break-words leading-normal">{serverError}</div>
                </div>
              )}

              {/* Form Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">

                {/* 1. Full Name - Full Width */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.fullName')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      {...register('fullName')}
                      type="text"
                      placeholder={t('auth.register.fullNamePlaceholder')}
                      className={`w-full pl-9 pr-3 min-h-[44px] bg-background border ${
                        errors.fullName ? 'border-destructive' : 'border-input'
                      } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.fullName.message as string)}
                    </p>
                  )}
                </div>

                {/* 2. Username */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.username')} *
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    placeholder={t('auth.register.usernamePlaceholder')}
                    className={`w-full px-3 min-h-[44px] bg-background border ${
                      errors.username ? 'border-destructive' : 'border-input'
                    } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.username.message as string)}
                    </p>
                  )}
                </div>

                {/* 3. Mobile Number */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.mobileNumber')} *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      {...register('phone')}
                      type="text"
                      placeholder={t('auth.register.mobilePlaceholder')}
                      className={`w-full pl-9 pr-3 min-h-[44px] bg-background border ${
                        errors.phone ? 'border-destructive' : 'border-input'
                      } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.phone.message as string)}
                    </p>
                  )}
                </div>

                {/* 4. Email Address */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.email')} *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      {...register('email')}
                      type="email"
                      placeholder={t('auth.register.emailPlaceholder')}
                      className={`w-full pl-9 pr-3 min-h-[44px] bg-background border ${
                        errors.email ? 'border-destructive' : 'border-input'
                      } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.email.message as string)}
                    </p>
                  )}
                </div>

                {/* 5. Role */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.role')} *
                  </label>
                  <select
                    {...register('role')}
                    className={`w-full px-3 min-h-[44px] bg-background border ${
                      errors.role ? 'border-destructive' : 'border-input'
                    } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                  >
                    <option value="FARMER">{t('auth.register.farmer')}</option>
                    <option value="ADMIN">{t('auth.register.admin')}</option>
                  </select>
                  {errors.role && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.role.message as string)}
                    </p>
                  )}
                </div>

                {/* 6. Password */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.password')} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.passwordPlaceholder')}
                      className={`w-full pl-9 pr-10 min-h-[44px] bg-background border ${
                        errors.password ? 'border-destructive' : 'border-input'
                      } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.password.message as string)}
                    </p>
                  )}
                </div>

                {/* 7. Confirm Password */}
                <div className="space-y-1.5 col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-normal break-words leading-snug">
                    {t('auth.register.confirmPassword')} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-muted-foreground" />
                    <input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder={t('auth.register.confirmPasswordPlaceholder')}
                      className={`w-full pl-9 pr-10 min-h-[44px] bg-background border ${
                        errors.confirmPassword ? 'border-destructive' : 'border-input'
                      } rounded-xl text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? t('auth.register.hidePassword') : t('auth.register.showPassword')}
                      className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive mt-1 whitespace-normal break-words leading-tight">
                      {t(errors.confirmPassword.message as string)}
                    </p>
                  )}
                </div>
              </div>

              {/* Real-time Password Requirements Checklist */}
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border/60 text-xs space-y-2">
                <div className="font-bold text-muted-foreground flex items-center gap-1.5 whitespace-normal break-words">
                  <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                  <span>{t('auth.register.passwordRequirements')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px]">
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasMinLen ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    {passwordCriteria.hasMinLen ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-normal break-words leading-tight">{t('auth.register.req8Chars')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    {passwordCriteria.hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-normal break-words leading-tight">{t('auth.register.reqUppercase')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    {passwordCriteria.hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-normal break-words leading-tight">{t('auth.register.reqLowercase')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    {passwordCriteria.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-normal break-words leading-tight">{t('auth.register.reqNumber')}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 lg:col-span-2 ${passwordCriteria.hasSpecial ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}`}>
                    {passwordCriteria.hasSpecial ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span className="whitespace-normal break-words leading-tight">{t('auth.register.reqSpecialChar')}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all whitespace-normal break-words leading-normal"
              >
                {loading ? t('auth.register.creatingAccount') : t('auth.register.createAccount')}
              </Button>

              {/* Footer Sign-in Link */}
              <div className="text-center pt-2 text-xs text-muted-foreground whitespace-normal break-words">
                {t('auth.register.alreadyRegistered')}{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  {t('auth.register.signIn')}
                </Link>
              </div>
            </form>
          )}
        </div>
    </div>
  );
};

export default RegisterScreen;
