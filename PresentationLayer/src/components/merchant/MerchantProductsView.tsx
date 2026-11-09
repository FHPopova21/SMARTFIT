import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Calendar,
  Layers,
  Archive,
  ChevronRight,
  ShieldAlert,
  Ruler,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { storeService, MerchantProduct } from '@/services/storeService';
import CreateProductDialog from './CreateProductDialog';
import ProductDetailDrawer from './ProductDetailDrawer';

export const MerchantProductsView: React.FC = () => {
  const { activeStore, isLoading: isStoreLoading } = useMerchantStore();

  const [products, setProducts] = useState<MerchantProduct[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals / Drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MerchantProduct | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isStaff = activeStore?.role === 'staff';

  const fetchProducts = useCallback(async () => {
    if (!activeStore) {
      setProducts([]);
      setTotalCount(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const filters: { status?: string; category?: string; search?: string } = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (searchTerm.trim()) filters.search = searchTerm.trim();

      const result = await storeService.listProducts(activeStore.id, filters);
      setProducts(result.products);
      setTotalCount(result.total);
    } catch (err: any) {
      console.warn('Error fetching store products:', err);
      setApiError(err.message || 'Failed to load products from store.');
      setProducts([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [activeStore, statusFilter, categoryFilter, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleProductRowClick = (product: MerchantProduct) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleProductCreated = () => {
    fetchProducts();
  };

  const handleProductUpdated = () => {
    fetchProducts();
    if (selectedProduct && activeStore) {
      storeService
        .getProduct(activeStore.id, selectedProduct.id)
        .then((updated) => setSelectedProduct(updated))
        .catch(() => {});
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

  // 1. Loading Store Context
  if (isStoreLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading store context...</p>
      </div>
    );
  }

  // 2. No Store Selected
  if (!activeStore) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 rounded-2xl bg-white border border-[#E9EAF3] shadow-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center mx-auto">
          <Package className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#0F1117]">No Store Selected</h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Please create or select an active store to manage its product catalog.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#E9EAF3]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F1117] font-heading tracking-tight">
              Products
            </h1>
            <Badge
              variant="outline"
              className="bg-indigo-50 text-[#4F46E5] border-indigo-200 text-xs font-mono font-bold"
            >
              {activeStore.name}
            </Badge>
          </div>
          <p className="text-sm text-zinc-500">
            Manage your store's apparel catalog, size variants, and measurement specifications.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isStaff ? (
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs font-mono py-1.5 px-3">
              Staff (Read-Only)
            </Badge>
          ) : (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9EAF3] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, brand, SKU..."
            className="pl-9 text-xs h-9 rounded-xl border-[#E9EAF3]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs h-9 rounded-xl border-[#E9EAF3]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
              <SelectItem value="draft" className="text-xs">Draft</SelectItem>
              <SelectItem value="active" className="text-xs">Active</SelectItem>
              <SelectItem value="archived" className="text-xs">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 text-xs h-9 rounded-xl border-[#E9EAF3]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs">All Categories</SelectItem>
              <SelectItem value="tops" className="text-xs">Tops</SelectItem>
              <SelectItem value="bottoms" className="text-xs">Bottoms</SelectItem>
              <SelectItem value="dresses" className="text-xs">Dresses</SelectItem>
              <SelectItem value="outerwear" className="text-xs">Outerwear</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => fetchProducts()}
            variant="ghost"
            size="sm"
            className="h-9 px-2.5 text-zinc-500 hover:text-zinc-800 rounded-xl"
            title="Refresh Products"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-7 h-7 text-[#4F46E5] animate-spin" />
          <p className="text-xs text-zinc-400 font-mono">Fetching store catalog...</p>
        </div>
      ) : apiError ? (
        <div className="p-8 rounded-2xl bg-white border border-rose-200 shadow-xs text-center space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-[#0F1117]">Error Loading Catalog</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">{apiError}</p>
          <Button
            onClick={() => fetchProducts()}
            variant="outline"
            size="sm"
            className="text-xs rounded-xl border-[#E9EAF3]"
          >
            Retry
          </Button>
        </div>
      ) : products.length === 0 ? (
        /* PART 3: EMPTY STATE */
        <div className="p-12 sm:p-16 rounded-3xl bg-white border border-[#E9EAF3] shadow-xs text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-[#4F46E5] flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>

          <div className="space-y-1.5 max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-[#0F1117] font-heading">
              Your catalog is empty
            </h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Add your first product and configure its size variants.
            </p>
          </div>

          {!isStaff && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white font-semibold text-xs h-10 px-6 rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Your First Product
            </Button>
          )}
        </div>
      ) : (
        /* PART 2: RESPONSIVE PRODUCTS TABLE */
        <div className="bg-white rounded-2xl border border-[#E9EAF3] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50/70 border-b border-[#E9EAF3] text-zinc-500 font-mono uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size Chart</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Created</th>
                  <th className="py-3 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9EAF3]">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => handleProductRowClick(p)}
                    className="hover:bg-zinc-50/70 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-zinc-900 group-hover:text-[#4F46E5] transition-colors">
                        {p.name}
                      </div>
                      {p.brand && (
                        <div className="text-[11px] text-zinc-400 font-normal">
                          {p.brand} {p.sku_prefix ? `• ${p.sku_prefix}` : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 capitalize text-zinc-600">
                      {p.category}
                    </td>

                    <td className="py-3 px-4">
                      {p.size_chart_name ? (
                        <div className="flex items-center gap-1.5 text-zinc-700 font-medium">
                          <Ruler className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{p.size_chart_name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px]">Unlinked</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {p.variants && p.variants.length > 0 ? (
                          p.variants.slice(0, 4).map((v) => (
                            <span
                              key={v.id}
                              className="px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-mono text-[10px] font-semibold"
                            >
                              {v.size}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-400 text-[11px] italic">0 sizes</span>
                        )}
                        {p.variants && p.variants.length > 4 && (
                          <span className="text-zinc-400 text-[10px] font-mono">
                            +{p.variants.length - 4}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getStatusBadge(p.status)}
                    </td>

                    <td className="py-3 px-4 text-right font-mono text-zinc-400 text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-2.5 px-4 bg-zinc-50/50 border-t border-[#E9EAF3] flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Showing {products.length} of {totalCount} products</span>
            <span className="capitalize">Store: {activeStore.name}</span>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      <CreateProductDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onProductCreated={handleProductCreated}
      />

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        product={selectedProduct}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onProductUpdated={handleProductUpdated}
      />
    </div>
  );
};

export default MerchantProductsView;

