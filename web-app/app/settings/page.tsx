/**
 * Settings Page
 *
 * User preferences and application settings
 */

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  Shield,
  Moon,
  Sun,
  Monitor,
  Lock,
  Mail,
  Phone,
  Camera,
  LogOut,
  Save,
  ChevronRight,
  AlertCircle,
  Check,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  SectionTitle,
  Input,
  Select,
  Alert,
  LoadingSpinner,
} from '../components/ui';
import { useTheme } from '../components/theme-provider';
import { useAuthStore } from '../lib/stores';
import apiClient from '../lib/api-client';
import type {
  ApiResponse,
  MidwifePreferences,
  MidwifeProfile,
  MidwifeSettingsResponse,
  MidwifeStats,
  User,
} from '../lib/types';

interface SettingCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const SettingCard: React.FC<SettingCardProps> = ({
  icon: Icon,
  title,
  description,
  children,
  onClick,
}) => (
  <Card hover={!!onClick} onClick={onClick} className={onClick ? 'cursor-pointer' : undefined}>
    <div className="flex items-center gap-4">
      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700">
        <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {children || <ChevronRight className="w-5 h-5 text-slate-400" />}
    </div>
  </Card>
);

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange }) => (
  <button
    onClick={(event) => {
      event.stopPropagation();
      onChange(!enabled);
    }}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
      enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const DEFAULT_PREFERENCES: MidwifePreferences = {
  theme: 'system',
  language: 'en',
  dateFormat: 'dmy',
  notifications: {
    appointments: true,
    vaccinations: true,
    highRisk: true,
    dailyDigest: false,
    emailNotifications: true,
    smsNotifications: false,
  },
};

const DEFAULT_STATS: MidwifeStats = {
  patientsManaged: 0,
  appointmentsThisMonth: 0,
  vaccinationsAdministered: 0,
};

const formatDate = (value: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
};

const mapProfileToUser = (profile: MidwifeProfile): User => ({
  id: profile.id,
  email: profile.email,
  name: profile.name ?? undefined,
  role: profile.role,
  employeeId: profile.licenseNumber ?? undefined,
  area: profile.region ?? undefined,
  phone: profile.phone ?? undefined,
  licenseNumber: profile.licenseNumber ?? undefined,
  facilityName: profile.facilityName ?? undefined,
  region: profile.region ?? undefined,
  picture: profile.picture ?? undefined,
  lastLoginAt: profile.lastLoginAt ?? undefined,
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout: storeLogout, user: storeUser, setUser } = useAuthStore();
  const [profile, setProfile] = useState<MidwifeProfile | null>(null);
  const [preferences, setPreferences] = useState<MidwifePreferences>(DEFAULT_PREFERENCES);
  const [stats, setStats] = useState<MidwifeStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordStatus, setPasswordStatus] = useState({
    isSaving: false,
    error: null as string | null,
    success: false,
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const fallbackProfile = useMemo<MidwifeProfile | null>(() => {
    if (!storeUser) return null;
    return {
      id: storeUser.id,
      name: storeUser.name ?? null,
      email: storeUser.email,
      phone: storeUser.phone ?? null,
      role: storeUser.role,
      licenseNumber: storeUser.licenseNumber ?? storeUser.employeeId ?? null,
      facilityName: storeUser.facilityName ?? null,
      region: storeUser.region ?? storeUser.area ?? null,
      picture: storeUser.picture ?? null,
      createdAt: storeUser.createdAt,
      updatedAt: storeUser.updatedAt,
      lastLoginAt: storeUser.lastLoginAt ?? null,
    };
  }, [storeUser]);

  useEffect(() => {
    if (!profile && fallbackProfile) {
      setProfile(fallbackProfile);
    }
  }, [fallbackProfile, profile]);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await apiClient.get<ApiResponse<MidwifeSettingsResponse>>('/settings');
      const data = response.data;
      if (!data) {
        throw new Error('Unable to load settings data.');
      }
      setProfile(data.profile);
      setPreferences(data.preferences);
      setStats(data.stats);
      setTheme(data.preferences.theme);
      setUser(mapProfileToUser(data.profile));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load settings.');
    } finally {
      setIsLoading(false);
    }
  }, [setTheme, setUser]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const activeProfile = profile ?? fallbackProfile;

  const handleThemeChange = (nextTheme: MidwifePreferences['theme']) => {
    setTheme(nextTheme);
    setPreferences((prev) => ({ ...prev, theme: nextTheme }));
  };

  const handleProfileChange = (field: keyof MidwifeProfile, value: string) => {
    setProfile((prev) => {
      const base = prev ?? activeProfile;
      if (!base) return prev;
      return { ...base, [field]: value } as MidwifeProfile;
    });
  };

  const handleNotificationChange = (
    field: keyof MidwifePreferences['notifications'],
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!activeProfile) return;

    if (!activeProfile.email?.trim()) {
      setSaveError('Email is required.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const response = await apiClient.put<ApiResponse<MidwifeSettingsResponse>>('/settings', {
        profile: {
          name: activeProfile.name ?? '',
          email: activeProfile.email,
          phone: activeProfile.phone ?? '',
          picture: activeProfile.picture ?? '',
        },
        preferences,
      });

      const data = response.data;
      if (!data) {
        throw new Error('Unable to save settings.');
      }

      setProfile(data.profile);
      setPreferences(data.preferences);
      setStats(data.stats);
      setUser(mapProfileToUser(data.profile));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    storeLogout();
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setSaveError('Please select an image under 2MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleProfileChange('picture', String(reader.result ?? ''));
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handlePasswordUpdate = async () => {
    setPasswordStatus({ isSaving: true, error: null, success: false });

    if (!passwordState.currentPassword || !passwordState.newPassword) {
      setPasswordStatus({
        isSaving: false,
        error: 'Please provide your current and new password.',
        success: false,
      });
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordStatus({
        isSaving: false,
        error: 'New passwords do not match.',
        success: false,
      });
      return;
    }

    try {
      await apiClient.post<ApiResponse>('/auth/midwife/change-password', {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });

      setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStatus({ isSaving: false, error: null, success: true });
    } catch (error) {
      setPasswordStatus({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update password.',
        success: false,
      });
    }
  };

  if (isLoading && !activeProfile) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!activeProfile) {
    return (
      <MainLayout>
        <Alert variant="error" title="Settings unavailable" icon={AlertCircle}>
          Unable to load your profile. Please log in again.
        </Alert>
      </MainLayout>
    );
  }

  const assignedArea = activeProfile.region || activeProfile.facilityName || 'Not assigned';
  const employeeId = activeProfile.licenseNumber || 'N/A';

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="sticky top-0 z-30 -mx-4 mb-8 border-b border-slate-200/70 bg-slate-50/90 px-4 pb-4 pt-4 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/90 lg:-mx-8 lg:px-8">
          <Header
            title="Settings"
            subtitle="Manage your preferences"
            actions={
              <Button
                icon={Save}
                onClick={handleSave}
                isLoading={isSaving}
                disabled={isSaving || isLoading}
              >
                Save Changes
              </Button>
            }
          />
        </div>

        {loadError && (
          <Alert variant="error" icon={AlertCircle} className="mb-6">
            {loadError}
          </Alert>
        )}

        {saveError && (
          <Alert variant="error" icon={AlertCircle} className="mb-6">
            {saveError}
          </Alert>
        )}

        {saved && (
          <Alert variant="success" icon={Check} className="mb-6">
            Settings saved successfully!
          </Alert>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-8">
          <div>
            <SectionTitle>Profile</SectionTitle>
            <Card>
              <div className="grid gap-6 sm:grid-cols-[160px,1fr]">
                <div className="flex flex-col items-center gap-3 sm:items-start">
                  <div className="relative">
                    <Avatar
                      name={activeProfile.name || 'Midwife'}
                      src={activeProfile.picture ?? undefined}
                      size="xl"
                    />
                    <button
                      className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
                      onClick={handleAvatarClick}
                      aria-label="Upload profile photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      value={activeProfile.name ?? ''}
                      onChange={(event) => handleProfileChange('name', event.target.value)}
                    />
                    <Input label="Employee ID" value={employeeId} readOnly />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Email"
                      type="email"
                      value={activeProfile.email}
                      onChange={(event) => handleProfileChange('email', event.target.value)}
                      icon={Mail}
                    />
                    <Input
                      label="Phone"
                      value={activeProfile.phone ?? ''}
                      onChange={(event) => handleProfileChange('phone', event.target.value)}
                      icon={Phone}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Role" value={activeProfile.role} readOnly />
                    <Input label="Assigned Area" value={assignedArea} readOnly />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Notifications</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingCard
                icon={Bell}
                title="Appointment Reminders"
                description="Get notified about upcoming appointments"
              >
                <ToggleSwitch
                  enabled={preferences.notifications.appointments}
                  onChange={(enabled) => handleNotificationChange('appointments', enabled)}
                />
              </SettingCard>
              <SettingCard
                icon={AlertCircle}
                title="Vaccination Alerts"
                description="Alerts for upcoming and overdue vaccinations"
              >
                <ToggleSwitch
                  enabled={preferences.notifications.vaccinations}
                  onChange={(enabled) => handleNotificationChange('vaccinations', enabled)}
                />
              </SettingCard>
              <SettingCard
                icon={Shield}
                title="High-Risk Patient Alerts"
                description="Immediate alerts for high-risk patients"
              >
                <ToggleSwitch
                  enabled={preferences.notifications.highRisk}
                  onChange={(enabled) => handleNotificationChange('highRisk', enabled)}
                />
              </SettingCard>
            </div>
          </div>

          <div>
            <SectionTitle>Appearance</SectionTitle>
            <Card>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light' as const, label: 'Light', icon: Sun },
                      { value: 'dark' as const, label: 'Dark', icon: Moon },
                      { value: 'system' as const, label: 'System', icon: Monitor },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <option.icon
                          className={`w-6 h-6 ${
                            theme === option.value ? 'text-primary' : 'text-slate-500'
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            theme === option.value
                              ? 'text-primary'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Language & Region</SectionTitle>
            <Card>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Language"
                  options={[
                    { value: 'en', label: 'English' },
                    { value: 'si', label: 'සිංහල (Sinhala)' },
                    { value: 'ta', label: 'தமிழ் (Tamil)' },
                  ]}
                  value={preferences.language}
                  onChange={(event) =>
                    setPreferences((prev) => ({
                      ...prev,
                      language: event.target.value,
                    }))
                  }
                />
                <Select
                  label="Date Format"
                  options={[
                    { value: 'mdy', label: 'MM/DD/YYYY' },
                    { value: 'dmy', label: 'DD/MM/YYYY' },
                    { value: 'ymd', label: 'YYYY-MM-DD' },
                  ]}
                  value={preferences.dateFormat}
                  onChange={(event) =>
                    setPreferences((prev) => ({
                      ...prev,
                      dateFormat: event.target.value,
                    }))
                  }
                />
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Security</SectionTitle>
            <div className="grid gap-4 md:grid-cols-2">
              <SettingCard
                icon={Lock}
                title="Change Password"
                description="Update your account password"
                onClick={() => setShowPasswordForm((prev) => !prev)}
              />
            </div>
            {showPasswordForm && (
              <Card className="mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordState.currentPassword}
                    onChange={(event) =>
                      setPasswordState((prev) => ({
                        ...prev,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordState.newPassword}
                    onChange={(event) =>
                      setPasswordState((prev) => ({
                        ...prev,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordState.confirmPassword}
                    onChange={(event) =>
                      setPasswordState((prev) => ({
                        ...prev,
                        confirmPassword: event.target.value,
                      }))
                    }
                  />
                </div>
                {passwordStatus.error && (
                  <Alert variant="error" className="mt-4">
                    {passwordStatus.error}
                  </Alert>
                )}
                {passwordStatus.success && (
                  <Alert variant="success" className="mt-4">
                    Password updated successfully.
                  </Alert>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={handlePasswordUpdate}
                    isLoading={passwordStatus.isSaving}
                    disabled={passwordStatus.isSaving}
                  >
                    Update Password
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowPasswordForm(false)}
                    disabled={passwordStatus.isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24 h-fit">
          <Card>
            <div className="text-center mb-4">
              <Avatar
                name={activeProfile.name || 'Midwife'}
                src={activeProfile.picture ?? undefined}
                size="xl"
                className="mx-auto mb-3"
              />
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {activeProfile.name || 'Midwife'}
              </h3>
              <p className="text-sm text-slate-500">{activeProfile.role}</p>
              <Badge variant="success" className="mt-2">
                Active
              </Badge>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-medium text-slate-900 dark:text-white">{employeeId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Area</span>
                <span className="font-medium text-slate-900 dark:text-white">{assignedArea}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Since</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDate(activeProfile.createdAt)}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Your Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Patients Managed</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.patientsManaged}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: Math.min(100, stats.patientsManaged) + '%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Appointments This Month</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.appointmentsThisMonth}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: Math.min(100, stats.appointmentsThisMonth) + '%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Vaccinations Administered</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {stats.vaccinationsAdministered}
                  </span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: Math.min(100, stats.vaccinationsAdministered) + '%' }}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Button variant="outline" className="w-full" icon={LogOut} onClick={handleLogout}>
            Sign Out
          </Button>

          <div className="text-center text-xs text-slate-400">
            <p>MidwifeHub v1.0.0</p>
            <p>© 2026 Ministry of Health, Sri Lanka</p>
          </div>
        </div>
      </div>
      </div>
    </MainLayout>
  );
}
