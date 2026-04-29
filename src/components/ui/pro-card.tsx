import React from 'react';
import { cn } from '@/lib/utils';

interface ProCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Compound Component: ProCard
 * Follows the "Pro Max" enterprise standards with clear borders,
 * modern shadows, and glassmorphism support.
 */
export function ProCard({ children, className, onClick }: ProCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-slate-200/60 bg-white/80 backdrop-blur-md text-card-foreground shadow-sm transition-all duration-200 ease-in-out',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      {children}
    </div>
  );
}

ProCard.Header = function ProCardHeader({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-6 pb-3 flex items-start justify-between gap-4', className)}>
      <div className="space-y-1">
        <h3 className="font-semibold text-lg text-slate-900 leading-none tracking-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </div>
  );
};

ProCard.Body = function ProCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-6 pt-0', className)}>
      {children}
    </div>
  );
};

ProCard.Footer = function ProCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('p-6 pt-0 border-t border-slate-100 flex items-center bg-slate-50/50 rounded-b-xl mt-4', className)}>
      {children}
    </div>
  );
};
