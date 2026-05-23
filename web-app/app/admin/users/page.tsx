/**
 * Admin User Management
 *
 * Provision midwife accounts and manage access
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Eye,
  EyeOff,
  KeyRound,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  BadgeCheck,
  IdCard,
  Mail,
  Lock,
  Pencil,
  Save,
  Trash2,
} from 'lucide-react';
import { AdminHeader } from '../layout';
import { Alert, Badge, Button, Card, EmptyState, LoadingSpinner, Modal, SectionTitle } from '../../components/ui';
import { useAuthStore } from '../../lib/stores';
import apiClient from '../../lib/api-client';

const roles = ['midwife', 'supervisor', 'admin'] as const;

type Role = (typeof roles)[number];

interface ProvisionFormState {
  email: string;
  password: string;
  role: Role;
  name: string;
  givenName: string;
  familyName: string;
  phone: string;
  licenseNumber: string;
  facilityName: string;
  region: string;
}

interface ProvisionedMidwife {
  id: string;
  email: string;
  name?: string;
  givenName?: string;
  familyName?: string;
  role: Role;
  phone?: string;
  licenseNumber?: string;
  facilityName?: string;
  region?: string;
  createdAt?: string;
  lastLoginAt?: string | null;
}

interface EditFormState {
  email: string;
  role: Role;
  name: string;
  givenName: string;
  familyName: string;
  phone: string;
  licenseNumber: string;
  facilityName: string;
  region: string;
}

const defaultForm: ProvisionFormState = {
  email: '',
  password: '',
  role: 'midwife',
  name: '',
  givenName: '',
  familyName: '',
  phone: '',
  licenseNumber: '',
  facilityName: '',
  region: '',
};

const defaultEditForm: EditFormState = {
  email: '',
  role: 'midwife',
  name: '',
  givenName: '',
  familyName: '',
  phone: '',
  licenseNumber: '',
  facilityName: '',
  region: '',
};

const roleLabels: Record<Role, string> = {
  midwife: 'Midwife',
  supervisor: 'Supervisor',
  admin: 'Admin',
};

const sriLankaDistricts = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Moneragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
];

const roleBadgeVariant = (role: Role) => {
  if (role === 'admin') return 'info';
  if (role === 'supervisor') return 'warning';
  return 'success';
};

const toOptional = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function AdminUsersPage() {
  const { user, hasHydrated } = useAuthStore();
  const [form, setForm] = useState<ProvisionFormState>(defaultForm);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [midwives, setMidwives] = useState<ProvisionedMidwife[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [editingMidwife, setEditingMidwife] = useState<ProvisionedMidwife | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(defaultEditForm);
  const [editError, setEditError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingMidwife, setDeletingMidwife] = useState<ProvisionedMidwife | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = user?.role === 'admin';

  const isFormValid = useMemo(() => {
    return form.email.trim().length > 0 && form.password.trim().length >= 8;
  }, [form.email, form.password]);

  const isEditFormValid = useMemo(() => {
    return editForm.email.trim().length > 0;
  }, [editForm.email]);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;

    let isActive = true;

    const loadMidwives = async () => {
      setIsLoadingList(true);
      setListError(null);

      try {
        const response = await apiClient.get<{ success: boolean; data: ProvisionedMidwife[] }>(
          '/auth/midwives'
        );
        if (isActive) {
          setMidwives(response.data);
        }
      } catch (err) {
        if (isActive) {
          setListError(err instanceof Error ? err.message : 'Failed to load midwife roster.');
        }
      } finally {
        if (isActive) {
          setIsLoadingList(false);
        }
      }
    };

    loadMidwives();

    return () => {
      isActive = false;
    };
  }, [hasHydrated, isAdmin]);

  const handleChange = (field: keyof ProvisionFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleEditChange = (field: keyof EditFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setEditForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const openEditModal = (account: ProvisionedMidwife) => {
    setEditingMidwife(account);
    setEditForm({
      email: account.email,
      role: account.role,
      name: account.name ?? '',
      givenName: account.givenName ?? '',
      familyName: account.familyName ?? '',
      phone: account.phone ?? '',
      licenseNumber: account.licenseNumber ?? '',
      facilityName: account.facilityName ?? '',
      region: account.region ?? '',
    });
    setEditError(null);
    setActionSuccess(null);
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (isUpdating) return;
    setIsEditOpen(false);
    setEditingMidwife(null);
    setEditForm(defaultEditForm);
    setEditError(null);
  };

  const openDeleteModal = (account: ProvisionedMidwife) => {
    setDeletingMidwife(account);
    setDeleteError(null);
    setActionSuccess(null);
    setIsDeleteOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
    setDeletingMidwife(null);
    setDeleteError(null);
  };

  const generatePassword = () => {
    if (typeof window === 'undefined' || !window.crypto?.getRandomValues) {
      setForm((prev) => ({ ...prev, password: 'MidwifePass123!' }));
      return;
    }

    const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    const length = 12;
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    const nextPassword = Array.from(values)
      .map((value) => charset[value % charset.length])
      .join('');

    setForm((prev) => ({ ...prev, password: nextPassword }));
    setShowPassword(true);
  };

  const resetForm = () => {
    setForm(defaultForm);
    setShowPassword(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !isFormValid) return;

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload = {
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        name: toOptional(form.name),
        givenName: toOptional(form.givenName),
        familyName: toOptional(form.familyName),
        phone: toOptional(form.phone),
        licenseNumber: toOptional(form.licenseNumber),
        facilityName: toOptional(form.facilityName),
        region: toOptional(form.region),
      };

      const response = await apiClient.post<{ success: boolean; data: ProvisionedMidwife }>(
        '/auth/midwife/provision',
        payload
      );

      const created = response.data;
      setMidwives((prev) => [created, ...prev]);
      setSuccess(`Provisioned ${created.email} successfully.`);
      resetForm();
    } catch (err) {
      console.error('Provisioning failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to provision account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMidwife = async () => {
    if (!editingMidwife || isUpdating || !isEditFormValid) return;

    setIsUpdating(true);
    setEditError(null);

    try {
      const payload = {
        email: editForm.email.trim(),
        role: editForm.role,
        name: editForm.name.trim(),
        givenName: editForm.givenName.trim(),
        familyName: editForm.familyName.trim(),
        phone: editForm.phone.trim(),
        licenseNumber: editForm.licenseNumber.trim(),
        facilityName: editForm.facilityName.trim(),
        region: editForm.region.trim(),
      };

      const response = await apiClient.patch<{ success: boolean; data: ProvisionedMidwife }>(
        `/auth/midwives/${editingMidwife.id}`,
        payload
      );

      const updated = response.data;
      setMidwives((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setActionSuccess(`Updated ${updated.email} successfully.`);
      closeEditModal();
    } catch (err) {
      console.error('Midwife update failed:', err);
      setEditError(err instanceof Error ? err.message : 'Failed to update account.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteMidwife = async () => {
    if (!deletingMidwife || isDeleting) return;

    if (deletingMidwife.id === user?.id) {
      setDeleteError('You cannot delete your own account.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await apiClient.delete<{ success: boolean; data: { id: string; email: string } }>(
        `/auth/midwives/${deletingMidwife.id}`
      );

      setMidwives((prev) => prev.filter((item) => item.id !== response.data.id));
      setActionSuccess(`Deleted ${response.data.email} successfully.`);
      closeDeleteModal();
    } catch (err) {
      console.error('Midwife delete failed:', err);
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading admin console</p>
            <p className="text-xs text-slate-500">Verifying access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader
          title="User Management"
          subtitle="Provision midwife accounts and manage access"
        />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          Only admin midwives can provision new accounts. Please contact your system administrator.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminHeader
        title="User Management"
        subtitle="Provision midwife accounts and manage access"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={Sparkles} onClick={generatePassword}>
              Generate Password
            </Button>
            <Button icon={UserPlus} form="provision-form" type="submit" isLoading={isSubmitting} disabled={!isFormValid}>
              Create Account
            </Button>
          </div>
        }
      />

      <Card className="border border-pink-200/60 bg-linear-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Admin Console</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Provision midwife access securely</h2>
              <p className="text-sm text-slate-500 mt-1">
                Share credentials through secure channels and enforce routine password changes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="success">Admin Verified</Badge>
            <Badge variant="default">{user?.email ?? 'admin@health.gov.lk'}</Badge>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle title="Provision New Midwife" subtitle="Create credentials and assign role" />

          {error && (
            <div className="mb-4">
              <Alert variant="error" title="Provisioning failed" icon={Lock}>
                {error}
              </Alert>
            </div>
          )}

          {success && (
            <div className="mb-4">
              <Alert variant="success" title="Account created" icon={BadgeCheck}>
                {success}
              </Alert>
            </div>
          )}

          <form id="provision-form" className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="midwife@health.gov.lk"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={handleChange('role')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Temporary password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Minimum 8 characters"
                    className="w-full pl-10 pr-20 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
                  >
                    {showPassword ? (
                      <span className="inline-flex items-center gap-1"><EyeOff className="w-4 h-4" />Hide</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Eye className="w-4 h-4" />Show</span>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Share this password securely and recommend a reset after first login.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  placeholder="Dr. N. Perera"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Given name
                </label>
                <input
                  type="text"
                  value={form.givenName}
                  onChange={handleChange('givenName')}
                  placeholder="Nimali"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Family name
                </label>
                <input
                  type="text"
                  value={form.familyName}
                  onChange={handleChange('familyName')}
                  placeholder="Perera"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="+94 77 123 4567"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  License number
                </label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={handleChange('licenseNumber')}
                    placeholder="MW-2026-009"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Facility
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={form.facilityName}
                    onChange={handleChange('facilityName')}
                    placeholder="Kandy General Hospital"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                  Region
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <select
                    value={form.region}
                    onChange={handleChange('region')}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select district</option>
                    {sriLankaDistricts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Reset form
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" icon={Sparkles} onClick={generatePassword}>
                  Generate
                </Button>
                <Button type="submit" icon={UserPlus} isLoading={isSubmitting} disabled={!isFormValid}>
                  Provision account
                </Button>
              </div>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionTitle title="Provisioning checklist" />
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                Verify the official ministry email before creating the account.
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                Assign the correct role based on approval documents.
              </li>
              <li className="flex items-start gap-3">
                <BadgeCheck className="w-5 h-5 text-emerald-500 mt-0.5" />
                Share credentials through secure channels only.
              </li>
            </ul>
          </Card>

          <Card>
            <SectionTitle title="Role guidance" />
            <div className="space-y-4">
              {roles.map((role) => (
                <div key={role} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{roleLabels[role]}</p>
                    <p className="text-xs text-slate-500">
                      {role === 'admin'
                        ? 'Full access to provisioning and system configuration.'
                        : role === 'supervisor'
                        ? 'Oversight access with reporting permissions.'
                        : 'Standard midwife access to patient workflows.'}
                    </p>
                  </div>
                  <Badge variant={roleBadgeVariant(role)}>{roleLabels[role]}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Midwife roster" subtitle="Latest provisioned accounts" />
        {listError && (
          <div className="mb-4">
            <Alert variant="error" title="Roster unavailable" icon={Users}>
              {listError}
            </Alert>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4">
            <Alert variant="success" title="Roster updated" icon={BadgeCheck}>
              {actionSuccess}
            </Alert>
          </div>
        )}
        {isLoadingList ? (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="md" />
            <p className="text-sm text-slate-500 mt-3">Loading midwives...</p>
          </div>
        ) : midwives.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No accounts yet"
            description="Use the form above to provision your first midwife account."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
                  <th className="py-3 px-2 font-medium text-slate-500">Midwife</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Role</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Facility</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Region</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Created</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Last login</th>
                  <th className="py-3 px-2 font-medium text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody>
                {midwives.map((account) => {
                  const isSelf = account.id === user?.id;

                  return (
                    <tr
                      key={account.id}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-br from-pink-400 to-purple-500 text-white flex items-center justify-center text-xs font-semibold">
                            {account.name
                              ? account.name.split(' ').map((part) => part[0]).join('').slice(0, 2)
                              : account.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {account.name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-slate-500">{account.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={roleBadgeVariant(account.role)}>{roleLabels[account.role]}</Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {account.facilityName || 'Unassigned'}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {account.region || 'Unassigned'}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {formatDateTime(account.createdAt)}
                      </td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">
                        {formatDateTime(account.lastLoginAt)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" icon={Pencil} onClick={() => openEditModal(account)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            onClick={() => openDeleteModal(account)}
                            disabled={isSelf}
                            title={isSelf ? 'You cannot delete your own account' : 'Delete account'}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isEditOpen} onClose={closeEditModal} title="Edit midwife" size="lg">
        {editError && (
          <div className="mb-4">
            <Alert variant="error" title="Update failed" icon={Lock}>
              {editError}
            </Alert>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={editForm.email}
                onChange={handleEditChange('email')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Role
            </label>
            <select
              value={editForm.role}
              onChange={handleEditChange('role')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Display name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={handleEditChange('name')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Given name
            </label>
            <input
              type="text"
              value={editForm.givenName}
              onChange={handleEditChange('givenName')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Family name
            </label>
            <input
              type="text"
              value={editForm.familyName}
              onChange={handleEditChange('familyName')}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="tel"
                value={editForm.phone}
                onChange={handleEditChange('phone')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              License number
            </label>
            <div className="relative">
              <IdCard className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={editForm.licenseNumber}
                onChange={handleEditChange('licenseNumber')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Facility
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={editForm.facilityName}
                onChange={handleEditChange('facilityName')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
              Region
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <select
                value={editForm.region}
                onChange={handleEditChange('region')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Select district</option>
                {sriLankaDistricts.map((district) => (
                  <option key={district} value={district}>
                    {district}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-6">
          <Button type="button" variant="secondary" onClick={closeEditModal} disabled={isUpdating}>
            Cancel
          </Button>
          <Button
            type="button"
            icon={Save}
            onClick={handleUpdateMidwife}
            isLoading={isUpdating}
            disabled={!isEditFormValid}
          >
            Save changes
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isDeleteOpen} onClose={closeDeleteModal} title="Delete midwife" size="sm">
        {deleteError && (
          <div className="mb-4">
            <Alert variant="error" title="Delete failed" icon={Lock}>
              {deleteError}
            </Alert>
          </div>
        )}
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            This will permanently remove the midwife account and revoke access. Any assigned patients will be unassigned.
          </p>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-4">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Account</p>
            <p className="text-sm text-slate-500 mt-1">
              {deletingMidwife?.name || 'Unnamed'} · {deletingMidwife?.email}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-6">
          <Button type="button" variant="secondary" onClick={closeDeleteModal} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            icon={Trash2}
            onClick={handleDeleteMidwife}
            isLoading={isDeleting}
            disabled={deletingMidwife?.id === user?.id}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
