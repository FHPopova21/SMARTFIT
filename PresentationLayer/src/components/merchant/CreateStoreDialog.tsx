import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Store, AlertCircle, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import { storeService, MerchantStore } from '@/services/storeService';
import { useAuthStore } from '@/store/authStore';

interface CreateStoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStoreCreated: (store: MerchantStore) => void;
}

export const CreateStoreDialog: React.FC<CreateStoreDialogProps> = ({
  isOpen,
  onClose,
  onStoreCreated,
}) => {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [platformType, setPlatformType] = useState('custom');
  const [currency, setCurrency] = useState('BGN');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a store name.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const newStore = await storeService.createStore({
        name: name.trim(),
        currency,
        platform_type: platformType,
        website_url: websiteUrl.trim() || undefined,
      });

      // Reset form
      setName('');
      setWebsiteUrl('');
      setPlatformType('custom');
      setCurrency('BGN');

      onStoreCreated(newStore);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create store. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl border-[#E9EAF3] bg-white shadow-xl">
        <DialogHeader className="pb-3 border-b border-[#E9EAF3]">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-[#4F46E5]">
              <Store className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-[#0F1117] font-heading">
              Create Your Store
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-zinc-500">
            Define your store's identity and default sizing currency to begin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Store Name */}
          <div className="space-y-1.5">
            <Label htmlFor="store-name" className="text-xs font-semibold text-zinc-700">
              Store Name <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="store-name"
              placeholder="e.g. Nordic Apparel Flagship"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs rounded-xl border-[#E9EAF3] focus-visible:ring-[#4F46E5]"
              disabled={submitting}
              required
            />
          </div>

          {/* Store Website */}
          <div className="space-y-1.5">
            <Label htmlFor="store-website" className="text-xs font-semibold text-zinc-700">
              Store Website <span className="text-zinc-400 font-normal">(Optional)</span>
            </Label>
            <Input
              id="store-website"
              placeholder="https://yourstore.com"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="h-10 text-xs rounded-xl border-[#E9EAF3] focus-visible:ring-[#4F46E5]"
              disabled={submitting}
            />
            <p className="text-[11px] text-zinc-400">
              Store URL validation active. Database column persistence pending migration approval.
            </p>
          </div>

          {/* Platform & Currency Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="platform-type" className="text-xs font-semibold text-zinc-700">
                Ecommerce Platform
              </Label>
              <Select
                value={platformType}
                onValueChange={setPlatformType}
                disabled={submitting}
              >
                <SelectTrigger id="platform-type" className="h-10 text-xs rounded-xl border-[#E9EAF3]">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E9EAF3]">
                  <SelectItem value="custom">Custom Storefront</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                  <SelectItem value="magento">Magento 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-currency" className="text-xs font-semibold text-zinc-700">
                Default Currency
              </Label>
              <Select
                value={currency}
                onValueChange={setCurrency}
                disabled={submitting}
              >
                <SelectTrigger id="store-currency" className="h-10 text-xs rounded-xl border-[#E9EAF3]">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-[#E9EAF3]">
                  <SelectItem value="BGN">BGN (лв)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Disclosure Notice */}
          <div className="p-3 rounded-xl bg-[#F8F9FC] border border-[#E9EAF3] text-[11px] text-zinc-500 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4F46E5]" />
              Multi-Tenant Sandbox Context
            </div>
            <p>
              This store will be isolated under your merchant organization (<code className="font-mono text-zinc-700">{user?.username || 'seller'}-org</code>). All newly created stores start with status <span className="font-mono text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">disconnected</span> until live API keys or theme extensions are linked.
            </p>
          </div>

          <DialogFooter className="pt-3 border-t border-[#E9EAF3] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-[#E9EAF3] text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 px-4 text-xs font-semibold rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-xs"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Creating Store...
                </>
              ) : (
                <>
                  Create Store
                  <Sparkles className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateStoreDialog;

