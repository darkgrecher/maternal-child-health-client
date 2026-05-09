/**
 * Children Management Page
 * 
 * Displays all registered children with growth tracking,
 * vaccination status, and development monitoring.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Baby,
  Plus,
  Search,
  Calendar,
  Syringe,
  TrendingUp,
  Edit,
  Scale,
  Ruler,
  Activity,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Input,
  Select,
  Modal,
  Alert,
  Table,
} from '../components/ui';
import apiClient from '../lib/api-client';
import { useChildStore } from '../lib/stores';
import type { ApiResponse, ChildProfile } from '../lib/types';
import QRCode from 'qrcode';

interface VaccineScheduleResponse {
  statistics?: {
    completionPercentage: number;
    overdue: number;
  };
  nextVaccine?: {
    scheduledDate?: string | null;
  } | null;
}

interface GrowthSummaryResponse {
  summary?: {
    latestWeight?: number | null;
    latestHeight?: number | null;
    lastMeasurementDate?: string | null;
    latestWeightPercentile?: number | null;
    latestHeightPercentile?: number | null;
  } | null;
}

interface ChildMetrics {
  vaccineCompletion: number;
  overdueVaccines: number;
  nextAppointment?: string | null;
  currentWeight?: number | null;
  currentHeight?: number | null;
  growthStatus: 'normal' | 'above_average' | 'below_average' | 'concerning' | 'unknown';
  lastCheckup?: string | null;
}

interface UiChild {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodType?: string | null;
  chdrNumber?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  emergencyContact?: string | null;
  address?: string | null;
  parentName: string;
  parentPhone: string;
  birthWeight?: number | null;
  birthHeight?: number | null;
  currentWeight?: number | null;
  currentHeight?: number | null;
  vaccineCompletion: number;
  overdueVaccines: number;
  lastCheckup?: string | null;
  nextAppointment?: string | null;
  growthStatus: 'normal' | 'above_average' | 'below_average' | 'concerning' | 'unknown';
}

const calculateAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) return 'Unknown';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return 'Unknown';
  const months = differenceInMonths(today, birthDate);
  const years = differenceInYears(today, birthDate);
  
  if (months < 12) {
    return `${months} months`;
  } else if (months < 24) {
    const remainingMonths = months % 12;
    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} mo`;
  }
  return `${years} years`;
};

const getGrowthStatusBadge = (status: string) => {
  switch (status) {
    case 'above_average':
      return <Badge variant="success">Above Average</Badge>;
    case 'below_average':
      return <Badge variant="warning">Below Average</Badge>;
    case 'concerning':
      return <Badge variant="error">Needs Attention</Badge>;
    case 'unknown':
      return <Badge variant="default">No Data</Badge>;
    default:
      return <Badge variant="info">Normal</Badge>;
  }
};

const formatShortDate = (value?: string | null) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return format(date, 'MMM d');
};

const formatLongDate = (value?: string | null) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return format(date, 'MMMM d, yyyy');
};

const deriveGrowthStatus = (weightPercentile?: number | null, heightPercentile?: number | null) => {
  const values = [weightPercentile, heightPercentile].filter(
    (value): value is number => typeof value === 'number'
  );
  if (values.length === 0) return 'unknown';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;

  if (min < 3 || max > 97) return 'concerning';
  if (average < 10) return 'below_average';
  if (average > 90) return 'above_average';
  return 'normal';
};

const isGrowthCheckDue = (lastCheckup?: string | null) => {
  if (!lastCheckup) return true;
  const lastDate = new Date(lastCheckup);
  if (Number.isNaN(lastDate.getTime())) return true;
  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > 90;
};

const getChildParentName = (child: ChildProfile) =>
  child.motherName || child.fatherName || 'Not provided';

const getChildParentPhone = (child: ChildProfile) =>
  child.emergencyContact || 'Not provided';

export default function ChildrenPage() {
  const { children, isLoading, error, fetchChildren, createChild, updateChild } = useChildStore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterVaccine, setFilterVaccine] = useState('all');
  const [selectedChild, setSelectedChild] = useState<UiChild | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChildFormOpen, setIsChildFormOpen] = useState(false);
  const [childFormMode, setChildFormMode] = useState<'create' | 'edit'>('create');
  const [childFormError, setChildFormError] = useState('');
  const [isChildSubmitting, setIsChildSubmitting] = useState(false);
  const [childFormValues, setChildFormValues] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'female',
    bloodType: 'unknown',
    chdrNumber: '',
    motherName: '',
    fatherName: '',
    emergencyContact: '',
    address: '',
    birthWeight: '',
    birthHeight: '',
  });
  const [isGrowthModalOpen, setIsGrowthModalOpen] = useState(false);
  const [growthError, setGrowthError] = useState('');
  const [isGrowthSubmitting, setIsGrowthSubmitting] = useState(false);
  const [growthFormValues, setGrowthFormValues] = useState({
    measurementDate: format(new Date(), 'yyyy-MM-dd'),
    weight: '',
    height: '',
    headCircumference: '',
    measuredBy: '',
    location: '',
    notes: '',
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [childMetrics, setChildMetrics] = useState<Record<string, ChildMetrics>>({});
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  const normalizeString = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const toNumber = (value: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const toDateInput = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const openEditChildForm = (child: UiChild) => {
    setChildFormMode('edit');
    setChildFormError('');
    setChildFormValues({
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: toDateInput(child.dateOfBirth),
      gender: child.gender,
      bloodType: child.bloodType ?? 'unknown',
      chdrNumber: child.chdrNumber ?? '',
      motherName: child.motherName ?? '',
      fatherName: child.fatherName ?? '',
      emergencyContact: child.emergencyContact ?? '',
      address: child.address ?? '',
      birthWeight: child.birthWeight?.toString() ?? '',
      birthHeight: child.birthHeight?.toString() ?? '',
    });
    setIsChildFormOpen(true);
  };

  const handleChildSubmit = async () => {
    if (!childFormValues.firstName.trim() || !childFormValues.lastName.trim() || !childFormValues.dateOfBirth) {
      setChildFormError('Please fill in all required fields.');
      return;
    }

    setChildFormError('');
    setIsChildSubmitting(true);

    const payload = {
      firstName: childFormValues.firstName.trim(),
      lastName: childFormValues.lastName.trim(),
      dateOfBirth: childFormValues.dateOfBirth,
      gender: childFormValues.gender as 'male' | 'female',
      bloodType: childFormValues.bloodType || undefined,
      chdrNumber: normalizeString(childFormValues.chdrNumber),
      motherName: normalizeString(childFormValues.motherName),
      fatherName: normalizeString(childFormValues.fatherName),
      emergencyContact: normalizeString(childFormValues.emergencyContact),
      address: normalizeString(childFormValues.address),
      birthWeight: toNumber(childFormValues.birthWeight),
      birthHeight: toNumber(childFormValues.birthHeight),
    } as Partial<ChildProfile>;

    try {
      if (childFormMode === 'create') {
        await createChild(payload);
      } else if (selectedChild) {
        await updateChild(selectedChild.id, payload);
      }
      setIsChildFormOpen(false);
      setIsModalOpen(false);
      await fetchChildren();
    } catch (err) {
      setChildFormError(err instanceof Error ? err.message : 'Unable to save child profile.');
    } finally {
      setIsChildSubmitting(false);
    }
  };

  const openGrowthModal = (child: UiChild) => {
    setSelectedChild(child);
    setGrowthError('');
    setGrowthFormValues({
      measurementDate: format(new Date(), 'yyyy-MM-dd'),
      weight: '',
      height: '',
      headCircumference: '',
      measuredBy: '',
      location: '',
      notes: '',
    });
    setIsGrowthModalOpen(true);
  };

  const handleGrowthSubmit = async () => {
    if (!selectedChild) return;
    if (!growthFormValues.measurementDate || !growthFormValues.weight || !growthFormValues.height) {
      setGrowthError('Please fill in the measurement date, weight, and height.');
      return;
    }

    setGrowthError('');
    setIsGrowthSubmitting(true);

    try {
      await apiClient.post(`/growth/child/${selectedChild.id}`, {
        measurementDate: growthFormValues.measurementDate,
        weight: Number(growthFormValues.weight),
        height: Number(growthFormValues.height),
        headCircumference: toNumber(growthFormValues.headCircumference),
        measuredBy: normalizeString(growthFormValues.measuredBy),
        location: normalizeString(growthFormValues.location),
        notes: normalizeString(growthFormValues.notes),
      });

      setIsGrowthModalOpen(false);
      await fetchChildren();
    } catch (err) {
      setGrowthError(err instanceof Error ? err.message : 'Unable to record growth measurement.');
    } finally {
      setIsGrowthSubmitting(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!isQrModalOpen) {
      setQrImageUrl(null);
      setQrError(null);
      setQrCode(null);
      return;
    }

    let isCancelled = false;

    const loadQrCode = async () => {
      setIsQrLoading(true);
      setQrError(null);

      try {
        const response = await apiClient.post<ApiResponse<{ qrPayload: string; code: string }>>('/midwife-links/qr', {
          profileType: 'child',
        });
        const qrPayload = response.data?.qrPayload;
        const code = response.data?.code ?? null;
        if (!qrPayload) {
          throw new Error('QR code payload unavailable');
        }

        const dataUrl = await QRCode.toDataURL(qrPayload, { width: 320, margin: 1 });
        if (!isCancelled) {
          setQrImageUrl(dataUrl);
          setQrCode(code);
        }
      } catch (error) {
        if (!isCancelled) {
          const message = error instanceof Error ? error.message : 'Failed to generate QR code';
          setQrError(message);
          setQrImageUrl(null);
        }
      } finally {
        if (!isCancelled) {
          setIsQrLoading(false);
        }
      }
    };

    loadQrCode();

    return () => {
      isCancelled = true;
    };
  }, [isQrModalOpen]);

  useEffect(() => {
    if (!isQrModalOpen || !qrCode) return;

    let isCancelled = false;
    const intervalId = setInterval(async () => {
      try {
        const response = await apiClient.get<ApiResponse<{ isActive: boolean; lastUsedAt?: string | null }>>(
          `/midwife-links/status/${qrCode}`
        );
        const lastUsedAt = response.data?.lastUsedAt ?? null;
        const isActive = response.data?.isActive ?? true;
        if (!isCancelled && (lastUsedAt || !isActive)) {
          setIsQrModalOpen(false);
          setQrCode(null);
          await fetchChildren();
        }
      } catch {
        // Ignore polling errors while modal is open.
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isQrModalOpen, qrCode, fetchChildren]);

  useEffect(() => {
    if (children.length === 0) {
      setChildMetrics({});
      return;
    }

    let isCancelled = false;

    const loadMetrics = async () => {
      const entries = await Promise.all(
        children.map(async (child) => {
          const metrics: ChildMetrics = {
            vaccineCompletion: 0,
            overdueVaccines: 0,
            growthStatus: 'unknown',
          };

          try {
            const vaccineResponse = await apiClient.get<ApiResponse<VaccineScheduleResponse>>(
              `/vaccines/child/${child.id}`
            );
            const vaccineData = vaccineResponse.data;
            if (vaccineData?.statistics) {
              metrics.vaccineCompletion = vaccineData.statistics.completionPercentage;
              metrics.overdueVaccines = vaccineData.statistics.overdue;
            }
            metrics.nextAppointment = vaccineData?.nextVaccine?.scheduledDate ?? null;
          } catch {
            metrics.vaccineCompletion = 0;
            metrics.overdueVaccines = 0;
          }

          try {
            const growthResponse = await apiClient.get<ApiResponse<GrowthSummaryResponse>>(
              `/growth/child/${child.id}`
            );
            const summary = growthResponse.data?.summary ?? null;
            metrics.currentWeight = summary?.latestWeight ?? null;
            metrics.currentHeight = summary?.latestHeight ?? null;
            metrics.lastCheckup = summary?.lastMeasurementDate ?? null;
            metrics.growthStatus = deriveGrowthStatus(
              summary?.latestWeightPercentile ?? null,
              summary?.latestHeightPercentile ?? null
            );
          } catch {
            metrics.growthStatus = 'unknown';
          }

          return [child.id, metrics] as const;
        })
      );

      if (!isCancelled) {
        setChildMetrics(Object.fromEntries(entries));
      }
    };

    loadMetrics();

    return () => {
      isCancelled = true;
    };
  }, [children]);

  const childCards = useMemo<UiChild[]>(
    () =>
      children.map((child) => {
        const metrics = childMetrics[child.id];

        return {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          dateOfBirth: child.dateOfBirth,
          gender: child.gender,
          bloodType: child.bloodType ?? 'unknown',
          chdrNumber: child.chdrNumber ?? null,
          motherName: child.motherName ?? null,
          fatherName: child.fatherName ?? null,
          emergencyContact: child.emergencyContact ?? null,
          address: child.address ?? null,
          parentName: getChildParentName(child),
          parentPhone: getChildParentPhone(child),
          birthWeight: child.birthWeight,
          birthHeight: child.birthHeight,
          currentWeight: metrics?.currentWeight ?? child.birthWeight ?? null,
          currentHeight: metrics?.currentHeight ?? child.birthHeight ?? null,
          vaccineCompletion: metrics?.vaccineCompletion ?? 0,
          overdueVaccines: metrics?.overdueVaccines ?? 0,
          lastCheckup: metrics?.lastCheckup ?? null,
          nextAppointment: metrics?.nextAppointment ?? null,
          growthStatus: metrics?.growthStatus ?? 'unknown',
        };
      }),
    [children, childMetrics]
  );

  const filteredChildren = childCards.filter((child) => {
    const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      child.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || child.gender === filterGender;
    const matchesVaccine = filterVaccine === 'all' ||
      (filterVaccine === 'overdue' && child.overdueVaccines > 0) ||
      (filterVaccine === 'complete' && child.vaccineCompletion === 100);
    return matchesSearch && matchesGender && matchesVaccine;
  });

  const totalChildren = childCards.length;
  const overdueVaccineCount = childCards.filter((child) => child.overdueVaccines > 0).length;
  const underOneYear = childCards.filter((child) => {
    const birthDate = new Date(child.dateOfBirth);
    if (Number.isNaN(birthDate.getTime())) return false;
    return differenceInMonths(new Date(), birthDate) < 12;
  }).length;
  const growthChecksDue = childCards.filter((child) => isGrowthCheckDue(child.lastCheckup)).length;

  const childColumns = [
    {
      key: 'child',
      header: 'Child',
      render: (child: UiChild) => (
        <div className="flex items-center gap-3 min-w-55">
          <Avatar name={`${child.firstName} ${child.lastName}`} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">
              {child.firstName} {child.lastName}
            </p>
            <p className="text-xs text-slate-500">{child.bloodType ?? 'unknown'}</p>
          </div>
          <Badge variant={child.gender === 'male' ? 'info' : 'default'} size="sm">
            {child.gender === 'male' ? 'Male' : 'Female'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      render: (child: UiChild) => calculateAge(child.dateOfBirth),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (child: UiChild) => (
        <div className="min-w-45">
          <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{child.parentName}</p>
          <p className="text-xs text-slate-500 truncate">{child.parentPhone}</p>
        </div>
      ),
    },
    {
      key: 'vaccines',
      header: 'Vaccines',
      render: (child: UiChild) => (
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{child.vaccineCompletion}%</p>
          {child.overdueVaccines > 0 ? (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {child.overdueVaccines} overdue
            </p>
          ) : (
            <p className="text-xs text-slate-500">On track</p>
          )}
        </div>
      ),
    },
    {
      key: 'growth',
      header: 'Growth',
      render: (child: UiChild) => (
        <div className="text-xs text-slate-600 dark:text-slate-300">
          {child.currentWeight ?? '--'} kg / {child.currentHeight ?? '--'} cm
        </div>
      ),
    },
    {
      key: 'next',
      header: 'Next visit',
      render: (child: UiChild) => formatShortDate(child.nextAppointment),
    },
    {
      key: 'status',
      header: 'Status',
      render: (child: UiChild) => getGrowthStatusBadge(child.growthStatus),
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Children Management"
        subtitle={`${totalChildren} children being monitored`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 text-slate-500 transition-all"
              title="Scan to add child profile"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <Button icon={Plus} variant="primary" onClick={() => setIsQrModalOpen(true)}>
              Register Child
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Baby className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalChildren}</p>
            <p className="text-sm text-slate-500">Total Children</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{underOneYear}</p>
            <p className="text-sm text-slate-500">Under 1 Year</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-red-100">
            <Syringe className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overdueVaccineCount}</p>
            <p className="text-sm text-slate-500">Overdue Vaccines</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{growthChecksDue}</p>
            <p className="text-sm text-slate-500">Growth Checks Due</p>
          </div>
        </Card>
      </div>

      {error && (
        <Alert variant="warning" title="Unable to load children" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by child or parent name..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Genders' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            value={filterGender}
            onChange={(e) => setFilterGender(e.target.value)}
            className="w-full sm:w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Vaccine Status' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'complete', label: 'Complete' },
            ]}
            value={filterVaccine}
            onChange={(e) => setFilterVaccine(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Children Table */}
      <Card className="mb-6">
        <Table
          columns={childColumns}
          data={filteredChildren}
          keyExtractor={(child) => child.id}
          onRowClick={(child) => {
            setSelectedChild(child);
            setIsModalOpen(true);
          }}
          isLoading={isLoading}
          emptyMessage="No children found"
        />
      </Card>

      {/* QR Code Video Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQrModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                  <QrCode className="w-5 h-5 text-pink-500" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scan to Add Child Profile</h2>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5">
              <div className="flex flex-col items-center gap-4">
                {isQrLoading && (
                  <div className="w-full rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center text-sm text-slate-500">
                    Generating QR code...
                  </div>
                )}
                {qrError && (
                  <Alert variant="warning" title="Unable to generate QR code" className="w-full">
                    {qrError}
                  </Alert>
                )}
                {qrImageUrl && !isQrLoading && (
                  <img
                    src={qrImageUrl}
                    alt="Midwife QR code"
                    className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                  />
                )}
              </div>
              <p className="text-center text-sm text-slate-500 mt-4">
                Scan the QR code with your mobile device to quickly add a new child profile
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Child Modal */}
      <Modal
        isOpen={isChildFormOpen}
        onClose={() => setIsChildFormOpen(false)}
        title={childFormMode === 'create' ? 'Register Child' : 'Edit Child'}
        size="lg"
      >
        <div className="space-y-4">
          {childFormError && (
            <Alert variant="warning" title="Unable to save child profile">
              {childFormError}
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              value={childFormValues.firstName}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, firstName: event.target.value }))
              }
              required
            />
            <Input
              label="Last Name"
              value={childFormValues.lastName}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, lastName: event.target.value }))
              }
              required
            />
            <Input
              label="Date of Birth"
              type="date"
              value={childFormValues.dateOfBirth}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, dateOfBirth: event.target.value }))
              }
              required
            />
            <Select
              label="Gender"
              options={[
                { value: 'female', label: 'Female' },
                { value: 'male', label: 'Male' },
              ]}
              value={childFormValues.gender}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, gender: event.target.value }))
              }
            />
            <Select
              label="Blood Type"
              options={[
                { value: 'unknown', label: 'Unknown' },
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' },
              ]}
              value={childFormValues.bloodType}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, bloodType: event.target.value }))
              }
            />
            <Input
              label="CHDR Number"
              value={childFormValues.chdrNumber}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, chdrNumber: event.target.value }))
              }
            />
            <Input
              label="Birth Weight (kg)"
              type="number"
              step="0.1"
              value={childFormValues.birthWeight}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, birthWeight: event.target.value }))
              }
            />
            <Input
              label="Birth Height (cm)"
              type="number"
              step="0.1"
              value={childFormValues.birthHeight}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, birthHeight: event.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mother Name"
              value={childFormValues.motherName}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, motherName: event.target.value }))
              }
            />
            <Input
              label="Father Name"
              value={childFormValues.fatherName}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, fatherName: event.target.value }))
              }
            />
            <Input
              label="Emergency Contact"
              value={childFormValues.emergencyContact}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, emergencyContact: event.target.value }))
              }
            />
            <Input
              label="Address"
              value={childFormValues.address}
              onChange={(event) =>
                setChildFormValues((prev) => ({ ...prev, address: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsChildFormOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isChildSubmitting} onClick={handleChildSubmit}>
              {childFormMode === 'create' ? 'Register Child' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Growth Measurement Modal */}
      <Modal
        isOpen={isGrowthModalOpen}
        onClose={() => setIsGrowthModalOpen(false)}
        title={selectedChild ? `Record Growth - ${selectedChild.firstName} ${selectedChild.lastName}` : 'Record Growth'}
        size="lg"
      >
        <div className="space-y-4">
          {growthError && (
            <Alert variant="warning" title="Unable to record growth">
              {growthError}
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Measurement Date"
              type="date"
              value={growthFormValues.measurementDate}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, measurementDate: event.target.value }))
              }
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={growthFormValues.weight}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, weight: event.target.value }))
              }
              required
            />
            <Input
              label="Height (cm)"
              type="number"
              step="0.1"
              value={growthFormValues.height}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, height: event.target.value }))
              }
              required
            />
            <Input
              label="Head Circumference (cm)"
              type="number"
              step="0.1"
              value={growthFormValues.headCircumference}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, headCircumference: event.target.value }))
              }
            />
            <Input
              label="Measured By"
              value={growthFormValues.measuredBy}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, measuredBy: event.target.value }))
              }
            />
            <Input
              label="Location"
              value={growthFormValues.location}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, location: event.target.value }))
              }
            />
            <Input
              label="Notes"
              value={growthFormValues.notes}
              onChange={(event) =>
                setGrowthFormValues((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsGrowthModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isGrowthSubmitting} onClick={handleGrowthSubmit}>
              Save Measurement
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Child Profile"
        size="lg"
      >
        {selectedChild && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={`${selectedChild.firstName} ${selectedChild.lastName}`} size="xl" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {selectedChild.firstName} {selectedChild.lastName}
                </h3>
                <p className="text-slate-500">
                  {calculateAge(selectedChild.dateOfBirth)} • {selectedChild.gender === 'male' ? 'Male' : 'Female'} • {selectedChild.bloodType ?? 'unknown'}
                </p>
                <p className="text-sm text-slate-400">
                  Born: {formatLongDate(selectedChild.dateOfBirth)}
                </p>
              </div>
            </div>

            {/* Parent Info */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <p className="text-sm text-slate-500 mb-1">Parent/Guardian</p>
              <p className="font-semibold text-slate-900 dark:text-white">{selectedChild.parentName}</p>
              <p className="text-sm text-slate-500">{selectedChild.parentPhone}</p>
            </div>

            {/* Growth Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <Scale className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Weight</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedChild.currentWeight ?? '--'} kg</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <Ruler className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Height</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedChild.currentHeight ?? '--'} cm</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <Syringe className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Vaccines</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedChild.vaccineCompletion}%</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <Activity className="w-5 h-5 text-pink-500 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Status</p>
                {getGrowthStatusBadge(selectedChild.growthStatus)}
              </div>
            </div>

            {/* Birth Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Birth Weight</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedChild.birthWeight ?? '--'} kg</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Birth Height</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedChild.birthHeight ?? '--'} cm</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                icon={TrendingUp}
                className="flex-1"
                onClick={() => {
                  if (!selectedChild) return;
                  setIsModalOpen(false);
                  openGrowthModal(selectedChild);
                }}
              >
                Record Growth
              </Button>
              <Button
                variant="outline"
                icon={Syringe}
                className="flex-1"
                onClick={() => {
                  setIsModalOpen(false);
                  router.push('/vaccinations');
                }}
              >
                Vaccinations
              </Button>
              <Button
                variant="ghost"
                icon={Edit}
                onClick={() => {
                  if (!selectedChild) return;
                  setIsModalOpen(false);
                  openEditChildForm(selectedChild);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
