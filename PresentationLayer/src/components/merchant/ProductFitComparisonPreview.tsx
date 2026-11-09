import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Ruler,
  AlertCircle,
  Info,
  Loader2,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  storeService,
  MerchantProduct,
  FitPreviewResult,
  VariantFitComparison,
} from '@/services/storeService';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { useToast } from '@/hooks/use-toast';
import { convertMeasurementString } from '@/utils/merchantFitPreview';

interface ProductFitComparisonPreviewProps {
  product: MerchantProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductFitComparisonPreview: React.FC<ProductFitComparisonPreviewProps> = ({
  product,
  open,
  onOpenChange,
}) => {
  const { activeStore } = useMerchantStore();
  const { toast } = useToast();

  // Units
  const [units, setUnits] = useState<'cm' | 'inch'>('cm');

  // Input states (ephemeral only - never saved to storage)
  const [chestInput, setChestInput] = useState('');
  const [waistInput, setWaistInput] = useState('');
  const [hipsInput, setHipsInput] = useState('');
  const [heightInput, setHeightInput] = useState('');

  // Execution states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FitPreviewResult | null>(null);

  // Request identity & abort controller to prevent stale responses & race conditions
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestKeyRef = useRef<string>('');

  // Store context safety: Clear inputs & stale responses when active store changes
  const prevStoreIdRef = useRef<number | null>(activeStore?.id ?? null);
  useEffect(() => {
    if (activeStore && prevStoreIdRef.current !== activeStore.id) {
      prevStoreIdRef.current = activeStore.id;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      activeRequestKeyRef.current = '';
      setChestInput('');
      setWaistInput('');
      setHipsInput('');
      setHeightInput('');
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  }, [activeStore]);

  // Reset inputs, results, and active requests when dialog opens/closes
  useEffect(() => {
    if (!open) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      activeRequestKeyRef.current = '';
      setChestInput('');
      setWaistInput('');
      setHipsInput('');
      setHeightInput('');
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const handleUnitToggle = (newUnits: 'cm' | 'inch') => {
    if (newUnits === units) return;
    setChestInput((prev) => convertMeasurementString(prev, units, newUnits));
    setWaistInput((prev) => convertMeasurementString(prev, units, newUnits));
    setHipsInput((prev) => convertMeasurementString(prev, units, newUnits));
    setHeightInput((prev) => convertMeasurementString(prev, units, newUnits));
    setUnits(newUnits);
    setResult(null);
  };

  if (!product || !activeStore) return null;

  const handleRunComparison = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    // Validate inputs
    const measurements: Record<string, number> = {};

    if (chestInput.trim()) {
      const c = parseFloat(chestInput);
      if (isNaN(c) || c <= 0) {
        setError('Chest measurement must be a positive number greater than 0.');
        return;
      }
      measurements.chest = c;
    }

    if (waistInput.trim()) {
      const w = parseFloat(waistInput);
      if (isNaN(w) || w <= 0) {
        setError('Waist measurement must be a positive number greater than 0.');
        return;
      }
      measurements.waist = w;
    }

    if (hipsInput.trim()) {
      const h = parseFloat(hipsInput);
      if (isNaN(h) || h <= 0) {
        setError('Hips measurement must be a positive number greater than 0.');
        return;
      }
      measurements.hips = h;
    }

    if (heightInput.trim()) {
      const ht = parseFloat(heightInput);
      if (isNaN(ht) || ht <= 0) {
        setError('Height measurement must be a positive number greater than 0.');
        return;
      }
      measurements.height = ht;
    }

    if (Object.keys(measurements).length === 0) {
      setError('Please provide at least one customer body measurement to evaluate fit.');
      return;
    }

    const requestKey = `${activeStore.id}:${product.id}:${Date.now()}`;
    activeRequestKeyRef.current = requestKey;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const res = await storeService.previewProductFit(
        activeStore.id,
        product.id,
        {
          units,
          measurements,
        },
        controller.signal
      );
      if (activeRequestKeyRef.current !== requestKey || controller.signal.aborted) {
        return;
      }
      setResult(res);
    } catch (err: any) {
      if (controller.signal.aborted || err?.name === 'AbortError') {
        return;
      }
      if (activeRequestKeyRef.current !== requestKey) {
        return;
      }
      console.warn('Fit preview error:', err);
      setError(err.message || 'Failed to evaluate fit comparison for this product.');
      setResult(null);
    } finally {
      if (activeRequestKeyRef.current === requestKey) {
        setIsLoading(false);
      }
    }
  };

  const getConventionBadge = (conv?: string | null) => {
    switch (conv) {
      case 'flat_garment':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
            Flat Width (2 × seam approx)
          </Badge>
        );
      case 'garment_circumference':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono">
            Garment Perimeter (360°)
          </Badge>
        );
      case 'body_circumference':
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-mono">
            Target Body Sizing
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px] font-mono">
            {conv || 'No Convention'}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E9EAF3] p-6 sm:p-7 shadow-2xl space-y-5">
        <DialogHeader className="space-y-1 text-left pb-3 border-b border-[#E9EAF3]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
                {activeStore.name} • Product #{product.id}
              </span>
              <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-mono font-bold">
                Merchant Preview — Not Published
              </Badge>
            </div>
            <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-xs font-mono capitalize">
              Status: {product.status}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-bold text-[#0F1117] font-heading flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#4F46E5]" />
            Test Sizing Comparison: {product.name}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Simulate customer body measurements and preview factual dimensional differences against your product's configured size variants.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-0.5">
              <span className="font-semibold">Comparison Blocked: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Sizing Context Information */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Category</span>
            <p className="text-xs font-semibold text-zinc-900 capitalize">{product.category}</p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Size Chart</span>
            <p className="text-xs font-semibold text-zinc-900 truncate" title={product.size_chart_name || 'None'}>
              {product.size_chart_name || 'No chart linked'}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Variants</span>
            <p className="text-xs font-semibold text-zinc-900 font-mono">{product.variants_count} defined</p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Fabric Stretch</span>
            <p className="text-xs font-semibold text-zinc-900 capitalize">{product.material_stretch || 'Unknown'}</p>
          </div>
        </div>

        {/* Form: Customer Measurements Simulation */}
        <form onSubmit={handleRunComparison} className="p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9EAF3]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 font-heading">Sample Customer Body Measurements</span>
              <span className="text-[11px] text-zinc-400 font-mono">(Simulated in memory)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-lg border border-[#E9EAF3]">
              <button
                type="button"
                onClick={() => handleUnitToggle('cm')}
                className={`px-2.5 py-1 text-xs font-mono rounded-md font-medium transition-all ${
                  units === 'cm'
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Centimeters (cm)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('inch')}
                className={`px-2.5 py-1 text-xs font-mono rounded-md font-medium transition-all ${
                  units === 'inch'
                    ? 'bg-[#4F46E5] text-white shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                Inches (in)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="space-y-1">
              <Label htmlFor="preview-chest" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                Chest / Bust ({units})
              </Label>
              <Input
                id="preview-chest"
                type="number"
                step="0.1"
                placeholder={units === 'cm' ? 'e.g. 98.0' : 'e.g. 38.5'}
                value={chestInput}
                onChange={(e) => setChestInput(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white border-[#E9EAF3]"
              />
              <p className="text-[10px] text-zinc-400">Fullest point across bust</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="preview-waist" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                Waist ({units})
              </Label>
              <Input
                id="preview-waist"
                type="number"
                step="0.1"
                placeholder={units === 'cm' ? 'e.g. 82.0' : 'e.g. 32.0'}
                value={waistInput}
                onChange={(e) => setWaistInput(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white border-[#E9EAF3]"
              />
              <p className="text-[10px] text-zinc-400">Natural waistline</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="preview-hips" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                Hips ({units})
              </Label>
              <Input
                id="preview-hips"
                type="number"
                step="0.1"
                placeholder={units === 'cm' ? 'e.g. 102.0' : 'e.g. 40.0'}
                value={hipsInput}
                onChange={(e) => setHipsInput(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white border-[#E9EAF3]"
              />
              <p className="text-[10px] text-zinc-400">Widest part of hips/seat</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="preview-height" className="text-xs font-semibold text-zinc-700 flex items-center gap-1">
                Height ({units}) <span className="text-[10px] text-zinc-400 font-normal">(optional)</span>
              </Label>
              <Input
                id="preview-height"
                type="number"
                step="0.1"
                placeholder={units === 'cm' ? 'e.g. 178.0' : 'e.g. 70.0'}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className="h-9 text-xs rounded-xl bg-white border-[#E9EAF3]"
              />
              <p className="text-[10px] text-zinc-400">Total body height</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              Ephemeral data only — Never saved to storage or analytics.
            </span>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-9 text-xs rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 gap-1.5 shadow-sm shadow-[#4F46E5]/20 font-medium"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  <Ruler className="w-3.5 h-3.5" />
                  Evaluate Fit Differences
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Results Area */}
        {result && (
          <div className="space-y-4 pt-1">
            {/* Status Callout Banner */}
            {result.status === 'fit_rules_required' && (
              <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 space-y-1">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>Factual Dimensional Comparisons Ready</span>
                </div>
                <p className="text-[11px] text-indigo-800 leading-relaxed">
                  Measurement differences are available, but FitVision does not yet have calibrated rules to identify the best-fitting size.
                  Review the variant differences below.
                </p>
              </div>
            )}

            {result.status === 'insufficient_data' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-2 font-bold font-mono">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Missing Sizing Information</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  {result.notes || 'Additional customer or garment measurements are required for this category.'}
                  {result.missing_dimensions && result.missing_dimensions.length > 0 && (
                    <span className="block font-semibold mt-1">
                      Missing dimension(s): {result.missing_dimensions.join(', ')}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Variant Comparison Table */}
            {result.variant_comparisons && result.variant_comparisons.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                      Variant Comparison Matrix ({result.variant_comparisons.length} sizes)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {getConventionBadge(result.measurement_convention)}
                    <Badge className="bg-zinc-100 text-zinc-600 border-zinc-200 text-[10px] font-mono uppercase">
                      Units: {result.units}
                    </Badge>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#E9EAF3]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#F8F9FC] text-zinc-600 font-mono text-[11px] border-b border-[#E9EAF3]">
                      <tr>
                        <th className="py-2.5 px-3 font-bold w-16">Variant Size</th>
                        <th className="py-2.5 px-3 font-semibold">Customer Measurement</th>
                        <th className="py-2.5 px-3 font-semibold">Garment / Chart Dimension</th>
                        <th className="py-2.5 px-3 font-semibold">Factual Difference (Ease)</th>
                        <th className="py-2.5 px-3 font-semibold">Linear Specs</th>
                        <th className="py-2.5 px-3 font-semibold">Seam Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E9EAF3] text-zinc-800">
                      {result.variant_comparisons.map((v: VariantFitComparison, idx: number) => {
                        const circumferences = Object.entries(v.circumference_comparisons || {});
                        const hasCircumference = circumferences.length > 0;
                        const linear = v.linear_dimensions || {};

                        return (
                          <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="py-3 px-3 font-bold">
                              <Badge className="bg-[#4F46E5] text-white text-xs font-mono px-2 py-0.5 rounded-md">
                                {v.size}
                              </Badge>
                            </td>

                            {/* Customer measurement */}
                            <td className="py-3 px-3 font-mono">
                              {hasCircumference ? (
                                circumferences.map(([dim, item]) => (
                                  <div key={dim} className="space-y-0.5">
                                    <span className="capitalize text-zinc-500 text-[10px] block">{dim}:</span>
                                    <span>
                                      {item.shopper_measurement} {item.unit}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-zinc-400 italic">No comparison</span>
                              )}
                            </td>

                            {/* Garment / Chart Dimension */}
                            <td className="py-3 px-3 font-mono">
                              {hasCircumference ? (
                                circumferences.map(([dim, item]) => (
                                  <div key={dim} className="space-y-0.5">
                                    <span className="capitalize text-zinc-500 text-[10px] block">
                                      {item.comparison_type === 'body_target_difference'
                                        ? 'Target Body:'
                                        : item.is_approximation
                                        ? 'Est. Perimeter:'
                                        : 'Garment Circ:'}
                                    </span>
                                    <span>
                                      {item.garment_specification} {item.unit}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span className="text-zinc-400 italic">—</span>
                              )}
                            </td>

                            {/* Factual Difference (Delta) */}
                            <td className="py-3 px-3 font-mono">
                              {hasCircumference ? (
                                circumferences.map(([dim, item]) => {
                                  const diff = item.difference;
                                  const sign = diff >= 0 ? '+' : '';
                                  const isNegative = diff < 0;

                                  return (
                                    <div key={dim} className="space-y-0.5">
                                      <span className="capitalize text-zinc-500 text-[10px] block">Difference:</span>
                                      <span
                                        className={`font-bold px-1.5 py-0.5 rounded ${
                                          isNegative
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-indigo-50 text-[#4F46E5]'
                                        }`}
                                      >
                                        {sign}
                                        {diff} {item.unit}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-zinc-400 italic">—</span>
                              )}
                            </td>

                            {/* Linear dimensions */}
                            <td className="py-3 px-3 font-mono text-[11px] text-zinc-600">
                              <div className="space-y-0.5">
                                {linear.total_length && (
                                  <div>Length: {linear.total_length} {result.units}</div>
                                )}
                                {linear.sleeve_length && (
                                  <div>Sleeve: {linear.sleeve_length} {result.units}</div>
                                )}
                                {linear.inseam_length && (
                                  <div>Inseam: {linear.inseam_length} {result.units}</div>
                                )}
                                {!linear.total_length && !linear.sleeve_length && !linear.inseam_length && (
                                  <span className="text-zinc-400 italic">None</span>
                                )}
                              </div>
                            </td>

                            {/* Seam Notes */}
                            <td className="py-3 px-3 text-[11px]">
                              {v.missing_chart_dimensions && v.missing_chart_dimensions.length > 0 ? (
                                <span className="text-amber-700 font-medium">
                                  Missing in chart: {v.missing_chart_dimensions.join(', ')}
                                </span>
                              ) : hasCircumference && circumferences[0][1].is_approximation ? (
                                <span className="text-indigo-600 font-mono text-[10px]">
                                  2 × flat width approx
                                </span>
                              ) : (
                                <span className="text-emerald-700 font-mono text-[10px]">Complete</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-[#E9EAF3] flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">
            FitVision Merchant Intelligence • Non-prescriptive measurement preview
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl border-[#E9EAF3]"
          >
            Close Preview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFitComparisonPreview;
