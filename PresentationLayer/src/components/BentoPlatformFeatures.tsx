import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Ruler,
  LayoutTemplate,
  Layers,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Info
} from 'lucide-react';

interface SizeData {
  ease: string;
  confidence: number;
  label: string;
  fitType: string;
  isRecommended: boolean;
}

// Sample reference profiles for the illustrative demo (Shopper chest: 98 cm)
const DEMO_SIZE_PROFILES: Record<string, SizeData> = {
  S: { ease: '-2 cm', confidence: 18, label: 'Tight across chest', fitType: 'Under-ease', isRecommended: false },
  M: { ease: '+2 cm', confidence: 44, label: 'Slim tailored fit', fitType: 'Slim Fit', isRecommended: false },
  L: { ease: '+6 cm', confidence: 86, label: 'Optimal mobility & drape', fitType: 'Recommended Fit', isRecommended: true },
  XL: { ease: '+11 cm', confidence: 26, label: 'Loose / oversized chest', fitType: 'Relaxed Fit', isRecommended: false },
};

export const BentoPlatformFeatures: React.FC = () => {
  // Feature A interactive state: switching displays sample reference values
  const [activeSize, setActiveSize] = useState<'S' | 'M' | 'L' | 'XL'>('L');

  // Feature B interactive state: toggle between flat width vs full circumference view
  const [measurementMode, setMeasurementMode] = useState<'flat' | 'circumference'>('flat');

  // Feature C interactive preview state
  const [widgetExpanded, setWidgetExpanded] = useState(true);

  const currentSize = DEMO_SIZE_PROFILES[activeSize];

  return (
    <section id="platform" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-zinc-200/80">
      {/* Anchor for Solutions navigation */}
      <div id="solutions" className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 font-mono font-bold mb-3 px-3.5 py-1 text-xs uppercase tracking-wider">
            THE PLATFORM
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1117] font-heading tracking-tight">
            Everything you need for smarter sizing.
          </h2>
          <p className="text-zinc-600 mt-3 text-sm sm:text-base leading-relaxed">
            An intelligent sizing experience designed for modern fashion ecommerce.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* ========================================================================= */}
          {/* FEATURE A — AI Size Recommendations (Featured Large Card, 7 cols on lg) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 bg-[#FAFAFC] rounded-3xl border border-zinc-200/80 p-7 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  FEATURE 01 • CORE ENGINE
                </span>
                <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-medium">
                  Illustrative Demo Data
                </span>
              </div>

              <h3 className="text-2xl font-black text-[#0F1117] font-heading tracking-tight mb-2">
                AI Size Recommendations
              </h3>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-6">
                Calibrated machine learning classification matches shopper body proportions with garment measurements. The interactive preview below displays illustrative sample profile values (Shopper chest: 98 cm); live model calls run in the interactive demo catalog.
              </p>

              {/* Miniature Interactive UI Preview */}
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Garment Target (Sample)</span>
                    <h4 className="text-sm font-bold text-zinc-900">Merino Wool Structured Blazer</h4>
                    <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">Sample Shopper: Chest 98 cm • Height 178 cm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-zinc-600 font-mono">Select Size:</span>
                    {(['S', 'M', 'L', 'XL'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setActiveSize(sz)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                          activeSize === sz
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                        }`}
                        aria-label={`Select illustrative size ${sz}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation Outcome Details (Clearly marked as illustrative) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Chest Ease</span>
                    <span className="text-base font-black text-zinc-900 font-mono">{currentSize.ease}</span>
                    <span className="text-[10px] text-zinc-500 block mt-0.5">{currentSize.fitType}</span>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Sample Confidence</span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-base font-black text-zinc-900 font-mono">{currentSize.confidence}%</span>
                      {currentSize.isRecommended && (
                        <span className="text-[10px] font-bold text-emerald-600 font-mono">Best Match</span>
                      )}
                    </div>
                    <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          currentSize.isRecommended ? 'bg-indigo-600' : 'bg-zinc-400'
                        }`}
                        style={{ width: `${currentSize.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">Fit Assessment</span>
                    <p className="text-[11px] font-medium text-zinc-700 leading-tight">
                      {currentSize.label}
                    </p>
                    <span className="text-[9px] font-mono text-zinc-400 mt-1">Illustrative reference</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-zinc-200/70 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-zinc-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Calibrated class probabilities (0.0 – 1.0) without fabricated 100% claims</span>
              </div>
              <Link to="/clothing" className="inline-flex items-center font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                Try catalog demo <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE B — Product-Specific Sizing (5 cols on lg) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-zinc-200/80 p-7 sm:p-9 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-50 text-purple-700 border border-purple-100">
                  <Ruler className="w-3.5 h-3.5 text-purple-600" />
                  FEATURE 02 • DATA INTEGRITY
                </span>
                <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  Verified Contract
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-[#0F1117] font-heading tracking-tight mb-2">
                Product-Specific Sizing
              </h3>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-6">
                Standard S/M/L labels vary drastically between suppliers. FitVision enforces explicit measurement metadata, distinguishing flat garment width from full circumference across all size charts.
              </p>

              {/* Interactive convention toggle preview: all values refer to the same garment (Size M) */}
              <div className="bg-[#FAFAFC] rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 font-bold block">Target: Size M Blazer</span>
                    <span className="text-[10px] text-zinc-500">1:2 Flat-to-Circumference Ratio</span>
                  </div>
                  <div className="inline-flex p-0.5 rounded-lg bg-zinc-200/70 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => setMeasurementMode('flat')}
                      className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                        measurementMode === 'flat' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Flat Width
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeasurementMode('circumference')}
                      className={`px-2.5 py-1 rounded-md transition-all font-semibold ${
                        measurementMode === 'circumference' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      Circumference
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-100">
                    <span className="text-zinc-600 font-medium">Chest Dimension</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {measurementMode === 'flat' ? '53.0 cm (Flat width seam-to-seam)' : '106.0 cm (360° perimeter)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-100">
                    <span className="text-zinc-600 font-medium">Waist Dimension</span>
                    <span className="font-mono font-bold text-zinc-900">
                      {measurementMode === 'flat' ? '48.0 cm (Flat width seam-to-seam)' : '96.0 cm (360° perimeter)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-zinc-100">
                    <span className="text-zinc-600 font-medium">Convention Metadata</span>
                    <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {measurementMode === 'flat' ? 'explicit: flat_width' : 'explicit: circumference'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-zinc-100 text-xs text-zinc-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Explicit typing prevents guessing conventions from numerical thresholds</span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE C — Storefront Widget (4 cols on lg) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <LayoutTemplate className="w-3.5 h-3.5 text-amber-600" />
                  FEATURE 03
                </span>
                <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                  Prototype Concept
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-2">
                Storefront Widget
              </h3>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-5">
                Designed as a prototype drawer on product detail pages, demonstrating how sizing advice could appear beside the Add to Cart button.
              </p>

              {/* Miniature Storefront Component Prototype */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-zinc-200/80">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">Product Page Drawer (Concept)</span>
                  <button
                    type="button"
                    onClick={() => setWidgetExpanded(!widgetExpanded)}
                    className="text-[10px] font-mono font-bold text-indigo-600 hover:underline"
                  >
                    {widgetExpanded ? 'Minimize' : 'Expand'}
                  </button>
                </div>

                {widgetExpanded ? (
                  <div className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">FitVision Assistant</span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        Prototype
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-600">
                      Based on your measurements, size <strong className="text-indigo-600">L</strong> provides a standard +6 cm ease.
                    </p>
                    <div className="pt-1 flex gap-2">
                      <button type="button" className="w-full text-center py-1.5 text-[11px] font-bold rounded-lg bg-zinc-950 text-white">
                        Select Size L
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded-xl border border-zinc-200 text-center">
                    <span className="text-xs font-semibold text-zinc-700">Collapsed Widget Pill (Preview)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500">
              <span className="font-medium text-amber-700">Prototype concept:</span> Merchant SDK embed script and storefront theme engine are on the engineering roadmap.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE D — Fit Visualization (4 cols on lg) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  FEATURE 04
                </span>
                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold">
                  Schematic 2D
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-2">
                2D Fit Visualization
              </h3>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-5">
                Technical 2D silhouette illustrating static body measurements against garment dimensions with explicit ease tolerance indicators.
              </p>

              {/* Miniature Schematic Silhouette Preview with clearly identified illustrative values */}
              <div className="bg-[#FAFAFC] rounded-2xl border border-zinc-200 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-2">
                  <span>Illustrative chest ease: +6 cm</span>
                  <span>Waist ease: +4 cm</span>
                </div>

                {/* SVG Silhouette Schematic */}
                <svg viewBox="0 0 160 110" className="w-36 h-24 stroke-zinc-700 fill-zinc-100">
                  {/* Body wireframe */}
                  <path d="M 80 10 L 72 26 L 50 34 L 54 55 L 62 75 L 56 105 L 104 105 L 98 75 L 106 55 L 110 34 L 88 26 Z" strokeWidth="1.2" fill="#F4F4F7" />
                  {/* Garment outline with ease */}
                  <path d="M 80 18 L 42 36 L 46 62 L 58 78 L 54 105 L 106 105 L 102 78 L 114 62 L 118 36 Z" stroke="#4F46E5" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
                  {/* Ease callout line */}
                  <line x1="42" y1="46" x2="50" y2="46" stroke="#059669" strokeWidth="1.5" />
                  <line x1="110" y1="46" x2="118" y2="46" stroke="#059669" strokeWidth="1.5" />
                </svg>

                <div className="mt-2 text-[10px] font-mono text-zinc-500 text-center">
                  Static 2D Wireframe Schematic
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
              <span className="font-medium text-zinc-700">Honest engineering:</span> Illustrates static dimensional differences only. Does not claim dynamic cloth physics, anatomical 3D reconstruction, or certified comfort thresholds.
            </div>
          </div>

          {/* ========================================================================= */}
          {/* FEATURE E — Merchant Analytics (4 cols on lg) */}
          {/* ========================================================================= */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-zinc-200/80 p-7 flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:border-indigo-500/30 hover:shadow-[0_12px_32px_rgba(79,70,229,0.06)] motion-safe:hover:-translate-y-1 motion-reduce:transform-none transition-all duration-300">
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                  <BarChart3 className="w-3.5 h-3.5 text-zinc-600" />
                  FEATURE 05
                </span>
                <span className="text-[10px] font-mono text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded border border-zinc-200 font-bold">
                  Roadmap
                </span>
              </div>

              <h3 className="text-xl font-black text-[#0F1117] font-heading tracking-tight mb-2">
                Merchant Sizing Insights
              </h3>
              <p className="text-zinc-600 text-xs sm:text-sm leading-relaxed mb-5">
                Conceptual preview of planned reporting for size demand distributions, measurement clusters, and return hotspot tracking across catalog items.
              </p>

              {/* Miniature Concept Analytics UI with prominent illustrative label */}
              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="uppercase font-bold">Clustering Concept</span>
                  <span className="text-amber-700 font-medium">Illustrative Mockup Data</span>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-700 mb-0.5">
                      <span>Size L (Sample Cluster)</span>
                      <span>42%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full w-[42%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-700 mb-0.5">
                      <span>Size M (Sample Cluster)</span>
                      <span>31%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-400 h-full rounded-full w-[31%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-mono text-zinc-700 mb-0.5">
                      <span>Size S / XL (Sample Cluster)</span>
                      <span>27%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-zinc-400 h-full rounded-full w-[27%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 text-[11px] text-zinc-500 leading-relaxed">
              <span className="font-medium text-zinc-700">Planned capability:</span> Simulated UI preview. Real merchant reporting dashboards are scheduled for future development phases.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
