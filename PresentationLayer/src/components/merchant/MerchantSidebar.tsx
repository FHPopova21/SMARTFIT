import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Ruler,
  Sparkles,
  Layers,
  BarChart3,
  Settings,
  ExternalLink,
  Store,
  ChevronRight,
  Plus,
  Info,
  X,
  Check
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMerchantStore } from '@/context/MerchantStoreContext';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  status: 'active' | 'coming_soon';
  description?: string;
}

interface MerchantSidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export const MerchantSidebar: React.FC<MerchantSidebarProps> = ({
  isMobile = false,
  onCloseMobile,
}) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { stores, activeStore, setActiveStore, openCreateStore } = useMerchantStore();
  const [activeTooltipItem, setActiveTooltipItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      path: '/seller',
      status: 'active',
      description: 'Store sizing performance and setup checklist',
    },
    {
      id: 'products',
      label: 'Products',
      icon: Package,
      path: '/seller/products',
      status: 'active',
      description: 'Manage apparel catalog and size specifications',
    },
    {
      id: 'size-charts',
      label: 'Size Charts',
      icon: Ruler,
      path: '/seller/size-charts',
      status: 'active',
      description: 'Define garment grading dimensions and seam specifications',
    },
    {
      id: 'widget-studio',
      label: 'Widget Studio',
      icon: Sparkles,
      path: '/seller/widget',
      status: 'active',
      description: 'Customize storefront embed theme, placement, and copy',
    },
    {
      id: 'integrations',
      label: 'Integrations',
      icon: Layers,
      path: '/seller/integrations',
      status: 'coming_soon',
      description: 'Connect Shopify, WooCommerce, or custom webhooks',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      path: '/seller/analytics',
      status: 'coming_soon',
      description: 'Return reduction and size confidence reporting',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: '/seller/settings',
      status: 'coming_soon',
      description: 'Store profile, team members, and API keys',
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className={`flex flex-col h-full bg-white border-r border-[#E9EAF3] ${
          isMobile ? 'w-full' : 'w-64'
        }`}
        aria-label="Merchant Navigation Sidebar"
      >
        {/* Brand & Store Context Header */}
        <div className="p-4.5 border-b border-[#E9EAF3] flex items-center justify-between">
          <Link
            to="/seller"
            className="flex items-center gap-2.5 group"
            onClick={isMobile ? onCloseMobile : undefined}
          >
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center text-white font-black text-sm shadow-xs group-hover:bg-indigo-700 transition-colors">
              FV
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-black text-base text-[#0F1117] tracking-tight">
                  FitVision
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-[#4F46E5] border border-indigo-100">
                  B2B
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Merchant Console</p>
            </div>
          </Link>

          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Store Context Switcher */}
        <div className="p-3 border-b border-[#E9EAF3]">
          {activeStore ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div
                  role="button"
                  tabIndex={0}
                  className="p-2.5 rounded-xl bg-[#F8F9FC] border border-[#E9EAF3] hover:border-indigo-200 hover:bg-zinc-50 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4F46E5] shrink-0">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#0F1117] truncate">
                        {activeStore.name}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        <span className="text-[10px] text-zinc-500 font-mono capitalize">
                          {activeStore.connection_status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono text-zinc-500 bg-white border-zinc-200 shrink-0">
                    {activeStore.currency}
                  </Badge>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 rounded-xl border-[#E9EAF3] shadow-md p-1.5">
                <DropdownMenuLabel className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider px-2 py-1">
                  Your Stores ({stores.length})
                </DropdownMenuLabel>
                {stores.map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => setActiveStore(s)}
                    className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-zinc-100"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Store className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      <span className="font-semibold text-zinc-800 truncate">{s.name}</span>
                    </div>
                    {activeStore.id === s.id && (
                      <Check className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-[#E9EAF3]" />
                <DropdownMenuItem
                  onClick={openCreateStore}
                  className="flex items-center gap-2 text-xs text-[#4F46E5] font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create New Store
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Store className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-amber-900 truncate">No Store Yet</p>
                  <p className="text-[10px] text-amber-700">Setup required</p>
                </div>
              </div>
              <Button
                onClick={openCreateStore}
                size="sm"
                className="h-7 text-[11px] font-semibold bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg px-2.5 shadow-xs"
              >
                + Create
              </Button>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Merchant Navigation">
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            Platform Menu
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.status === 'active' && (currentPath === item.path || (item.path === '/seller' && currentPath === '/seller/'));

            if (item.status === 'coming_soon') {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>
                    <div
                      role="button"
                      tabIndex={0}
                      aria-disabled="true"
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-500 hover:bg-zinc-50/70 cursor-not-allowed transition-colors select-none group"
                      onClick={() => setActiveTooltipItem(item.id)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-500 transition-colors" />
                        <span>{item.label}</span>
                      </div>
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-mono font-medium bg-zinc-100 text-zinc-500 border-zinc-200 py-0 px-1.5"
                      >
                        Coming Soon
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs max-w-xs">
                    <p className="font-semibold text-zinc-900">{item.label}</p>
                    <p className="text-zinc-500 mt-0.5">{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={isMobile ? onCloseMobile : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-[#4F46E5] shadow-xs'
                    : 'text-zinc-600 hover:text-[#0F1117] hover:bg-zinc-50'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#4F46E5]' : 'text-zinc-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]"></span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer: Environment & Public Link */}
        <div className="p-3 border-t border-[#E9EAF3] space-y-2">
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex items-start gap-2">
            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-semibold text-zinc-700">FitVision Workspace</p>
              <p className="text-[10px] text-zinc-500 leading-normal">
                Dedicated merchant console with verified store isolation.
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              Public Storefront
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default MerchantSidebar;
