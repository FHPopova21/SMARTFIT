import type { MerchantStore } from '../services/storeService';

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'available' | 'incomplete' | 'blocked';
  statusLabel: string;
  badge?: string;
  actionLabel?: string;
  actionHref?: string;
  isActionDialog?: boolean;
  note?: string;
}

/**
 * Derives setup checklist steps based on real backend state.
 * Never fabricates progress; strictly categorizes steps as completed, available, pending, or planned.
 */
export function deriveSetupChecklist(activeStore: MerchantStore | null): SetupStep[] {
  const isStoreSelected = Boolean(activeStore && activeStore.id);

  return [
    {
      id: 'store',
      title: '1. Create or select your store',
      description: isStoreSelected
        ? `Store "${activeStore?.name}" (${activeStore?.platform_type}, ${activeStore?.currency}) is selected.`
        : 'Create your first store entity in FitVision to manage sizes and catalogs.',
      status: isStoreSelected ? 'completed' : 'incomplete',
      statusLabel: isStoreSelected ? 'Completed' : 'Pending Setup',
      badge: isStoreSelected ? 'Store Active' : 'Action Needed',
      actionLabel: isStoreSelected ? undefined : 'Create Store',
      isActionDialog: !isStoreSelected,
      note: isStoreSelected
        ? 'Store entity verified in your merchant workspace.'
        : 'Set up your store name, default currency, and platform type.',
    },
    {
      id: 'catalog',
      title: '2. Connect catalog',
      description: 'Synchronize products and variants from your ecommerce platform or upload your apparel catalog.',
      status: 'incomplete',
      statusLabel: 'Catalog not connected',
      badge: '0 Products Synced',
      note: 'External catalog synchronization endpoints will be available when ecommerce connectors are configured.',
    },
    {
      id: 'measurements',
      title: '3. Add product measurements',
      description: 'Input explicit flat-width or circumference garment dimensions and material elasticity for your catalog.',
      status: 'incomplete',
      statusLabel: 'Product measurements pending',
      badge: 'Pending',
      note: 'Garment specs strictly distinguish flat width vs. circumference to prevent sizing errors.',
    },
    {
      id: 'size-charts',
      title: '4. Configure size charts',
      description: 'Map garment grading across standard sizes (XS through XXL) with verified ease tolerances.',
      status: 'blocked',
      statusLabel: 'Coming Soon',
      badge: 'Planned',
      note: 'Size charts will automatically feed the 2D mannequin ease calculations.',
    },
    {
      id: 'preview-widget',
      title: '5. Preview FitVision Widget',
      description: 'Test the shopper size recommendation experience and visual fit mannequin with sample data.',
      status: 'available',
      statusLabel: 'Prototype available',
      badge: 'Working Prototype',
      actionLabel: 'Preview Widget Demo',
      actionHref: '/recommendation',
      note: 'Interactive size recommendation engine with 2D mannequin visualization.',
    },
    {
      id: 'activate',
      title: '6. Activate integration',
      description: 'Publish the FitVision script tag to your live store theme once catalog and sizing are configured.',
      status: 'blocked',
      statusLabel: 'Awaiting Connection',
      badge: 'Prerequisites Needed',
      note: 'Requires completing steps 1 through 4 and connecting live storefront credentials.',
    },
  ];
}
