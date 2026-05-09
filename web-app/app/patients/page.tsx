/**
 * Patients Page
 * 
 * Consolidated view of all patients (pregnant mothers and children)
 */

'use client';

import React, { useState } from 'react';
import { format, differenceInDays, differenceInMonths, differenceInYears, differenceInWeeks } from 'date-fns';
import {
  Users,
  Search,
  Plus,
  Heart,
  Baby,
  Filter,
  Phone,
  MapPin,
  Calendar,
  AlertCircle,
  ChevronRight,
  UserPlus,
  Activity,
  FileText,
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
} from '../components/ui';

// Mock patients data
const mockMothers = [
  {
    id: '1',
    name: 'Kumari Perera',
    nic: '887654321V',
    phone: '0771234567',
    address: '123 Galle Road, Colombo 03',
    area: 'Colombo',
    dob: '1988-05-12',
    pregnancies: [
      {
        id: 'p1',
        edd: '2026-06-15',
        currentWeek: 28,
        status: 'active',
        riskFactors: ['Advanced Maternal Age'],
      }
    ],
    children: [
      {
        id: 'c1',
        name: 'Nethara',
        dob: '2023-08-20',
        gender: 'female',
      }
    ],
    registeredDate: '2020-01-15',
  },
  {
    id: '2',
    name: 'Sithumi Fernando',
    nic: '926543210V',
    phone: '0712345678',
    address: '45 Temple Road, Kandy',
    area: 'Kandy',
    dob: '1992-11-25',
    pregnancies: [],
    children: [
      {
        id: 'c2',
        name: 'Kavindu',
        dob: '2025-08-15',
        gender: 'male',
      }
    ],
    registeredDate: '2024-01-20',
  },
  {
    id: '3',
    name: 'Dilhani Fernando',
    nic: '906543210V',
    phone: '0779876543',
    address: '78 Lake Road, Galle',
    area: 'Galle',
    dob: '1990-03-08',
    pregnancies: [
      {
        id: 'p2',
        edd: '2026-04-22',
        currentWeek: 34,
        status: 'active',
        riskFactors: ['Gestational Diabetes'],
      }
    ],
    children: [],
    registeredDate: '2023-05-10',
  },
  {
    id: '4',
    name: 'Nethmi Silva',
    nic: '956789012V',
    phone: '0765432198',
    address: '12 High Street, Matara',
    area: 'Matara',
    dob: '1995-07-20',
    pregnancies: [
      {
        id: 'p3',
        edd: '2026-08-15',
        currentWeek: 18,
        status: 'active',
        riskFactors: [],
      }
    ],
    children: [],
    registeredDate: '2025-11-01',
  },
  {
    id: '5',
    name: 'Chamari Wickramasinghe',
    nic: '896789012V',
    phone: '0787654321',
    address: '56 Beach Road, Negombo',
    area: 'Negombo',
    dob: '1989-09-15',
    pregnancies: [
      {
        id: 'p4',
        edd: '2026-03-30',
        currentWeek: 38,
        status: 'active',
        riskFactors: ['Pre-eclampsia', 'Previous C-Section'],
      }
    ],
    children: [
      {
        id: 'c3',
        name: 'Savitha',
        dob: '2022-05-12',
        gender: 'female',
      }
    ],
    registeredDate: '2019-08-20',
  },
  {
    id: '6',
    name: 'Malini Bandara',
    nic: '936789012V',
    phone: '0758765432',
    address: '89 Main Street, Kurunegala',
    area: 'Kurunegala',
    dob: '1993-01-28',
    pregnancies: [],
    children: [
      {
        id: 'c4',
        name: 'Isuri',
        dob: '2025-11-20',
        gender: 'female',
      }
    ],
    registeredDate: '2024-06-15',
  },
];

const getAge = (dob: string) => {
  const years = differenceInYears(new Date(), new Date(dob));
  return `${years} years`;
};

const getChildAge = (dob: string) => {
  const months = differenceInMonths(new Date(), new Date(dob));
  if (months < 12) {
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths > 0 
    ? `${years}y ${remainingMonths}m` 
    : `${years} year${years !== 1 ? 's' : ''}`;
};

const getPregnancyWeek = (edd: string) => {
  const dueDate = new Date(edd);
  const today = new Date();
  const weeksRemaining = differenceInWeeks(dueDate, today);
  return 40 - weeksRemaining;
};

type PatientView = 'all' | 'mothers' | 'children';

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('all');
  const [view, setView] = useState<PatientView>('all');
  const [selectedPatient, setSelectedPatient] = useState<typeof mockMothers[0] | null>(null);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  // Get unique areas
  const areas = [...new Set(mockMothers.map(m => m.area))];

  // Filter patients
  const filteredMothers = mockMothers.filter((mother) => {
    const matchesSearch = mother.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mother.nic.includes(searchTerm) ||
      mother.phone.includes(searchTerm);
    const matchesArea = filterArea === 'all' || mother.area === filterArea;
    return matchesSearch && matchesArea;
  });

  // Get all children
  const allChildren = mockMothers.flatMap(mother => 
    mother.children.map(child => ({
      ...child,
      motherName: mother.name,
      motherPhone: mother.phone,
    }))
  );

  // Filter children
  const filteredChildren = allChildren.filter((child) => {
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      child.motherName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = filterArea === 'all' || 
      mockMothers.find(m => m.children.some(c => c.id === child.id))?.area === filterArea;
    return matchesSearch && matchesArea;
  });

  // Stats
  const totalMothers = mockMothers.length;
  const activePregnancies = mockMothers.filter(m => m.pregnancies.some(p => p.status === 'active')).length;
  const totalChildren = allChildren.length;
  const highRiskPatients = mockMothers.filter(m => 
    m.pregnancies.some(p => p.riskFactors && p.riskFactors.length > 0)
  ).length;

  return (
    <MainLayout>
      <Header
        title="Patients"
        subtitle="Manage mothers and children"
        actions={
          <Button icon={UserPlus} onClick={() => setShowNewPatientModal(true)}>
            New Patient
          </Button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <Users className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalMothers}</p>
            <p className="text-sm text-slate-500">Total Mothers</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activePregnancies}</p>
            <p className="text-sm text-slate-500">Active Pregnancies</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Baby className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalChildren}</p>
            <p className="text-sm text-slate-500">Children</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-amber-100">
            <AlertCircle className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{highRiskPatients}</p>
            <p className="text-sm text-slate-500">High Risk</p>
          </div>
        </Card>
      </div>

      {/* View Toggle & Filters */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* View Toggle */}
          <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'all'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('all')}
            >
              All Patients
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'mothers'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('mothers')}
            >
              Mothers
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'children'
                  ? 'bg-white dark:bg-slate-600 shadow text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
              onClick={() => setView('children')}
            >
              Children
            </button>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by name, NIC, or phone..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              options={[
                { value: 'all', label: 'All Areas' },
                ...areas.map(area => ({ value: area, label: area }))
              ]}
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
        </div>
      </Card>

      {/* Patient Lists */}
      {(view === 'all' || view === 'mothers') && (
        <div className="mb-8">
          <SectionTitle>
            Mothers ({filteredMothers.length})
          </SectionTitle>
          <div className="grid gap-4">
            {filteredMothers.map((mother) => (
              <Card key={mother.id} hover onClick={() => setSelectedPatient(mother)}>
                <div className="flex items-center gap-4">
                  <Avatar name={mother.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {mother.name}
                      </h3>
                      {mother.pregnancies.some(p => p.status === 'active') && (
                        <Badge variant="info">Pregnant</Badge>
                      )}
                      {mother.pregnancies.some(p => p.riskFactors && p.riskFactors.length > 0) && (
                        <Badge variant="warning">High Risk</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span>{mother.nic}</span>
                      <span>{getAge(mother.dob)}</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {mother.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {mother.area}
                      </span>
                    </div>
                    {mother.pregnancies.filter(p => p.status === 'active').map(pregnancy => (
                      <div key={pregnancy.id} className="mt-2 flex items-center gap-2">
                        <Heart className="w-4 h-4 text-pink-500" />
                        <span className="text-sm text-pink-600 dark:text-pink-400">
                          Week {pregnancy.currentWeek} • EDD: {format(new Date(pregnancy.edd), 'MMM d, yyyy')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right">
                    {mother.children.length > 0 && (
                      <div className="flex items-center gap-1 text-slate-500 mb-2">
                        <Baby className="w-4 h-4" />
                        <span className="text-sm">{mother.children.length} child{mother.children.length > 1 ? 'ren' : ''}</span>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {(view === 'all' || view === 'children') && (
        <div>
          <SectionTitle>
            Children ({filteredChildren.length})
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredChildren.map((child) => (
              <Card key={child.id} hover>
                <div className="flex items-center gap-4">
                  <Avatar name={child.name} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {child.name}
                      </h3>
                      <Badge variant={child.gender === 'male' ? 'info' : 'default'}>
                        {child.gender === 'male' ? '♂' : '♀'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500">{getChildAge(child.dob)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Mother: {child.motherName}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      <Modal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
              <Avatar name={selectedPatient.name} size="xl" />
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {selectedPatient.name}
                </h2>
                <p className="text-slate-500">{selectedPatient.nic}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPatient.pregnancies.some(p => p.status === 'active') && (
                    <Badge variant="info">Currently Pregnant</Badge>
                  )}
                  {selectedPatient.pregnancies.some(p => p.riskFactors && p.riskFactors.length > 0) && (
                    <Badge variant="warning">High Risk</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Phone</label>
                <p className="text-slate-900 dark:text-white">{selectedPatient.phone}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase">Age</label>
                <p className="text-slate-900 dark:text-white">{getAge(selectedPatient.dob)}</p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase">Address</label>
                <p className="text-slate-900 dark:text-white">{selectedPatient.address}</p>
              </div>
            </div>

            {/* Active Pregnancy */}
            {selectedPatient.pregnancies.filter(p => p.status === 'active').map(pregnancy => (
              <div key={pregnancy.id}>
                <SectionTitle>Current Pregnancy</SectionTitle>
                <Card className="bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-500">Current Week</p>
                        <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                          Week {pregnancy.currentWeek}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Expected Due Date</p>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {format(new Date(pregnancy.edd), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((pregnancy.currentWeek / 40) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-pink-200 dark:bg-pink-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${(pregnancy.currentWeek / 40) * 100}%` }}
                        />
                      </div>
                    </div>

                    {pregnancy.riskFactors && pregnancy.riskFactors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Risk Factors:</p>
                        <div className="flex flex-wrap gap-2">
                          {pregnancy.riskFactors.map((factor, idx) => (
                            <Badge key={idx} variant="warning">{factor}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            ))}

            {/* Children */}
            {selectedPatient.children.length > 0 && (
              <div>
                <SectionTitle>Children</SectionTitle>
                <div className="space-y-3">
                  {selectedPatient.children.map(child => (
                    <Card key={child.id}>
                      <div className="flex items-center gap-4">
                        <Avatar name={child.name} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900 dark:text-white">{child.name}</p>
                            <Badge variant={child.gender === 'male' ? 'info' : 'default'}>
                              {child.gender === 'male' ? '♂ Male' : '♀ Female'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-500">
                            {getChildAge(child.dob)} • Born {format(new Date(child.dob), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="secondary" icon={Calendar}>
                Schedule Appointment
              </Button>
              <Button variant="secondary" icon={FileText}>
                View Medical Records
              </Button>
              <Button variant="secondary" icon={Phone}>
                Call Patient
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Patient Modal (simplified) */}
      <Modal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
        title="Register New Patient"
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" placeholder="Enter full name" required />
            <Input label="NIC Number" placeholder="Enter NIC" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date of Birth" type="date" required />
            <Input label="Phone Number" placeholder="07XXXXXXXX" required />
          </div>
          <Input label="Address" placeholder="Enter full address" />
          <Select
            label="Area"
            options={[
              { value: '', label: 'Select area' },
              ...areas.map(area => ({ value: area, label: area }))
            ]}
          />
          
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
              Registration Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Card hover className="cursor-pointer border-2 border-transparent hover:border-pink-500">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-pink-500" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">New Pregnancy</p>
                    <p className="text-sm text-slate-500">Register antenatal care</p>
                  </div>
                </div>
              </Card>
              <Card hover className="cursor-pointer border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center gap-3">
                  <Baby className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">New Child</p>
                    <p className="text-sm text-slate-500">Register child health</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNewPatientModal(false)}>
              Cancel
            </Button>
            <Button>Register Patient</Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
}
