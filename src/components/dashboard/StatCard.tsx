import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-chart-1/10 border-chart-1/20',
  warning: 'bg-chart-4/10 border-chart-4/20',
  danger: 'bg-destructive/10 border-destructive/20',
};

const iconStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-chart-1 text-foreground',
  warning: 'bg-chart-4 text-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

const StatCard = ({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) => {
  return (
    <Card className={cn('transition-all duration-300 hover:shadow-lg', variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-chart-1' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
