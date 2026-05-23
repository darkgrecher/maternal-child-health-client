/**
 * Activities Page
 * 
 * Displays activity log and recent events across all patients
 */

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Activity,
  Search,
  Heart,
  Baby,
  Syringe,
  TrendingUp,
  Calendar,
  User,
  Clock,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { MainLayout, Header } from '../components/main-layout';
import {
  Card,
  Button,
  Badge,
  Avatar,
  Input,
  Select,
  EmptyState,
  Modal,
  Alert,
} from '../components/ui';
import apiClient from '../lib/api-client';
import { useChildStore } from '../lib/stores';
import type { ApiResponse, ChildProfile } from '../lib/types';

interface ApiActivity {
  id: string;
  childId: string;
  type: string;
  title: string;
  description?: string | null;
  date: string;
  icon?: string | null;
  child?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface UiActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  childName: string;
  parentName: string;
  dateTime: string;
  icon: typeof Activity;
  color: string;
  bgColor: string;
}

const getActivityTypeConfig = (type: string) => {
  switch (type) {
    case 'vaccination':
      return { icon: Syringe, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Vaccination' };
    case 'growth':
      return { icon: TrendingUp, color: 'text-emerald-500', bgColor: 'bg-emerald-100', label: 'Growth' };
    case 'milestone':
      return { icon: Baby, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Milestone' };
    case 'appointment':
      return { icon: Calendar, color: 'text-indigo-500', bgColor: 'bg-indigo-100', label: 'Appointment' };
    case 'checkup':
      return { icon: Heart, color: 'text-pink-500', bgColor: 'bg-pink-100', label: 'Checkup' };
    default:
      return { icon: Activity, color: 'text-amber-500', bgColor: 'bg-amber-100', label: type };
  }
};

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
  const { children, isLoading: childrenLoading, error: childrenError, fetchChildren } = useChildStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activities, setActivities] = useState<ApiActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesError, setActivitiesError] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<UiActivity | null>(null);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  useEffect(() => {
    let isCancelled = false;

    const loadActivities = async () => {
      setActivitiesLoading(true);
      setActivitiesError('');

      try {
        const response = await apiClient.get<ApiResponse<ApiActivity[]>>('/activity');
        if (!isCancelled) {
          setActivities(response.data ?? []);
        }
      } catch (error) {
        if (!isCancelled) {
          setActivitiesError((error as Error).message || 'Failed to load activities');
        }
      } finally {
        if (!isCancelled) {
          setActivitiesLoading(false);
        }
      }
    };

    loadActivities();

    return () => {
      isCancelled = true;
    };
  }, []);

  const childLookup = useMemo(() => {
    return new Map(children.map((child) => [child.id, child]));
  }, [children]);

  const getChildName = (activity: ApiActivity) => {
    if (activity.child) {
      return `${activity.child.firstName} ${activity.child.lastName}`.trim();
    }
    const child = childLookup.get(activity.childId);
    if (!child) return 'Unknown Child';
    return `${child.firstName} ${child.lastName}`.trim();
  };

  const getParentName = (child?: ChildProfile) =>
    child?.motherName || child?.fatherName || 'Not provided';

  const uiActivities = useMemo<UiActivity[]>(() => {
    return activities.map((activity) => {
      const child = childLookup.get(activity.childId);
      const childName = getChildName(activity);
      const parentName = getParentName(child);
      const config = getActivityTypeConfig(activity.type);

      return {
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description || 'No additional details provided.',
        childName,
        parentName,
        dateTime: activity.date,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor,
      };
    });
  }, [activities, childLookup]);

  const filteredActivities = uiActivities.filter((activity) => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
  }, {} as Record<string, UiActivity[]>);

  const errorMessage = activitiesError || childrenError || '';
  const isLoading = activitiesLoading || childrenLoading;

  return (
    <MainLayout>
      <Header
        title="Activity Log"
        subtitle="Recent activities and events"
      />

      {errorMessage && (
        <Alert variant="warning" title="Unable to load activities" icon={AlertCircle} className="mt-4">
          {errorMessage}
        </Alert>
      )}

      {/* Activity Detail Modal */}
      <Modal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title="Activity Details"
        size="md"
      >
        {selectedActivity && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${selectedActivity.bgColor}`}>
                <selectedActivity.icon className={`w-5 h-5 ${selectedActivity.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-500">
                  {getActivityTypeConfig(selectedActivity.type).label}
                </p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedActivity.title}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={selectedActivity.childName} />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {selectedActivity.childName}
                  </p>
                  <p className="text-sm text-slate-500">
                    Parent: {selectedActivity.parentName}
                  </p>
                </div>
              </div>
              <div className="text-sm text-slate-500 space-y-1">
                <p>
                  <Calendar className="inline-block w-4 h-4 mr-2" />
                  {format(new Date(selectedActivity.dateTime), 'MMMM d, yyyy')}
                </p>
                <p>
                  <Clock className="inline-block w-4 h-4 mr-2" />
                  {format(new Date(selectedActivity.dateTime), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Details</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {selectedActivity.description}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="ghost" icon={X} onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-xl bg-pink-100">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {uiActivities.filter((activity) => activity.type === 'checkup').length}
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
              {uiActivities.filter((activity) => activity.type === 'vaccination').length}
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
              {uiActivities.filter((activity) => activity.type === 'growth').length}
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
              {uiActivities.filter((activity) => activity.type === 'milestone').length}
            </p>
            <p className="text-sm text-slate-500">Milestones</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
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
              { value: 'growth', label: 'Growth' },
              { value: 'milestone', label: 'Milestones' },
              { value: 'appointment', label: 'Appointments' },
              { value: 'checkup', label: 'Checkups' },
            ]}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full sm:w-48"
          />
        </div>
      </Card>

      {/* Activity Timeline */}
      {isLoading ? (
        <Card className="p-6 text-center text-slate-500">Loading activities...</Card>
      ) : filteredActivities.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activities found"
          description="Try adjusting your search or filter criteria"
        />
      ) : (
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
                  <Card
                    key={activity.id}
                    hover
                    className="relative"
                    onClick={() => setSelectedActivity(activity)}
                  >
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
                          <Badge variant="default" size="sm">
                            {getActivityTypeConfig(activity.type).label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500 mb-2">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {activity.childName}
                            {activity.parentName && ` (${activity.parentName})`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getRelativeTime(activity.dateTime)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={ChevronRight}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedActivity(activity);
                        }}
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
