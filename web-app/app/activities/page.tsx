/**
 * Activities Page
 * 
 * Displays activity log and recent events across all patients
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  Search,
  Filter,
  Heart,
  Baby,
  Syringe,
  TrendingUp,
  Calendar,
  FileText,
  User,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { MainLayout, Header } from '../components/layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  SectionTitle,
  Input,
  Select,
  EmptyState,
} from '../components/ui';

// Mock activities data
const mockActivities = [
  {
    id: '1',
    type: 'vaccination',
    title: 'BCG Vaccination Completed',
    description: 'Administered BCG vaccine at birth',
    patient: 'Baby Nethara',
    parentName: 'Kumari Perera',
    dateTime: '2026-01-28T09:30:00',
    icon: Syringe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    id: '2',
    type: 'prenatal',
    title: 'Prenatal Checkup - Week 24',
    description: 'Regular checkup completed. Blood pressure normal.',
    patient: 'Kumari Perera',
    dateTime: '2026-01-28T10:00:00',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100',
  },
  {
    id: '3',
    type: 'growth',
    title: 'Growth Measurement Recorded',
    description: 'Weight: 6.2kg, Height: 62cm',
    patient: 'Kavindu Fernando',
    parentName: 'Sithumi Fernando',
    dateTime: '2026-01-28T11:15:00',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
  },
  {
    id: '4',
    type: 'appointment',
    title: 'New Appointment Scheduled',
    description: 'Prenatal checkup scheduled for Feb 5, 2026',
    patient: 'Dilhani Fernando',
    dateTime: '2026-01-28T14:00:00',
    icon: Calendar,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  {
    id: '5',
    type: 'registration',
    title: 'New Pregnancy Registered',
    description: 'EDD: August 15, 2026 - First pregnancy',
    patient: 'Nethmi Silva',
    dateTime: '2026-01-27T15:30:00',
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100',
  },
  {
    id: '6',
    type: 'vaccination',
    title: 'DTP-HepB-Hib Dose 1',
    description: 'Pentavalent vaccine administered',
    patient: 'Isuri Bandara',
    parentName: 'Malini Bandara',
    dateTime: '2026-01-27T10:00:00',
    icon: Syringe,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  {
    id: '7',
    type: 'delivery',
    title: 'Baby Delivered',
    description: 'Normal delivery - Baby girl, 3.2kg',
    patient: 'Rashmi Jayawardena',
    dateTime: '2026-01-26T08:45:00',
    icon: Baby,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  {
    id: '8',
    type: 'checkup',
    title: 'High Risk Follow-up',
    description: 'Gestational diabetes under control',
    patient: 'Chamari Wickramasinghe',
    dateTime: '2026-01-26T11:00:00',
    icon: Activity,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
  },
  {
    id: '9',
    type: 'growth',
    title: 'Growth Concern Flagged',
    description: 'Weight below 5th percentile - Follow-up required',
    patient: 'Tharindu Perera',
    parentName: 'Amaya Perera',
    dateTime: '2026-01-25T14:30:00',
    icon: TrendingUp,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  {
    id: '10',
    type: 'registration',
    title: 'New Child Registered',
    description: 'Birth weight: 3.1kg, Normal delivery',
    patient: 'Baby Nipun',
    parentName: 'Kumari Bandara',
    dateTime: '2026-01-25T09:00:00',
    icon: Baby,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
];

const getRelativeTime = (dateTime: string) => {
  const now = new Date();
  const date = new Date(dateTime);
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
};

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    return matchesSearch && matchesType;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = format(new Date(activity.dateTime), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {} as Record<string, typeof mockActivities>);

  return (
    <MainLayout>
      <Header
        title="Activity Log"
        subtitle="Recent activities and events"
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mockActivities.filter(a => a.type === 'prenatal' || a.type === 'checkup').length}
            </p>
            <p className="text-sm text-slate-500">Checkups</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-blue-100">
            <Syringe className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mockActivities.filter(a => a.type === 'vaccination').length}
            </p>
            <p className="text-sm text-slate-500">Vaccinations</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <TrendingUp className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mockActivities.filter(a => a.type === 'growth').length}
            </p>
            <p className="text-sm text-slate-500">Growth Records</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-purple-100">
            <User className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {mockActivities.filter(a => a.type === 'registration').length}
            </p>
            <p className="text-sm text-slate-500">New Registrations</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search activities..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All Activities' },
              { value: 'vaccination', label: 'Vaccinations' },
              { value: 'prenatal', label: 'Prenatal' },
              { value: 'growth', label: 'Growth' },
              { value: 'appointment', label: 'Appointments' },
              { value: 'registration', label: 'Registrations' },
              { value: 'delivery', label: 'Deliveries' },
            ]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, activities]) => (
          <div key={date}>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-sm font-medium text-slate-500">
                {format(new Date(date), 'EEEE, MMMM d, yyyy')}
              </span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>
            
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} hover className="relative">
                  {/* Timeline connector */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
                  
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${activity.bgColor} relative z-10`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {activity.title}
                        </h3>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.patient}
                          {activity.parentName && ` (${activity.parentName})`}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getRelativeTime(activity.dateTime)}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" icon={ChevronRight} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredActivities.length === 0 && (
        <EmptyState
          icon={Activity}
          title="No activities found"
          description="Try adjusting your search or filter criteria"
        />
      )}
    </MainLayout>
  );
}
