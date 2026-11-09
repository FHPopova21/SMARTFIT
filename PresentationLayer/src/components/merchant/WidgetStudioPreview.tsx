import React from 'react';
import { Ruler, ShoppingBag, Star, Info, Eye, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBorderRadiusClass, HEX_COLOR_REGEX } from '@/utils/widgetConfigValidation';
import type { WidgetConfig } from '@/services/storeService';

interface WidgetStudioPreviewProps {
  config: WidgetConfig;
  storeName?: string;
}

export const WidgetStudioPreview: React.FC<WidgetStudioPreviewProps> = ({
  config,
  storeName = 'Store',
}) => {
  // Validate hex colors before applying directly to style to prevent CSS injection or malformed values
  const safeBgColor = HEX_COLOR_REGEX.test(config.primary_color)
    ? config.primary_color
    : '#4F46E5';
  const safeTextColor = HEX_COLOR_REGEX.test(config.text_color)
    ? config.text_color
    : '#FFFFFF';
  const borderRadiusClass = getBorderRadiusClass(config.border_radius);

  return (
    <div className="bg-white rounded-2xl border border-[#E9EAF3] shadow-xs overflow-hidden flex flex-col">
      {/* Header with clear appearance simulation label */}
      <div className="p-4 sm:p-5 border-b border-[#E9EAF3] bg-gradient-to-r from-zinc-50 to-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-indigo-50 text-[#4F46E5]">
              <Eye className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-zinc-900 tracking-tight">
              Widget Appearance Preview
            </h3>
            <Badge
              variant="outline"
              className="text-[11px] font-semibold bg-indigo-50/50 text-[#4F46E5] border-indigo-200"
            >
              Local Simulation
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Simulates button presentation on an e-commerce Product Details Page (PDP).
          </p>
        </div>

        {/* Status indicator */}
        <div>
          {config.is_enabled ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-semibold text-xs px-2.5 py-1">
              Preference: Enabled
            </Badge>
          ) : (
            <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 font-semibold text-xs px-2.5 py-1">
              Preference: Disabled
            </Badge>
          )}
        </div>
      </div>

      {/* Deployment status banner required by Milestone 4B.2 */}
      <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-200/50 text-xs text-amber-900 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          {config.is_enabled ? (
            <span>
              <strong>Configuration enabled.</strong> Storefront installation is not yet available.
              The widget is not yet loaded into customer browsers.
            </span>
          ) : (
            <span>
              <strong>Configuration disabled.</strong> The widget trigger button will not be displayed on customer-facing product pages once integrations launch.
            </span>
          )}
        </div>
      </div>

      {/* Simulated Product Details Page Canvas */}
      <div className="p-6 sm:p-8 bg-zinc-50/50 flex-1 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white rounded-2xl border border-zinc-200 shadow-md p-6 sm:p-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Left Column: Product Silhouette Placeholder */}
            <div className="relative aspect-4/5 rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-200/70 border border-zinc-200 flex flex-col items-center justify-center p-4 text-center overflow-hidden group">
              <svg
                className="w-24 h-24 text-zinc-400 drop-shadow-xs"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.47a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.47a2 2 0 00-1.34-2.23z" />
              </svg>
              <span className="mt-3 text-[11px] font-semibold tracking-wider uppercase text-zinc-500 font-mono">
                Sample Apparel Item
              </span>
              <span className="text-[10px] text-zinc-400">Neutral Silhouette</span>
            </div>

            {/* Right Column: PDP Details & Trigger Button */}
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {storeName} Catalog
                </p>
                <h4 className="text-base font-bold text-zinc-900 leading-snug">
                  Relaxed Oxford Cotton Shirt
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-zinc-500 font-medium">4.9 (42 reviews)</span>
                </div>
                <p className="text-lg font-bold text-zinc-900 mt-2">$68.00</p>
              </div>

              {/* Simulated Size Selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-700">Size:</span>
                  <span className="text-zinc-500 text-[11px]">
                    Unit: <strong className="uppercase">{config.default_unit}</strong> | Lang:{' '}
                    <strong className="uppercase">{config.default_language}</strong>
                  </span>
                </div>
                <div className="flex gap-2">
                  {['S', 'M', 'L', 'XL'].map((size, idx) => (
                    <span
                      key={size}
                      className={`h-8 w-9 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                        idx === 1
                          ? 'border-[#4F46E5] bg-indigo-50/50 text-[#4F46E5] shadow-xs'
                          : 'border-zinc-200 text-zinc-600 bg-white'
                      }`}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              {/* Simulated FitVision Widget Button Container */}
              <div className="pt-2 space-y-2.5">
                {/* Simulated Trigger Button */}
                <div className="relative">
                  <button
                    type="button"
                    style={{
                      backgroundColor: safeBgColor,
                      color: safeTextColor,
                    }}
                    className={`w-full py-2.5 px-4 font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:opacity-95 active:scale-[0.99] cursor-pointer ${borderRadiusClass} ${
                      !config.is_enabled ? 'ring-2 ring-dashed ring-zinc-300 opacity-60' : ''
                    }`}
                  >
                    {config.show_ruler_icon && (
                      <Ruler className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate">{config.button_label || 'Compare My Fit'}</span>
                  </button>

                  {!config.is_enabled && (
                    <div className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded bg-zinc-800 text-white text-[9px] font-mono font-medium shadow-xs">
                      Disabled Preview
                    </div>
                  )}
                </div>

                {/* Standard Add to Cart button */}
                <button
                  type="button"
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs opacity-90 cursor-not-allowed"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Bag</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="px-5 py-3 border-t border-[#E9EAF3] bg-white text-[11px] text-zinc-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Local visual rendering only. No external scripts or iframes loaded.</span>
        </div>
        <span className="text-zinc-400 font-mono text-[10px]">FitVision Studio v2.0</span>
      </div>
    </div>
  );
};

export default WidgetStudioPreview;

