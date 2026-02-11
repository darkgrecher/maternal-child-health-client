/**
 * Admin Dashboard Page
 * 
 * Main admin dashboard with system overview, user management, and analytics
 */

'use client';

import React, { useState } from 'react';
import {
  Users,
  Baby,
  Heart,
  Shield,
  AlertTriangle,
  BarChart3,
  Server,
  Database,
  RefreshCw,
  MoreHorizontal,
  UserPlus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
} from 'lucide-react';
import { Card, Button, Badge, Avatar, SectionTitle } from '../components/ui';
import { AdminHeader } from './layout';

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-pink-500',
  iconBg = 'bg-pink-100 dark:bg-pink-900/30',
  trend,
  subtitle,
}) => {
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.isPositive ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{trend.value}%</span>
              <span className="text-xs text-slate-400">vs last month</span>
            </div>
          )}
          {subtitle && (
            <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </Card>
  );
};

// System Status Component
interface SystemStatusProps {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ name, status, uptime }) => {
  const statusConfig = {
    operational: { color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Operational' },
    degraded: { color: 'text-amber-500', bg: 'bg-amber-500', label: 'Degraded' },
    down: { color: 'text-red-500', bg: 'bg-red-500', label: 'Down' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${config.bg}`} />
        <span className="font-medium text-slate-900 dark:text-white">{name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-500">{uptime}</span>
        <Badge variant={status === 'operational' ? 'success' : status === 'degraded' ? 'warning' : 'error'}>
          {config.label}
        </Badge>
      </div>
    </div>
  );
};

// Recent Activity Item
interface ActivityItemProps {
  user: string;
  action: string;
  time: string;
  type: 'user' | 'system' | 'alert';
}

const ActivityItem: React.FC<ActivityItemProps> = ({ user, action, time, type }) => {
  const typeConfig = {
    user: { icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    system: { icon: Server, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    alert: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
      <div className={`p-2 rounded-lg ${config.bg}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 dark:text-white">
          <span className="font-medium">{user}</span> {action}
        </p>
        <p className="text-xs text-slate-400 mt-1">{time}</p>
      </div>
    </div>
  );
};

// User Row Component
interface UserRowProps {
  name: string;
  email: string;
  role: string;
  district: string;
  status: 'active' | 'inactive';
  lastActive: string;
}

const UserRow: React.FC<UserRowProps> = ({ name, email, role, district, status, lastActive }) => {
  return (
    <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="sm" />
          <div>
            <p className="font-medium text-slate-900 dark:text-white">{name}</p>
            <p className="text-xs text-slate-500">{email}</p>
          </div>
        </div>
      </td>
      <td className="py-4 px-4">
        <Badge variant={role === 'Admin' ? 'info' : 'default'}>{role}</Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-slate-600 dark:text-slate-400">{district}</span>
      </td>
      <td className="py-4 px-4">
        <Badge variant={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </Badge>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-slate-500">{lastActive}</span>
      </td>
      <td className="py-4 px-4">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </button>
      </td>
    </tr>
  );
};

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState('7d');

  // Mock data
  const stats = [
    {
      title: 'Total Users',
      value: '524',
      icon: Users,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active Midwives',
      value: '486',
      icon: Heart,
      iconColor: 'text-pink-500',
      iconBg: 'bg-pink-100 dark:bg-pink-900/30',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Patients Registered',
      value: '15,234',
      icon: Baby,
      iconColor: 'text-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      trend: { value: 23, isPositive: true },
    },
    {
      title: 'System Alerts',
      value: '3',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      trend: { value: 50, isPositive: false },
    },
  ];

  const systemServices = [
    { name: 'API Server', status: 'operational' as const, uptime: '99.99%' },
    { name: 'Database', status: 'operational' as const, uptime: '99.95%' },
    { name: 'Authentication', status: 'operational' as const, uptime: '100%' },
    { name: 'File Storage', status: 'degraded' as const, uptime: '98.5%' },
    { name: 'Email Service', status: 'operational' as const, uptime: '99.8%' },
  ];

  const recentActivity = [
    { user: 'Admin User', action: 'created a new midwife account', time: '2 minutes ago', type: 'user' as const },
    { user: 'System', action: 'completed daily backup', time: '1 hour ago', type: 'system' as const },
    { user: 'Alert', action: 'High memory usage detected on server', time: '3 hours ago', type: 'alert' as const },
    { user: 'Dr. Priya', action: 'updated patient records', time: '5 hours ago', type: 'user' as const },
    { user: 'System', action: 'security scan completed', time: '6 hours ago', type: 'system' as const },
  ];

  const recentUsers = [
    {
      name: 'Dr. Priya Jayawardena',
      email: 'priya.j@health.gov.lk',
      role: 'Senior Midwife',
      district: 'Colombo',
      status: 'active' as const,
      lastActive: '2 mins ago',
    },
    {
      name: 'Kumari Silva',
      email: 'kumari.s@health.gov.lk',
      role: 'Midwife',
      district: 'Gampaha',
      status: 'active' as const,
      lastActive: '15 mins ago',
    },
    {
      name: 'Nimal Fernando',
      email: 'nimal.f@health.gov.lk',
      role: 'Admin',
      district: 'Kandy',
      status: 'active' as const,
      lastActive: '1 hour ago',
    },
    {
      name: 'Samantha Perera',
      email: 'samantha.p@health.gov.lk',
      role: 'Midwife',
      district: 'Galle',
      status: 'inactive' as const,
      lastActive: '2 days ago',
    },
  ];

  const districtStats = [
    { name: 'Colombo', midwives: 85, patients: 4234, vaccinations: 1250 },
    { name: 'Gampaha', midwives: 72, patients: 3521, vaccinations: 980 },
    { name: 'Kandy', midwives: 58, patients: 2890, vaccinations: 820 },
    { name: 'Galle', midwives: 45, patients: 2156, vaccinations: 650 },
    { name: 'Kurunegala', midwives: 41, patients: 1987, vaccinations: 590 },
  ];

  return (
    <>
      <AdminHeader
        title="Admin Dashboard"
        subtitle="System overview and management"
        actions={
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-900 dark:text-white border-none outline-none cursor-pointer"
            >
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <Button icon={RefreshCw} variant="secondary">
              Refresh
            </Button>
            <Button icon={Download}>
              Export
            </Button>
          </div>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* System Status */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">System Status</h3>
            <Badge variant="success">All Systems Operational</Badge>
          </div>
          <div>
            {systemServices.map((service, index) => (
              <SystemStatus key={index} {...service} />
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <button className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              View All
            </button>
          </div>
          <div>
            {recentActivity.map((activity, index) => (
              <ActivityItem key={index} {...activity} />
            ))}
          </div>
        </Card>
      </div>

      {/* District Overview */}
      <div className="mb-8">
        <SectionTitle title="District Overview" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {districtStats.map((district, index) => (
            <Card key={index} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <MapPin className="w-4 h-4 text-pink-500" />
                <h4 className="font-semibold text-slate-900 dark:text-white">{district.name}</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Midwives</span>
                  <span className="font-medium text-slate-900 dark:text-white">{district.midwives}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Patients</span>
                  <span className="font-medium text-slate-900 dark:text-white">{district.patients.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Vaccinations</span>
                  <span className="font-medium text-slate-900 dark:text-white">{district.vaccinations.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* User Management Table */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Users</h3>
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={UserPlus}>
              Add User
            </Button>
            <button className="text-sm text-pink-500 hover:text-pink-600 font-medium">
              View All Users
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">User</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Role</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">District</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Last Active</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((user, index) => (
                <UserRow key={index} {...user} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card hover className="cursor-pointer text-center">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-3">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <h4 className="font-medium text-slate-900 dark:text-white">Manage Users</h4>
          <p className="text-xs text-slate-500 mt-1">Add, edit, or remove users</p>
        </Card>
        <Card hover className="cursor-pointer text-center">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 w-fit mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-purple-500" />
          </div>
          <h4 className="font-medium text-slate-900 dark:text-white">View Analytics</h4>
          <p className="text-xs text-slate-500 mt-1">Detailed system analytics</p>
        </Card>
        <Card hover className="cursor-pointer text-center">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 w-fit mx-auto mb-3">
            <Database className="w-6 h-6 text-emerald-500" />
          </div>
          <h4 className="font-medium text-slate-900 dark:text-white">Database</h4>
          <p className="text-xs text-slate-500 mt-1">Manage database backups</p>
        </Card>
        <Card hover className="cursor-pointer text-center">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 w-fit mx-auto mb-3">
            <Shield className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="font-medium text-slate-900 dark:text-white">Security</h4>
          <p className="text-xs text-slate-500 mt-1">Access control settings</p>
        </Card>
      </div>
    </>
  );
}
