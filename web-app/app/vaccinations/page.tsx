/**
 * Vaccinations Management Page
 * 
 * Displays vaccination schedules, records, and overdue vaccinations
 * following the Sri Lanka National Immunization Schedule.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { differenceInDays, format, isSameDay, isSameMonth } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import {
  Syringe,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  FileText,
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
  Modal,
  EmptyState,
  Alert,
} from '../components/ui';
import apiClient from '../lib/api-client';
import { useChildStore } from '../lib/stores';
import type { ApiResponse, ChildProfile, VaccinationRecord, VaccineInfo } from '../lib/types';

interface VaccinationScheduleResponse {
  schedule: VaccinationRecord[];
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<UiVaccinationRecord | null>(null);
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualChildId, setManualChildId] = useState('');
  const [manualVaccineId, setManualVaccineId] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'schedule'>('records');
  const [records, setRecords] = useState<UiVaccinationRecord[]>([]);
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
      setRecords([]);
      return;
    }

    let isCancelled = false;

    const loadRecords = async () => {
      setRecordsLoading(true);
      setRecordsError('');

      try {
        const recordsByChild = await Promise.all(
          children.map(async (child) => {
            const response = await apiClient.get<ApiResponse<VaccinationScheduleResponse>>(
              `/vaccines/child/${child.id}`
            );
            return { child, schedule: response.data?.schedule ?? [] };
          })
        );

        if (isCancelled) return;

        const today = new Date();
        const mapped = recordsByChild.flatMap(({ child, schedule }) =>
          schedule.map((record) => {
            const scheduledDate = new Date(record.scheduledDate);
            const normalizedStatus = record.status === 'pending' ? 'scheduled' : record.status;
            const isOverdue = normalizedStatus === 'overdue' || normalizedStatus === 'missed';
            const daysOverdue = isOverdue
              ? Math.max(0, differenceInDays(today, scheduledDate))
              : 0;

            return {
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
            } as UiVaccinationRecord;
          })
        );

        setRecords(mapped);
      } catch (error) {
        if (!isCancelled) {
          setRecordsError((error as Error).message || 'Failed to load vaccination records');
          setRecords([]);
        }
      } finally {
        if (!isCancelled) {
          setRecordsLoading(false);
        }
      }
    };

    loadRecords();

    return () => {
      isCancelled = true;
    };
  }, [children]);

  useEffect(() => {
    if (!selectedRecord) return;
    setAdministeredBy('');
    setBatchNumber('');
    setAdministrationDate(format(new Date(), 'yyyy-MM-dd'));
    setAdminNotes('');
    setAdminError('');
  }, [selectedRecord]);

  useEffect(() => {
    if (!isManualModalOpen) return;
    setManualError('');
    setAdministeredBy('');
    setBatchNumber('');
    setAdministrationDate(format(new Date(), 'yyyy-MM-dd'));
    setAdminNotes('');
    if (!manualChildId && children.length > 0) {
      setManualChildId(children[0].id);
    }
    if (!manualVaccineId && vaccineCatalog.length > 0) {
      setManualVaccineId(vaccineCatalog[0].id);
    }
  }, [isManualModalOpen, children, vaccineCatalog, manualChildId, manualVaccineId]);

  const handleAdminister = async () => {
    if (!selectedRecord) return;

    setAdminError('');

    try {
      const response = await apiClient.post<ApiResponse<VaccinationRecord>>(
        `/vaccines/child/${selectedRecord.childId}/administer/${selectedRecord.vaccineId}`,
        {
          administeredBy: administeredBy || undefined,
          batchNumber: batchNumber || undefined,
          administeredDate: administrationDate || undefined,
          notes: adminNotes || undefined,
          status: 'completed',
        }
      );

      const updated = response.data;
      if (updated) {
        setRecords((prev) =>
          prev.map((record) =>
            record.childId === selectedRecord.childId && record.vaccineId === selectedRecord.vaccineId
              ? {
                  ...record,
                  status: 'completed',
                  administeredDate: updated.administeredDate ?? record.administeredDate,
                  administeredBy: updated.administeredBy ?? record.administeredBy,
                  daysOverdue: 0,
                }
              : record
          )
        );
      }

      setIsAdministerModalOpen(false);
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
      fetchChildren();
    } catch (error) {
      setManualError((error as Error).message || 'Failed to record vaccination');
    } finally {
      setManualSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch = record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.vaccine.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, filterStatus]);

  const overdueCount = records.filter((record) => record.status === 'overdue' || record.status === 'missed').length;
  const overdueChildCount = new Set(
    records
      .filter((record) => record.status === 'overdue' || record.status === 'missed')
      .map((record) => record.childId)
  ).size;
  const scheduledCount = records.filter((record) => record.status === 'scheduled').length;
  const completedTodayCount = records.filter((record) => {
    if (record.status !== 'completed') return false;
    const date = new Date(record.administeredDate || record.scheduledDate);
    return isSameDay(date, new Date());
  }).length;
  const completedThisMonthCount = records.filter((record) => {
    if (record.status !== 'completed') return false;
    const date = new Date(record.administeredDate || record.scheduledDate);
    return isSameMonth(date, new Date());
  }).length;

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
            There are <strong>{overdueChildCount} children</strong> with overdue vaccinations. 
            Immediate follow-up is required.
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
            <p className="text-sm text-slate-500">Upcoming</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedTodayCount}</p>
            <p className="text-sm text-slate-500">Completed Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Syringe className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedThisMonthCount}</p>
            <p className="text-sm text-slate-500">This Month</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'records' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('records')}
        >
          Vaccination Records
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
          {/* Filters */}
          <Card className="mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <Input
                  placeholder="Search by child name or vaccine..."
                  icon={Search}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'overdue', label: 'Overdue' },
                  { value: 'scheduled', label: 'Scheduled' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'missed', label: 'Missed' },
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
          </Card>

          {/* Vaccination Records */}
          {isLoading ? (
            <Card className="p-6 text-center text-slate-500">Loading vaccination records...</Card>
          ) : (
            <div className="space-y-4">
            {/* Overdue Section */}
            {filteredRecords.filter(r => r.status === 'overdue' || r.status === 'missed').length > 0 && (
              <div>
                <SectionTitle 
                  title="Overdue Vaccinations" 
                  subtitle="Requires immediate follow-up"
                />
                <div className="space-y-3">
                  {filteredRecords
                    .filter(r => r.status === 'overdue' || r.status === 'missed')
                    .map((record) => (
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
              </div>
            )}

            {/* Scheduled Section */}
            {filteredRecords.filter(r => r.status === 'scheduled').length > 0 && (
              <div className="mt-8">
                <SectionTitle 
                  title="Upcoming Vaccinations" 
                  subtitle="Scheduled for administration"
                />
                <div className="space-y-3">
                  {filteredRecords
                    .filter(r => r.status === 'scheduled')
                    .map((record) => (
                      <Card key={getRecordKey(record)} hover>
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-blue-100">
                            <Syringe className="w-6 h-6 text-blue-500" />
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
                              Scheduled: {format(new Date(record.scheduledDate), 'MMMM d, yyyy')}
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
              </div>
            )}

            {/* Completed Section */}
            {filteredRecords.filter(r => r.status === 'completed').length > 0 && (
              <div className="mt-8">
                <SectionTitle 
                  title="Recently Completed" 
                  subtitle="Administered vaccinations"
                />
                <div className="space-y-3">
                  {filteredRecords
                    .filter(r => r.status === 'completed')
                    .map((record) => (
                      <Card key={getRecordKey(record)} className="opacity-75">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-emerald-100">
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
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
                            <p className="text-xs text-emerald-500 mt-1">
                              Administered: {format(new Date(record.administeredDate || record.scheduledDate), 'MMMM d, yyyy')}
                              {record.administeredBy && ` by ${record.administeredBy}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={FileText}
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsAdministerModalOpen(true);
                            }}
                          >
                            View Record
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
            {filteredRecords.length === 0 && (
              <EmptyState
                icon={Syringe}
                title="No vaccinations found"
                description="Try adjusting your search or filter criteria"
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
