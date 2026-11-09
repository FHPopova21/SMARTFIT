import React, { useState, useEffect, useCallback } from 'react';
import {
  Ruler,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Lock,
  Unlock,
  ChevronRight,
  ShieldAlert,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { storeService, SizeChart } from '@/services/storeService';
import { CreateSizeChartDialog } from './CreateSizeChartDialog';
import { SizeChartDetailDrawer } from './SizeChartDetailDrawer';

export const MerchantSizeChartsView: React.FC = () => {
  const { activeStore, isLoading: isStoreLoading } = useMerchantStore();

  const [sizeCharts, setSizeCharts] = useState<SizeChart[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conventionFilter, setConventionFilter] = useState('all');

  // Modals / Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<SizeChart | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isStaff = activeStore?.role === 'staff';

  const fetchSizeCharts = useCallback(async () => {
    if (!activeStore) {
      setSizeCharts([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);
      const charts = await storeService.listSizeCharts(activeStore.id);
      setSizeCharts(charts);
    } catch (err: any) {
      console.warn('Error fetching size charts:', err);
      setApiError(err.message || 'Failed to load size charts for store.');
      setSizeCharts([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore]);

  useEffect(() => {
    fetchSizeCharts();
  }, [fetchSizeCharts]);

  // Client-side filtering
  const filteredCharts = sizeCharts.filter((chart) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      chart.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      chart.garment_category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || chart.garment_category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesConvention =
      conventionFilter === 'all' || chart.measurement_convention === conventionFilter;

    return matchesSearch && matchesCategory && matchesConvention;
  });

  const getConventionBadge = (conv: string) => {
    switch (conv) {
      case 'flat_garment':
        return (
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-mono">
            Flat Garment (Widths)
          </Badge>
        );
      case 'garment_circumference':
        return (
          <Badge className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-mono">
            Garment (360°)
          </Badge>
        );
      case 'body_circumference':
        return (
          <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-mono">
            Body Circumference
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-mono">
            {conv}
          </Badge>
        );
    }
  };

  const handleOpenDetail = (chart: SizeChart) => {
    setSelectedChart(chart);
    setIsDetailOpen(true);
  };

  if (isStoreLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading store context...</p>
      </div>
    );
  }

  if (!activeStore) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 text-center rounded-2xl bg-white border border-[#E9EAF3] shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-zinc-500">
          <Ruler className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-zinc-900 font-heading">No Store Selected</h3>
          <p className="text-xs text-zinc-500">Please select or create a merchant store to manage size charts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E9EAF3]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F1117] font-heading">Size Charts</h1>
            <Badge className="bg-[#4F46E5]/10 text-[#4F46E5] border-transparent font-mono text-xs px-2.5 py-0.5">
              {sizeCharts.length} {sizeCharts.length === 1 ? 'chart' : 'charts'}
            </Badge>
          </div>
          <p className="text-xs text-zinc-500">
            Define garment grading dimensions and seam specifications for{' '}
            <span className="font-semibold text-zinc-800">{activeStore.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSizeCharts}
            disabled={isLoading}
            className="rounded-xl border-[#E9EAF3] text-xs h-9 text-zinc-600 hover:text-zinc-900"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {!isStaff && (
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs h-9 px-4 shadow-sm shadow-[#4F46E5]/20 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create Size Chart
            </Button>
          )}
        </div>
      </div>

      {/* Staff banner if applicable */}
      {isStaff && (
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Staff role active: size chart specifications are viewable in read-only mode.</span>
          </div>
          <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-mono">
            Staff View
          </Badge>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E9EAF3] shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Search size charts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl border-[#E9EAF3]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category filter */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-500">
            <Filter className="w-3.5 h-3.5" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-36 text-xs rounded-xl border-[#E9EAF3]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                <SelectItem value="tops" className="text-xs">Tops</SelectItem>
                <SelectItem value="bottoms" className="text-xs">Bottoms</SelectItem>
                <SelectItem value="dresses" className="text-xs">Dresses</SelectItem>
                <SelectItem value="outerwear" className="text-xs">Outerwear</SelectItem>
                <SelectItem value="accessories" className="text-xs">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Convention filter */}
          <Select value={conventionFilter} onValueChange={setConventionFilter}>
            <SelectTrigger className="h-9 w-44 text-xs rounded-xl border-[#E9EAF3]">
              <SelectValue placeholder="Convention" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">All Conventions</SelectItem>
              <SelectItem value="flat_garment" className="text-xs">Flat Garment (Widths)</SelectItem>
              <SelectItem value="garment_circumference" className="text-xs">Garment (360°)</SelectItem>
              <SelectItem value="body_circumference" className="text-xs">Body Circumference</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || categoryFilter !== 'all' || conventionFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setConventionFilter('all');
              }}
              className="h-9 text-xs text-zinc-500 hover:text-zinc-900 rounded-xl"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load size charts</p>
              <p className="text-[11px] text-rose-700">{apiError}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSizeCharts}
            className="text-xs h-8 rounded-xl border-rose-200 bg-white text-rose-700 hover:bg-rose-50"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Size Charts List / Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-[#E9EAF3] bg-white space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="h-5 w-36 bg-zinc-200 rounded-lg" />
                <div className="h-5 w-12 bg-zinc-200 rounded-md" />
              </div>
              <div className="h-4 w-24 bg-zinc-100 rounded" />
              <div className="h-10 bg-zinc-100 rounded-xl" />
              <div className="h-8 bg-zinc-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredCharts.length === 0 ? (
        // Empty State
        sizeCharts.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#E9EAF3] shadow-sm space-y-5 max-w-lg mx-auto my-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-[#4F46E5]">
              <Ruler className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-[#0F1117] font-heading">
                Your size chart library is empty
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Create a size chart to define garment measurements and enable product-specific sizing.
              </p>
            </div>
            {!isStaff && (
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs h-9 px-5 gap-1.5 shadow-sm shadow-[#4F46E5]/20"
              >
                <Plus className="w-4 h-4" />
                Create Size Chart
              </Button>
            )}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white border border-[#E9EAF3] shadow-sm space-y-3">
            <p className="text-sm font-semibold text-zinc-700">No matching size charts found</p>
            <p className="text-xs text-zinc-400">Try modifying your search or clearing your active filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setConventionFilter('all');
              }}
              className="text-xs rounded-xl border-[#E9EAF3] mt-2"
            >
              Reset Filters
            </Button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCharts.map((chart) => {
            const isLocked = (chart.active_products_count ?? 0) > 0;
            const sizesCount = chart.measurements?.length ?? 0;
            const previewSizes = chart.measurements?.map((m) => m.size).slice(0, 6) || [];

            return (
              <div
                key={chart.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl border border-[#E9EAF3] bg-white shadow-sm hover:shadow-md hover:border-[#D0D3E5] transition-all"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                          #{chart.id}
                        </span>
                        <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200 text-[10px] font-mono">
                          v{chart.version}
                        </Badge>
                        <Badge className="bg-zinc-50 text-zinc-600 border-zinc-200 text-[10px] font-mono uppercase">
                          {chart.unit}
                        </Badge>
                      </div>
                      <h3
                        className="text-base font-bold text-[#0F1117] font-heading group-hover:text-[#4F46E5] transition-colors cursor-pointer truncate"
                        title={chart.name}
                        onClick={() => handleOpenDetail(chart)}
                      >
                        {chart.name}
                      </h3>
                    </div>

                    {isLocked ? (
                      <Badge className="bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-mono flex items-center gap-1 shrink-0">
                        <Lock className="w-2.5 h-2.5 text-amber-600" />
                        Locked ({chart.active_products_count})
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-mono flex items-center gap-1 shrink-0">
                        <Unlock className="w-2.5 h-2.5 text-emerald-600" />
                        Unlocked
                      </Badge>
                    )}
                  </div>

                  {/* Convention and Category */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <Badge className="bg-zinc-100 text-zinc-700 border-transparent text-[10px] capitalize">
                      {chart.garment_category}
                    </Badge>
                    {getConventionBadge(chart.measurement_convention)}
                  </div>

                  {/* Sizes Preview */}
                  <div className="p-3 rounded-xl bg-zinc-50/70 border border-[#E9EAF3] space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                      <span>Graded Sizes ({sizesCount})</span>
                      <span className="text-[10px] text-zinc-400 uppercase">{chart.unit}</span>
                    </div>
                    {previewSizes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {previewSizes.map((s, idx) => (
                          <Badge
                            key={idx}
                            className="bg-white text-zinc-800 border-zinc-200 text-[11px] font-mono px-2 py-0.5"
                          >
                            {s}
                          </Badge>
                        ))}
                        {sizesCount > 6 && (
                          <span className="text-[10px] text-zinc-400 font-mono self-center">
                            +{sizesCount - 6} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-400 italic">No measurement rows defined</p>
                    )}
                  </div>

                  {/* Product Assignment Info */}
                  <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between pt-1">
                    <span>Assigned Products:</span>
                    <span className="font-semibold text-zinc-800">
                      {chart.total_products_count ?? 0} total ({chart.active_products_count ?? 0} live)
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 mt-3 border-t border-[#E9EAF3] flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {chart.chart_type === 'body_measurements' ? 'Body Sizing' : 'Garment Dimensions'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDetail(chart)}
                    className="h-8 text-xs text-[#4F46E5] hover:text-[#4338CA] hover:bg-indigo-50/50 rounded-xl gap-1 group-hover:translate-x-0.5 transition-all p-2 font-medium"
                  >
                    Inspect Specs
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Drawers */}
      <CreateSizeChartDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onChartCreated={fetchSizeCharts}
      />

      <SizeChartDetailDrawer
        chart={selectedChart}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onChartUpdated={fetchSizeCharts}
        onChartDeleted={() => {
          fetchSizeCharts();
          setIsDetailOpen(false);
          setSelectedChart(null);
        }}
      />
    </div>
  );
};

export default MerchantSizeChartsView;

