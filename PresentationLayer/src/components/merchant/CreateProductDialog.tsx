import React, { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { storeService, SizeChart, CreateProductPayload } from '@/services/storeService';
import { useMerchantStore } from '@/context/MerchantStoreContext';

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProductCreated?: () => void;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COMMON_CATEGORIES = [
  { value: 'tops', label: 'Tops (Shirts, Tees, Sweaters)' },
  { value: 'bottoms', label: 'Bottoms (Pants, Jeans, Shorts)' },
  { value: 'dresses', label: 'Dresses & Jumpsuits' },
  { value: 'outerwear', label: 'Outerwear (Jackets, Coats)' },
  { value: 'accessories', label: 'Accessories' },
];

export const CreateProductDialog: React.FC<CreateProductDialogProps> = ({
  open,
  onOpenChange,
  onProductCreated,
}) => {
  const { activeStore } = useMerchantStore();
  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [isLoadingCharts, setIsLoadingCharts] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('tops');
  const [brand, setBrand] = useState('');
  const [skuPrefix, setSkuPrefix] = useState('');
  const [description, setDescription] = useState('');
  const [materialStretch, setMaterialStretch] = useState('unknown');
  const [sizeChartId, setSizeChartId] = useState<string>('none');

  // Variants list
  const [variants, setVariants] = useState<Array<{ size: string; sku: string }>>([
    { size: 'S', sku: '' },
    { size: 'M', sku: '' },
    { size: 'L', sku: '' },
  ]);
  const [customSizeInput, setCustomSizeInput] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load size charts when dialog opens
  useEffect(() => {
    if (open && activeStore) {
      setIsLoadingCharts(true);
      storeService
        .listSizeCharts(activeStore.id)
        .then((charts) => setSizeCharts(charts))
        .catch((err) => console.error('Failed to load size charts:', err))
        .finally(() => setIsLoadingCharts(false));
    }
  }, [open, activeStore]);

  const handleAddCommonSize = (size: string) => {
    if (!variants.some((v) => v.size.toLowerCase() === size.toLowerCase())) {
      const generatedSku = skuPrefix ? `${skuPrefix}-${size}` : '';
      setVariants([...variants, { size, sku: generatedSku }]);
    }
  };

  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (variants.some((v) => v.size.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Variant size '${trimmed}' is already in the list.`);
      return;
    }
    const generatedSku = skuPrefix ? `${skuPrefix}-${trimmed}` : '';
    setVariants([...variants, { size: trimmed, sku: generatedSku }]);
    setCustomSizeInput('');
    setError(null);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantSkuChange = (index: number, newSku: string) => {
    const updated = [...variants];
    updated[index].sku = newSku;
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }

    if (variants.length === 0) {
      setError('At least one size variant is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateProductPayload = {
      name: name.trim(),
      category: category.trim(),
      brand: brand.trim() || undefined,
      sku_prefix: skuPrefix.trim() || undefined,
      description: description.trim() || undefined,
      material_stretch: materialStretch,
      size_chart_id: sizeChartId !== 'none' ? parseInt(sizeChartId, 10) : undefined,
      variants: variants.map((v) => ({
        size: v.size.trim(),
        sku: v.sku.trim() || undefined,
      })),
    };

    try {
      await storeService.createProduct(activeStore.id, payload);
      onOpenChange(false);
      // Reset form
      setName('');
      setBrand('');
      setSkuPrefix('');
      setDescription('');
      setMaterialStretch('unknown');
      setSizeChartId('none');
      setVariants([
        { size: 'S', sku: '' },
        { size: 'M', sku: '' },
        { size: 'L', sku: '' },
      ]);
      if (onProductCreated) {
        onProductCreated();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-[#E9EAF3] p-6 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
              {activeStore?.name}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-[#0F1117] font-heading">
            Create New Product
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Add an apparel item to your store catalog. Products start in draft mode until sized.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-zinc-700">Product Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Oxford Tailored Shirt"
                className="rounded-xl border-[#E9EAF3] text-sm h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Garment Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {COMMON_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Brand / Collection</Label>
              <Input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Modern Atelier"
                className="rounded-xl border-[#E9EAF3] text-sm h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Material Stretch</Label>
              <Select value={materialStretch} onValueChange={setMaterialStretch}>
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder="Stretch behavior" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="unknown" className="text-xs">Unknown / Unspecified</SelectItem>
                  <SelectItem value="non_stretch" className="text-xs">Non-Stretch (Rigid Cotton, Denim)</SelectItem>
                  <SelectItem value="low_stretch" className="text-xs">Low Stretch (1-2% Elastane)</SelectItem>
                  <SelectItem value="medium_stretch" className="text-xs">Medium Stretch (Ribbed Knit, Blends)</SelectItem>
                  <SelectItem value="high_stretch" className="text-xs">High Stretch (Spandex, Athletic)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Assign Size Chart</Label>
              <Select value={sizeChartId} onValueChange={setSizeChartId}>
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder={isLoadingCharts ? 'Loading charts...' : 'Select size chart'} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="text-xs">None (Assign later in draft)</SelectItem>
                  {sizeCharts.map((sc) => (
                    <SelectItem key={sc.id} value={sc.id.toString()} className="text-xs">
                      {sc.name} ({sc.garment_category} • {sc.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-700">Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Garment silhouette, fit details, fabric composition..."
              className="rounded-xl border-[#E9EAF3] text-xs min-h-[60px]"
            />
          </div>

          {/* Variants Section */}
          <div className="space-y-3 pt-2 border-t border-[#E9EAF3]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#0F1117] uppercase tracking-wider">
                  Size Variants ({variants.length})
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Define the sizes and optional store SKUs for this product.
                </p>
              </div>

              {/* SKU Prefix quick helper */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-zinc-400 font-mono">SKU Prefix:</span>
                <Input
                  value={skuPrefix}
                  onChange={(e) => setSkuPrefix(e.target.value)}
                  placeholder="e.g. OXF"
                  className="w-24 h-7 text-xs font-mono rounded-lg border-[#E9EAF3]"
                />
              </div>
            </div>

            {/* Quick add chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Quick Add:</span>
              {COMMON_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddCommonSize(s)}
                  className="px-2.5 py-1 rounded-lg border border-[#E9EAF3] bg-zinc-50 hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
                >
                  +{s}
                </button>
              ))}
            </div>

            {/* Custom size input */}
            <div className="flex items-center gap-2">
              <Input
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
                placeholder="Custom size (e.g. 32x34, S/M, One Size)"
                className="text-xs h-9 rounded-xl border-[#E9EAF3]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCustomSize}
                className="h-9 text-xs rounded-xl border-[#E9EAF3] shrink-0"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Size
              </Button>
            </div>

            {/* Configured Variants List */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#E9EAF3] bg-zinc-50/70"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-[#4F46E5] text-white text-xs font-mono px-2 py-0.5 rounded-md">
                      {v.size}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <span className="text-[11px] text-zinc-400 font-mono">SKU:</span>
                    <Input
                      value={v.sku}
                      onChange={(e) => handleVariantSkuChange(idx, e.target.value)}
                      placeholder={`e.g. ${skuPrefix || 'SKU'}-${v.size}`}
                      className="text-xs font-mono h-7 rounded-lg border-[#E9EAF3] bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveVariant(idx)}
                    className="p-1 rounded-lg hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E9EAF3] flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs font-semibold rounded-xl border-[#E9EAF3]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductDialog;

