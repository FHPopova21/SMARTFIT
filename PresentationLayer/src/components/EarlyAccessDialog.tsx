import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShoppingBag, Sliders, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EarlyAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPlan?: string;
}

export const EarlyAccessDialog: React.FC<EarlyAccessDialogProps> = ({
  open,
  onOpenChange,
  selectedPlan = 'Early Access Partner Program'
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 sm:p-8 rounded-3xl bg-white border border-zinc-200 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono text-[10px] uppercase font-bold tracking-wider">
              {selectedPlan}
            </Badge>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Private Preview
            </span>
          </div>

          <DialogTitle className="text-2xl font-black text-[#0F1117] font-heading tracking-tight">
            Join the FitVision Early Access Program
          </DialogTitle>

          <DialogDescription className="text-zinc-600 text-xs sm:text-sm leading-relaxed">
            We are partnering with select fashion brands to validate custom sizing workflows prior to public release.
          </DialogDescription>
        </DialogHeader>

        {/* Status disclosure */}
        <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4 space-y-2 text-xs text-zinc-700">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Open Public Demos:</strong> You do not need an approved merchant account to explore our catalog, size recommendation flow, or AR footwear scanner today.
            </span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Automated Billing & Self-Service SDK:</strong> Currently in engineering development. Pricing and subscription tiers are not yet finalized.
            </span>
          </div>
        </div>

        {/* Immediate Supported Actions */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-mono font-bold uppercase text-zinc-400 block tracking-wider">
            Explore Available Features:
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Link
              to="/clothing"
              onClick={() => onOpenChange(false)}
              className="p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-500/40 hover:bg-indigo-50/20 transition-all flex items-center justify-between text-xs font-bold text-zinc-900 group"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-indigo-600" />
                <span>Demo Catalog</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <Link
              to="/recommendation"
              onClick={() => onOpenChange(false)}
              className="p-3.5 rounded-xl border border-zinc-200 hover:border-indigo-500/40 hover:bg-indigo-50/20 transition-all flex items-center justify-between text-xs font-bold text-zinc-900 group"
            >
              <div className="flex items-center gap-2.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Recommendation Flow</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="pt-2">
            <Link
              to="/signup"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all"
            >
              <span>Register Merchant Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

