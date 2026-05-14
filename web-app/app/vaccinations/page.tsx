/**
 * Vaccinations Management Page
 * 
 * Displays vaccination schedules, records, and overdue vaccinations
 * following the Sri Lanka National Immunization Schedule.
 */

'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { differenceInDays, format, isSameMonth } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import {
  Syringe,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Check,
  X,
  AlertCircle,
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
  Table,
  Modal,
  EmptyState,
  Alert,
} from '../components/ui';
import apiClient from '../lib/api-client';
import { useChildStore } from '../lib/stores';
import type { ApiResponse, ChildProfile, VaccinationRecord, VaccineInfo } from '../lib/types';

interface VaccinationScheduleResponse {
  child?: Pick<ChildProfile, 'id' | 'firstName' | 'lastName' | 'dateOfBirth'>;
  schedule: VaccinationRecord[];
  statistics?: {
    completed: number;
    total: number;
    overdue: number;
    pending: number;
    completionPercentage: number;
  };
  nextVaccine?: VaccinationRecord | null;
}

interface UiVaccinationRecord {
  id?: string | null;
  childId: string;
  childName: string;
  childAge: string;
  parentName: string;
  parentPhone: string;
  vaccineId: string;
  vaccine: string;
  shortName: string;
  scheduledDate: string;
  status: 'overdue' | 'scheduled' | 'completed' | 'missed';
  daysOverdue: number;
  administeredDate?: string | null;
  administeredBy?: string | null;
  location?: string | null;
  batchNumber?: string | null;
  notes?: string | null;
}

interface ChildVaccinationSummary {
  childId: string;
  childName: string;
  childAge: string;
  parentName: string;
  parentPhone: string;
  completionPercentage: number;
  overdueCount: number;
  nextVaccineName: string | null;
  nextVaccineDate: string | null;
  nextVaccineStatus: 'overdue' | 'scheduled' | 'completed' | 'missed' | null;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'overdue':
      return <Badge variant="error">Overdue</Badge>;
    case 'scheduled':
    case 'pending':
      return <Badge variant="info">Scheduled</Badge>;
    case 'missed':
      return <Badge variant="error">Missed</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

const calculateAge = (dateOfBirth?: string) => {
  if (!dateOfBirth) return 'Unknown';
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return 'Unknown';
  const months = Math.floor(differenceInDays(today, birthDate) / 30.44);
  if (months < 12) return `${Math.max(0, months)} months`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 ? `${years} years ${remainingMonths} mo` : `${years} years`;
};

const getParentName = (child: ChildProfile) =>
  child.motherName || child.fatherName || 'Not provided';

const getParentPhone = (child: ChildProfile) =>
  child.emergencyContact || 'Not provided';

const getAgeLabel = (vaccine: VaccineInfo) => {
  if (vaccine.scheduledAgeMonths === 0 && (!vaccine.scheduledAgeDays || vaccine.scheduledAgeDays === 0)) {
    return 'At Birth';
  }
  if (vaccine.scheduledAgeDays) {
    return `${vaccine.scheduledAgeMonths} months ${vaccine.scheduledAgeDays} days`;
  }
  return `${vaccine.scheduledAgeMonths} months`;
};

const getRecordKey = (record: UiVaccinationRecord) =>
  record.id ?? `${record.childId}-${record.vaccineId}-${record.scheduledDate}`;

export default function VaccinationsPage() {
  const searchParams = useSearchParams();
  const { children, isLoading: childrenLoading, error: childrenError, fetchChildren } = useChildStore();
  const [childSearchTerm, setChildSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<UiVaccinationRecord | null>(null);
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualChildId, setManualChildId] = useState('');
  const [manualVaccineId, setManualVaccineId] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'schedule'>('records');
  const [childSummaries, setChildSummaries] = useState<ChildVaccinationSummary[]>([]);
  const [overdueRecords, setOverdueRecords] = useState<UiVaccinationRecord[]>([]);
  const [upcomingRecords, setUpcomingRecords] = useState<UiVaccinationRecord[]>([]);
  const [overdueTotal, setOverdueTotal] = useState(0);
  const [upcomingTotal, setUpcomingTotal] = useState(0);
  const [completedThisMonthTotal, setCompletedThisMonthTotal] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isChildDetailOpen, setIsChildDetailOpen] = useState(false);
  const [childDetailSummary, setChildDetailSummary] = useState<ChildVaccinationSummary | null>(null);
  const [childDetailRecords, setChildDetailRecords] = useState<UiVaccinationRecord[]>([]);
  const [childDetailLoading, setChildDetailLoading] = useState(false);
  const [childDetailError, setChildDetailError] = useState('');
  const [editingRecord, setEditingRecord] = useState<UiVaccinationRecord | null>(null);
  const [editStatus, setEditStatus] = useState<UiVaccinationRecord['status']>('scheduled');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editAdministeredDate, setEditAdministeredDate] = useState('');
  const [editAdministeredBy, setEditAdministeredBy] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBatchNumber, setEditBatchNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [vaccineCatalog, setVaccineCatalog] = useState<VaccineInfo[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState('');
  const [administeredBy, setAdministeredBy] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [administrationDate, setAdministrationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [adminNotes, setAdminNotes] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (searchParams.get('record') === '1') {
      setIsManualModalOpen(true);
    }
  }, [searchParams]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const digits = phone.replace(/\D+/g, '');
    if (!digits) return;
    window.open(`tel:${digits}`, '_self');
  };

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    let isCancelled = false;

    const loadCatalog = async () => {
      try {
        const response = await apiClient.get<ApiResponse<VaccineInfo[]>>('/vaccines');
        if (!isCancelled) {
          setVaccineCatalog(response.data ?? []);
        }
      } catch {
        if (!isCancelled) {
          setVaccineCatalog([]);
        }
      }
    };

    loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (children.length === 0) {
      setChildSummaries([]);
      setOverdueRecords([]);
      setUpcomingRecords([]);
      setOverdueTotal(0);
      setUpcomingTotal(0);
      setCompletedThisMonthTotal(0);
      setRecordsLoading(false);
      setRecordsError('');
      return;
    }

    let isCancelled = false;

    const loadSummaries = async () => {
      setRecordsLoading(true);
      setRecordsError('');

      try {
        const responses = await Promise.all(
          children.map(async (child) => {
            const response = await apiClient.get<ApiResponse<VaccinationScheduleResponse>>(
              `/vaccines/child/${child.id}`
            );
            return { child, data: response.data };
          })
        );

        if (isCancelled) return;

        const today = new Date();
        const upcomingWindowDays = 30;
        const allOverdue: UiVaccinationRecord[] = [];
        const allUpcoming: UiVaccinationRecord[] = [];
        let completedThisMonth = 0;

        const summaries: ChildVaccinationSummary[] = responses.map(({ child, data }) => {
          const schedule = data?.schedule ?? [];
          const stats = data?.statistics;
          const nextVaccine = data?.nextVaccine ?? null;

          schedule.forEach((record) => {
            const scheduledDate = new Date(record.scheduledDate);
            const normalizedStatus = record.status === 'pending'
              ? (scheduledDate < today ? 'overdue' : 'scheduled')
              : record.status;
            const isOverdue = normalizedStatus === 'overdue' || normalizedStatus === 'missed';
            const daysOverdue = isOverdue
              ? Math.max(0, differenceInDays(today, scheduledDate))
              : 0;

            const uiRecord: UiVaccinationRecord = {
              id: record.id,
              childId: child.id,
              childName: `${child.firstName} ${child.lastName}`.trim(),
              childAge: calculateAge(child.dateOfBirth),
              parentName: getParentName(child),
              parentPhone: getParentPhone(child),
              vaccineId: record.vaccineId,
              vaccine: record.vaccine?.name || 'Unknown Vaccine',
              shortName: record.vaccine?.shortName || 'N/A',
              scheduledDate: record.scheduledDate,
              status: normalizedStatus === 'completed' ? 'completed' : normalizedStatus,
              daysOverdue,
              administeredDate: record.administeredDate ?? null,
              administeredBy: record.administeredBy ?? null,
            };

            if (uiRecord.status === 'overdue' || uiRecord.status === 'missed') {
              allOverdue.push(uiRecord);
            }

            const daysUntil = differenceInDays(scheduledDate, today);
            if (uiRecord.status === 'scheduled' && daysUntil >= 0 && daysUntil <= upcomingWindowDays) {
              allUpcoming.push(uiRecord);
            }

            if (uiRecord.status === 'completed') {
              const completedDate = new Date(uiRecord.administeredDate || uiRecord.scheduledDate);
              if (isSameMonth(completedDate, today)) {
                completedThisMonth += 1;
              }
            }
          });

          const nextVaccineName = nextVaccine?.vaccine?.name ?? null;
          const nextVaccineDate = nextVaccine?.scheduledDate ?? null;
          const nextVaccineStatus = nextVaccine?.status
            ? (nextVaccine.status === 'pending'
              ? (nextVaccine.scheduledDate && new Date(nextVaccine.scheduledDate) < today ? 'overdue' : 'scheduled')
              : nextVaccine.status)
            : null;

          return {
            childId: child.id,
            childName: `${child.firstName} ${child.lastName}`.trim(),
            childAge: calculateAge(child.dateOfBirth),
            parentName: getParentName(child),
            parentPhone: getParentPhone(child),
            completionPercentage: stats?.completionPercentage ?? 0,
            overdueCount: stats?.overdue ?? 0,
            nextVaccineName,
            nextVaccineDate,
            nextVaccineStatus: nextVaccineStatus === 'missed' || nextVaccineStatus === 'overdue'
              ? 'overdue'
              : nextVaccineStatus,
          } as ChildVaccinationSummary;
        });

        allOverdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
        allUpcoming.sort((a, b) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );

        setChildSummaries(summaries);
        setOverdueTotal(allOverdue.length);
        setUpcomingTotal(allUpcoming.length);
        setCompletedThisMonthTotal(completedThisMonth);
        setOverdueRecords(allOverdue.slice(0, 8));
        setUpcomingRecords(allUpcoming.slice(0, 8));
      } catch (error) {
        if (!isCancelled) {
          setRecordsError((error as Error).message || 'Failed to load vaccination overview');
          setChildSummaries([]);
          setOverdueRecords([]);
          setUpcomingRecords([]);
          setOverdueTotal(0);
          setUpcomingTotal(0);
          setCompletedThisMonthTotal(0);
        }
      } finally {
        if (!isCancelled) {
          setRecordsLoading(false);
        }
      }
    };

    loadSummaries();

    return () => {
      isCancelled = true;
    };
  }, [children, refreshKey]);

  useEffect(() => {
    if (!selectedRecord) return;
    setAdministeredBy('');
    setBatchNumber('');
    setAdministrationDate(format(new Date(), 'yyyy-MM-dd'));
    setAdminNotes('');
    setAdminError('');
  }, [selectedRecord]);

  useEffect(() => {
    if (!editingRecord) return;
    setEditError('');
    setEditSubmitting(false);
    setEditStatus(editingRecord.status);
    setEditScheduledDate(editingRecord.scheduledDate
      ? format(new Date(editingRecord.scheduledDate), 'yyyy-MM-dd')
      : '');
    setEditAdministeredDate(editingRecord.administeredDate
      ? format(new Date(editingRecord.administeredDate), 'yyyy-MM-dd')
      : '');
    setEditAdministeredBy(editingRecord.administeredBy ?? '');
    setEditLocation(editingRecord.location ?? '');
    setEditBatchNumber(editingRecord.batchNumber ?? '');
    setEditNotes(editingRecord.notes ?? '');
  }, [editingRecord]);

  useEffect(() => {
    if (!isManualModalOpen) return;
    setManualError('');
    setAdministeredBy('');
    setBatchNumber('');
    setAdministrationDate(format(new Date(), 'yyyy-MM-dd'));
    setAdminNotes('');
    if (!manualChildId) {
      if (children.length > 0) {
        setManualChildId(children[0].id);
      }
    }
    if (!manualVaccineId && vaccineCatalog.length > 0) {
      setManualVaccineId(vaccineCatalog[0].id);
    }
  }, [isManualModalOpen, children, vaccineCatalog, manualChildId, manualVaccineId]);

  const loadChildDetails = useCallback(async (childId: string) => {
    setChildDetailLoading(true);
    setChildDetailError('');

    try {
      const response = await apiClient.get<ApiResponse<VaccinationScheduleResponse>>(
        `/vaccines/child/${childId}`
      );

      const childFromStore = children.find((child) => child.id === childId);
      const childName = childFromStore
        ? `${childFromStore.firstName} ${childFromStore.lastName}`.trim()
        : `${response.data?.child?.firstName ?? ''} ${response.data?.child?.lastName ?? ''}`.trim() || 'Unknown';
      const childAge = childFromStore
        ? calculateAge(childFromStore.dateOfBirth)
        : response.data?.child?.dateOfBirth
          ? calculateAge(response.data.child.dateOfBirth)
          : 'Unknown';
      const parentName = childFromStore ? getParentName(childFromStore) : 'Not provided';
      const parentPhone = childFromStore ? getParentPhone(childFromStore) : 'Not provided';

      const today = new Date();
      const schedule = response.data?.schedule ?? [];
      const mapped = schedule.map((record) => {
        const scheduledDate = new Date(record.scheduledDate);
        const normalizedStatus = record.status === 'pending'
          ? (scheduledDate < today ? 'overdue' : 'scheduled')
          : record.status;
        const isOverdue = normalizedStatus === 'overdue' || normalizedStatus === 'missed';
        const daysOverdue = isOverdue
          ? Math.max(0, differenceInDays(today, scheduledDate))
          : 0;

        return {
          id: record.id,
          childId,
          childName,
          childAge,
          parentName,
          parentPhone,
          vaccineId: record.vaccineId,
          vaccine: record.vaccine?.name || 'Unknown Vaccine',
          shortName: record.vaccine?.shortName || 'N/A',
          scheduledDate: record.scheduledDate,
          status: normalizedStatus === 'completed' ? 'completed' : normalizedStatus,
          daysOverdue,
          administeredDate: record.administeredDate ?? null,
          administeredBy: record.administeredBy ?? null,
          location: record.location ?? null,
          batchNumber: record.batchNumber ?? null,
          notes: record.notes ?? null,
        } as UiVaccinationRecord;
      });

      setChildDetailRecords(mapped);
    } catch (error) {
      setChildDetailError((error as Error).message || 'Failed to load child vaccination records');
      setChildDetailRecords([]);
    } finally {
      setChildDetailLoading(false);
    }
  }, [children]);

  const handleOpenChildDetail = useCallback((child: ChildVaccinationSummary) => {
    setChildDetailSummary(child);
    setIsChildDetailOpen(true);
    loadChildDetails(child.childId);
  }, [loadChildDetails]);

  const handleAdminister = async () => {
    if (!selectedRecord) return;

    setAdminError('');

    try {
      await apiClient.post<ApiResponse<VaccinationRecord>>(
        `/vaccines/child/${selectedRecord.childId}/administer/${selectedRecord.vaccineId}`,
        {
          administeredBy: administeredBy || undefined,
          batchNumber: batchNumber || undefined,
          administeredDate: administrationDate || undefined,
          notes: adminNotes || undefined,
          status: 'completed',
        }
      );

      setIsAdministerModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      if (childDetailSummary && selectedRecord.childId === childDetailSummary.childId) {
        await loadChildDetails(childDetailSummary.childId);
      }
    } catch (error) {
      setAdminError((error as Error).message || 'Failed to record vaccination');
    }
  };

  const handleManualAdminister = async () => {
    if (!manualChildId || !manualVaccineId) {
      setManualError('Please select a child and a vaccine.');
      return;
    }

    setManualError('');
    setManualSubmitting(true);

    try {
      await apiClient.post<ApiResponse<VaccinationRecord>>(
        `/vaccines/child/${manualChildId}/administer/${manualVaccineId}`,
        {
          administeredBy: administeredBy || undefined,
          batchNumber: batchNumber || undefined,
          administeredDate: administrationDate || undefined,
          notes: adminNotes || undefined,
          status: 'completed',
        }
      );

      setIsManualModalOpen(false);
      setRefreshKey((prev) => prev + 1);
      if (childDetailSummary && manualChildId === childDetailSummary.childId) {
        await loadChildDetails(childDetailSummary.childId);
      }
    } catch (error) {
      setManualError((error as Error).message || 'Failed to record vaccination');
    } finally {
      setManualSubmitting(false);
    }
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord?.id) {
      setEditError('This record cannot be edited until it has been recorded.');
      return;
    }

    setEditSubmitting(true);
    setEditError('');

    try {
      await apiClient.patch<ApiResponse<VaccinationRecord>>(
        `/vaccines/records/${editingRecord.id}`,
        {
          status: editStatus,
          scheduledDate: editScheduledDate || undefined,
          administeredDate: editAdministeredDate || undefined,
          administeredBy: editAdministeredBy || undefined,
          location: editLocation || undefined,
          batchNumber: editBatchNumber || undefined,
          notes: editNotes || undefined,
        }
      );

      setEditingRecord(null);
      setRefreshKey((prev) => prev + 1);
      if (childDetailSummary) {
        await loadChildDetails(childDetailSummary.childId);
      }
    } catch (error) {
      setEditError((error as Error).message || 'Failed to update vaccination record');
    } finally {
      setEditSubmitting(false);
    }
  };

  const filteredChildren = useMemo(() => {
    const term = childSearchTerm.trim().toLowerCase();
    if (!term) return childSummaries;
    return childSummaries.filter((child) => {
      const name = child.childName.toLowerCase();
      const parentName = child.parentName.toLowerCase();
      return name.includes(term) || parentName.includes(term);
    });
  }, [childSummaries, childSearchTerm]);

  const overdueCount = overdueTotal;
  const scheduledCount = upcomingTotal;
  const completedThisMonthCount = completedThisMonthTotal;

  const sortedCatalog = useMemo(
    () =>
      [...vaccineCatalog].sort((a, b) => {
        const ageDiff = a.scheduledAgeMonths - b.scheduledAgeMonths;
        if (ageDiff !== 0) return ageDiff;
        const dayDiff = (a.scheduledAgeDays ?? 0) - (b.scheduledAgeDays ?? 0);
        if (dayDiff !== 0) return dayDiff;
        return a.doseNumber - b.doseNumber;
      }),
    [vaccineCatalog]
  );

  const isLoading = childrenLoading || recordsLoading;
  const errorMessage = recordsError || childrenError || '';

  const childColumns = useMemo(
    () => [
      {
        key: 'child',
        header: 'Child',
        render: (child: ChildVaccinationSummary) => (
          <div className="flex items-center gap-3 min-w-55">
            <Avatar name={child.childName} size="sm" />
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {child.childName}
              </p>
              <p className="text-xs text-slate-500">{child.childAge}</p>
            </div>
          </div>
        ),
      },
      {
        key: 'next',
        header: 'Next vaccine',
        render: (child: ChildVaccinationSummary) => (
          <div className="min-w-45">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                {child.nextVaccineName ?? 'All done'}
              </p>
              {child.nextVaccineStatus
                ? getStatusBadge(child.nextVaccineStatus)
                : <Badge variant="success">Complete</Badge>}
            </div>
            <p className="text-xs text-slate-500 truncate">
              {child.nextVaccineDate
                ? format(new Date(child.nextVaccineDate), 'MMM d, yyyy')
                : '—'}
            </p>
          </div>
        ),
      },
      {
        key: 'overdue',
        header: 'Overdue',
        render: (child: ChildVaccinationSummary) => (
          <div className="text-sm">
            {child.overdueCount > 0 ? (
              <Badge variant="error" size="sm">{child.overdueCount} overdue</Badge>
            ) : (
              <Badge variant="success" size="sm">On track</Badge>
            )}
          </div>
        ),
      },
      {
        key: 'completion',
        header: 'Completion',
        className: 'text-right',
        render: (child: ChildVaccinationSummary) => (
          <Badge variant={child.completionPercentage === 100 ? 'success' : 'info'} size="sm">
            {child.completionPercentage}%
          </Badge>
        ),
      },
    ],
    []
  );

  const childDetailColumns = useMemo(
    () => [
      {
        key: 'vaccine',
        header: 'Vaccine',
        render: (record: UiVaccinationRecord) => (
          <div className="min-w-45">
            <p className="font-semibold text-slate-900 dark:text-white">{record.vaccine}</p>
            <p className="text-xs text-slate-500">{record.shortName}</p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (record: UiVaccinationRecord) => getStatusBadge(record.status),
      },
      {
        key: 'due',
        header: 'Due',
        render: (record: UiVaccinationRecord) => (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            <p>{format(new Date(record.scheduledDate), 'MMM d, yyyy')}</p>
            {record.status === 'overdue' && (
              <p className="text-red-500">{record.daysOverdue} days overdue</p>
            )}
          </div>
        ),
      },
      {
        key: 'administered',
        header: 'Administered',
        render: (record: UiVaccinationRecord) => (
          <div className="text-xs text-slate-600 dark:text-slate-300">
            {record.administeredDate ? (
              <>
                <p>{format(new Date(record.administeredDate), 'MMM d, yyyy')}</p>
                {record.administeredBy && (
                  <p className="text-slate-500">by {record.administeredBy}</p>
                )}
              </>
            ) : (
              <p className="text-slate-400">—</p>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        className: 'text-right',
        render: (record: UiVaccinationRecord) => (
          <div className="flex items-center justify-end gap-2">
            {record.id ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingRecord(record)}
              >
                Edit
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedRecord(record);
                  setIsAdministerModalOpen(true);
                }}
              >
                Record
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <MainLayout>
      <Header
        title="Vaccination Management"
        subtitle="Sri Lanka National Immunization Schedule"
        actions={
          <Button icon={Plus} variant="primary" onClick={() => setIsManualModalOpen(true)}>
            Record Vaccination
          </Button>
        }
      />

      {/* Alert for Overdue */}
      {overdueCount > 0 && (
        <Alert variant="error" title="Overdue Vaccinations" icon={AlertTriangle}>
          <span>
            There are <strong>{overdueCount} overdue vaccinations</strong> across your roster.
            Prioritize follow-up with the most overdue children.
          </span>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="warning" title="Unable to load vaccinations" className="mt-4">
          {errorMessage}
        </Alert>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 my-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Syringe className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{children.length}</p>
            <p className="text-sm text-slate-500">Children</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-red-100">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{overdueCount}</p>
            <p className="text-sm text-slate-500">Overdue</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Clock className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{scheduledCount}</p>
            <p className="text-sm text-slate-500">Next 30 Days</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedThisMonthCount}</p>
            <p className="text-sm text-slate-500">Completed This Month</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'records' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('records')}
        >
          Vaccination Overview
        </Button>
        <Button
          variant={activeTab === 'schedule' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('schedule')}
        >
          Immunization Schedule
        </Button>
      </div>

      {activeTab === 'records' ? (
        <>
          <Card className="mb-6">
            <SectionTitle
              title="Vaccination Overview"
              subtitle="Track next doses and overdue children at a glance"
            />
            <div className="mt-4">
              <Input
                placeholder="Search children by name or parent..."
                icon={Search}
                value={childSearchTerm}
                onChange={(e) => setChildSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-4">
              <Table
                columns={childColumns}
                data={filteredChildren}
                keyExtractor={(child) => child.childId}
                onRowClick={handleOpenChildDetail}
                isLoading={isLoading}
                emptyMessage="No children found"
              />
            </div>
          </Card>

          {isLoading ? (
            <Card className="p-6 text-center text-slate-500">Loading vaccination overview...</Card>
          ) : (
            <div className="space-y-6">
              {overdueTotal > 0 ? (
                <div>
                  <SectionTitle
                    title="Overdue Vaccinations"
                    subtitle={`${overdueTotal} overdue across your roster`}
                  />
                  <div className="space-y-3">
                    {overdueRecords.map((record) => (
                      <Card
                        key={getRecordKey(record)}
                        className="border-l-4 border-l-red-500"
                        hover
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-red-100">
                            <Syringe className="w-6 h-6 text-red-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {record.childName}
                              </h3>
                              {getStatusBadge(record.status)}
                            </div>
                            <p className="text-sm text-slate-500">
                              {record.vaccine} • {record.childAge}
                            </p>
                            <p className="text-xs text-red-500 mt-1">
                              {record.daysOverdue} days overdue (Due: {format(new Date(record.scheduledDate), 'MMM d, yyyy')})
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-sm text-slate-500">{record.parentName}</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{record.parentPhone}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={Phone}
                              className="border-red-300 text-red-600"
                              onClick={() => handleCall(record.parentPhone)}
                            >
                              Call
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Syringe}
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsAdministerModalOpen(true);
                              }}
                            >
                              Administer
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {overdueTotal > overdueRecords.length && (
                    <p className="text-xs text-slate-500 mt-2">
                      Showing top {overdueRecords.length} most overdue vaccinations.
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Syringe}
                  title="No overdue vaccinations"
                  description="All tracked children are up to date."
                />
              )}

              {upcomingTotal > 0 ? (
                <div>
                  <SectionTitle
                    title="Due in the Next 30 Days"
                    subtitle={`${upcomingTotal} upcoming vaccinations`}
                  />
                  <div className="space-y-3">
                    {upcomingRecords.map((record) => (
                      <Card key={getRecordKey(record)} hover>
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-100">
                            <Clock className="w-6 h-6 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-slate-900 dark:text-white">
                                {record.childName}
                              </h3>
                              {getStatusBadge(record.status)}
                            </div>
                            <p className="text-sm text-slate-500">
                              {record.vaccine} • {record.childAge}
                            </p>
                            <p className="text-xs text-blue-500 mt-1">
                              Due: {format(new Date(record.scheduledDate), 'MMMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right mr-4">
                              <p className="text-sm text-slate-500">{record.parentName}</p>
                              <p className="text-sm text-slate-700 dark:text-slate-300">{record.parentPhone}</p>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={Syringe}
                              onClick={() => {
                                setSelectedRecord(record);
                                setIsAdministerModalOpen(true);
                              }}
                            >
                              Administer
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {upcomingTotal > upcomingRecords.length && (
                    <p className="text-xs text-slate-500 mt-2">
                      Showing the next {upcomingRecords.length} scheduled vaccinations.
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={Clock}
                  title="No upcoming vaccinations"
                  description="No scheduled doses in the next 30 days."
                />
              )}
            </div>
          )}
        </>
      ) : (
        /* Immunization Schedule */
        <Card>
          <SectionTitle 
            title="Sri Lanka National Immunization Schedule" 
            subtitle="Standard vaccination timeline for children"
          />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Age
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Vaccine
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Short Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCatalog.map((vaccine) => (
                  <tr 
                    key={vaccine.id} 
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="info" size="sm">
                        {getAgeLabel(vaccine)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {vaccine.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {vaccine.shortName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {vaccine.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedCatalog.length === 0 && (
              <div className="p-6 text-center text-sm text-slate-500">
                No vaccination schedule data available.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Child Detail Modal */}
      <Modal
        isOpen={isChildDetailOpen}
        onClose={() => {
          setIsChildDetailOpen(false);
          setChildDetailSummary(null);
          setChildDetailRecords([]);
          setChildDetailError('');
          setEditingRecord(null);
        }}
        title={childDetailSummary ? `Vaccinations: ${childDetailSummary.childName}` : 'Vaccination Details'}
        size="2xl"
      >
        {childDetailError && (
          <Alert variant="warning" title="Unable to load child records" className="mb-4">
            {childDetailError}
          </Alert>
        )}
        {childDetailLoading ? (
          <div className="py-8 text-center text-slate-500">Loading child vaccinations...</div>
        ) : (
          <div className="space-y-4">
            {childDetailSummary && (
              <Card className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900 dark:text-white">
                      {childDetailSummary.childName}
                    </p>
                    <p className="text-sm text-slate-500">
                      {childDetailSummary.childAge} • {childDetailSummary.parentName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {childDetailSummary.overdueCount > 0 ? (
                      <Badge variant="error">{childDetailSummary.overdueCount} overdue</Badge>
                    ) : (
                      <Badge variant="success">On track</Badge>
                    )}
                    <Badge variant="info">{childDetailSummary.completionPercentage}% complete</Badge>
                  </div>
                </div>
                <div className="mt-3 text-sm text-slate-500">
                  Next vaccine: {childDetailSummary.nextVaccineName ?? 'All done'}
                  {childDetailSummary.nextVaccineDate && (
                    <span> • {format(new Date(childDetailSummary.nextVaccineDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </Card>
            )}

            <Table
              columns={childDetailColumns}
              data={childDetailRecords}
              keyExtractor={getRecordKey}
              isLoading={childDetailLoading}
              emptyMessage="No vaccination records found"
            />
          </div>
        )}
      </Modal>

      {/* Edit Record Modal */}
      <Modal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        title="Edit Vaccination Record"
        size="md"
      >
        {editingRecord && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4">
              <p className="font-semibold text-slate-900 dark:text-white">
                {editingRecord.childName}
              </p>
              <p className="text-sm text-slate-500">{editingRecord.vaccine}</p>
            </div>

            <Select
              label="Status"
              options={[
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'completed', label: 'Completed' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'missed', label: 'Missed' },
              ]}
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as UiVaccinationRecord['status'])}
            />
            <Input
              label="Scheduled Date"
              type="date"
              value={editScheduledDate}
              onChange={(e) => setEditScheduledDate(e.target.value)}
            />
            <Input
              label="Administered Date"
              type="date"
              value={editAdministeredDate}
              onChange={(e) => setEditAdministeredDate(e.target.value)}
            />
            <Input
              label="Administered By"
              value={editAdministeredBy}
              onChange={(e) => setEditAdministeredBy(e.target.value)}
            />
            <Input
              label="Location"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
            />
            <Input
              label="Batch Number"
              value={editBatchNumber}
              onChange={(e) => setEditBatchNumber(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Add notes..."
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            {editError && (
              <Alert variant="warning" title="Unable to save" icon={AlertCircle}>
                {editError}
              </Alert>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                icon={Check}
                className="flex-1"
                onClick={handleUpdateRecord}
                disabled={editSubmitting}
              >
                Save Changes
              </Button>
              <Button
                variant="ghost"
                icon={X}
                onClick={() => setEditingRecord(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Record Modal */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title="Record Vaccination"
        size="md"
      >
        {children.length === 0 || vaccineCatalog.length === 0 ? (
          <Alert variant="warning" title="Unable to record" className="mt-2">
            {children.length === 0
              ? 'Please register a child before recording vaccinations.'
              : 'Vaccine catalog is unavailable right now.'}
          </Alert>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Child
              </label>
              <Select
                options={children.map((child) => ({
                  value: child.id,
                  label: `${child.firstName} ${child.lastName}`.trim(),
                }))}
                value={manualChildId}
                onChange={(e) => setManualChildId(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Vaccine
              </label>
              <Select
                options={sortedCatalog.map((vaccine) => ({
                  value: vaccine.id,
                  label: `${vaccine.name} (${vaccine.shortName})`,
                }))}
                value={manualVaccineId}
                onChange={(e) => setManualVaccineId(e.target.value)}
                className="w-full"
              />
            </div>
            <Input
              label="Administered By"
              placeholder="Enter your name"
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
            />
            <Input
              label="Batch Number"
              placeholder="Enter vaccine batch number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
            <Input
              label="Administration Date"
              type="date"
              value={administrationDate}
              onChange={(e) => setAdministrationDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Any observations or notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            {manualError && (
              <Alert variant="warning" title="Unable to save" icon={AlertCircle}>
                {manualError}
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                icon={Check}
                className="flex-1"
                onClick={handleManualAdminister}
                disabled={manualSubmitting}
              >
                Confirm Administration
              </Button>
              <Button
                variant="ghost"
                icon={X}
                onClick={() => setIsManualModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Administer Modal */}
      <Modal
        isOpen={isAdministerModalOpen}
        onClose={() => setIsAdministerModalOpen(false)}
        title="Administer Vaccination"
        size="md"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={selectedRecord.childName} />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedRecord.childName}
                  </p>
                  <p className="text-sm text-slate-500">{selectedRecord.childAge}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Syringe className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-700 dark:text-blue-300">
                    {selectedRecord.vaccine}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    Scheduled: {format(new Date(selectedRecord.scheduledDate), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            <Input
              label="Administered By"
              placeholder="Enter your name"
              value={administeredBy}
              onChange={(e) => setAdministeredBy(e.target.value)}
            />
            <Input
              label="Batch Number"
              placeholder="Enter vaccine batch number"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
            />
            <Input
              label="Administration Date"
              type="date"
              value={administrationDate}
              onChange={(e) => setAdministrationDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Any observations or notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
            </div>

            {adminError && (
              <Alert variant="warning" title="Unable to save" icon={AlertCircle}>
                {adminError}
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                variant="primary" 
                icon={Check} 
                className="flex-1"
                onClick={handleAdminister}
              >
                Confirm Administration
              </Button>
              <Button 
                variant="ghost" 
                icon={X}
                onClick={() => setIsAdministerModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
