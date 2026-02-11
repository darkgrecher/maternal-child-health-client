/**
 * Vaccinations Management Page
 * 
 * Displays vaccination schedules, records, and overdue vaccinations
 * following the Sri Lanka National Immunization Schedule.
 */

'use client';

import React, { useState } from 'react';
import { format, isPast, isFuture, addDays } from 'date-fns';
import {
  Syringe,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  User,
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
  ProgressBar,
  SectionTitle,
  Input,
  Select,
  Modal,
  Table,
  EmptyState,
  Alert,
} from '../components/ui';

// Sri Lanka National Immunization Schedule
const vaccineSchedule = [
  { name: 'BCG', shortName: 'BCG', ageInMonths: 0, description: 'Bacillus Calmette-Guérin' },
  { name: 'Hepatitis B (Birth Dose)', shortName: 'HepB-BD', ageInMonths: 0, description: 'Hepatitis B' },
  { name: 'DTP-HepB-Hib (Dose 1)', shortName: 'Penta-1', ageInMonths: 2, description: 'Pentavalent' },
  { name: 'OPV (Dose 1)', shortName: 'OPV-1', ageInMonths: 2, description: 'Oral Polio' },
  { name: 'DTP-HepB-Hib (Dose 2)', shortName: 'Penta-2', ageInMonths: 4, description: 'Pentavalent' },
  { name: 'OPV (Dose 2)', shortName: 'OPV-2', ageInMonths: 4, description: 'Oral Polio' },
  { name: 'DTP-HepB-Hib (Dose 3)', shortName: 'Penta-3', ageInMonths: 6, description: 'Pentavalent' },
  { name: 'OPV (Dose 3)', shortName: 'OPV-3', ageInMonths: 6, description: 'Oral Polio' },
  { name: 'MMR (Dose 1)', shortName: 'MMR-1', ageInMonths: 9, description: 'Measles, Mumps, Rubella' },
  { name: 'Japanese Encephalitis', shortName: 'JE', ageInMonths: 12, description: 'Japanese Encephalitis' },
  { name: 'DTP-HepB-Hib (Booster)', shortName: 'Penta-B', ageInMonths: 18, description: 'Pentavalent Booster' },
  { name: 'OPV (Booster)', shortName: 'OPV-B', ageInMonths: 18, description: 'Oral Polio Booster' },
  { name: 'MMR (Dose 2)', shortName: 'MMR-2', ageInMonths: 36, description: 'Measles, Mumps, Rubella' },
];

// Mock vaccination records
const mockVaccinationRecords = [
  {
    id: '1',
    childId: '1',
    childName: 'Tharindu Perera',
    childAge: '4 months',
    parentName: 'Amaya Perera',
    parentPhone: '+94 77 123 4567',
    vaccine: 'DTP-HepB-Hib (Dose 2)',
    shortName: 'Penta-2',
    scheduledDate: '2026-01-20',
    status: 'overdue',
    daysOverdue: 8,
  },
  {
    id: '2',
    childId: '2',
    childName: 'Kavindi Silva',
    childAge: '9 months',
    parentName: 'Nethmi Silva',
    parentPhone: '+94 71 234 5678',
    vaccine: 'MMR (Dose 1)',
    shortName: 'MMR-1',
    scheduledDate: '2026-01-15',
    status: 'overdue',
    daysOverdue: 13,
  },
  {
    id: '3',
    childId: '3',
    childName: 'Isuru Fernando',
    childAge: '18 months',
    parentName: 'Sithumi Fernando',
    parentPhone: '+94 76 345 6789',
    vaccine: 'DTP-HepB-Hib (Booster)',
    shortName: 'Penta-B',
    scheduledDate: '2026-01-22',
    status: 'overdue',
    daysOverdue: 6,
  },
  {
    id: '4',
    childId: '4',
    childName: 'Dinithi Herath',
    childAge: '6 months',
    parentName: 'Rashmi Herath',
    parentPhone: '+94 77 456 7890',
    vaccine: 'DTP-HepB-Hib (Dose 3)',
    shortName: 'Penta-3',
    scheduledDate: '2026-01-30',
    status: 'scheduled',
    daysOverdue: 0,
  },
  {
    id: '5',
    childId: '5',
    childName: 'Nipun Bandara',
    childAge: '2 months',
    parentName: 'Kumari Bandara',
    parentPhone: '+94 71 567 8901',
    vaccine: 'DTP-HepB-Hib (Dose 1)',
    shortName: 'Penta-1',
    scheduledDate: '2026-02-05',
    status: 'scheduled',
    daysOverdue: 0,
  },
  {
    id: '6',
    childId: '6',
    childName: 'Kavisha Fernando',
    childAge: '3 months',
    parentName: 'Sithumi Fernando',
    parentPhone: '+94 77 123 4567',
    vaccine: 'OPV (Dose 1)',
    shortName: 'OPV-1',
    scheduledDate: '2026-01-25',
    status: 'completed',
    administeredDate: '2026-01-25',
    administeredBy: 'Sarah Johnson',
  },
  {
    id: '7',
    childId: '7',
    childName: 'Kasun Jayawardena',
    childAge: '4 months',
    parentName: 'Dilani Jayawardena',
    parentPhone: '+94 76 678 9012',
    vaccine: 'DTP-HepB-Hib (Dose 2)',
    shortName: 'Penta-2',
    scheduledDate: '2026-01-28',
    status: 'scheduled',
    daysOverdue: 0,
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success">Completed</Badge>;
    case 'overdue':
      return <Badge variant="error">Overdue</Badge>;
    case 'scheduled':
      return <Badge variant="info">Scheduled</Badge>;
    case 'missed':
      return <Badge variant="error">Missed</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export default function VaccinationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<typeof mockVaccinationRecords[0] | null>(null);
  const [isAdministerModalOpen, setIsAdministerModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'records' | 'schedule'>('records');

  const filteredRecords = mockVaccinationRecords.filter((record) => {
    const matchesSearch = record.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.vaccine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const overdueCount = mockVaccinationRecords.filter(r => r.status === 'overdue').length;
  const scheduledCount = mockVaccinationRecords.filter(r => r.status === 'scheduled').length;
  const completedCount = mockVaccinationRecords.filter(r => r.status === 'completed').length;

  return (
    <MainLayout>
      <Header
        title="Vaccination Management"
        subtitle="Sri Lanka National Immunization Schedule"
        actions={
          <Button icon={Plus} variant="primary">
            Record Vaccination
          </Button>
        }
      />

      {/* Alert for Overdue */}
      {overdueCount > 0 && (
        <Alert variant="error" title="Overdue Vaccinations" icon={AlertTriangle}>
          <span>
            There are <strong>{overdueCount} children</strong> with overdue vaccinations. 
            Immediate follow-up is required.
          </span>
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
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</p>
            <p className="text-sm text-slate-500">Completed Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Syringe className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">142</p>
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
                ]}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full sm:w-44"
              />
            </div>
          </Card>

          {/* Vaccination Records */}
          <div className="space-y-4">
            {/* Overdue Section */}
            {filteredRecords.filter(r => r.status === 'overdue').length > 0 && (
              <div>
                <SectionTitle 
                  title="Overdue Vaccinations" 
                  subtitle="Requires immediate follow-up"
                />
                <div className="space-y-3">
                  {filteredRecords
                    .filter(r => r.status === 'overdue')
                    .map((record) => (
                      <Card 
                        key={record.id} 
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
                      <Card key={record.id} hover>
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
                      <Card key={record.id} className="opacity-75">
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
                              Administered: {format(new Date((record as { administeredDate?: string }).administeredDate || record.scheduledDate), 'MMMM d, yyyy')}
                              {(record as { administeredBy?: string }).administeredBy && ` by ${(record as { administeredBy?: string }).administeredBy}`}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" icon={FileText}>
                            View Record
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
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
                {vaccineSchedule.map((vaccine, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-4 py-3 text-sm">
                      <Badge variant="info" size="sm">
                        {vaccine.ageInMonths === 0 ? 'At Birth' : `${vaccine.ageInMonths} months`}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {vaccine.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {vaccine.shortName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {vaccine.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
              defaultValue="Sarah Johnson"
            />
            <Input
              label="Batch Number"
              placeholder="Enter vaccine batch number"
            />
            <Input
              label="Administration Date"
              type="date"
              defaultValue={format(new Date(), 'yyyy-MM-dd')}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Notes
              </label>
              <textarea
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Any observations or notes..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="primary" 
                icon={Check} 
                className="flex-1"
                onClick={() => setIsAdministerModalOpen(false)}
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
