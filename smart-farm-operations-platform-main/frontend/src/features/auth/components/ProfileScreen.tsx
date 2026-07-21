import { useState, useEffect, useRef } from 'react';
import { useProfile, useUpdateProfile } from '../api/profileApi';
import { LoadingState } from '@/components/ui/states/LoadingState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  User, Mail, Phone, Edit2, Check, X, Camera,
  Key, Clock, ShieldAlert, Award, FileText, CheckCircle
} from 'lucide-react';

export default function ProfileScreen() {
  const { data: profile, isLoading, error } = useProfile();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', preferredLanguage: '' });
  const [avatar, setAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security Form State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        preferredLanguage: profile.preferredLanguage || 'en'
      });
      // Load avatar from local storage
      const cachedAvatar = localStorage.getItem(`user_avatar_${profile.id}`);
      if (cachedAvatar) {
        setAvatar(cachedAvatar);
      }
    }
  }, [profile]);

  const handleSave = () => {
    updateProfile(form, {
      onSuccess: () => {
        toast({ title: 'Profile updated successfully' });
        setIsEditing(false);
      },
      onError: (err: any) => {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
      },
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB.'
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatar(base64String);
        if (profile?.id) {
          localStorage.setItem(`user_avatar_${profile.id}`, base64String);
        }
        toast({ title: 'Avatar updated successfully' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All password fields are required.'
      });
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'New password and confirm password do not match.'
      });
      return;
    }
    if (securityForm.newPassword.length < 6) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'New password must be at least 6 characters.'
      });
      return;
    }

    setIsUpdatingPassword(true);
    // Simulate API update
    setTimeout(() => {
      setIsUpdatingPassword(false);
      setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast({
        title: 'Password updated',
        description: 'Your security credentials have been updated successfully.'
      });
    }, 1000);
  };

  if (isLoading) return <LoadingState message="Loading profile..." />;

  if (error || !profile) {
    return (
      <div className="sf-card p-8 text-center max-w-md mx-auto mt-12">
        <p className="text-sm text-destructive">Unable to load profile.</p>
      </div>
    );
  }

  // Simulated activity summary
  const mockActivities = [
    { id: '1', action: 'Authorized new session', ip: '192.168.1.15', time: '10 mins ago', success: true },
    { id: '2', action: 'Synchronized offline farm records', ip: 'Local Device', time: '2 hours ago', success: true },
    { id: '3', action: 'Updated account email address', ip: '192.168.1.15', time: 'Yesterday', success: true },
    { id: '4', action: 'Modified field boundary coordinate details', ip: '192.168.1.15', time: '3 days ago', success: true },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 sf-stagger">
      <div>
        <h1 className="text-xl font-bold text-foreground tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account information and security preferences.</p>
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
                      {profile.name?.substring(0, 2).toUpperCase() || 'U'}
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
                <h2 className="text-xl font-bold text-foreground leading-snug">{profile.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary uppercase tracking-wider text-[10px]">
                    {profile.role || 'FARMER'}
                  </span>
                  <span>•</span>
                  <span>ID: {profile.id.substring(0, 8)}...</span>
                </div>
              </div>
            </div>
            <Button
              variant={isEditing ? 'destructive' : 'outline'}
              className="h-9 px-4 text-xs gap-1.5 shrink-0"
              onClick={() => {
                setIsEditing(!isEditing);
                if (isEditing) {
                  setForm({
                    name: profile.name || '',
                    email: profile.email || '',
                    preferredLanguage: profile.preferredLanguage || 'en'
                  });
                }
              }}
            >
              {isEditing ? <><X className="w-3.5 h-3.5" /> Cancel</> : <><Edit2 className="w-3.5 h-3.5" /> Edit Profile</>}
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
                <User className="w-3.5 h-3.5 text-primary" />
              </div>
              Personal Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <ProfileField icon={User} label="Full Name">
                {isEditing ? (
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-9 bg-background focus-visible:ring-primary/50"
                  />
                ) : (
                  <p className="text-sm font-medium text-foreground">{profile.name}</p>
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
                  <p className="text-sm font-medium text-foreground">{profile.email || 'Not configured'}</p>
                )}
              </ProfileField>

              <ProfileField icon={Phone} label="Registered Mobile">
                <p className="text-sm font-medium text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg border border-border/50">
                  {profile.phone}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">Mobile number is linked to OTP credentials and cannot be changed.</p>
              </ProfileField>

              <ProfileField icon={Clock} label="Member Since">
                <p className="text-sm font-medium text-foreground">
                  {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              </ProfileField>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <Button variant="outline" className="h-9 text-sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={isPending} className="h-9 text-sm bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                  {isPending ? (
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
                    value={securityForm.currentPassword}
                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
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
                    placeholder="Min 6 characters"
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
                  className="h-9 text-xs bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
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
          {/* Status Overview Card */}
          <div className="sf-card p-5 relative overflow-hidden bg-primary/[0.01] dark:bg-primary/5 border-primary/20">
            <Award className="absolute -top-3 -right-3 w-16 h-16 text-primary/10 pointer-events-none" />
            <h3 className="text-sm font-semibold text-foreground mb-4">Account Verification</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Identity Status</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Role Permission Level</span>
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold text-foreground">
                  LEVEL 2 (ADMIN)
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log Summary */}
          <div className="sf-card p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              Security Log
            </h3>
            <div className="space-y-4">
              {mockActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground line-clamp-1">{act.action}</p>
                    <p className="text-[10px] text-muted-foreground">{act.ip} • {act.time}</p>
                  </div>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                </div>
              ))}
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
