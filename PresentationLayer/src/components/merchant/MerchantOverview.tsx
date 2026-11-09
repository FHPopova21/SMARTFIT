import React from 'react';
import {
  Store,
  Package,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import SetupChecklist from './SetupChecklist';
import IntegrationStatusCard from './IntegrationStatusCard';
import EmptyState from './EmptyState';
import MerchantFirstTimeOnboarding from './MerchantFirstTimeOnboarding';

export const MerchantOverview: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    stores,
    activeStore,
    isLoading,
    apiError,
    isSessionExpired,
    refreshStores,
    openCreateStore,
  } = useMerchantStore();

  const isSeller = isAuthenticated && (user?.role === 'seller' || user?.role === 'admin');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading merchant dashboard...</p>
      </div>
    );
  }

  // Session Expired state
  if (isSessionExpired) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white border border-[#E9EAF3] shadow-md text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F1117]">Session Expired</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Your authenticated merchant session has expired. Please sign in again to access your store console.
          </p>
        </div>
        <Button asChild className="bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl">
          <Link to="/signin">Sign In Again</Link>
        </Button>
      </div>
    );
  }

  // API Error state (Do NOT falsely treat as zero stores)
  if (apiError && stores.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-white border border-rose-200 shadow-md text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#0F1117]">Unable to load store data</h2>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            {apiError}
          </p>
        </div>
        <Button
          onClick={() => refreshStores()}
          variant="outline"
          className="border-zinc-300 hover:bg-zinc-50 text-xs font-semibold rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  // First-time onboarding screen when merchant legitimately has ZERO stores
  if (isAuthenticated && isSeller && stores.length === 0) {
    return (
      <MerchantFirstTimeOnboarding onCreateStoreClick={openCreateStore} />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#E9EAF3]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F1117] font-heading tracking-tight">
              Dashboard Overview
            </h1>
            {activeStore && (
              <Badge
                variant="outline"
                className="bg-indigo-50 text-[#4F46E5] border-indigo-200 text-xs font-mono font-bold"
              >
                {activeStore.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-zinc-500">
            Manage your store's AI-powered sizing experience.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-[#E9EAF3] bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-xl h-9"
          >
            <Link to="/clothing">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              View Sample Catalog Demo
            </Link>
          </Button>

          <Button
            asChild
            size="sm"
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-medium rounded-xl h-9 shadow-xs"
          >
            <Link to="/recommendation">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Test Recommendation Engine
            </Link>
          </Button>
        </div>
      </div>

      {/* Guest / Unauthenticated Notice Banner */}
      {!isSeller && (
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100/80 text-[#4F46E5] flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#0F1117]">
                {isAuthenticated
                  ? `Signed in as ${user?.username || user?.name} (${user?.role} role)`
                  : 'Sandbox Preview Mode'}
              </p>
              <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
                {isAuthenticated
                  ? 'Your current account does not have merchant privileges. You are viewing the UI layout prototype in evaluation mode.'
                  : 'You are viewing the isolated merchant dashboard prototype. Sign in with a merchant account to create stores and manage sizing.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 pl-11 sm:pl-0">
            {!isAuthenticated ? (
              <>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs font-semibold border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 rounded-lg"
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="h-8 text-xs font-semibold bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg shadow-xs"
                >
                  <Link to="/signup">Register Merchant</Link>
                </Button>
              </>
            ) : (
              <Badge className="bg-white text-zinc-700 border-zinc-200 text-xs font-mono">
                Evaluation Session
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* SECTION A: Store Status Card */}
      <section aria-labelledby="store-connection-title">
        <div className="bg-white rounded-2xl border border-[#E9EAF3] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4F46E5] shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="store-connection-title"
                    className="text-base font-bold text-[#0F1117]"
                  >
                    {activeStore ? activeStore.name : 'Store Status'}
                  </h2>
                  <Badge
                    className={
                      activeStore
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 text-xs font-mono font-semibold'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200 text-xs font-mono font-semibold'
                    }
                  >
                    {activeStore ? 'Store Active' : 'No Store Selected'}
                  </Badge>
                  {activeStore && (
                    <span className="text-xs font-mono text-zinc-400">
                      • Platform: <span className="capitalize">{activeStore.platform_type}</span> ({activeStore.currency})
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 max-w-2xl leading-relaxed">
                  {activeStore
                    ? `Store entity is active in your merchant organization. Storefront connector status is currently ${activeStore.connection_status}. Connect your storefront theme or API credentials once catalog setup is complete.`
                    : 'Create your first store entity in FitVision to configure products, size charts, and storefront integrations.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={openCreateStore}
                variant="outline"
                className="h-9 px-4 text-xs font-semibold border-[#E9EAF3] hover:border-indigo-200 hover:bg-zinc-50 text-zinc-700 rounded-xl"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Store
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: Getting Started Checklist */}
      <section aria-label="Setup Checklist">
        <SetupChecklist />
      </section>

      {/* SECTION C: Product Summary (Empty State) */}
      <section aria-labelledby="product-summary-title">
        <div className="bg-white rounded-2xl border border-[#E9EAF3] p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E9EAF3] gap-2">
            <div>
              <h3
                id="product-summary-title"
                className="text-base font-bold text-[#0F1117] flex items-center gap-2"
              >
                Product Catalog Summary
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                  0 Synced Products
                </span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Garment measurements and sizing tables configured for this store.
              </p>
            </div>
          </div>

          <EmptyState
            icon={Package}
            title="No merchant products synchronized"
            description="Your merchant product catalog has not been linked yet. When catalog synchronization is active, you will be able to review flat-width measurements, assign size grading tables, and monitor ease tolerances here."
            badge="0 Products in Store"
            actionText="Explore Sample Garment Catalog Demo"
            actionHref="/clothing"
            secondaryText="Test Fit Engine"
            secondaryHref="/recommendation"
          />
        </div>
      </section>

      {/* SECTION D: Integration Status */}
      <section aria-label="Integration Status">
        <IntegrationStatusCard />
      </section>

      {/* SECTION E: Quick Access (Working Prototype Demos) */}
      <section aria-labelledby="quick-access-title">
        <div className="bg-white rounded-2xl border border-[#E9EAF3] p-6 shadow-xs">
          <div className="pb-4 border-b border-[#E9EAF3]">
            <h3
              id="quick-access-title"
              className="text-base font-bold text-[#0F1117] flex items-center gap-2"
            >
              Prototype Demonstrations
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Interactive Experiences
              </span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Experience the core sizing algorithms and shopper workflows built in the FitVision engine.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
            <Link
              to="/recommendation"
              className="group p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC]/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4F46E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-indigo-700 bg-indigo-50/60 border-indigo-200">
                    Demo
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-[#0F1117] group-hover:text-[#4F46E5] transition-colors mb-1">
                  AI Size & Fit Engine
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  Interactive size prediction with 2D mannequin and ease calculation.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-[#4F46E5] gap-1 pt-2 border-t border-[#E9EAF3]/80">
                <span>Launch Engine</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/clothing"
              className="group p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC]/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Package className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-700 bg-emerald-50/60 border-emerald-200">
                    Demo
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-[#0F1117] group-hover:text-emerald-700 transition-colors mb-1">
                  Garment Catalog
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  Sample dresses, shirts, and jackets with ISO 8559 measurement specs.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-emerald-700 gap-1 pt-2 border-t border-[#E9EAF3]/80">
                <span>View Products</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/quiz"
              className="group p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC]/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-purple-700 bg-purple-50/60 border-purple-200">
                    Demo
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-[#0F1117] group-hover:text-purple-700 transition-colors mb-1">
                  Shopper Quiz Flow
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  Multi-step questionnaire collecting height, weight, body shape, and fit preferences.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-purple-700 gap-1 pt-2 border-t border-[#E9EAF3]/80">
                <span>Try Quiz</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>

            <Link
              to="/shoes"
              className="group p-4 rounded-xl border border-[#E9EAF3] bg-[#F8F9FC]/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-amber-700 bg-amber-50/60 border-amber-200">
                    Demo
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-[#0F1117] group-hover:text-amber-700 transition-colors mb-1">
                  Footwear Sizing
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed mb-3">
                  Foot length to EU/US conversion with width tolerance adjustment.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-amber-700 gap-1 pt-2 border-t border-[#E9EAF3]/80">
                <span>View Scanner</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MerchantOverview;
