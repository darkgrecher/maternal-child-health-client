/**
 * Pregnancies Management Page
 * 
 * Displays all active and past pregnancies with detailed information
 * for midwife tracking and management.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import {
  Heart,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  FileText,
  Edit,
  Baby,
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
  Table,
  Alert,
} from '../components/ui';
import { usePregnancyStore } from '../lib/stores';
import apiClient from '../lib/api-client';
import type { ApiResponse, PregnancyCheckup, PregnancyProfile } from '../lib/types';
import QRCode from 'qrcode';

interface UiPregnancy {
  id: string;
  motherName: string;
  motherFirstName?: string;
  motherLastName?: string;
  motherAge?: number;
  motherDateOfBirth?: string;
  phone: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  expectedDeliveryDate?: string;
  lastMenstrualPeriod?: string;
  conceptionDate?: string;
  currentWeek: number;
  trimester: number;
  status: 'active' | 'delivered' | 'terminated';
  isHighRisk: boolean;
  riskFactors: string[];
  gravida?: number;
  para?: number;
  bloodType?: string;
  lastCheckup?: string;
  nextAppointment?: string;
  midwife?: string;
  hospitalName?: string;
  obgynName?: string;
  obgynContact?: string;
}

const getBabyDevelopmentInfo = (week: number) => {
  if (week <= 12) return { trimester: '1st Trimester', stage: 'Embryonic Development' };
  if (week <= 27) return { trimester: '2nd Trimester', stage: 'Fetal Growth' };
  return { trimester: '3rd Trimester', stage: 'Final Development' };
};

const getWeeksRemaining = (edd?: string) => {
  if (!edd) return 0;
  const today = new Date();
  const dueDate = new Date(edd);
  if (Number.isNaN(dueDate.getTime())) return 0;
  const diffTime = dueDate.getTime() - today.getTime();
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, diffWeeks);
};

const getCurrentWeek = (edd?: string, fallbackWeek?: number) => {
  if (typeof fallbackWeek === 'number') return fallbackWeek;
  if (!edd) return 0;
  return Math.max(1, 40 - getWeeksRemaining(edd));
};

const getTrimesterNumber = (week: number) => {
  if (week <= 12) return 1;
  if (week <= 27) return 2;
  return 3;
};

const formatDate = (value?: string, pattern = 'MMM d, yyyy') => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return format(date, pattern);
};

const getAgeFromDob = (dob?: string) => {
  if (!dob) return undefined;
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return undefined;
  return differenceInYears(new Date(), date);
};

export default function PregnanciesPage() {
  const searchParams = useSearchParams();
  const { pregnancies, isLoading, error, fetchPregnancies, createPregnancy, updatePregnancy } = usePregnancyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedPregnancy, setSelectedPregnancy] = useState<UiPregnancy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isPregnancyFormOpen, setIsPregnancyFormOpen] = useState(false);
  const [pregnancyFormMode, setPregnancyFormMode] = useState<'create' | 'edit'>('create');
  const [pregnancyFormError, setPregnancyFormError] = useState('');
  const [isPregnancySubmitting, setIsPregnancySubmitting] = useState(false);
  const defaultPregnancyFormValues = {
    motherFirstName: '',
    motherLastName: '',
    motherDateOfBirth: '',
    expectedDeliveryDate: '',
    motherBloodType: 'unknown',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    gravida: '',
    para: '',
    hospitalName: '',
    obgynName: '',
    obgynContact: '',
  };
  const [pregnancyFormValues, setPregnancyFormValues] = useState(defaultPregnancyFormValues);
  const [isCheckupModalOpen, setIsCheckupModalOpen] = useState(false);
  const [checkupError, setCheckupError] = useState('');
  const [isCheckupSubmitting, setIsCheckupSubmitting] = useState(false);
  const [checkupFormValues, setCheckupFormValues] = useState({
    checkupDate: format(new Date(), 'yyyy-MM-dd'),
    weekOfPregnancy: '',
    weight: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    notes: '',
    nextCheckupDate: '',
    providerName: '',
    location: '',
  });
  const [isRecordsModalOpen, setIsRecordsModalOpen] = useState(false);
  const [checkupsLoading, setCheckupsLoading] = useState(false);
  const [checkupsError, setCheckupsError] = useState('');
  const [checkups, setCheckups] = useState<PregnancyCheckup[]>([]);

  const openCreatePregnancyForm = () => {
    setPregnancyFormMode('create');
    setPregnancyFormError('');
    setPregnancyFormValues(defaultPregnancyFormValues);
    setIsPregnancyFormOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openCreatePregnancyForm();
    }
  }, [searchParams]);

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

  const openEditPregnancyForm = (pregnancy: UiPregnancy) => {
    setPregnancyFormMode('edit');
    setPregnancyFormError('');
    setPregnancyFormValues({
      motherFirstName: pregnancy.motherFirstName ?? pregnancy.motherName.split(' ')[0] ?? '',
      motherLastName: pregnancy.motherLastName ?? pregnancy.motherName.split(' ').slice(1).join(' ') ?? '',
      motherDateOfBirth: toDateInput(pregnancy.motherDateOfBirth),
      expectedDeliveryDate: toDateInput(pregnancy.expectedDeliveryDate),
      motherBloodType: pregnancy.bloodType ?? 'unknown',
      emergencyContactName: pregnancy.emergencyContactName ?? '',
      emergencyContactPhone: pregnancy.emergencyContactPhone ?? '',
      emergencyContactRelation: pregnancy.emergencyContactRelation ?? '',
      gravida: pregnancy.gravida?.toString() ?? '',
      para: pregnancy.para?.toString() ?? '',
      hospitalName: pregnancy.hospitalName ?? '',
      obgynName: pregnancy.obgynName ?? '',
      obgynContact: pregnancy.obgynContact ?? '',
    });
    setIsPregnancyFormOpen(true);
  };

  const handlePregnancySubmit = async () => {
    if (
      !pregnancyFormValues.motherFirstName.trim() ||
      !pregnancyFormValues.motherLastName.trim() ||
      !pregnancyFormValues.motherDateOfBirth ||
      !pregnancyFormValues.expectedDeliveryDate
    ) {
      setPregnancyFormError('Please fill in all required fields.');
      return;
    }

    setPregnancyFormError('');
    setIsPregnancySubmitting(true);

    const payload = {
      motherFirstName: pregnancyFormValues.motherFirstName.trim(),
      motherLastName: pregnancyFormValues.motherLastName.trim(),
      motherDateOfBirth: pregnancyFormValues.motherDateOfBirth,
      expectedDeliveryDate: pregnancyFormValues.expectedDeliveryDate,
      motherBloodType: pregnancyFormValues.motherBloodType || undefined,
      emergencyContactName: normalizeString(pregnancyFormValues.emergencyContactName),
      emergencyContactPhone: normalizeString(pregnancyFormValues.emergencyContactPhone),
      emergencyContactRelation: normalizeString(pregnancyFormValues.emergencyContactRelation),
      gravida: toNumber(pregnancyFormValues.gravida),
      para: toNumber(pregnancyFormValues.para),
      hospitalName: normalizeString(pregnancyFormValues.hospitalName),
      obgynName: normalizeString(pregnancyFormValues.obgynName),
      obgynContact: normalizeString(pregnancyFormValues.obgynContact),
    } as Partial<PregnancyProfile>;

    try {
      if (pregnancyFormMode === 'create') {
        await createPregnancy(payload);
      } else if (selectedPregnancy) {
        await updatePregnancy(selectedPregnancy.id, payload);
      }
      setIsPregnancyFormOpen(false);
      setIsModalOpen(false);
      await fetchPregnancies();
    } catch (err) {
      setPregnancyFormError(err instanceof Error ? err.message : 'Unable to save pregnancy profile.');
    } finally {
      setIsPregnancySubmitting(false);
    }
  };

  const openCheckupModal = (pregnancy: UiPregnancy) => {
    setSelectedPregnancy(pregnancy);
    setCheckupError('');
    setCheckupFormValues({
      checkupDate: format(new Date(), 'yyyy-MM-dd'),
      weekOfPregnancy: pregnancy.currentWeek?.toString() ?? '',
      weight: '',
      bloodPressureSystolic: '',
      bloodPressureDiastolic: '',
      notes: '',
      nextCheckupDate: '',
      providerName: '',
      location: '',
    });
    setIsCheckupModalOpen(true);
  };

  const handleCheckupSubmit = async () => {
    if (!selectedPregnancy) return;
    if (!checkupFormValues.checkupDate || !checkupFormValues.weekOfPregnancy) {
      setCheckupError('Please provide the checkup date and week of pregnancy.');
      return;
    }

    setCheckupError('');
    setIsCheckupSubmitting(true);

    try {
      await apiClient.post(`/pregnancies/${selectedPregnancy.id}/checkups`, {
        checkupDate: checkupFormValues.checkupDate,
        weekOfPregnancy: Number(checkupFormValues.weekOfPregnancy),
        weight: toNumber(checkupFormValues.weight),
        bloodPressureSystolic: toNumber(checkupFormValues.bloodPressureSystolic),
        bloodPressureDiastolic: toNumber(checkupFormValues.bloodPressureDiastolic),
        notes: normalizeString(checkupFormValues.notes),
        nextCheckupDate: normalizeString(checkupFormValues.nextCheckupDate),
        providerName: normalizeString(checkupFormValues.providerName),
        location: normalizeString(checkupFormValues.location),
      });

      setIsCheckupModalOpen(false);
      await fetchPregnancies();
    } catch (err) {
      setCheckupError(err instanceof Error ? err.message : 'Unable to schedule checkup.');
    } finally {
      setIsCheckupSubmitting(false);
    }
  };

  const openRecordsModal = async (pregnancy: UiPregnancy) => {
    setSelectedPregnancy(pregnancy);
    setCheckups([]);
    setCheckupsError('');
    setCheckupsLoading(true);
    setIsRecordsModalOpen(true);

    try {
      const data = await apiClient.get<PregnancyCheckup[]>(`/pregnancies/${pregnancy.id}/checkups`);
      setCheckups(data ?? []);
    } catch (err) {
      setCheckupsError(err instanceof Error ? err.message : 'Unable to load checkups.');
    } finally {
      setCheckupsLoading(false);
    }
  };

  useEffect(() => {
    fetchPregnancies();
  }, [fetchPregnancies]);

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
          profileType: 'pregnancy',
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
          await fetchPregnancies();
        }
      } catch {
        // Ignore polling errors while modal is open.
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [isQrModalOpen, qrCode, fetchPregnancies]);

  const pregnanciesView = useMemo<UiPregnancy[]>(
    () =>
      pregnancies.map((pregnancy) => {
        const motherName = pregnancy.motherFullName || `${pregnancy.motherFirstName} ${pregnancy.motherLastName}`.trim();
        const currentWeek = getCurrentWeek(pregnancy.expectedDeliveryDate, pregnancy.currentWeek);
        const trimester = pregnancy.trimester ?? getTrimesterNumber(currentWeek || 1);
        const normalizedStatus = pregnancy.status === 'converted' ? 'delivered' : pregnancy.status;
        const latestCheckup = pregnancy.checkups?.[0];

        return {
          id: pregnancy.id,
          motherName,
          motherFirstName: pregnancy.motherFirstName,
          motherLastName: pregnancy.motherLastName,
          motherAge: getAgeFromDob(pregnancy.motherDateOfBirth),
          motherDateOfBirth: pregnancy.motherDateOfBirth,
          phone: pregnancy.emergencyContactPhone || pregnancy.obgynContact || pregnancy.midwifeContact || 'Not provided',
          emergencyContactName: pregnancy.emergencyContactName,
          emergencyContactPhone: pregnancy.emergencyContactPhone,
          emergencyContactRelation: pregnancy.emergencyContactRelation,
          expectedDeliveryDate: pregnancy.expectedDeliveryDate,
          lastMenstrualPeriod: pregnancy.lastMenstrualPeriod,
          conceptionDate: pregnancy.conceptionDate,
          currentWeek,
          trimester,
          status: normalizedStatus,
          isHighRisk: pregnancy.isHighRisk,
          riskFactors: pregnancy.riskFactors || [],
          gravida: pregnancy.gravida,
          para: pregnancy.para,
          bloodType: pregnancy.motherBloodType || 'unknown',
          lastCheckup: latestCheckup?.checkupDate,
          nextAppointment: latestCheckup?.nextCheckupDate,
          midwife: pregnancy.midwifeName || 'Assigned Midwife',
          hospitalName: pregnancy.hospitalName,
          obgynName: pregnancy.obgynName,
          obgynContact: pregnancy.obgynContact,
        };
      }),
    [pregnancies]
  );

  const filteredPregnancies = pregnanciesView.filter((pregnancy) => {
    const matchesSearch = pregnancy.motherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pregnancy.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || 
      (filterRisk === 'high' && pregnancy.isHighRisk) || 
      (filterRisk === 'normal' && !pregnancy.isHighRisk);
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const activeCount = pregnanciesView.filter((p) => p.status === 'active').length;
  const highRiskCount = pregnanciesView.filter((p) => p.isHighRisk).length;
  const thirdTrimesterCount = pregnanciesView.filter((p) => p.trimester === 3).length;
  const dueThisMonthCount = pregnanciesView.filter((p) => {
    if (!p.expectedDeliveryDate || p.status !== 'active') return false;
    const dueDate = new Date(p.expectedDeliveryDate);
    if (Number.isNaN(dueDate.getTime())) return false;
    const today = new Date();
    return dueDate.getMonth() === today.getMonth() && dueDate.getFullYear() === today.getFullYear();
  }).length;

  const pregnancyColumns = [
    {
      key: 'mother',
      header: 'Mother',
      render: (pregnancy: UiPregnancy) => (
        <div className="flex items-center gap-3 min-w-60">
          <Avatar name={pregnancy.motherName} size="sm" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{pregnancy.motherName}</p>
            <p className="text-xs text-slate-500">
              {pregnancy.motherAge ?? 'Unknown'} yrs • {pregnancy.bloodType}
            </p>
          </div>
          {pregnancy.isHighRisk && (
            <Badge variant="warning" size="sm">High Risk</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (pregnancy: UiPregnancy) => (
        <Badge
          variant={
            pregnancy.status === 'active'
              ? 'success'
              : pregnancy.status === 'delivered'
              ? 'info'
              : 'default'
          }
          size="sm"
        >
          {pregnancy.status === 'active'
            ? 'Active'
            : pregnancy.status === 'delivered'
            ? 'Delivered'
            : 'Terminated'}
        </Badge>
      ),
    },
    {
      key: 'week',
      header: 'Week',
      render: (pregnancy: UiPregnancy) => (
        <div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">Week {pregnancy.currentWeek}</p>
          <p className="text-xs text-slate-500">{getBabyDevelopmentInfo(pregnancy.currentWeek).trimester}</p>
        </div>
      ),
    },
    {
      key: 'edd',
      header: 'EDD',
      render: (pregnancy: UiPregnancy) => formatDate(pregnancy.expectedDeliveryDate),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (pregnancy: UiPregnancy) => (
        <span className="text-sm text-slate-700 dark:text-slate-300">{pregnancy.phone}</span>
      ),
    },
    {
      key: 'next',
      header: 'Next visit',
      render: (pregnancy: UiPregnancy) =>
        pregnancy.nextAppointment ? formatDate(pregnancy.nextAppointment) : 'Not scheduled',
    },
  ];

  return (
    <MainLayout>
      <Header
        title="Pregnancy Management"
        subtitle={`${activeCount} active pregnancies being monitored`}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 text-slate-500 transition-all"
              title="Scan to add pregnancy profile"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <Button icon={Plus} variant="primary" onClick={openCreatePregnancyForm}>
              Register Pregnancy
            </Button>
          </div>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
            <p className="text-sm text-slate-500">Active Pregnancies</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-amber-100">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{highRiskCount}</p>
            <p className="text-sm text-slate-500">High Risk Cases</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Baby className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{thirdTrimesterCount}</p>
            <p className="text-sm text-slate-500">3rd Trimester</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Calendar className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{dueThisMonthCount}</p>
            <p className="text-sm text-slate-500">Due This Month</p>
          </div>
        </Card>
      </div>

      {error && (
        <Alert variant="warning" title="Unable to load pregnancies" className="mb-6">
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <Input
              placeholder="Search by mother's name..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'terminated', label: 'Terminated' },
            ]}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-40"
          />
          <Select
            options={[
              { value: 'all', label: 'All Risk Levels' },
              { value: 'high', label: 'High Risk' },
              { value: 'normal', label: 'Normal' },
            ]}
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="w-full sm:w-44"
          />
        </div>
      </Card>

      {/* Pregnancy Table */}
      <Card className="mb-6">
        <Table
          columns={pregnancyColumns}
          data={filteredPregnancies}
          keyExtractor={(pregnancy) => pregnancy.id}
          onRowClick={(pregnancy) => {
            setSelectedPregnancy(pregnancy);
            setIsModalOpen(true);
          }}
          isLoading={isLoading}
          emptyMessage="No pregnancies found"
        />
      </Card>

      {/* QR Code Video Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsQrModalOpen(false)}
          />
          <div className="relative animate-slide-up shadow-2xl rounded-[3rem] overflow-hidden bg-white">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="relative w-[400px] h-[400px] sm:w-[500px] sm:h-[500px]">
              <video 
                src="/baby-qr.mp4" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />

              <div className="absolute inset-0 flex flex-col items-center justify-end pb-[8%] sm:pb-[10%]">
                {isQrLoading && (
                  <div className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-sm text-slate-500 bg-white/50 backdrop-blur-sm shadow-sm" style={{ transform: 'translateY(10%)' }}>
                    Generating...
                  </div>
                )}
                {qrError && (
                  <div className="w-[160px] px-2 text-center text-xs text-red-500 bg-white/80 p-2 rounded-xl" style={{ transform: 'translateY(10%)' }}>
                    {qrError}
                  </div>
                )}
                {qrImageUrl && !isQrLoading && (
                  <img
                    src={qrImageUrl}
                    alt="Child QR code"
                    className="w-[160px] h-[160px] sm:w-[200px] sm:h-[200px] rounded-xl bg-white p-2 shadow-sm"
                    style={{ transform: 'translateY(10%)' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Pregnancy Modal */}
      <Modal
        isOpen={isPregnancyFormOpen}
        onClose={() => setIsPregnancyFormOpen(false)}
        title={pregnancyFormMode === 'create' ? 'Register Pregnancy' : 'Edit Pregnancy'}
        size="lg"
      >
        <div className="space-y-4">
          {pregnancyFormError && (
            <Alert variant="warning" title="Unable to save pregnancy profile">
              {pregnancyFormError}
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mother First Name"
              value={pregnancyFormValues.motherFirstName}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, motherFirstName: event.target.value }))
              }
              required
            />
            <Input
              label="Mother Last Name"
              value={pregnancyFormValues.motherLastName}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, motherLastName: event.target.value }))
              }
              required
            />
            <Input
              label="Mother Date of Birth"
              type="date"
              value={pregnancyFormValues.motherDateOfBirth}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, motherDateOfBirth: event.target.value }))
              }
              required
            />
            <Input
              label="Expected Delivery Date"
              type="date"
              value={pregnancyFormValues.expectedDeliveryDate}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, expectedDeliveryDate: event.target.value }))
              }
              required
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
              value={pregnancyFormValues.motherBloodType}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, motherBloodType: event.target.value }))
              }
            />
            <Input
              label="Gravida"
              type="number"
              value={pregnancyFormValues.gravida}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, gravida: event.target.value }))
              }
            />
            <Input
              label="Para"
              type="number"
              value={pregnancyFormValues.para}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, para: event.target.value }))
              }
            />
            <Input
              label="Hospital Name"
              value={pregnancyFormValues.hospitalName}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, hospitalName: event.target.value }))
              }
            />
            <Input
              label="OB/GYN Name"
              value={pregnancyFormValues.obgynName}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, obgynName: event.target.value }))
              }
            />
            <Input
              label="OB/GYN Contact"
              value={pregnancyFormValues.obgynContact}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, obgynContact: event.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Emergency Contact Name"
              value={pregnancyFormValues.emergencyContactName}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, emergencyContactName: event.target.value }))
              }
            />
            <Input
              label="Emergency Contact Phone"
              value={pregnancyFormValues.emergencyContactPhone}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, emergencyContactPhone: event.target.value }))
              }
            />
            <Input
              label="Emergency Contact Relation"
              value={pregnancyFormValues.emergencyContactRelation}
              onChange={(event) =>
                setPregnancyFormValues((prev) => ({ ...prev, emergencyContactRelation: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsPregnancyFormOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isPregnancySubmitting} onClick={handlePregnancySubmit}>
              {pregnancyFormMode === 'create' ? 'Register Pregnancy' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Schedule Checkup Modal */}
      <Modal
        isOpen={isCheckupModalOpen}
        onClose={() => setIsCheckupModalOpen(false)}
        title={selectedPregnancy ? `Schedule Checkup - ${selectedPregnancy.motherName}` : 'Schedule Checkup'}
        size="lg"
      >
        <div className="space-y-4">
          {checkupError && (
            <Alert variant="warning" title="Unable to schedule checkup">
              {checkupError}
            </Alert>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Checkup Date"
              type="date"
              value={checkupFormValues.checkupDate}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, checkupDate: event.target.value }))
              }
              required
            />
            <Input
              label="Week of Pregnancy"
              type="number"
              value={checkupFormValues.weekOfPregnancy}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, weekOfPregnancy: event.target.value }))
              }
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={checkupFormValues.weight}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, weight: event.target.value }))
              }
            />
            <Input
              label="BP Systolic"
              type="number"
              value={checkupFormValues.bloodPressureSystolic}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, bloodPressureSystolic: event.target.value }))
              }
            />
            <Input
              label="BP Diastolic"
              type="number"
              value={checkupFormValues.bloodPressureDiastolic}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, bloodPressureDiastolic: event.target.value }))
              }
            />
            <Input
              label="Next Checkup Date"
              type="date"
              value={checkupFormValues.nextCheckupDate}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, nextCheckupDate: event.target.value }))
              }
            />
            <Input
              label="Provider Name"
              value={checkupFormValues.providerName}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, providerName: event.target.value }))
              }
            />
            <Input
              label="Location"
              value={checkupFormValues.location}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, location: event.target.value }))
              }
            />
            <Input
              label="Notes"
              value={checkupFormValues.notes}
              onChange={(event) =>
                setCheckupFormValues((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCheckupModalOpen(false)}>
              Cancel
            </Button>
            <Button isLoading={isCheckupSubmitting} onClick={handleCheckupSubmit}>
              Save Checkup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Checkup Records Modal */}
      <Modal
        isOpen={isRecordsModalOpen}
        onClose={() => setIsRecordsModalOpen(false)}
        title={selectedPregnancy ? `Checkups - ${selectedPregnancy.motherName}` : 'Checkups'}
        size="lg"
      >
        <div className="space-y-4">
          {checkupsError && (
            <Alert variant="warning" title="Unable to load checkups">
              {checkupsError}
            </Alert>
          )}
          <Table
            columns={[
              {
                key: 'date',
                header: 'Date',
                render: (item: PregnancyCheckup) => formatDate(item.checkupDate, 'MMM d, yyyy'),
              },
              {
                key: 'week',
                header: 'Week',
                render: (item: PregnancyCheckup) => item.weekOfPregnancy ?? '--',
              },
              {
                key: 'weight',
                header: 'Weight',
                render: (item: PregnancyCheckup) => (item.weight ? `${item.weight} kg` : '--'),
              },
              {
                key: 'bp',
                header: 'BP',
                render: (item: PregnancyCheckup) => item.bloodPressure ?? '--',
              },
              {
                key: 'notes',
                header: 'Notes',
                render: (item: PregnancyCheckup) => item.notes || '--',
              },
            ]}
            data={checkups}
            keyExtractor={(item) => item.id}
            isLoading={checkupsLoading}
            emptyMessage="No checkups recorded"
          />
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Pregnancy Details"
        size="lg"
      >
        {selectedPregnancy && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar name={selectedPregnancy.motherName} size="xl" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {selectedPregnancy.motherName}
                </h3>
                <p className="text-slate-500">
                  {selectedPregnancy.motherAge ?? 'Unknown'} years old • Blood Type: {selectedPregnancy.bloodType}
                </p>
                {selectedPregnancy.isHighRisk && (
                  <Badge variant="warning" className="mt-2">High Risk Pregnancy</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Current Week</p>
                <p className="text-2xl font-bold text-pink-500">Week {selectedPregnancy.currentWeek}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Expected Delivery</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {formatDate(selectedPregnancy.expectedDeliveryDate, 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Gravida / Para</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  G{selectedPregnancy.gravida ?? '-'} P{selectedPregnancy.para ?? '-'}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Contact</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedPregnancy.phone}
                </p>
              </div>
            </div>

            {selectedPregnancy.riskFactors.length > 0 && (
              <Alert variant="warning" title="Risk Factors">
                <ul className="list-disc list-inside">
                  {selectedPregnancy.riskFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                icon={Calendar}
                className="flex-1"
                onClick={() => {
                  if (!selectedPregnancy) return;
                  setIsModalOpen(false);
                  openCheckupModal(selectedPregnancy);
                }}
              >
                Schedule Checkup
              </Button>
              <Button
                variant="outline"
                icon={FileText}
                className="flex-1"
                onClick={() => {
                  if (!selectedPregnancy) return;
                  setIsModalOpen(false);
                  openRecordsModal(selectedPregnancy);
                }}
              >
                View Records
              </Button>
              <Button
                variant="ghost"
                icon={Edit}
                onClick={() => {
                  if (!selectedPregnancy) return;
                  setIsModalOpen(false);
                  openEditPregnancyForm(selectedPregnancy);
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
