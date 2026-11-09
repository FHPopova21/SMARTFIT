import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryText?: string;
  secondaryHref?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  badge,
  actionText,
  actionHref,
  onAction,
  secondaryText,
  secondaryHref,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-[#E9EAF3] bg-white/60 transition-colors ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="w-14 h-14 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-xs">
        <Icon className="w-7 h-7" aria-hidden="true" />
      </div>

      {badge && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 mb-2 font-mono">
          {badge}
        </span>
      )}

      <h3 className="text-base sm:text-lg font-bold text-[#0F1117] tracking-tight mb-1.5">
        {title}
      </h3>

      <p className="text-xs sm:text-sm text-zinc-500 max-w-md leading-relaxed mb-6">
        {description}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionText && actionHref && (
          <Button
            asChild
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm rounded-xl px-4 py-2 shadow-xs transition-colors"
          >
            <Link to={actionHref}>{actionText}</Link>
          </Button>
        )}

        {actionText && onAction && !actionHref && (
          <Button
            onClick={onAction}
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-medium text-xs sm:text-sm rounded-xl px-4 py-2 shadow-xs transition-colors"
          >
            {actionText}
          </Button>
        )}

        {secondaryText && secondaryHref && (
          <Button
            asChild
            variant="outline"
            className="border-[#E9EAF3] bg-white hover:bg-zinc-50 text-zinc-700 font-medium text-xs sm:text-sm rounded-xl px-4 py-2 transition-colors"
          >
            <Link to={secondaryHref}>{secondaryText}</Link>
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;

