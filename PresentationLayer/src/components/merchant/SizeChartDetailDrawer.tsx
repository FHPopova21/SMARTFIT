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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Ruler,
  Lock,
  Unlock,
  AlertCircle,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  Plus,
  X,
  ShieldAlert,
} from 'lucide-react';
import { storeService, SizeChart, GarmentMeasurement } from '@/services/storeService';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { useToast } from '@/hooks/use-toast';

interface SizeChartDetailDrawerProps {
  chart: SizeChart | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChartUpdated?: () => void;
  onChartDeleted?: () => void;
}

export const SizeChartDetailDrawer: React.FC<SizeChartDetailDrawerProps> = ({
  chart,
  open,
  onOpenChange,
  onChartUpdated,
  onChartDeleted,
}) => {
  const { activeStore } = useMerchantStore();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [rows, setRows] = useState<GarmentMeasurement[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStaff = activeStore?.role === 'staff';
  const isLocked = (chart?.active_products_count ?? 0) > 0;

  useEffect(() => {
    if (chart) {
      setName(chart.name);
      setRows(chart.measurements ? JSON.parse(JSON.stringify(chart.measurements)) : []);
      setIsEditing(false);
      setShowDeleteConfirm(false);
      setError(null);
    }
  }, [chart, open]);

  if (!chart || !activeStore) return null;

  const getConventionLabel = (conv: string) => {
    switch (conv) {
      case 'flat_garment':
        return 'Flat Garment (Widths)';
      case 'garment_circumference':
        return 'Garment Circumference (360°)';
      case 'body_circumference':
        return 'Body Circumference (Perimeter)';
      default:
        return conv;
    }
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

  const handleAddSize = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customSize.trim();
    if (!trimmed) return;
    if (rows.some((r) => r.size.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Size '${trimmed}' already exists in this chart.`);
      return;
    }
    setRows([...rows, { size: trimmed }]);
    setCustomSize('');
    setError(null);
  };

  const handleRemoveSize = (index: number) => {
    if (rows.length <= 1) {
      setError('A size chart must contain at least one size.');
      return;
    }
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    if (isStaff || !activeStore) return;

    if (!name.trim()) {
      setError('Size chart name cannot be empty.');
      return;
    }

    if (rows.length === 0) {
      setError('At least one size measurement row is required.');
      return;
    }

    // Validate numbers
    for (const r of rows) {
      for (const [key, val] of Object.entries(r)) {
        if (key !== 'size' && key !== 'id' && key !== 'size_chart_id' && val !== null && val !== undefined) {
          if (typeof val === 'number' && (isNaN(val) || val <= 0)) {
            setError(`Dimension '${key}' for size '${r.size}' must be a positive number greater than 0.`);
            return;
          }
        }
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      await storeService.updateSizeChart(activeStore.id, chart.id, {
        name: name.trim(),
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
      });

      toast({
        title: 'Size Chart Updated',
        description: `Size chart "${name.trim()}" was updated (v${chart.version + 1}).`,
      });
      setIsEditing(false);
      if (onChartUpdated) onChartUpdated();
    } catch (err: any) {
      console.warn('Update size chart error:', err);
      if (err.activeProductsCount) {
        setError(
          `Cannot modify measurements: chart is referenced by ${err.activeProductsCount} active product(s). Unlink or draft active products first.`
        );
      } else {
        setError(err.message || 'Failed to update size chart.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isStaff || !activeStore) return;
    setIsDeleting(true);
    setError(null);

    try {
      await storeService.deleteSizeChart(activeStore.id, chart.id);
      toast({
        title: 'Size Chart Deleted',
        description: `Size chart "${chart.name}" has been removed.`,
      });
      onOpenChange(false);
      if (onChartDeleted) onChartDeleted();
    } catch (err: any) {
      console.warn('Delete size chart error:', err);
      setError(
        err.message || 'Cannot delete size chart. Ensure no products are referencing this chart.'
      );
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const isFlat = chart.measurement_convention === 'flat_garment';
  const isGarmentCirc = chart.measurement_convention === 'garment_circumference';
  const isBodyCirc = chart.measurement_convention === 'body_circumference';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-white border-l border-[#E9EAF3] p-6 sm:p-8 space-y-6">
        {/* Header */}
        <SheetHeader className="space-y-2 text-left pb-4 border-b border-[#E9EAF3]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-[#4F46E5] uppercase tracking-wider">
              {activeStore.name} • Chart #{chart.id}
            </span>
            <div className="flex items-center gap-2">
              <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-xs font-mono font-semibold">
                v{chart.version}
              </Badge>
              {isLocked ? (
                <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-xs font-mono font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Locked ({chart.active_products_count} Live)
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-mono font-semibold flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-600" />
                  Unlocked
                </Badge>
              )}
            </div>
          </div>
          <SheetTitle className="text-xl font-bold text-[#0F1117] font-heading flex items-center gap-2">
            <Ruler className="w-5 h-5 text-[#4F46E5]" />
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base font-bold text-[#0F1117] h-9 max-w-md rounded-lg"
              />
            ) : (
              <span>{chart.name}</span>
            )}
          </SheetTitle>
          <SheetDescription className="text-xs text-zinc-500">
            Grading dimensions and seam specifications for sizing intelligence.
          </SheetDescription>
        </SheetHeader>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-0.5">
              <span className="font-semibold">Action Blocked: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Protection Alert if Locked */}
        {isLocked && (
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-900">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Measurement Immutability Protection Active</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              This chart is currently linked to <strong>{chart.active_products_count} active product(s)</strong>.
              To protect shoppers from sizing inconsistencies, grading measurements cannot be modified while products are live.
            </p>
            <p className="text-amber-700 text-[11px]">
              To change specifications: revert linked products to <em>Draft</em> status, unassign this chart, or create a new version/chart.
            </p>
          </div>
        )}

        {/* Specification Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Category</span>
            <p className="text-xs font-semibold text-zinc-900 capitalize">{chart.garment_category}</p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Convention</span>
            <p className="text-xs font-semibold text-zinc-900 truncate" title={getConventionLabel(chart.measurement_convention)}>
              {getConventionLabel(chart.measurement_convention)}
            </p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Grading Unit</span>
            <p className="text-xs font-semibold text-zinc-900 uppercase font-mono">{chart.unit}</p>
          </div>
          <div className="p-3 rounded-xl border border-[#E9EAF3] bg-zinc-50/60 space-y-1">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">Referenced Products</span>
            <p className="text-xs font-semibold text-zinc-900 font-mono">
              {chart.total_products_count ?? 0} total ({chart.active_products_count ?? 0} active)
            </p>
          </div>
        </div>

        {/* Measurement Matrix Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-zinc-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                Measurement Matrix ({rows.length} {rows.length === 1 ? 'size' : 'sizes'})
              </h4>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">
              All dimensions in <strong className="text-zinc-600 uppercase">{chart.unit}</strong>
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-[#E9EAF3]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F8F9FC] text-zinc-600 font-mono text-[11px] border-b border-[#E9EAF3]">
                <tr>
                  <th className="py-2.5 px-3 font-bold w-16">Size</th>
                  {/* Flat garment widths */}
                  {isFlat && (
                    <>
                      <th className="py-2.5 px-3 font-semibold">Flat Chest</th>
                      <th className="py-2.5 px-3 font-semibold">Flat Waist</th>
                      <th className="py-2.5 px-3 font-semibold">Flat Hip</th>
                    </>
                  )}
                  {/* Garment circumferences */}
                  {isGarmentCirc && (
                    <>
                      <th className="py-2.5 px-3 font-semibold">Garment Chest (360°)</th>
                      <th className="py-2.5 px-3 font-semibold">Garment Waist (360°)</th>
                      <th className="py-2.5 px-3 font-semibold">Garment Hip (360°)</th>
                    </>
                  )}
                  {/* Body circumferences */}
                  {isBodyCirc && (
                    <>
                      <th className="py-2.5 px-3 font-semibold">Body Chest</th>
                      <th className="py-2.5 px-3 font-semibold">Body Waist</th>
                      <th className="py-2.5 px-3 font-semibold">Body Hip</th>
                    </>
                  )}
                  {/* Linear lengths */}
                  <th className="py-2.5 px-3 font-semibold">Total Length</th>
                  <th className="py-2.5 px-3 font-semibold">Sleeve</th>
                  <th className="py-2.5 px-3 font-semibold">Inseam</th>
                  <th className="py-2.5 px-3 font-semibold">Shoulder</th>
                  {isEditing && <th className="py-2.5 px-3 font-semibold w-10"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EAF3] text-zinc-800">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold">
                      <Badge className="bg-[#4F46E5] text-white text-xs font-mono px-2 py-0.5 rounded-md">
                        {row.size}
                      </Badge>
                    </td>

                    {/* Flat garment widths */}
                    {isFlat && (
                      <>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.flat_chest_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_chest_width', e.target.value)}
                              className="h-8 text-xs w-20 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.flat_chest_width ? 'font-mono' : 'text-zinc-300'}>
                              {row.flat_chest_width ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.flat_waist_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_waist_width', e.target.value)}
                              className="h-8 text-xs w-20 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.flat_waist_width ? 'font-mono' : 'text-zinc-300'}>
                              {row.flat_waist_width ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.flat_hip_width ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'flat_hip_width', e.target.value)}
                              className="h-8 text-xs w-20 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.flat_hip_width ? 'font-mono' : 'text-zinc-300'}>
                              {row.flat_hip_width ?? '—'}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Garment circumferences */}
                    {isGarmentCirc && (
                      <>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.garment_chest_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_chest_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.garment_chest_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.garment_chest_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.garment_waist_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_waist_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.garment_waist_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.garment_waist_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.garment_hip_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'garment_hip_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.garment_hip_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.garment_hip_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Body circumferences */}
                    {isBodyCirc && (
                      <>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.body_chest_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_chest_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.body_chest_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.body_chest_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.body_waist_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_waist_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.body_waist_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.body_waist_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.1"
                              value={row.body_hip_circumference ?? ''}
                              onChange={(e) => handleDimensionChange(idx, 'body_hip_circumference', e.target.value)}
                              className="h-8 text-xs w-24 rounded-lg"
                              placeholder="—"
                            />
                          ) : (
                            <span className={row.body_hip_circumference ? 'font-mono' : 'text-zinc-300'}>
                              {row.body_hip_circumference ?? '—'}
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    {/* Linear dimensions */}
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={row.total_length ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'total_length', e.target.value)}
                          className="h-8 text-xs w-20 rounded-lg"
                          placeholder="—"
                        />
                      ) : (
                        <span className={row.total_length ? 'font-mono' : 'text-zinc-300'}>
                          {row.total_length ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={row.sleeve_length ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'sleeve_length', e.target.value)}
                          className="h-8 text-xs w-20 rounded-lg"
                          placeholder="—"
                        />
                      ) : (
                        <span className={row.sleeve_length ? 'font-mono' : 'text-zinc-300'}>
                          {row.sleeve_length ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={row.inseam_length ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'inseam_length', e.target.value)}
                          className="h-8 text-xs w-20 rounded-lg"
                          placeholder="—"
                        />
                      ) : (
                        <span className={row.inseam_length ? 'font-mono' : 'text-zinc-300'}>
                          {row.inseam_length ?? '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={row.shoulder_width ?? ''}
                          onChange={(e) => handleDimensionChange(idx, 'shoulder_width', e.target.value)}
                          className="h-8 text-xs w-20 rounded-lg"
                          placeholder="—"
                        />
                      ) : (
                        <span className={row.shoulder_width ? 'font-mono' : 'text-zinc-300'}>
                          {row.shoulder_width ?? '—'}
                        </span>
                      )}
                    </td>

                    {isEditing && (
                      <td className="py-2.5 px-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSize(idx)}
                          className="h-7 w-7 p-0 text-zinc-400 hover:text-rose-600 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add size row during edit mode */}
          {isEditing && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                placeholder="New size (e.g. 3XL, 32W, Petite)"
                value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
                className="h-9 text-xs max-w-xs rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSize}
                className="h-9 text-xs rounded-xl border-[#E9EAF3] gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Size
              </Button>
            </div>
          )}

          <div className="p-3 rounded-xl bg-zinc-50 border border-[#E9EAF3] text-[11px] text-zinc-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Unspecified measurements are recorded as <code>null</code> (omitted from grading calculations). They are never coerced to zero.
            </p>
          </div>
        </div>

        {/* Delete Confirmation Box */}
        {showDeleteConfirm && (
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 space-y-3">
            <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Confirm Size Chart Deletion</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Are you sure you want to delete <strong>{chart.name}</strong>?
              {chart.total_products_count && chart.total_products_count > 0 ? (
                <span className="block mt-1 font-bold text-rose-900">
                  Warning: {chart.total_products_count} product(s) are assigned to this chart. The server will reject deletion unless you unlink them first.
                </span>
              ) : (
                ' This action cannot be undone.'
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="h-8 text-xs rounded-xl gap-1.5 bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Delete Chart
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="h-8 text-xs rounded-xl border-[#E9EAF3]"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#E9EAF3] flex items-center justify-between">
          <div>
            {!isStaff && !showDeleteConfirm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="h-9 text-xs rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Chart
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setName(chart.name);
                    setRows(chart.measurements ? JSON.parse(JSON.stringify(chart.measurements)) : []);
                    setError(null);
                  }}
                  disabled={isSaving}
                  className="h-9 text-xs rounded-xl border-[#E9EAF3]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="h-9 text-xs rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white gap-1.5"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </Button>
              </>
            ) : (
              !isStaff &&
              !isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="h-9 text-xs rounded-xl border-[#E9EAF3] gap-1.5"
                >
                  Edit Specifications
                </Button>
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

