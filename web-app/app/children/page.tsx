/**
 * Children Management Page
 * 
 * Displays all registered children with growth tracking,
 * vaccination status, and development monitoring.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import {
  Baby,
  Plus,
  Search,
  Calendar,
  Syringe,
  TrendingUp,
  User,
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
  ProgressBar,
  Input,
  Select,
  Modal,
  EmptyState,
  Alert,
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
  const { children, isLoading, error, fetchChildren } = useChildStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterVaccine, setFilterVaccine] = useState('all');
  const [selectedChild, setSelectedChild] = useState<UiChild | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [childMetrics, setChildMetrics] = useState<Record<string, ChildMetrics>>({});
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    if (!isQrModalOpen) {
      setQrImageUrl(null);
      setQrError(null);
      return;
    }

    let isCancelled = false;

    const loadQrCode = async () => {
      setIsQrLoading(true);
      setQrError(null);

      try {
        const response = await apiClient.post<ApiResponse<{ qrPayload: string }>>('/midwife-links/qr', {
          profileType: 'child',
        });
        const qrPayload = response.data?.qrPayload;
        if (!qrPayload) {
          throw new Error('QR code payload unavailable');
        }

        const dataUrl = await QRCode.toDataURL(qrPayload, { width: 320, margin: 1 });
        if (!isCancelled) {
          setQrImageUrl(dataUrl);
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
            <Button icon={Plus} variant="primary">
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

      {/* Children Cards */}
      {isLoading ? (
        <Card className="p-6 text-center text-slate-500">Loading children...</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredChildren.map((child) => {
          const age = calculateAge(child.dateOfBirth);
          const hasOverdue = child.overdueVaccines > 0;

          return (
            <Card
              key={child.id}
              hover
              className={hasOverdue ? 'border-l-4 border-l-red-500' : ''}
              onClick={() => {
                setSelectedChild(child);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-start gap-4">
                <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {child.firstName} {child.lastName}
                    </h3>
                    <Badge variant={child.gender === 'male' ? 'info' : 'default'} size="sm">
                      {child.gender === 'male' ? '♂' : '♀'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mb-2">
                    {age} • {child.bloodType ?? 'unknown'}
                  </p>
                  
                  {/* Parent Info */}
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <User className="w-4 h-4" />
                    <span className="truncate">{child.parentName}</span>
                  </div>

                  {/* Vaccine Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">Vaccination</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {child.vaccineCompletion}%
                      </span>
                    </div>
                    <ProgressBar
                      value={child.vaccineCompletion}
                      color={hasOverdue ? 'bg-red-500' : 'bg-emerald-500'}
                      size="sm"
                    />
                    {hasOverdue && (
                      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {child.overdueVaccines} overdue
                      </p>
                    )}
                  </div>

                  {/* Growth Status */}
                  <div className="flex items-center justify-between">
                    {getGrowthStatusBadge(child.growthStatus)}
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Scale className="w-3 h-3" />
                        {child.currentWeight ?? '--'} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {child.currentHeight ?? '--'} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Next Appointment */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Next:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatShortDate(child.nextAppointment)}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" icon={TrendingUp}>
                    Growth
                  </Button>
                  <Button variant="ghost" size="sm" icon={Syringe}>
                    Vaccines
                  </Button>
                </div>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredChildren.length === 0 && (
        <EmptyState
          icon={Baby}
          title="No children found"
          description="Try adjusting your search or filter criteria"
          action={
            <Button icon={Plus} variant="primary">
              Register New Child
            </Button>
          }
        />
      )}

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
              <Button variant="primary" icon={TrendingUp} className="flex-1">
                Record Growth
              </Button>
              <Button variant="outline" icon={Syringe} className="flex-1">
                Vaccinations
              </Button>
              <Button variant="ghost" icon={Edit}>
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
