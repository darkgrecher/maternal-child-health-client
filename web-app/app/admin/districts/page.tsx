/**
 * Admin Districts Page
 *
 * Manage midwife coverage and assignments by district.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Baby,
  Building2,
  MapPin,
  RefreshCw,
  Save,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { AdminHeader } from '../layout';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  LoadingSpinner,
  SectionTitle,
} from '../../components/ui';
import apiClient from '../../lib/api-client';
import { useAuthStore } from '../../lib/stores';
import type {
  AdminDistrictMidwife,
  AdminDistrictSummary,
  AdminDistrictsResponse,
  ApiResponse,
} from '../../lib/types';

const UNASSIGNED_LABEL = 'Unassigned';

const normalizeRegion = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export default function AdminDistrictsPage() {
  const { user, hasHydrated } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [districts, setDistricts] = useState<AdminDistrictSummary[]>([]);
  const [midwives, setMidwives] = useState<AdminDistrictMidwife[]>([]);
  const [draftRegions, setDraftRegions] = useState<Record<string, string>>({});
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDistricts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ApiResponse<AdminDistrictsResponse>>('/admin/districts');
      const payload = response.data ?? { districts: [], midwives: [] };

      setDistricts(payload.districts ?? []);
      setMidwives(payload.midwives ?? []);

      const nextDrafts: Record<string, string> = {};
      (payload.midwives ?? []).forEach((midwife) => {
        nextDrafts[midwife.id] = midwife.region ?? '';
      });
      setDraftRegions(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load district data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || !isAdmin) return;
    loadDistricts();
  }, [hasHydrated, isAdmin, refreshKey, loadDistricts]);

  const districtOptions = useMemo(() => {
    const unique = Array.from(new Set(districts.map((district) => district.name))).filter(Boolean);
    unique.sort((a, b) => {
      const aUnassigned = a === UNASSIGNED_LABEL;
      const bUnassigned = b === UNASSIGNED_LABEL;
      if (aUnassigned !== bUnassigned) {
        return aUnassigned ? 1 : -1;
      }
      return a.localeCompare(b);
    });

    return [
      { value: 'all', label: 'All districts' },
      ...unique.map((name) => ({ value: name, label: name })),
    ];
  }, [districts]);

  const datalistOptions = useMemo(() => {
    const unique = Array.from(new Set(districts.map((district) => district.name))).filter(
      (name) => name && name !== UNASSIGNED_LABEL
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [districts]);

  const totals = useMemo(() => {
    const totalPatients = districts.reduce(
      (sum, district) => sum + district.children + district.pregnancies,
      0
    );
    const unassignedMidwives = midwives.filter((midwife) => !normalizeRegion(midwife.region)).length;

    return {
      totalDistricts: districts.length,
      totalMidwives: midwives.length,
      totalPatients,
      unassignedMidwives,
    };
  }, [districts, midwives]);

  const filteredMidwives = useMemo(() => {
    if (selectedDistrict === 'all') {
      return midwives;
    }

    return midwives.filter((midwife) => {
      const region = normalizeRegion(midwife.region) || UNASSIGNED_LABEL;
      return region === selectedDistrict;
    });
  }, [midwives, selectedDistrict]);

  const handleRegionChange = (midwifeId: string, value: string) => {
    setDraftRegions((prev) => ({ ...prev, [midwifeId]: value }));
  };

  const handleSave = async (midwife: AdminDistrictMidwife) => {
    const draft = draftRegions[midwife.id] ?? midwife.region ?? '';
    const normalized = normalizeRegion(draft);

    setSavingId(midwife.id);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.patch<ApiResponse<AdminDistrictMidwife>>(
        `/admin/districts/midwives/${midwife.id}`,
        { region: normalized || null }
      );
      setSuccess(`Updated district assignment for ${midwife.email}.`);
      await loadDistricts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update district assignment.');
    } finally {
      setSavingId(null);
    }
  };

  if (!hasHydrated) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-pink-500 to-purple-600 flex items-center justify-center animate-pulse">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading districts</p>
            <p className="text-xs text-slate-500">Checking your access...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <AdminHeader title="Districts" subtitle="Manage midwife coverage by district" />
        <Alert variant="error" title="Restricted access" icon={ShieldCheck}>
          You need administrator privileges to manage district coverage.
        </Alert>
      </div>
    );
  }

  const isInitialLoad = isLoading && districts.length === 0 && midwives.length === 0;

  return (
    <>
      <AdminHeader
        title="Districts"
        subtitle="Manage midwife coverage and assignments"
        actions={
          <Button
            icon={RefreshCw}
            variant="secondary"
            isLoading={isLoading}
            onClick={() => setRefreshKey((prev) => prev + 1)}
          >
            Refresh
          </Button>
        }
      />

      {error && (
        <Alert variant="warning" title="District data unavailable" className="mb-6">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" title="Update saved" className="mb-6">
          {success}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30">
            <MapPin className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total districts</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {totals.totalDistricts}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total midwives</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {totals.totalMidwives}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Unassigned midwives</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {totals.unassignedMidwives}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
            <Baby className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Patients covered</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {totals.totalPatients.toLocaleString()}
            </p>
          </div>
        </Card>
      </div>

      <div className="mb-8">
        <SectionTitle title="District overview" subtitle="Coverage by district" />
        {isInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : districts.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {districts.map((district) => (
              <Card key={district.name} className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-pink-500" />
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {district.name}
                  </h4>
                  {district.name === UNASSIGNED_LABEL && (
                    <Badge variant="warning">Needs assignment</Badge>
                  )}
                </div>
                <div className="space-y-2 text-sm text-slate-500">
                  <div className="flex items-center justify-between">
                    <span>Midwives</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {district.midwives}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Children</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {district.children}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pregnancies</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {district.pregnancies}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No district data yet"
            description="Assign midwives to districts to see coverage statistics."
          />
        )}
      </div>

      <Card>
        <SectionTitle
          title="Midwife assignments"
          subtitle="Update the district assigned to each midwife"
          action={
            <select
              value={selectedDistrict}
              onChange={(event) => setSelectedDistrict(event.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white border-none outline-none cursor-pointer"
            >
              {districtOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          }
        />

        {isInitialLoad ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : filteredMidwives.length ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Midwife</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Facility</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">District</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Last Active</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredMidwives.map((midwife) => {
                  const currentRegion = normalizeRegion(midwife.region);
                  const draft = draftRegions[midwife.id] ?? midwife.region ?? '';
                  const isDirty = normalizeRegion(draft) !== currentRegion;
                  const isSaving = savingId === midwife.id;

                  return (
                    <tr
                      key={midwife.id}
                      className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {midwife.name}
                          </p>
                          <p className="text-xs text-slate-500">{midwife.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {midwife.facilityName || 'Not set'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="max-w-55">
                          <Input
                            value={draft}
                            onChange={(event) => handleRegionChange(midwife.id, event.target.value)}
                            placeholder={UNASSIGNED_LABEL}
                            list="district-options"
                          />
                        </div>
                        {!currentRegion && !draft && (
                          <p className="text-xs text-amber-500 mt-1">Unassigned</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-slate-500">
                          {formatDateTime(midwife.lastLoginAt)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={Save}
                          isLoading={isSaving}
                          disabled={!isDirty || Boolean(savingId)}
                          onClick={() => handleSave(midwife)}
                        >
                          Save
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No midwives match this filter"
            description="Try a different district selection or assign midwives to this district."
          />
        )}

        <p className="text-xs text-slate-500 mt-4">
          Clear the district field and save to mark a midwife as unassigned.
        </p>
        <datalist id="district-options">
          {datalistOptions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Card>
    </>
  );
}
