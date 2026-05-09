/**
 * Pregnancies Management Page
 * 
 * Displays all active and past pregnancies with detailed information
 * for midwife tracking and management.
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format, differenceInYears } from 'date-fns';
import {
  Heart,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  AlertTriangle,
  User,
  Phone,
  MapPin,
  FileText,
  Edit,
  Trash2,
  Eye,
  Baby,
  Activity,
  Stethoscope,
  QrCode,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  ProgressBar,
  SectionTitle,
  Input,
  Select,
  Modal,
  Table,
  EmptyState,
  Alert,
} from '../components/ui';
import { usePregnancyStore } from '../lib/stores';
import apiClient from '../lib/api-client';
import type { ApiResponse } from '../lib/types';
import QRCode from 'qrcode';

interface UiPregnancy {
  id: string;
  motherName: string;
  motherAge?: number;
  phone: string;
  expectedDeliveryDate?: string;
  lastMenstrualPeriod?: string;
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
  const { pregnancies, isLoading, error, fetchPregnancies } = usePregnancyStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedPregnancy, setSelectedPregnancy] = useState<UiPregnancy | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

  useEffect(() => {
    fetchPregnancies();
  }, [fetchPregnancies]);

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
        const response = await apiClient.post<ApiResponse<{ qrPayload: string }>>('/midwife-links/qr');
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
          motherAge: getAgeFromDob(pregnancy.motherDateOfBirth),
          phone: pregnancy.emergencyContactPhone || pregnancy.obgynContact || pregnancy.midwifeContact || 'Not provided',
          expectedDeliveryDate: pregnancy.expectedDeliveryDate,
          lastMenstrualPeriod: pregnancy.lastMenstrualPeriod,
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
            <Button icon={Plus} variant="primary">
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

      {/* Pregnancy Cards */}
      {isLoading ? (
        <Card className="p-6 text-center text-slate-500">Loading pregnancies...</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredPregnancies.map((pregnancy) => {
          const weeksRemaining = getWeeksRemaining(pregnancy.expectedDeliveryDate);
          const progress = Math.min((pregnancy.currentWeek / 40) * 100, 100);
          const devInfo = getBabyDevelopmentInfo(pregnancy.currentWeek);

          return (
            <Card
              key={pregnancy.id}
              hover
              className={pregnancy.isHighRisk ? 'border-l-4 border-l-amber-500' : ''}
              onClick={() => {
                setSelectedPregnancy(pregnancy);
                setIsModalOpen(true);
              }}
            >
              <div className="flex items-start gap-4">
                <Avatar name={pregnancy.motherName} size="lg" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {pregnancy.motherName}
                    </h3>
                    {pregnancy.isHighRisk && (
                      <Badge variant="warning" size="sm">High Risk</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">
                    {pregnancy.motherAge ?? 'Unknown'} years • G{pregnancy.gravida ?? '-'}P{pregnancy.para ?? '-'} • {pregnancy.bloodType}
                  </p>
                  
                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Week {pregnancy.currentWeek} of 40
                      </span>
                      <span className="text-sm text-slate-500">
                        {weeksRemaining} weeks to go
                      </span>
                    </div>
                    <ProgressBar
                      value={progress}
                      color={pregnancy.isHighRisk ? 'bg-amber-500' : 'bg-pink-500'}
                    />
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      EDD: {formatDate(pregnancy.expectedDeliveryDate)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {pregnancy.phone}
                    </span>
                  </div>

                  {/* Risk Factors */}
                  {pregnancy.riskFactors.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {pregnancy.riskFactors.map((factor, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Badge variant={pregnancy.trimester === 3 ? 'info' : 'default'}>
                    {devInfo.trimester}
                  </Badge>
                  <Button variant="ghost" size="sm" icon={Eye}>
                    View
                  </Button>
                </div>
              </div>

              {/* Next Appointment */}
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Stethoscope className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">Next visit:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {pregnancy.nextAppointment
                      ? formatDate(pregnancy.nextAppointment)
                      : 'Not scheduled'}
                  </span>
                </div>
                <Button variant="outline" size="sm" icon={Calendar}>
                  Schedule
                </Button>
              </div>
            </Card>
            );
          })}
        </div>
      )}

      {!isLoading && filteredPregnancies.length === 0 && (
        <EmptyState
          icon={Heart}
          title="No pregnancies found"
          description="Try adjusting your search or filter criteria"
          action={
            <Button icon={Plus} variant="primary">
              Register New Pregnancy
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
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Scan to Add Pregnancy Profile</h2>
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
                Scan the QR code with your mobile device to quickly add a new pregnancy profile
              </p>
            </div>
          </div>
        </div>
      )}

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

            <div className="grid grid-cols-2 gap-4">
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
              <Button variant="primary" icon={Calendar} className="flex-1">
                Schedule Checkup
              </Button>
              <Button variant="outline" icon={FileText} className="flex-1">
                View Records
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
