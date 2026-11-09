import React from 'react';
import { Menu, Store, Bell, LogOut, LogIn, User as UserIcon, Shield, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MerchantHeaderProps {
  onOpenMobileNav: () => void;
}

export const MerchantHeader: React.FC<MerchantHeaderProps> = ({ onOpenMobileNav }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { activeStore, openCreateStore } = useMerchantStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isVerifiedSeller = isAuthenticated && (user?.role === 'seller' || user?.role === 'admin');

  return (
    <header
      className="h-16 bg-white border-b border-[#E9EAF3] px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30"
      aria-label="Merchant Dashboard Header"
    >
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          className="lg:hidden p-2 rounded-xl text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className="text-zinc-500 font-mono">Merchant Console</span>
          <span>/</span>
          <span className="text-[#0F1117] font-semibold">Overview</span>
        </div>
      </div>

      {/* Center / Right: Store status & User profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Store Connection Status Pill */}
        {activeStore ? (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F8F9FC] border border-[#E9EAF3] text-xs">
            <Store className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-zinc-500 font-medium">Store:</span>
            <span className="font-semibold text-zinc-800">{activeStore.name}</span>
            <span className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-medium ${
              activeStore.connection_status === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {activeStore.connection_status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        ) : (
          <Button
            onClick={openCreateStore}
            size="sm"
            variant="outline"
            className="hidden md:flex items-center gap-1.5 h-8 text-xs font-semibold rounded-xl border-dashed border-indigo-300 text-[#4F46E5] hover:bg-indigo-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Store
          </Button>
        )}

        {/* Auth / Profile Menu */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-10 px-2 sm:px-3 rounded-xl border border-transparent hover:border-[#E9EAF3] hover:bg-zinc-50 flex items-center gap-2 text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-[#4F46E5] font-mono shrink-0">
                  {user?.name ? user.name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'M')}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-[#0F1117] leading-tight truncate max-w-[120px]">
                    {user?.name || user?.username || 'Merchant'}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-mono leading-tight">
                    {user?.role === 'seller' ? 'Seller Account' : `${user?.role} role`}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl border-[#E9EAF3] shadow-md p-1.5">
              <DropdownMenuLabel className="p-2">
                <p className="text-xs font-bold text-[#0F1117]">{user?.name || user?.username}</p>
                <p className="text-[11px] text-zinc-400 font-mono truncate">{user?.email}</p>
                <div className="mt-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono font-medium ${
                      isVerifiedSeller
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {isVerifiedSeller ? 'Role: Verified Seller' : `Role: ${user?.role}`}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#E9EAF3]" />
              <DropdownMenuItem
                onClick={() => navigate('/seller/profile')}
                className="text-xs text-zinc-700 cursor-pointer rounded-lg px-2.5 py-1.5 hover:bg-zinc-100"
              >
                <UserIcon className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                Merchant Profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={openCreateStore}
                className="text-xs text-zinc-700 cursor-pointer rounded-lg px-2.5 py-1.5 hover:bg-zinc-100"
              >
                <Plus className="w-3.5 h-3.5 mr-2 text-zinc-500" />
                Add Another Store
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#E9EAF3]" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-xs text-red-600 cursor-pointer rounded-lg px-2.5 py-1.5 hover:bg-red-50"
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
              Preview Mode
            </span>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 text-xs font-semibold text-zinc-700 border-[#E9EAF3] hover:bg-zinc-50 rounded-xl"
            >
              <Link to="/signin">
                <LogIn className="w-3.5 h-3.5 mr-1.5" />
                Sign In
              </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default MerchantHeader;
