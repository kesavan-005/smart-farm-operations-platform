import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { updateProfileApi, changePasswordApi } from '../api/authApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  User as UserIcon, Mail, Phone, Edit2, Check, X, Camera,
  Key, ShieldAlert, Award, CheckCircle, ShieldCheck
} from 'lucide-react';

export default function ProfileScreen() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    preferredLanguage: 'en',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [securityForm, setSecurityForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || user.name?.split(' ')[0] || '',
        lastName: user.lastName || user.name?.split(' ')[1] || '',
        email: user.email || '',
        preferredLanguage: user.language || user.preferredLanguage || 'en',
      });
      if (user.avatar) {
        setAvatar(user.avatar);
      }
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const updatedUser = await updateProfileApi({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        preferredLanguage: form.preferredLanguage,
      });
      updateUser(updatedUser);
      toast({ title: 'Profile updated successfully' });
      setIsEditing(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: err.message || 'Could not update profile',
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB.',
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (user?.id) {
          localStorage.setItem(`user_avatar_${user.id}`, base64String);
        }
        toast({ title: 'Avatar preview updated' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.oldPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All password fields are required.',
      });
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'New password and confirm password do not match.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await changePasswordApi(securityForm);
      setSecurityForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: 'Password Updated',
        description: 'Your security credentials have been updated successfully in PostgreSQL.',
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Password Change Failed',
        description: err.message || 'Failed to change password.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="sf-card p-8 text-center max-w-md mx-auto mt-12">
        <p className="text-sm text-destructive">User session not loaded.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sf-stagger">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Enterprise User Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account information, security credentials, and active permissions.</p>
      </div>

      {/* Profile Header Card */}
      <div className="sf-card overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-700 relative">
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="px-6 pb-6 -mt-12 relative z-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary text-3xl font-bold">
                      {user.name?.substring(0, 2).toUpperCase() || 'US'}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                  aria-label="Upload photo"
                >
                  <Camera className="w-6 h-6 text-white" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-foreground leading-snug">{user.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] border border-emerald-500/20">
                    {user.role || 'WORKER'}
                  </span>
                  <span>•</span>
                  <span>@{user.username || user.phone}</span>
                </div>
              </div>
            </div>
            <Button
              variant={isEditing ? 'destructive' : 'outline'}
              className="h-9 px-4 text-xs gap-1.5 shrink-0"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <X className="w-3.5 h-3.5" /> Cancel
                </>
              ) : (
                <>
                  <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Side: General Profile Form & Account Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Info Card */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-primary" />
              </div>
              Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ProfileField icon={UserIcon} label="First Name">
                {isEditing ? (
                  <Input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-primary/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{user.firstName || user.name?.split(' ')[0] || 'N/A'}</p>
                )}
              </ProfileField>

              <ProfileField icon={UserIcon} label="Last Name">
                {isEditing ? (
                  <Input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-primary/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{user.lastName || user.name?.split(' ')[1] || 'N/A'}</p>
                )}
              </ProfileField>

              <ProfileField icon={Mail} label="Email Address">
                {isEditing ? (
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-primary/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{user.email || 'Not configured'}</p>
                )}
              </ProfileField>

              <ProfileField icon={Phone} label="Registered Phone">
                <p className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
                  {user.phone}
                </p>
              </ProfileField>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="outline" className="h-9 text-sm" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isUpdatingProfile}
                  className="h-9 text-sm bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
                >
                  {isUpdatingProfile ? (
                    'Saving...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Security Management Form */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center">
                <Key className="w-3.5 h-3.5 text-amber-500" />
              </div>
              Change Password
            </h3>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Current Password</label>
                  <Input
                    type="password"
                    value={securityForm.oldPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, oldPassword: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-amber-500/50"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">New Password</label>
                  <Input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-amber-500/50"
                    placeholder="Min 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Confirm New Password</label>
                  <Input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-amber-500/50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="h-9 text-xs bg-amber-600 hover:bg-amber-500 text-white gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Account Activity & Security status */}
        <div className="space-y-6">
          <div className="sf-card p-5 relative overflow-hidden bg-emerald-500/[0.02] dark:bg-emerald-500/5 border-emerald-500/20">
            <Award className="absolute -top-3 -right-3 w-16 h-16 text-emerald-500/10 pointer-events-none" />
            <h3 className="text-sm font-semibold text-foreground mb-4">Enterprise Role & Permissions</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Account Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified Active
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Role Level</span>
                <span className="font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                  {user.role || 'WORKER'}
                </span>
              </div>
            </div>
          </div>

          {/* Granted Permissions List */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              Granted Permissions
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {user.permissions && user.permissions.length > 0 ? (
                user.permissions.map((perm) => (
                  <div key={perm} className="flex items-center gap-2 text-xs bg-slate-800/60 p-2 rounded-lg border border-slate-700/40">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="font-mono text-slate-200 text-[11px]">{perm}</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Standard worker permissions</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
        <Icon className="w-3.5 h-3.5 text-muted-foreground/75" />
        <span>{label}</span>
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
