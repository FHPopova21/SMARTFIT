import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Loader2, Ruler, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { storeService, GarmentMeasurement, CreateSizeChartPayload } from '@/services/storeService';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { useToast } from '@/hooks/use-toast';

interface CreateSizeChartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChartCreated?: () => void;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const CATEGORY_OPTIONS = [
  { value: 'tops', label: 'Tops (Shirts, Tees, Sweaters)' },
  { value: 'bottoms', label: 'Bottoms (Pants, Jeans, Shorts)' },
  { value: 'dresses', label: 'Dresses & Jumpsuits' },
  { value: 'outerwear', label: 'Outerwear (Jackets, Coats)' },
  { value: 'accessories', label: 'Accessories & Tailoring' },
];

export const CreateSizeChartDialog: React.FC<CreateSizeChartDialogProps> = ({
  open,
  onOpenChange,
  onChartCreated,
}) => {
  const { activeStore } = useMerchantStore();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [garmentCategory, setGarmentCategory] = useState('tops');
  const [chartType, setChartType] = useState<'garment_dimensions' | 'body_measurements'>('garment_dimensions');
  const [convention, setConvention] = useState<'flat_garment' | 'garment_circumference' | 'body_circumference'>('flat_garment');
  const [unit, setUnit] = useState<'cm' | 'inch'>('cm');

  // Matrix rows
  const [rows, setRows] = useState<GarmentMeasurement[]>([
    { size: 'S', flat_chest_width: 50, total_length: 70 },
    { size: 'M', flat_chest_width: 53, total_length: 72 },
    { size: 'L', flat_chest_width: 56, total_length: 74 },
  ]);

  const [customSizeInput, setCustomSizeInput] = useState('');
  const [showAdvancedDimensions, setShowAdvancedDimensions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddCommonSize = (size: string) => {
    if (!rows.some((r) => r.size.toLowerCase() === size.toLowerCase())) {
      setRows([...rows, { size }]);
    }
  };

  const handleAddCustomSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (rows.some((r) => r.size.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Size '${trimmed}' is already in the matrix.`);
      return;
    }
    setRows([...rows, { size: trimmed }]);
    setCustomSizeInput('');
    setError(null);
  };

  const handleRemoveRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleDimensionChange = (index: number, field: keyof GarmentMeasurement, value: string) => {
    const updated = [...rows];
    if (value === '' || value === null || value === undefined) {
      updated[index] = { ...updated[index], [field]: null };
    } else {
      const num = parseFloat(value);
      updated[index] = { ...updated[index], [field]: isNaN(num) ? null : num };
    }
    setRows(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore) return;

    if (!name.trim()) {
      setError('Size chart name is required.');
      return;
    }

    if (rows.length === 0) {
      setError('At least one size row with dimensions is required.');
      return;
    }

    // Validate positive numbers
    for (const r of rows) {
      for (const [key, val] of Object.entries(r)) {
        if (key !== 'size' && val !== null && val !== undefined) {
          if (typeof val === 'number' && (isNaN(val) || val <= 0)) {
            setError(`Dimension '${key}' for size '${r.size}' must be a positive number greater than 0.`);
            return;
          }
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    const payload: CreateSizeChartPayload = {
      name: name.trim(),
      garment_category: garmentCategory,
      chart_type: chartType,
      measurement_convention: convention,
      unit: unit,
      measurements: rows.map((r) => ({
        size: r.size.trim(),
        flat_chest_width: r.flat_chest_width ?? null,
        flat_waist_width: r.flat_waist_width ?? null,
        flat_hip_width: r.flat_hip_width ?? null,
        garment_chest_circumference: r.garment_chest_circumference ?? null,
        garment_waist_circumference: r.garment_waist_circumference ?? null,
        garment_hip_circumference: r.garment_hip_circumference ?? null,
        body_chest_circumference: r.body_chest_circumference ?? null,
        body_waist_circumference: r.body_waist_circumference ?? null,
        body_hip_circumference: r.body_hip_circumference ?? null,
        total_length: r.total_length ?? null,
        sleeve_length: r.sleeve_length ?? null,
        inseam_length: r.inseam_length ?? null,
        shoulder_width: r.shoulder_width ?? null,
      })),
    };

    try {
      await storeService.createSizeChart(activeStore.id, payload);
      toast({
        title: 'Size Chart Created',
        description: `Size chart "${name.trim()}" has been saved for ${activeStore.name}.`,
      });
      onOpenChange(false);
      setName('');
      setRows([
        { size: 'S', flat_chest_width: 50, total_length: 70 },
        { size: 'M', flat_chest_width: 53, total_length: 72 },
        { size: 'L', flat_chest_width: 56, total_length: 74 },
      ]);
      if (onChartCreated) onChartCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create size chart.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white border border-[#E9EAF3] p-6 sm:p-7 shadow-2xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
              {activeStore?.name}
            </span>
          </div>
          <DialogTitle className="text-xl font-bold text-[#0F1117] font-heading flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#4F46E5]" />
            Create Size Chart Specification
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Define physical garment grading dimensions. Explicitly distinguishes flat garment widths from 360° circumferences.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold text-zinc-700">Size Chart Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Regular Fit Tops Specs"
                className="rounded-xl border-[#E9EAF3] text-sm h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Garment Category *</Label>
              <Select value={garmentCategory} onValueChange={setGarmentCategory}>
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c.value} value={c.value} className="text-xs">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Measurement Convention *</Label>
              <Select
                value={convention}
                onValueChange={(val: any) => {
                  setConvention(val);
                  if (val === 'body_circumference') {
                    setChartType('body_measurements');
                  } else {
                    setChartType('garment_dimensions');
                  }
                }}
              >
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder="Convention" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="flat_garment" className="text-xs">
                    Flat Garment Width (seam-to-seam across flat garment)
                  </SelectItem>
                  <SelectItem value="garment_circumference" className="text-xs">
                    Garment Circumference (360° perimeter of garment)
                  </SelectItem>
                  <SelectItem value="body_circumference" className="text-xs">
                    Target Body Circumference (shopper body perimeter)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Measurement Unit *</Label>
              <Select value={unit} onValueChange={(val: any) => setUnit(val)}>
                <SelectTrigger className="rounded-xl border-[#E9EAF3] text-sm h-10">
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="cm" className="text-xs">Centimeters (cm)</SelectItem>
                  <SelectItem value="inch" className="text-xs">Inches (in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-zinc-700">Specification Type</Label>
              <div className="h-10 flex items-center px-3 rounded-xl border border-[#E9EAF3] bg-zinc-50 text-xs font-mono text-zinc-600">
                {chartType === 'garment_dimensions' ? 'Garment Dimensions' : 'Body Measurements'}
              </div>
            </div>
          </div>

          {/* Interactive Garment Measurement Matrix */}
          <div className="space-y-3 pt-3 border-t border-[#E9EAF3]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1117] font-mono flex items-center gap-1.5">
                  Measurement Matrix ({rows.length} sizes)
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Enter physical dimensions in {unit}. Missing dimensions remain NULL and will not be fabricated.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedDimensions(!showAdvancedDimensions)}
                  className="text-[11px] h-7 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 rounded-lg"
                >
                  {showAdvancedDimensions ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 mr-1" />
                      Standard View
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 mr-1" />
                      All Dimensions (13 fields)
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick add sizes */}
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-zinc-50 border border-[#E9EAF3] text-xs">
              <span className="text-zinc-500 font-medium text-[11px]">Add Size:</span>
              {COMMON_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddCommonSize(s)}
                  className="px-2.5 py-1 rounded-lg border border-[#E9EAF3] bg-white hover:bg-indigo-50 hover:border-indigo-200 text-xs font-medium text-zinc-700 hover:text-indigo-600 transition-colors"
                >
                  +{s}
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <Input
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  placeholder="Custom size (32x34, One Size)"
                  className="w-36 h-7 text-xs rounded-lg border-[#E9EAF3] bg-white"
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
                  className="h-7 text-xs rounded-lg border-[#E9EAF3] px-2.5 bg-white"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="border border-[#E9EAF3] rounded-2xl overflow-x-auto bg-white shadow-xs">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-zinc-50/70 border-b border-[#E9EAF3] text-zinc-600 font-mono text-[10px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-20">Size</th>
                    {convention === 'flat_garment' && (
                      <>
                        <th className="py-2.5 px-3">Flat Chest Width</th>
                        <th className="py-2.5 px-3">Flat Waist Width</th>
                        <th className="py-2.5 px-3">Flat Hip Width</th>
                      </>
                    )}
                    {convention === 'garment_circumference' && (
                      <>
                        <th className="py-2.5 px-3">Garment Chest Circ</th>
                        <th className="py-2.5 px-3">Garment Waist Circ</th>
                        <th className="py-2.5 px-3">Garment Hip Circ</th>
                      </>
                    )}
                    {convention === 'body_circumference' && (
                      <>
                        <th className="py-2.5 px-3">Body Chest Circ</th>
                        <th className="py-2.5 px-3">Body Waist Circ</th>
                        <th className="py-2.5 px-3">Body Hip Circ</th>
                      </>
                    )}
                    <th className="py-2.5 px-3">Total Length</th>
                    <th className="py-2.5 px-3">Sleeve Length</th>

                    {showAdvancedDimensions && (
                      <>
                        <th className="py-2.5 px-3">Inseam</th>
                        <th className="py-2.5 px-3">Shoulder</th>
                      </>
                    )}

                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9EAF3]">
                  {rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-2 px-3">
                        <Badge className="bg-[#4F46E5] text-white text-xs font-mono font-bold px-2 py-0.5 rounded-md">
                          {row.size}
                        </Badge>
                      </td>

                      {/* Primary Width/Circumference inputs */}
                      {convention === 'flat_garment' && (
                        <>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.flat_chest_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_chest_width', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.flat_waist_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_waist_width', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.flat_hip_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_hip_width', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                        </>
                      )}

                      {convention === 'garment_circumference' && (
                        <>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.garment_chest_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_chest_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.garment_waist_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_waist_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.garment_hip_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_hip_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                        </>
                      )}

                      {convention === 'body_circumference' && (
                        <>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.body_chest_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_chest_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.body_waist_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_waist_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.body_hip_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_hip_circumference', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                        </>
                      )}

                      {/* Lengths */}
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          placeholder="cm"
                          value={row.total_length ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'total_length', e.target.value)}
                          className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          step="0.1"
                          min="1"
                          placeholder="cm"
                          value={row.sleeve_length ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'sleeve_length', e.target.value)}
                          className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                        />
                      </td>

                      {showAdvancedDimensions && (
                        <>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.inseam_length ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'inseam_length', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              placeholder="cm"
                              value={row.shoulder_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'shoulder_width', e.target.value)}
                              className="h-8 text-xs font-mono rounded-lg border-[#E9EAF3]"
                            />
                          </td>
                        </>
                      )}

                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          className="p-1 rounded-md hover:bg-rose-50 text-zinc-400 hover:text-rose-600 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving Specs...
                </>
              ) : (
                'Create Size Chart'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateSizeChartDialog;

