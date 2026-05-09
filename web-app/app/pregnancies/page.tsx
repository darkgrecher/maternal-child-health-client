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
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);

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

  const pregnancyColumns = [
    {
      key: 'mother',
      header: 'Mother',
      render: (pregnancy: UiPregnancy) => (
        <div className="flex items-center gap-3 min-w-[240px]">
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
