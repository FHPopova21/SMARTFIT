import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShoppingBag,
  Sliders,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Info,
  Footprints
} from 'lucide-react';

interface SizeSpec {
  size: string;
  ease: string;
  chestFlat: number;
  waistFlat: number;
  label: string;
  recommended: boolean;
}

const DEMO_SPECS: Record<string, SizeSpec> = {
  S: { size: 'S', ease: '-2 cm', chestFlat: 48, waistFlat: 43, label: 'Under-ease / Snug chest', recommended: false },
  M: { size: 'M', ease: '+2 cm', chestFlat: 50.5, waistFlat: 45.5, label: 'Slim tailored silhouette', recommended: false },
  L: { size: 'L', ease: '+6 cm', chestFlat: 53, waistFlat: 48, label: 'Comfortable ease tolerance', recommended: true },
  XL: { size: 'XL', ease: '+11 cm', chestFlat: 56, waistFlat: 51, label: 'Relaxed / Generous volume', recommended: false },
};

export const InteractiveDemoSection: React.FC = () => {
  const [selectedSize, setSelectedSize] = useState<string>('L');
  const spec = DEMO_SPECS[selectedSize];

  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FAFAFC] border-b border-zinc-200/80">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
            EXPERIENCE FITVISION
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
            See smarter sizing in action.
          </h2>
          <p className="text-zinc-600 mt-3 text-sm sm:text-base leading-relaxed">
            Explore our interactive prototype and discover how personalized size recommendations could appear in an online fashion store.
          </p>
        </div>

        {/* Interactive Storefront Prototype Preview */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-[0_8px_32px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Product Preview Column (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-4/5 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200">
                <img
                  src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"
                  alt="Tailored Double-Breasted Wool Blazer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-white/95 text-zinc-900 shadow-xs border border-zinc-200/80 backdrop-blur-xs">
                    Storefront Mockup Item
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Collection: Tailored Essentials</span>
                <h3 className="text-lg font-bold text-zinc-950 font-heading">Structured Cashmere Blend Blazer</h3>
                <span className="text-sm font-semibold text-zinc-700 font-mono">€280.00</span>
              </div>
            </div>

            {/* Sizing Assistant Widget Preview Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#FAFAFC] rounded-2xl border border-zinc-200 p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200/80">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                      FV
                    </div>
                    <span className="text-xs font-bold text-zinc-900">FitVision Sizing Assistant</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                    Prototype Preview
                  </span>
                </div>

                {/* Body & Garment specs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-600 font-medium">Sample Profile:</span>
                    <span className="font-mono text-zinc-800 font-bold">Chest 98 cm • Waist 84 cm</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-zinc-600 block mb-1.5 uppercase font-medium">
                      Select Size to Preview Fit:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['S', 'M', 'L', 'XL'] as const).map((sz) => {
                        const isSelected = selectedSize === sz;
                        const isBest = sz === 'L';
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`py-2 px-3 rounded-xl border text-center transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs font-bold'
                                : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 font-medium'
                            }`}
                          >
                            <span className="block text-xs font-mono">{sz}</span>
                            <span className={`text-[9px] block ${isSelected ? 'text-indigo-100' : 'text-zinc-500'}`}>
                              {isBest ? 'Best fit' : DEMO_SPECS[sz].ease}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dimension breakdown */}
                  <div className="p-3.5 bg-white rounded-xl border border-zinc-200/80 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Calculated Chest Ease:</span>
                      <span className="font-mono font-bold text-zinc-900">{spec.ease}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-600">Garment Flat Width:</span>
                      <span className="font-mono text-zinc-800">{spec.chestFlat} cm (Chest) • {spec.waistFlat} cm (Waist)</span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-zinc-100">
                      <span className="text-zinc-600">Fit Interpretation:</span>
                      <span className="font-medium text-indigo-700">{spec.label}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span>Calculated from explicit garment dimensions and sample profile measurements.</span>
                </div>
              </div>

              {/* Action Buttons to Real Existing Functional Routes */}
              <div className="space-y-3">
                <span className="text-xs font-mono font-bold uppercase text-zinc-400 block tracking-wider">
                  Test Functional Demos Today:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link to="/clothing">
                    <Button className="w-full bg-zinc-950 hover:bg-zinc-850 text-white rounded-xl py-5 text-xs font-bold shadow-xs flex items-center justify-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-400" />
                      <span>Explore Demo Catalog</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>

                  <Link to="/recommendation">
                    <Button variant="outline" className="w-full border-zinc-200 text-zinc-800 hover:bg-zinc-50 rounded-xl py-5 text-xs font-bold flex items-center justify-center gap-2">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>Live Sizing Recommendation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
                  <span>No login or merchant account required for catalog testing</span>
                  <Link to="/shoes" className="font-bold text-indigo-600 hover:underline flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5" />
                    <span>Try AR Shoe Scanner</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

