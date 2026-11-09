import React from 'react';
import { Store, ArrowRight, Play, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface MerchantFirstTimeOnboardingProps {
  onCreateStoreClick: () => void;
}

export const MerchantFirstTimeOnboarding: React.FC<MerchantFirstTimeOnboardingProps> = ({
  onCreateStoreClick,
}) => {
  return (
    <div className="max-w-2xl mx-auto py-8 sm:py-16 px-4 animate-in fade-in-50 duration-300">
      {/* Onboarding Hero Card strictly matching the user-approved design */}
      <div className="rounded-2xl border border-zinc-800/80 bg-[#0C0E14] text-white p-7 sm:p-9 shadow-2xl relative overflow-hidden">
        {/* Subtle radial ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

        <div className="relative z-10 space-y-6">
          {/* Header tag and icon */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              FITVISION CONSOLE
            </span>
            <div className="text-zinc-400 hover:text-white transition-colors">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
          </div>

          {/* Headline & Subtitle */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-heading">
              Welcome to FitVision
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Set up your store to start delivering smarter size recommendations.
            </p>
          </div>

          {/* Action Card Inner Container */}
          <div className="rounded-xl border border-zinc-800 bg-[#141721]/90 p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4 text-zinc-300" />
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Start with your store
                </h2>
              </div>
              <p className="text-xs text-zinc-400 pl-6 sm:pl-6 leading-relaxed">
                Create your first store and prepare its product catalog.
              </p>
            </div>

            <Button
              onClick={onCreateStoreClick}
              size="lg"
              className="w-full bg-[#4F46E5] hover:bg-indigo-600 active:bg-indigo-700 text-white font-semibold text-xs sm:text-sm h-11 rounded-xl shadow-md transition-all group flex items-center justify-center gap-2"
            >
              <span>Create Your Store</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Secondary Action: Explore interactive demo */}
          <div className="pt-1">
            <Link
              to="/recommendation"
              className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors group"
            >
              <div className="w-5 h-5 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-300 group-hover:text-white transition-colors">
                <Play className="w-2.5 h-2.5 fill-current" />
              </div>
              <span className="font-medium">Explore the interactive demo</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantFirstTimeOnboarding;


