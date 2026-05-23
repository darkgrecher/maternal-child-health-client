/**
 * Common UI Components for Midwife Web Application
 */

'use client';

import React from 'react';
import { clsx } from 'clsx';
import {
  Heart,
  Baby,
  Calendar,
  Users,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Syringe,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

// ============================================================================
// CARD COMPONENT
// ============================================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, onClick }) => {
  return (
    <div
      className={clsx(
        'bg-[color:var(--card-bg)] rounded-xl border border-[color:var(--border)] p-6 shadow-sm text-[color:var(--text-primary)]',
        hover && 'card-hover cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'text-[color:var(--primary)]',
  iconBg = 'bg-[color:var(--primary-light)]',
  trend,
  subtitle,
}) => {
  return (
    <Card hover className="flex items-start gap-4">
      <div className={clsx('p-3 rounded-xl', iconBg)}>
        <Icon className={clsx('w-6 h-6', iconColor)} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-[color:var(--text-secondary)] mb-1">{title}</p>
        <p className="text-2xl font-bold text-[color:var(--text-primary)]">{value}</p>
        {trend && (
          <p
            className={clsx(
              'text-sm mt-1 flex items-center gap-1',
              trend.isPositive ? 'text-emerald-500' : 'text-red-500'
            )}
          >
            <TrendingUp
              className={clsx('w-4 h-4', !trend.isPositive && 'rotate-180')}
            />
            {trend.value}% {trend.isPositive ? 'increase' : 'decrease'}
          </p>
        )}
        {subtitle && (
          <p className="text-xs text-[color:var(--text-muted)] mt-1">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};

// ============================================================================
// BUTTON COMPONENT
// ============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'btn-primary text-white',
    secondary: 'btn-secondary',
    outline: 'border-2 border-[color:var(--primary)] text-[color:var(--primary)] hover:bg-[color:var(--primary-light)]',
    ghost: 'text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-elevated)]',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };

  return (
    <button
      className={clsx(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </>
      )}
    </button>
  );
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const variants = {
    default: 'bg-[color:var(--surface-elevated)] text-[color:var(--text-secondary)]',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
};

// ============================================================================
// PROGRESS BAR COMPONENT
// ============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = 'bg-[color:var(--primary)]',
  size = 'md',
  showLabel = false,
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      <div className={clsx('w-full bg-[color:var(--border)] rounded-full overflow-hidden', sizes[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-sm text-[color:var(--text-secondary)] mt-1">{Math.round(percentage)}%</p>
      )}
    </div>
  );
};

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'md', className }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full gradient-primary flex items-center justify-center text-white font-semibold',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

// ============================================================================
// SECTION TITLE COMPONENT
// ============================================================================

interface SectionTitleProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ title, subtitle, action, children }) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div>
        <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">{title || children}</h2>
        {subtitle && <p className="text-sm text-[color:var(--text-secondary)]">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-full bg-[color:var(--surface-elevated)] mb-4">
        <Icon className="w-8 h-8 text-[color:var(--text-muted)]" />
      </div>
      <h3 className="text-lg font-medium text-[color:var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[color:var(--text-secondary)] max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
};

// ============================================================================
// LOADING SPINNER COMPONENT
// ============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div
      className={clsx(
        'border-[color:var(--primary)] border-t-transparent rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
};

// ============================================================================
// ALERT COMPONENT
// ============================================================================

interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ variant, title, children, icon, className }) => {
  const variants = {
    info: {
      container: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      icon: 'text-blue-500',
      title: 'text-blue-800 dark:text-blue-300',
      text: 'text-blue-700 dark:text-blue-400',
    },
    success: {
      container: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800',
      icon: 'text-emerald-500',
      title: 'text-emerald-800 dark:text-emerald-300',
      text: 'text-emerald-700 dark:text-emerald-400',
    },
    warning: {
      container: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
      icon: 'text-amber-500',
      title: 'text-amber-800 dark:text-amber-300',
      text: 'text-amber-700 dark:text-amber-400',
    },
    error: {
      container: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      icon: 'text-red-500',
      title: 'text-red-800 dark:text-red-300',
      text: 'text-red-700 dark:text-red-400',
    },
  };

  const defaultIcons = {
    info: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertTriangle,
  };

  const Icon = icon || defaultIcons[variant];

  return (
    <div className={clsx('rounded-lg border p-4 flex gap-3', variants[variant].container, className)}>
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', variants[variant].icon)} />
      <div>
        {title && <p className={clsx('font-medium mb-1', variants[variant].title)}>{title}</p>}
        <div className={clsx('text-sm', variants[variant].text)}>{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// INPUT COMPONENT
// ============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative group">
          {Icon && (
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[color:var(--text-muted)] group-focus-within:text-[color:var(--primary)] transition-colors" />
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-4 py-2.5 text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] focus:bg-[color:var(--surface)] shadow-sm hover:border-[color:var(--primary-light)] transition-all',
              Icon && 'pl-11',
              error && 'border-red-500 focus:ring-red-500/40 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================================================
// SELECT COMPONENT
// ============================================================================

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className={clsx('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-[color:var(--text-secondary)] mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] pl-4 pr-10 py-2.5 text-sm text-[color:var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] focus:border-[color:var(--primary)] focus:bg-[color:var(--surface)] shadow-sm hover:border-[color:var(--primary-light)] transition-all cursor-pointer',
              error && 'border-red-500 focus:ring-red-500/40 focus:border-red-500'
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--text-muted)] pointer-events-none" />
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

// ============================================================================
// MODAL COMPONENT
// ============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={clsx(
          'relative w-full max-h-[90vh] bg-[color:var(--card-bg)] rounded-2xl shadow-xl animate-slide-up flex flex-col',
          sizes[size]
        )}
      >
        <div className="flex items-center justify-between p-6 border-b border-[color:var(--border)]">
          <h2 className="text-lg font-semibold text-[color:var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[color:var(--surface-elevated)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
};

// ============================================================================
// TABLE COMPONENT
// ============================================================================

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">{emptyMessage}</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[640px] w-full">
        <thead>
          <tr className="border-b border-[color:var(--border)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={clsx(
                  'px-4 py-3 text-left text-sm font-semibold text-[color:var(--text-secondary)]',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={clsx(
                'border-b border-[color:var(--border)] hover:bg-[color:var(--surface-elevated)] transition-colors',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-sm text-[color:var(--text-primary)]',
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : (item as Record<string, unknown>)[column.key]?.toString()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
