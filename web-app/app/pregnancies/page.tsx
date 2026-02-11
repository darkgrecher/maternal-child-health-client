/**
 * Pregnancies Management Page
 * 
 * Displays all active and past pregnancies with detailed information
 * for midwife tracking and management.
 */

'use client';

import React, { useState } from 'react';
import { format, differenceInWeeks, differenceInDays, addWeeks } from 'date-fns';
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
} from 'lucide-react';
import { MainLayout, Header } from '../components/layout';
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

// Mock pregnancy data
const mockPregnancies = [
  {
    id: '1',
    motherName: 'Amaya Perera',
    motherAge: 28,
    phone: '+94 77 123 4567',
    expectedDeliveryDate: '2026-04-15',
    lastMenstrualPeriod: '2025-07-09',
    currentWeek: 29,
    trimester: 3,
    status: 'active',
    isHighRisk: false,
    riskFactors: [],
    gravida: 1,
    para: 0,
    bloodType: 'O+',
    lastCheckup: '2026-01-20',
    nextAppointment: '2026-02-03',
    midwife: 'Sarah Johnson',
  },
  {
    id: '2',
    motherName: 'Chamari Wickramasinghe',
    motherAge: 35,
    phone: '+94 71 234 5678',
    expectedDeliveryDate: '2026-03-20',
    lastMenstrualPeriod: '2025-06-13',
    currentWeek: 33,
    trimester: 3,
    status: 'active',
    isHighRisk: true,
    riskFactors: ['Gestational Diabetes', 'High Blood Pressure'],
    gravida: 3,
    para: 2,
    bloodType: 'A+',
    lastCheckup: '2026-01-25',
    nextAppointment: '2026-01-30',
    midwife: 'Sarah Johnson',
  },
  {
    id: '3',
    motherName: 'Dilani Jayawardena',
    motherAge: 31,
    phone: '+94 76 345 6789',
    expectedDeliveryDate: '2026-02-28',
    lastMenstrualPeriod: '2025-05-24',
    currentWeek: 36,
    trimester: 3,
    status: 'active',
    isHighRisk: false,
    riskFactors: [],
    gravida: 2,
    para: 1,
    bloodType: 'B+',
    lastCheckup: '2026-01-22',
    nextAppointment: '2026-01-29',
    midwife: 'Sarah Johnson',
  },
  {
    id: '4',
    motherName: 'Sanduni Gunasekara',
    motherAge: 29,
    phone: '+94 77 456 7890',
    expectedDeliveryDate: '2026-06-10',
    lastMenstrualPeriod: '2025-09-03',
    currentWeek: 21,
    trimester: 2,
    status: 'active',
    isHighRisk: true,
    riskFactors: ['Multiple Pregnancy (Twins)'],
    gravida: 1,
    para: 0,
    bloodType: 'AB+',
    lastCheckup: '2026-01-18',
    nextAppointment: '2026-02-01',
    midwife: 'Sarah Johnson',
  },
  {
    id: '5',
    motherName: 'Malini Ratnayake',
    motherAge: 37,
    phone: '+94 71 567 8901',
    expectedDeliveryDate: '2026-05-05',
    lastMenstrualPeriod: '2025-07-29',
    currentWeek: 26,
    trimester: 2,
    status: 'active',
    isHighRisk: true,
    riskFactors: ['Previous Cesarean', 'Advanced Maternal Age'],
    gravida: 4,
    para: 3,
    bloodType: 'O-',
    lastCheckup: '2026-01-15',
    nextAppointment: '2026-01-31',
    midwife: 'Sarah Johnson',
  },
  {
    id: '6',
    motherName: 'Nethmi Silva',
    motherAge: 24,
    phone: '+94 76 678 9012',
    expectedDeliveryDate: '2026-07-20',
    lastMenstrualPeriod: '2025-10-13',
    currentWeek: 15,
    trimester: 2,
    status: 'active',
    isHighRisk: false,
    riskFactors: [],
    gravida: 1,
    para: 0,
    bloodType: 'A-',
    lastCheckup: '2026-01-10',
    nextAppointment: '2026-02-07',
    midwife: 'Sarah Johnson',
  },
];

const getBabyDevelopmentInfo = (week: number) => {
  if (week <= 12) return { trimester: '1st Trimester', stage: 'Embryonic Development' };
  if (week <= 27) return { trimester: '2nd Trimester', stage: 'Fetal Growth' };
  return { trimester: '3rd Trimester', stage: 'Final Development' };
};

const getWeeksRemaining = (edd: string) => {
  const today = new Date();
  const dueDate = new Date(edd);
  const diffTime = dueDate.getTime() - today.getTime();
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  return Math.max(0, diffWeeks);
};

export default function PregnanciesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [selectedPregnancy, setSelectedPregnancy] = useState<typeof mockPregnancies[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPregnancies = mockPregnancies.filter((pregnancy) => {
    const matchesSearch = pregnancy.motherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || pregnancy.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || 
      (filterRisk === 'high' && pregnancy.isHighRisk) || 
      (filterRisk === 'normal' && !pregnancy.isHighRisk);
    return matchesSearch && matchesStatus && matchesRisk;
  });

  const activeCount = mockPregnancies.filter(p => p.status === 'active').length;
  const highRiskCount = mockPregnancies.filter(p => p.isHighRisk).length;
  const thirdTrimesterCount = mockPregnancies.filter(p => p.trimester === 3).length;

  return (
    <MainLayout>
      <Header
        title="Pregnancy Management"
        subtitle={`${activeCount} active pregnancies being monitored`}
        actions={
          <Button icon={Plus} variant="primary">
            Register Pregnancy
          </Button>
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
            <p className="text-2xl font-bold text-slate-900 dark:text-white">8</p>
            <p className="text-sm text-slate-500">Due This Month</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
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
            className="w-full sm:w-40"
          />
        </div>
      </Card>

      {/* Pregnancy Cards */}
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
                    {pregnancy.motherAge} years • G{pregnancy.gravida}P{pregnancy.para} • {pregnancy.bloodType}
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
                      EDD: {format(new Date(pregnancy.expectedDeliveryDate), 'MMM d, yyyy')}
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
                    {format(new Date(pregnancy.nextAppointment), 'MMM d, yyyy')}
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

      {filteredPregnancies.length === 0 && (
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
                  {selectedPregnancy.motherAge} years old • Blood Type: {selectedPregnancy.bloodType}
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
                  {format(new Date(selectedPregnancy.expectedDeliveryDate), 'MMMM d, yyyy')}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Gravida / Para</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  G{selectedPregnancy.gravida} P{selectedPregnancy.para}
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
