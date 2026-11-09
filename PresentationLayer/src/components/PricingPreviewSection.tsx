import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Sparkles, Building2, Store, Rocket, Info } from 'lucide-react';
import { EarlyAccessDialog } from '@/components/EarlyAccessDialog';

export const PricingPreviewSection: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Starter Concept');

  const handleOpenDialog = (planName: string) => {
    setSelectedPlan(planName);
    setDialogOpen(true);
  };

  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
            PLANS & EARLY ACCESS
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
            Built to grow with your store.
          </h2>
          <p className="text-zinc-600 mt-3 text-sm sm:text-base leading-relaxed">
            Flexible deployment concepts tailored for boutique collections, scaling multibrand retailers, and high-volume fashion storefronts.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono text-amber-800 bg-amber-50 border border-amber-200">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>Planned subscription concepts • Final pricing announced prior to general availability</span>
          </div>
        </div>

        {/* 3 Pricing Concept Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* STARTER */}
          <div className="bg-[#FAFAFC] rounded-3xl border border-zinc-200/90 p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-800">
                  <Store className="w-5 h-5 text-indigo-600" />
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Plan Concept</span>
              </div>

              <h3 className="text-2xl font-black text-[#0F1117] font-heading tracking-tight">Starter</h3>
              <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">
                For smaller fashion retailers establishing structured sizing and transparent garment charts.
              </p>

              <div className="my-6 pb-6 border-b border-zinc-200/80">
                <span className="text-xl font-black text-zinc-900 font-heading">Pricing TBA</span>
                <span className="text-xs text-zinc-500 block mt-0.5">Announced at partner beta release</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Structured garment measurement mapping</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Technical 2D visual fit ease preview</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Core size prediction classification</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Standard email technical support</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Access to developer reference schemas</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-200/80">
              <Button
                type="button"
                onClick={() => handleOpenDialog('Starter Plan Concept')}
                variant="outline"
                className="w-full border-zinc-200 hover:border-indigo-600 hover:text-indigo-600 font-bold text-xs py-5 rounded-xl transition-all"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* GROWTH (Prominent Featured Card) */}
          <div className="bg-white rounded-3xl border-2 border-indigo-600 p-8 flex flex-col justify-between shadow-[0_12px_40px_rgba(79,70,229,0.08)] relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white font-mono text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Featured Plan Concept
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Rocket className="w-5 h-5 text-indigo-600" />
                </span>
                <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-wider font-bold">Recommended</span>
              </div>

              <h3 className="text-2xl font-black text-[#0F1117] font-heading tracking-tight">Growth</h3>
              <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">
                For expanding ecommerce stores seeking automated sizing recommendations and footwear measurement.
              </p>

              <div className="my-6 pb-6 border-b border-zinc-100">
                <span className="text-xl font-black text-indigo-950 font-heading">Pricing TBA</span>
                <span className="text-xs text-zinc-500 block mt-0.5">Announced at partner beta release</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Everything in Starter concept</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Calibrated ML size intelligence</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>AR footwear sizing integration (prototype)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Storefront embed widget (roadmap)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Priority integration onboarding</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Catalog batch measurement mapping</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-100">
              <Button
                type="button"
                onClick={() => handleOpenDialog('Growth Plan Concept')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-5 rounded-xl shadow-md transition-all"
              >
                <span>Request Early Access</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* ENTERPRISE */}
          <div className="bg-[#FAFAFC] rounded-3xl border border-zinc-200/90 p-8 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 transition-all duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-10 h-10 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-800">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </span>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Plan Concept</span>
              </div>

              <h3 className="text-2xl font-black text-[#0F1117] font-heading tracking-tight">Enterprise</h3>
              <p className="text-zinc-600 text-xs mt-1.5 leading-relaxed">
                For larger retail brands requiring custom model calibration, ERP ingestion, and tailored integration support.
              </p>

              <div className="my-6 pb-6 border-b border-zinc-200/80">
                <span className="text-xl font-black text-zinc-900 font-heading">Custom Scoping</span>
                <span className="text-xs text-zinc-500 block mt-0.5">Tailored to catalog volume & requirements</span>
              </div>

              <div className="space-y-3 text-xs text-zinc-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Everything in Growth concept</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Custom ML calibration on historical return data</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Dedicated technical solutions engineer</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Custom ERP / PIM catalog ingestion</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Enterprise uptime & performance SLA</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-zinc-200/80">
              <Button
                type="button"
                onClick={() => handleOpenDialog('Enterprise Plan Concept')}
                variant="outline"
                className="w-full border-zinc-200 hover:border-indigo-600 hover:text-indigo-600 font-bold text-xs py-5 rounded-xl transition-all"
              >
                <span>Contact Us for Early Scoping</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EarlyAccessDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedPlan={selectedPlan}
      />
    </section>
  );
};

