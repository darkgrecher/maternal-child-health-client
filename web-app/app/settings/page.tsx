/**
 * Settings Page
 * 
 * User preferences and application settings
 */

'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Shield,
  Globe,
  Palette,
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
} from '../components/ui';
import { useTheme } from '../components/theme-provider';

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
  <Card hover={!!onClick} onClick={onClick} className="cursor-pointer">
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
    onClick={(e) => {
      e.stopPropagation();
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

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('dmy');
  const [notifications, setNotifications] = useState({
    appointments: true,
    vaccinations: true,
    highRisk: true,
    dailyDigest: false,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [saved, setSaved] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // Mock user data
  const user = {
    name: 'Dr. Priya Jayawardena',
    email: 'priya.jayawardena@health.gov.lk',
    phone: '0771234567',
    role: 'Senior Midwife',
    area: 'Colombo District',
    employeeId: 'MW-2024-001',
    registeredDate: '2020-01-15',
  };

  // Initialize profile data on mount
  React.useEffect(() => {
    setProfileData({
      name: user.name,
      email: user.email,
      phone: user.phone,
    });
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <MainLayout>
      <Header
        title="Settings"
        subtitle="Manage your preferences"
        actions={
          <Button icon={Save} onClick={handleSave}>
            Save Changes
          </Button>
        }
      />

      {saved && (
        <Alert variant="success" icon={Check} className="mb-6">
          Settings saved successfully!
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div>
            <SectionTitle>Profile</SectionTitle>
            <Card>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="relative">
                  <Avatar name={user.name} size="xl" />
                  <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input 
                      label="Full Name" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    />
                    <Input label="Employee ID" value={user.employeeId} readOnly />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input 
                      label="Email" 
                      type="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      icon={Mail} 
                    />
                    <Input 
                      label="Phone" 
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      icon={Phone} 
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Role" value={user.role} readOnly />
                    <Input label="Assigned Area" value={user.area} readOnly />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Notifications Section */}
          <div>
            <SectionTitle>Notifications</SectionTitle>
            <div className="space-y-3">
              <SettingCard
                icon={Bell}
                title="Appointment Reminders"
                description="Get notified about upcoming appointments"
              >
                <ToggleSwitch
                  enabled={notifications.appointments}
                  onChange={(enabled) => setNotifications({ ...notifications, appointments: enabled })}
                />
              </SettingCard>
              <SettingCard
                icon={AlertCircle}
                title="Vaccination Alerts"
                description="Alerts for upcoming and overdue vaccinations"
              >
                <ToggleSwitch
                  enabled={notifications.vaccinations}
                  onChange={(enabled) => setNotifications({ ...notifications, vaccinations: enabled })}
                />
              </SettingCard>
              <SettingCard
                icon={Shield}
                title="High-Risk Patient Alerts"
                description="Immediate alerts for high-risk patients"
              >
                <ToggleSwitch
                  enabled={notifications.highRisk}
                  onChange={(enabled) => setNotifications({ ...notifications, highRisk: enabled })}
                />
              </SettingCard>
              <SettingCard
                icon={Mail}
                title="Daily Digest"
                description="Receive a daily summary email"
              >
                <ToggleSwitch
                  enabled={notifications.dailyDigest}
                  onChange={(enabled) => setNotifications({ ...notifications, dailyDigest: enabled })}
                />
              </SettingCard>
            </div>
          </div>

          {/* Appearance Section */}
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
                        onClick={() => setTheme(option.value)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          theme === option.value
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <option.icon className={`w-6 h-6 ${
                          theme === option.value ? 'text-primary' : 'text-slate-500'
                        }`} />
                        <span className={`text-sm font-medium ${
                          theme === option.value ? 'text-primary' : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Language Section */}
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
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
                <Select
                  label="Date Format"
                  options={[
                    { value: 'mdy', label: 'MM/DD/YYYY' },
                    { value: 'dmy', label: 'DD/MM/YYYY' },
                    { value: 'ymd', label: 'YYYY-MM-DD' },
                  ]}
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                />
              </div>
            </Card>
          </div>

          {/* Security Section */}
          <div>
            <SectionTitle>Security</SectionTitle>
            <div className="space-y-3">
              <SettingCard
                icon={Lock}
                title="Change Password"
                description="Update your account password"
              />
              <SettingCard
                icon={Shield}
                title="Two-Factor Authentication"
                description="Add an extra layer of security"
              >
                <Badge variant="default">Enabled</Badge>
              </SettingCard>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Info */}
          <Card>
            <div className="text-center mb-4">
              <Avatar name={user.name} size="xl" className="mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white">{user.name}</h3>
              <p className="text-sm text-slate-500">{user.role}</p>
              <Badge variant="success" className="mt-2">Active</Badge>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-medium text-slate-900 dark:text-white">{user.employeeId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Area</span>
                <span className="font-medium text-slate-900 dark:text-white">{user.area}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Since</span>
                <span className="font-medium text-slate-900 dark:text-white">Jan 2020</span>
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Your Statistics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Patients Managed</span>
                  <span className="font-medium text-slate-900 dark:text-white">156</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '78%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Appointments This Month</span>
                  <span className="font-medium text-slate-900 dark:text-white">42</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '65%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Vaccinations Administered</span>
                  <span className="font-medium text-slate-900 dark:text-white">89</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '89%' }} />
                </div>
              </div>
            </div>
          </Card>

          {/* Help & Support */}
          <Card>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Help & Support</h3>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full justify-start">
                📚 User Guide
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                💬 Contact Support
              </Button>
              <Button variant="secondary" className="w-full justify-start">
                📋 Report an Issue
              </Button>
            </div>
          </Card>

          {/* Logout */}
          <Button variant="outline" className="w-full" icon={LogOut}>
            Sign Out
          </Button>

          {/* Version Info */}
          <div className="text-center text-xs text-slate-400">
            <p>MidwifeHub v1.0.0</p>
            <p>© 2026 Ministry of Health, Sri Lanka</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
