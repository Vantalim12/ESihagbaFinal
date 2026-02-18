import { cn } from '@/lib/utils';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'flow';
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = 'default',
  delay = 0
}: StatsCardProps) {
  const variantStyles = {
    default: 'bg-card border-border/50 hover:border-border',
    accent: 'bg-accent/5 border-accent/20 hover:border-accent/40',
    success: 'bg-success/5 border-success/20 hover:border-success/40',
    warning: 'bg-warning/5 border-warning/20 hover:border-warning/40',
    flow: 'bg-flow/5 border-flow/20 hover:border-flow/40',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    accent: 'bg-accent/15 text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    flow: 'bg-flow/15 text-flow',
  };

  const glowStyles = {
    default: '',
    accent: 'hover:shadow-glow-teal',
    success: '',
    warning: '',
    flow: 'hover:shadow-glow',
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 animate-slide-up",
        variantStyles[variant],
        glowStyles[variant]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Flow accent line at top */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity",
        variant === 'flow' && "bg-gradient-flow",
        variant === 'accent' && "bg-gradient-to-r from-accent to-success",
        variant === 'success' && "bg-success",
        variant === 'warning' && "bg-warning",
        variant === 'default' && "bg-gradient-primary"
      )} />

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground animate-count-up" style={{ animationDelay: `${delay + 100}ms` }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground/80">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg",
              trend.isPositive 
                ? "bg-success/10 text-success" 
                : "bg-destructive/10 text-destructive"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground font-normal">vs last month</span>
            </div>
          )}
        </div>
        
        {/* Icon container with subtle animation */}
        <div className={cn(
          "relative shrink-0 p-3 rounded-xl transition-transform group-hover:scale-105",
          iconStyles[variant]
        )}>
          {/* Background glow */}
          <div className={cn(
            "absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity",
            variant === 'flow' && "bg-flow",
            variant === 'accent' && "bg-accent",
            variant === 'success' && "bg-success",
            variant === 'warning' && "bg-warning",
            variant === 'default' && "bg-primary"
          )} />
          <Icon className="relative h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
