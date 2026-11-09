import { describe, it } from 'node:test';
import assert from 'node:assert';
import { deriveSetupChecklist } from './merchantChecklist.ts';
import type { MerchantStore } from '../services/storeService.ts';

describe('Merchant Setup Checklist State Derivation', () => {
  it('correctly marks store setup incomplete when no store is selected', () => {
    const steps = deriveSetupChecklist(null);
    assert.strictEqual(steps.length, 6);

    const storeStep = steps.find((s) => s.id === 'store');
    assert.ok(storeStep);
    assert.strictEqual(storeStep?.status, 'incomplete');
    assert.strictEqual(storeStep?.statusLabel, 'Pending Setup');
    assert.strictEqual(storeStep?.badge, 'Action Needed');
    assert.strictEqual(storeStep?.actionLabel, 'Create Store');
    assert.strictEqual(storeStep?.isActionDialog, true);

    const catalogStep = steps.find((s) => s.id === 'catalog');
    assert.strictEqual(catalogStep?.statusLabel, 'Catalog not connected');

    const measurementsStep = steps.find((s) => s.id === 'measurements');
    assert.strictEqual(measurementsStep?.statusLabel, 'Product measurements pending');

    const chartsStep = steps.find((s) => s.id === 'size-charts');
    assert.strictEqual(chartsStep?.statusLabel, 'Coming Soon');

    const widgetStep = steps.find((s) => s.id === 'preview-widget');
    assert.strictEqual(widgetStep?.status, 'available');
    assert.strictEqual(widgetStep?.statusLabel, 'Prototype available');

    const activateStep = steps.find((s) => s.id === 'activate');
    assert.strictEqual(activateStep?.status, 'blocked');
    assert.strictEqual(activateStep?.statusLabel, 'Awaiting Connection');
  });

  it('marks store setup complete when a verified store is active', () => {
    const activeStore: MerchantStore = {
      id: 42,
      organization_id: 10,
      organization_name: 'Test Apparel Org',
      name: 'Nordic Boutique',
      slug: 'nordic-boutique',
      currency: 'EUR',
      platform_type: 'shopify',
      connection_status: 'disconnected',
      role: 'owner',
      created_at: new Date().toISOString(),
    };

    const steps = deriveSetupChecklist(activeStore);
    const storeStep = steps.find((s) => s.id === 'store');
    assert.ok(storeStep);
    assert.strictEqual(storeStep?.status, 'completed');
    assert.strictEqual(storeStep?.statusLabel, 'Completed');
    assert.strictEqual(storeStep?.badge, 'Store Active');
    assert.strictEqual(storeStep?.actionLabel, undefined);
    assert.ok(storeStep?.description.includes('Nordic Boutique'));

    // Verify other steps still accurately reflect unverified/pending integrations
    const catalogStep = steps.find((s) => s.id === 'catalog');
    assert.strictEqual(catalogStep?.status, 'incomplete');
    assert.strictEqual(catalogStep?.statusLabel, 'Catalog not connected');

    const measurementsStep = steps.find((s) => s.id === 'measurements');
    assert.strictEqual(measurementsStep?.status, 'incomplete');
    assert.strictEqual(measurementsStep?.statusLabel, 'Product measurements pending');

    const widgetStep = steps.find((s) => s.id === 'preview-widget');
    assert.strictEqual(widgetStep?.status, 'available');
    assert.strictEqual(widgetStep?.statusLabel, 'Prototype available');
  });
});
