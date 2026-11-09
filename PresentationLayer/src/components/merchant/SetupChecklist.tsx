import React from 'react';
import { CheckCircle2, Circle, ArrowRight, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { deriveSetupChecklist, SetupStep } from '@/utils/merchantChecklist';

export const SetupChecklist: React.FC = () => {
  const { activeStore, openCreateStore } = useMerchantStore();
  const steps = deriveSetupChecklist(activeStore);

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const availableCount = steps.filter((s) => s.status === 'available').length;

  const getStatusIcon = (status: SetupStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
      case 'available':
        return <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'blocked':
        return <ShieldAlert className="w-5 h-5 text-zinc-400 shrink-0" />;
      case 'incomplete':
      default:
        return <Circle className="w-5 h-5 text-zinc-300 shrink-0" />;
    }
  };

  const getStatusBadge = (status: SetupStep['status'], label: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-mono font-medium">
            {label}
          </Badge>
        );
      case 'available':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[11px] font-mono font-medium">
            {label}
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px] font-mono font-medium">
            {label}
          </Badge>
        );
      case 'blocked':
        return (
          <Badge className="bg-zinc-100 text-zinc-500 border-zinc-200 text-[11px] font-mono font-medium">
            {label}
          </Badge>
        );
      case 'incomplete':
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[11px] font-mono font-medium">
            {label}
          </Badge>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E9EAF3] p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-[#E9EAF3] gap-2">
        <div>
          <h3 className="text-base font-bold text-[#0F1117] flex items-center gap-2">
            Getting Started Checklist
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
              {completedCount} of {steps.length} completed {availableCount > 0 && `• ${availableCount} prototype ready`}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Follow these steps to configure your store sizing and prepare for live storefront integration.
          </p>
        </div>
      </div>

      <div className="divide-y divide-[#E9EAF3]">
        {steps.map((step) => (
          <div
            key={step.id}
            className="py-4.5 first:pt-4 last:pb-1 flex flex-col md:flex-row md:items-start justify-between gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">{getStatusIcon(step.status)}</div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-bold text-[#0F1117]">{step.title}</h4>
                  {getStatusBadge(step.status, step.statusLabel)}
                  {step.badge && (
                    <span className="text-[11px] font-mono text-zinc-400">
                      • {step.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 max-w-xl leading-relaxed">
                  {step.description}
                </p>
                {step.note && (
                  <p className="text-[11px] text-zinc-400 italic">
                    Note: {step.note}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 md:self-center pl-8 md:pl-0">
              {step.isActionDialog && step.actionLabel && (
                <Button
                  onClick={openCreateStore}
                  size="sm"
                  className="h-8 text-xs font-semibold bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  <span>{step.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              )}

              {step.actionHref && step.actionLabel && (
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold border-[#E9EAF3] hover:border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded-xl"
                >
                  <Link to={step.actionHref}>
                    <span>{step.actionLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-indigo-500" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SetupChecklist;
