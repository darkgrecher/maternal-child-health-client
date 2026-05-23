/**
 * Sidebar Navigation Component
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../lib/stores';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Users,
  Baby,
  Heart,
  Syringe,
  Calendar,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Avatar } from './ui';
import { NotificationsPanel } from './notifications-panel';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  external?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Pregnancies', href: '/pregnancies', icon: Heart },
  { name: 'Children', href: '/children', icon: Baby },
  { name: 'Vaccinations', href: '/vaccinations', icon: Syringe },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Activities', href: '/activities', icon: Activity },
  { name: 'Patients', href: '/patients', icon: Users },
];

const bottomNavItems: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
];

const ADMIN_PORTAL_URL = process.env.NEXT_PUBLIC_ADMIN_URL;

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout: storeLogout, user: storeUser } = useAuthStore();

  const isAdmin = storeUser?.role === 'admin';
  const adminPortalItem: NavItem | null = isAdmin && ADMIN_PORTAL_URL
    ? {
        name: 'Admin Portal',
        href: ADMIN_PORTAL_URL,
        icon: Shield,
        external: true,
      }
    : null;

  const visibleNavItems: NavItem[] = navItems;
  const visibleBottomItems: NavItem[] = adminPortalItem
    ? [...bottomNavItems, adminPortalItem]
    : bottomNavItems;

  const displayName = storeUser?.name || 'User';
  const displayRole = storeUser?.role || 'Midwife';

  const handleLogout = () => {
    storeLogout();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-[color:var(--card-bg)] border border-[color:var(--border)] shadow-lg lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 z-40 h-screen bg-[color:var(--card-bg)] border-r border-[color:var(--border)] transition-all duration-300 flex flex-col',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[color:var(--border)]">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-[color:var(--text-primary)]">MidwifeHub</h1>
                <p className="text-xs text-[color:var(--text-muted)]">Care Management</p>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mx-auto">
              <Heart className="w-6 h-6 text-white" />
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-[color:var(--surface-elevated)] transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-[color:var(--text-muted)]" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-[color:var(--text-muted)]" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = !item.external && pathname === item.href;
              return (
                <li key={item.name}>
                  {item.external ? (
                    <a
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-medium">{item.name}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[color:var(--primary)] text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsed && item.badge && (
                        <span className="absolute left-12 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[color:var(--primary)] text-white">
                          {item.badge}
                        </span>
                      )}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                        isActive
                          ? 'bg-[color:var(--primary-light)] text-[color:var(--primary)]'
                          : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]'
                      )}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <item.icon className={clsx('w-5 h-5 shrink-0', isActive && 'text-[color:var(--primary)]')} />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 font-medium">{item.name}</span>
                          {item.badge && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[color:var(--primary)] text-white">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsed && item.badge && (
                        <span className="absolute left-12 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[color:var(--primary)] text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="mt-8 pt-4 border-t border-[color:var(--border)]">
            <ul className="space-y-1">
              {visibleBottomItems.map((item) => {
                const isActive = !item.external && pathname === item.href;
                return (
                  <li key={item.name}>
                    {item.external ? (
                      <a
                        href={item.href}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                          'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]'
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="font-medium">{item.name}</span>}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-[color:var(--primary-light)] text-[color:var(--primary)]'
                            : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]'
                        )}
                        onClick={() => setIsMobileOpen(false)}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="font-medium">{item.name}</span>}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[color:var(--border)]">
          <div className={clsx('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <Avatar name={displayName} size="md" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--text-primary)] truncate">
                  {displayName}
                </p>
                <p className="text-xs text-[color:var(--text-muted)] truncate capitalize">{displayRole}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4 text-[color:var(--text-muted)] hover:text-red-500" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

// ============================================================================
// HEADER COMPONENT
// ============================================================================

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showSearch?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  actions,
  showSearch = true,
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--text-primary)]">{title}</h1>
        {subtitle && <p className="text-[color:var(--text-secondary)] mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-[color:var(--surface-elevated)] border border-[color:var(--border)] rounded-xl focus-within:ring-2 focus-within:ring-[color:var(--primary)] focus-within:border-[color:var(--primary)] focus-within:bg-[color:var(--surface)] transition-all">
            <Search className="w-4 h-4 text-[color:var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-sm w-48 text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)]"
            />
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen((prev) => !prev)}
            className="relative p-2 rounded-xl hover:bg-[color:var(--surface-elevated)] transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-5 h-5 text-[color:var(--text-secondary)]" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[color:var(--primary)] rounded-full" />
          </button>
          <NotificationsPanel
            isOpen={isNotificationsOpen}
            onClose={() => setIsNotificationsOpen(false)}
          />
        </div>

        {actions}
      </div>
    </header>
  );
};

// ============================================================================
// MAIN LAYOUT COMPONENT
// ============================================================================

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen app-shell">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen p-4 lg:p-8 pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
};
