/**
 * Children Management Page
 * 
 * Displays all registered children with growth tracking,
 * vaccination status, and development monitoring.
 */

'use client';

import React, { useState } from 'react';
import { format, differenceInMonths, differenceInYears } from 'date-fns';
import {
  Baby,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Syringe,
  TrendingUp,
  User,
  Phone,
  Eye,
  Edit,
  Scale,
  Ruler,
  Activity,
  Heart,
  AlertCircle,
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
  EmptyState,
} from '../components/ui';

// Mock children data
const mockChildren = [
  {
    id: '1',
    firstName: 'Kavisha',
    lastName: 'Fernando',
    dateOfBirth: '2025-10-15',
    gender: 'female',
    bloodType: 'O+',
    parentName: 'Sithumi Fernando',
    parentPhone: '+94 77 123 4567',
    birthWeight: 3.2,
    birthHeight: 50,
    currentWeight: 5.8,
    currentHeight: 58,
    vaccineCompletion: 75,
    overdueVaccines: 0,
    lastCheckup: '2026-01-20',
    nextAppointment: '2026-02-05',
    growthStatus: 'normal',
  },
  {
    id: '2',
    firstName: 'Kasun',
    lastName: 'Silva',
    dateOfBirth: '2025-05-20',
    gender: 'male',
    bloodType: 'A+',
    parentName: 'Nethmi Silva',
    parentPhone: '+94 71 234 5678',
    birthWeight: 3.5,
    birthHeight: 52,
    currentWeight: 8.2,
    currentHeight: 68,
    vaccineCompletion: 90,
    overdueVaccines: 1,
    lastCheckup: '2026-01-15',
    nextAppointment: '2026-01-30',
    growthStatus: 'normal',
  },
  {
    id: '3',
    firstName: 'Tharindu',
    lastName: 'Perera',
    dateOfBirth: '2025-09-28',
    gender: 'male',
    bloodType: 'B+',
    parentName: 'Amaya Perera',
    parentPhone: '+94 76 345 6789',
    birthWeight: 2.9,
    birthHeight: 48,
    currentWeight: 5.1,
    currentHeight: 55,
    vaccineCompletion: 50,
    overdueVaccines: 2,
    lastCheckup: '2026-01-10',
    nextAppointment: '2026-01-28',
    growthStatus: 'below_average',
  },
  {
    id: '4',
    firstName: 'Dinithi',
    lastName: 'Herath',
    dateOfBirth: '2024-08-10',
    gender: 'female',
    bloodType: 'AB+',
    parentName: 'Rashmi Herath',
    parentPhone: '+94 77 456 7890',
    birthWeight: 3.3,
    birthHeight: 51,
    currentWeight: 10.5,
    currentHeight: 76,
    vaccineCompletion: 100,
    overdueVaccines: 0,
    lastCheckup: '2026-01-25',
    nextAppointment: '2026-02-20',
    growthStatus: 'normal',
  },
  {
    id: '5',
    firstName: 'Nipun',
    lastName: 'Bandara',
    dateOfBirth: '2025-12-05',
    gender: 'male',
    bloodType: 'O-',
    parentName: 'Kumari Bandara',
    parentPhone: '+94 71 567 8901',
    birthWeight: 3.1,
    birthHeight: 49,
    currentWeight: 4.2,
    currentHeight: 53,
    vaccineCompletion: 25,
    overdueVaccines: 0,
    lastCheckup: '2026-01-22',
    nextAppointment: '2026-02-10',
    growthStatus: 'normal',
  },
  {
    id: '6',
    firstName: 'Kavindi',
    lastName: 'Jayawardena',
    dateOfBirth: '2025-04-18',
    gender: 'female',
    bloodType: 'A-',
    parentName: 'Dilani Jayawardena',
    parentPhone: '+94 76 678 9012',
    birthWeight: 3.0,
    birthHeight: 50,
    currentWeight: 8.8,
    currentHeight: 70,
    vaccineCompletion: 80,
    overdueVaccines: 1,
    lastCheckup: '2026-01-18',
    nextAppointment: '2026-02-01',
    growthStatus: 'above_average',
  },
];

const calculateAge = (dateOfBirth: string) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
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
    default:
      return <Badge variant="info">Normal</Badge>;
  }
};

export default function ChildrenPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGender, setFilterGender] = useState('all');
  const [filterVaccine, setFilterVaccine] = useState('all');
  const [selectedChild, setSelectedChild] = useState<typeof mockChildren[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredChildren = mockChildren.filter((child) => {
    const fullName = `${child.firstName} ${child.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      child.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGender = filterGender === 'all' || child.gender === filterGender;
    const matchesVaccine = filterVaccine === 'all' ||
      (filterVaccine === 'overdue' && child.overdueVaccines > 0) ||
      (filterVaccine === 'complete' && child.vaccineCompletion === 100);
    return matchesSearch && matchesGender && matchesVaccine;
  });

  const totalChildren = mockChildren.length;
  const overdueVaccineCount = mockChildren.filter(c => c.overdueVaccines > 0).length;
  const underOneYear = mockChildren.filter(c => differenceInMonths(new Date(), new Date(c.dateOfBirth)) < 12).length;

  return (
    <MainLayout>
      <Header
        title="Children Management"
        subtitle={`${totalChildren} children being monitored`}
        actions={
          <Button icon={Plus} variant="primary">
            Register Child
          </Button>
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
            <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
            <p className="text-sm text-slate-500">Growth Checks Due</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
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
                    {age} • {child.bloodType}
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
                        {child.currentWeight} kg
                      </span>
                      <span className="flex items-center gap-1">
                        <Ruler className="w-3 h-3" />
                        {child.currentHeight} cm
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
                    {format(new Date(child.nextAppointment), 'MMM d')}
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

      {filteredChildren.length === 0 && (
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
                  {calculateAge(selectedChild.dateOfBirth)} • {selectedChild.gender === 'male' ? 'Male' : 'Female'} • {selectedChild.bloodType}
                </p>
                <p className="text-sm text-slate-400">
                  Born: {format(new Date(selectedChild.dateOfBirth), 'MMMM d, yyyy')}
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
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedChild.currentWeight} kg</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-center">
                <Ruler className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-sm text-slate-500">Height</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedChild.currentHeight} cm</p>
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
                <p className="font-semibold text-slate-900 dark:text-white">{selectedChild.birthWeight} kg</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <p className="text-sm text-slate-500">Birth Height</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedChild.birthHeight} cm</p>
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
