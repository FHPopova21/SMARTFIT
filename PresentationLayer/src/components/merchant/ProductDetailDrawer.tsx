import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  Ruler,
  CheckCircle2,
  AlertCircle,
  Archive,
  ArrowRight,
  Loader2,
  ShieldAlert,
  Info,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { storeService, MerchantProduct, SizeChart } from '@/services/storeService';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { useToast } from '@/hooks/use-toast';
import { ProductFitComparisonPreview } from './ProductFitComparisonPreview';
import { checkProductSizingCompleteness } from '@/utils/sizeChartValidation';

interface ProductDetailDrawerProps {
  product: MerchantProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductUpdated?: () => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  open,
  onOpenChange,
  onProductUpdated,
}) => {
  const { activeStore } = useMerchantStore();
  const { toast } = useToast();

  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string>('none');
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isLinkingChart, setIsLinkingChart] = useState(false);
  const [activationErrors, setActivationErrors] = useState<string[] | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const isStaff = activeStore?.role === 'staff';

  useEffect(() => {
    if (open && activeStore && product) {
      setActivationErrors(null);
      setSelectedChartId(product.size_chart_id ? String(product.size_chart_id) : 'none');
      setIsLoadingCharts(true);
      storeService
        .listSizeCharts(activeStore.id)
        .then((charts) => setSizeCharts(charts))
        .catch((err) => console.error('Error loading size charts:', err))
        .finally(() => setIsLoadingCharts(false));
    }
  }, [open, activeStore, product]);

  if (!product || !activeStore) return null;

  const handleActivate = async () => {
    if (isStaff) return;
    setIsActivating(true);
    setActivationErrors(null);

    try {
      await storeService.updateProduct(activeStore.id, product.id, { status: 'active' });
      toast({
        title: 'Product Activated',
        description: `${product.name} is now active and ready for sizing recommendations.`,
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      console.warn('Activation error:', err);
      if (err.validationErrors && Array.isArray(err.validationErrors)) {
        setActivationErrors(err.validationErrors);
      } else {
        setActivationErrors([err.message || 'Product sizing requirements are incomplete.']);
      }
      toast({
        title: 'Activation Rejected',
        description: 'Sizing requirements are incomplete. See details below.',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
    }
  };

  const handleArchive = async () => {
    if (isStaff) return;
    setIsArchiving(true);
    try {
      await storeService.updateProduct(activeStore.id, product.id, { status: 'archived' });
      toast({
        title: 'Product Archived',
        description: `${product.name} has been archived.`,
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      toast({
        title: 'Archive Failed',
        description: err.message || 'Failed to archive product.',
        variant: 'destructive',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRevertDraft = async () => {
    if (isStaff) return;
    try {
      await storeService.updateProduct(activeStore.id, product.id, { status: 'draft' });
      toast({
        title: 'Reverted to Draft',
        description: `${product.name} is now in draft status.`,
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Failed to change status.',
        variant: 'destructive',
      });
    }
  };

  const handleAssignChart = async (newChartIdStr: string) => {
    if (isStaff) return;
    setIsLinkingChart(true);
    setActivationErrors(null);
    try {
      const chartId = newChartIdStr === 'none' ? null : parseInt(newChartIdStr, 10);
      await storeService.updateProduct(activeStore.id, product.id, { size_chart_id: chartId });
      setSelectedChartId(newChartIdStr);
      toast({
        title: 'Size Chart Updated',
        description: newChartIdStr === 'none' ? 'Size chart unlinked.' : 'Size chart assigned successfully.',
      });
      if (onProductUpdated) onProductUpdated();
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not assign size chart.',
        variant: 'destructive',
      });
    } finally {
      setIsLinkingChart(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-mono font-semibold">
            Active
          </Badge>
        );
      case 'draft':
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-mono font-semibold">
            Draft
          </Badge>
        );
      case 'archived':
        return (
          <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-xs font-mono font-semibold">
            Archived
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white border-l border-[#E9EAF3] p-6 space-y-6">
        <SheetHeader className="space-y-2 text-left pb-4 border-b border-[#E9EAF3]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
              {activeStore.name} • Product #{product.id}
            </span>
            {getStatusBadge(product.status)}
          </div>
          <SheetTitle className="text-xl font-bold text-[#0F1117] font-heading">
            {product.name}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            {product.category} {product.brand ? `• ${product.brand}` : ''}
          </SheetDescription>
        </SheetHeader>

        {/* Read-Only Notice for Staff Users */}
        {isStaff && (
          <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-center gap-2.5 text-xs text-indigo-900">
            <ShieldAlert className="w-4 h-4 text-[#4F46E5] shrink-0" />
            <span>Staff role has read-only access. Store Admin or Owner required to modify products.</span>
          </div>
        )}

        {/* Activation Errors Banner */}
        {activationErrors && activationErrors.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Sizing Data Incomplete for Activation</span>
            </div>
            <p className="text-[11px] text-rose-700">
              This product cannot be activated because it is missing validated sizing specifications:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              {activationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* General Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
            Product Specifications
          </h4>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] space-y-1">
              <span className="text-zinc-400 block text-[11px]">Category</span>
              <span className="font-semibold text-zinc-800 capitalize">{product.category}</span>
            </div>

            <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] space-y-1">
              <span className="text-zinc-400 block text-[11px]">Material Stretch</span>
              <span className="font-semibold text-zinc-800 capitalize font-mono">
                {product.material_stretch || 'unknown'}
              </span>
            </div>

            {product.brand && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] space-y-1">
                <span className="text-zinc-400 block text-[11px]">Brand</span>
                <span className="font-semibold text-zinc-800">{product.brand}</span>
              </div>
            )}

            {product.sku_prefix && (
              <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] space-y-1">
                <span className="text-zinc-400 block text-[11px]">SKU Prefix</span>
                <span className="font-semibold text-zinc-800 font-mono">{product.sku_prefix}</span>
              </div>
            )}
          </div>

          {product.description && (
            <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] text-xs space-y-1">
              <span className="text-zinc-400 block text-[11px]">Description</span>
              <p className="text-zinc-700 leading-relaxed">{product.description}</p>
            </div>
          )}
        </div>

        {/* Size Chart Integration Section */}
        <div className="space-y-3 pt-3 border-t border-[#E9EAF3]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Size Chart & Measurements
            </h4>
            {product.size_chart_name ? (
              <Badge className="bg-indigo-50 text-[#4F46E5] border-indigo-200 text-xs font-mono">
                Assigned
              </Badge>
            ) : (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-xs font-mono">
                Unassigned
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-700">Linked Size Chart</Label>
            {sizeCharts.length === 0 && !isLoadingCharts ? (
              <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] text-xs text-zinc-500 space-y-1">
                <p className="font-medium text-zinc-700">No size charts yet.</p>
                <p className="text-[11px]">
                  Create one in Size Charts to complete your product sizing setup.
                </p>
              </div>
            ) : (
              <Select
                value={selectedChartId}
                onValueChange={handleAssignChart}
                disabled={isStaff || isLinkingChart || isLoadingCharts}
              >
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-xs h-10">
                  <SelectValue placeholder={isLoadingCharts ? 'Loading charts...' : 'Select a size chart'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="text-xs">
                    None (Draft mode only)
                  </SelectItem>
                  {sizeCharts.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name} ({c.garment_category} • {c.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Size Chart Coverage Indicator */}
            {selectedChartId !== 'none' && (() => {
              const matchedChart = sizeCharts.find((c) => String(c.id) === selectedChartId);
              if (!matchedChart) return null;
              const variantSizes = (product.variants || []).map((v) => v.size);
              const completeness = checkProductSizingCompleteness(
                product.category,
                variantSizes,
                matchedChart.measurements || []
              );

              return (
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-500">Grading Coverage:</span>
                    <span className="font-semibold text-zinc-700">
                      {(matchedChart.measurements || []).length} chart sizes available
                    </span>
                  </div>
                  {!completeness.isFullyCovered ? (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span>Sizing specifications incomplete for activation: </span>
                        <strong>{completeness.summaryMessage}</strong>
                        <span className="block text-[10px] text-amber-700 mt-0.5">
                          Complete required dimensions ({product.category}) before activating product.
                        </span>
                      </div>
                    </div>
                  ) : product.variants && product.variants.length > 0 ? (
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>All {product.variants.length} variant sizes covered with required specifications.</span>
                    </div>
                  ) : null}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Variants List */}
        <div className="space-y-3 pt-3 border-t border-[#E9EAF3]">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
              Variants ({product.variants_count})
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">Store-scoped SKUs</span>
          </div>

          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {product.variants.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#4F46E5] text-white text-xs font-mono px-2 py-0.5 rounded-md">
                      {v.size}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
                    {v.sku ? (
                      <span>SKU: {v.sku}</span>
                    ) : (
                      <span className="text-zinc-400 italic">No SKU</span>
                    )}
                    {v.barcode && <span>• {v.barcode}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">No variants defined.</p>
          )}

          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Note: Variant dimensions and SKU values are immutable in this MVP release to preserve sizing integrity.
          </p>
        </div>

        {/* Product Status Actions */}
        <div className="pt-4 border-t border-[#E9EAF3] space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 font-mono">
            Status Actions
          </h4>

          <div className="flex flex-col gap-2">
            {/* Preview Fit Comparison Action (Available to all authorized merchant roles, including staff) */}
            {product.status !== 'archived' && (
              <Button
                onClick={() => setIsPreviewOpen(true)}
                variant="outline"
                className="w-full border-indigo-200 text-[#4F46E5] bg-indigo-50/40 hover:bg-indigo-50 font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5"
              >
                <Ruler className="w-4 h-4 text-[#4F46E5]" />
                Preview Fit Comparison
              </Button>
            )}

            {product.status === 'draft' && (
              <Button
                onClick={handleActivate}
                disabled={isStaff || isActivating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 rounded-xl shadow-xs flex items-center justify-center gap-1.5"
              >
                {isActivating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Validating Sizing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Activate Product for Sizing
                  </>
                )}
              </Button>
            )}

            {product.status === 'active' && (
              <Button
                onClick={handleRevertDraft}
                disabled={isStaff}
                variant="outline"
                className="w-full border-amber-300 text-amber-800 hover:bg-amber-50 font-semibold text-xs h-10 rounded-xl"
              >
                Revert to Draft Status
              </Button>
            )}

            {product.status !== 'archived' && (
              <Button
                onClick={handleArchive}
                disabled={isStaff || isArchiving}
                variant="outline"
                className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-rose-600 font-semibold text-xs h-10 rounded-xl flex items-center justify-center gap-1.5"
              >
                {isArchiving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    Archive Product
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <ProductFitComparisonPreview
          product={product}
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
        />
      </SheetContent>
    </Sheet>
  );
};

export default ProductDetailDrawer;

