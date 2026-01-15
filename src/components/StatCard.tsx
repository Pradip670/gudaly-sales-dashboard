import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    positive?: boolean;
  };
  variant?: 'default' | 'primary' | 'accent' | 'warning';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-card',
    primary: 'chocolate-gradient text-primary-foreground',
    accent: 'gold-gradient text-sidebar',
    warning: 'bg-warning/10 border-warning/20',
  };

  const iconStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
    accent: 'bg-sidebar/20 text-sidebar',
    warning: 'bg-warning/20 text-warning',
  };

  return (
    <div className={cn('stat-card', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium mb-1',
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          )}>
            {title}
          </p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className={cn(
              'text-xs mt-1',
              variant === 'default' ? 'text-muted-foreground' : 'opacity-70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <p className={cn(
              'text-xs mt-2 flex items-center gap-1',
              trend.positive ? 'text-success' : 'text-destructive'
            )}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
