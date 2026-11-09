import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Palette,
  Ruler,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  Globe,
  Lock,
  Layers,
  Store,
  RefreshCw,
} from 'lucide-react';
import { useMerchantStore } from '@/context/MerchantStoreContext';
import { storeService, WidgetConfig, UpdateWidgetConfigPayload } from '@/services/storeService';
import { WidgetStudioPreview } from './WidgetStudioPreview';
import {
  validateWidgetConfigForm,
  evaluateColorContrast,
  HEX_COLOR_REGEX,
  ALLOWED_BORDER_RADII,
  ALLOWED_DEFAULT_UNITS,
  ALLOWED_LANGUAGES,
} from '@/utils/widgetConfigValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const MerchantWidgetStudioView: React.FC = () => {
  const { activeStore, stores, openCreateStore, isLoading: isStoreLoading } = useMerchantStore();

  // Server-confirmed baseline configuration
  const [serverConfig, setServerConfig] = useState<WidgetConfig | null>(null);
  // Current user draft form values
  const [formConfig, setFormConfig] = useState<WidgetConfig | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Guard against stale asynchronous responses when user switches stores rapidly
  const currentStoreIdRef = useRef<number | null>(null);

  // Role permissions
  const canEdit = useMemo(() => {
    if (!activeStore) return false;
    return activeStore.role === 'owner' || activeStore.role === 'admin';
  }, [activeStore]);

  // Load configuration for the active store
  const loadWidgetConfig = useCallback(async (storeId: number) => {
    setIsLoading(true);
    setFetchError(null);
    setSaveSuccessMessage(null);

    try {
      const data = await storeService.getWidgetConfig(storeId);
      // Ensure the received data belongs to the currently active store
      if (currentStoreIdRef.current === storeId) {
        setServerConfig(data);
        setFormConfig(data);
      }
    } catch (err: any) {
      if (currentStoreIdRef.current === storeId) {
        const errorMsg =
          err?.message || 'Failed to retrieve store widget configuration from server.';
        setFetchError(errorMsg);
        setServerConfig(null);
        setFormConfig(null);
      }
    } finally {
      if (currentStoreIdRef.current === storeId) {
        setIsLoading(false);
      }
    }
  }, []);

  // Synchronize on store switch
  useEffect(() => {
    if (activeStore?.id) {
      currentStoreIdRef.current = activeStore.id;
      loadWidgetConfig(activeStore.id);
    } else {
      currentStoreIdRef.current = null;
      setServerConfig(null);
      setFormConfig(null);
      setIsLoading(false);
    }
  }, [activeStore?.id, loadWidgetConfig]);

  // Detect dirty state (has unsaved modifications)
  const isDirty = useMemo(() => {
    if (!serverConfig || !formConfig) return false;
    return (
      serverConfig.is_enabled !== formConfig.is_enabled ||
      serverConfig.button_label !== formConfig.button_label ||
      serverConfig.primary_color !== formConfig.primary_color ||
      serverConfig.text_color !== formConfig.text_color ||
      serverConfig.border_radius !== formConfig.border_radius ||
      serverConfig.show_ruler_icon !== formConfig.show_ruler_icon ||
      serverConfig.default_unit !== formConfig.default_unit ||
      serverConfig.default_language !== formConfig.default_language
    );
  }, [serverConfig, formConfig]);

  // Form validation feedback
  const validation = useMemo(() => {
    if (!formConfig) return { isValid: true };
    return validateWidgetConfigForm(formConfig);
  }, [formConfig]);

  // Color contrast feedback
  const contrast = useMemo(() => {
    if (!formConfig) return { ratio: null, isAccessible: true };
    return evaluateColorContrast(formConfig.primary_color, formConfig.text_color);
  }, [formConfig]);

  // Handler for form input updates
  const handleFieldChange = <K extends keyof WidgetConfig>(field: K, value: WidgetConfig[K]) => {
    if (!canEdit) return;
    setSaveSuccessMessage(null);
    setFormConfig((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  // Revert changes back to server state
  const handleReset = () => {
    if (serverConfig) {
      setFormConfig(serverConfig);
      setSaveSuccessMessage(null);
      toast.info('Form reverted to last saved configuration');
    }
  };

  // Save changes to backend
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeStore || !formConfig || !canEdit || !isDirty || !validation.isValid || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveSuccessMessage(null);

    const payload: UpdateWidgetConfigPayload = {
      is_enabled: formConfig.is_enabled,
      button_label: formConfig.button_label.trim(),
      primary_color: formConfig.primary_color.trim(),
      text_color: formConfig.text_color.trim(),
      border_radius: formConfig.border_radius,
      show_ruler_icon: formConfig.show_ruler_icon,
      default_unit: formConfig.default_unit,
      default_language: formConfig.default_language,
    };

    try {
      const updated = await storeService.updateWidgetConfig(activeStore.id, payload);
      setServerConfig(updated);
      setFormConfig(updated);
      setSaveSuccessMessage('Widget configuration saved successfully.');
      toast.success('Widget settings updated successfully');
    } catch (err: any) {
      const errorMsg =
        err?.message || 'Failed to update widget configuration on the server.';
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Render: No store selected
  if (!activeStore && !isStoreLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E9EAF3] p-12 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <Store className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">No Store Selected</h3>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Select or create a merchant store in the sidebar to configure and preview the FitVision storefront widget.
        </p>
        <Button
          onClick={openCreateStore}
          className="bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4 py-2"
        >
          Create Store
        </Button>
      </div>
    );
  }

  // Render: Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E9EAF3] p-16 text-center shadow-xs space-y-3">
        <RefreshCw className="w-8 h-8 text-[#4F46E5] animate-spin mx-auto" />
        <h4 className="text-sm font-semibold text-zinc-800">Loading Widget Studio...</h4>
        <p className="text-xs text-zinc-400">
          Fetching configuration for {activeStore?.name || 'store'}.
        </p>
      </div>
    );
  }

  // Render: Fetch error state
  if (fetchError || !formConfig) {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-8 text-center max-w-lg mx-auto shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-zinc-900">Failed to Load Widget Configuration</h3>
        <p className="text-xs text-zinc-600 leading-relaxed">{fetchError}</p>
        <Button
          onClick={() => activeStore && loadWidgetConfig(activeStore.id)}
          className="bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold px-4 py-2"
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Widget Studio
            </h1>
            <Badge className="bg-indigo-50 text-[#4F46E5] border-indigo-200 text-xs font-semibold">
              Milestone 4B.2
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Customize the appearance, behavior, and localization of the FitVision PDP sizing trigger for{' '}
            <strong className="text-zinc-800 font-semibold">{activeStore?.name}</strong>.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving || !canEdit}
              className="text-xs font-medium text-zinc-600 border-zinc-200 hover:bg-zinc-100 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </Button>
          )}

          {canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => handleSave()}
              disabled={!isDirty || !validation.isValid || isSaving}
              className="bg-[#4F46E5] hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl px-4 shadow-xs"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Staff View-Only Banner */}
      {!canEdit && (
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold">View-Only Access (Staff Role):</span> You can preview
            widget styling and configurations, but Admin or Owner privileges are required to save changes.
          </div>
        </div>
      )}

      {/* Save Success Banner */}
      {saveSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveSuccessMessage}</span>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {isDirty && canEdit && (
        <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60 flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4F46E5] animate-pulse"></span>
            <span>You have unsaved changes to this store&apos;s widget configuration.</span>
          </div>
          <span className="text-[11px] font-mono font-medium text-indigo-600">Draft uncommitted</span>
        </div>
      )}

      {/* Main Studio Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls Form (7 Cols) */}
        <div className="lg:col-span-6 xl:col-span-5 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Card 1: Activation Preference */}
            <div className="bg-white rounded-2xl border border-[#E9EAF3] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="widget-enabled" className="text-xs font-bold text-zinc-900 cursor-pointer">
                    Enable Sizing Widget
                  </Label>
                  <p className="text-[11px] text-zinc-500">
                    Control whether the FitVision trigger appears on your product pages.
                  </p>
                </div>
                <Switch
                  id="widget-enabled"
                  checked={formConfig.is_enabled}
                  onCheckedChange={(checked) => handleFieldChange('is_enabled', checked)}
                  disabled={!canEdit}
                />
              </div>

              <div className="text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Note:</strong> Enabling this setting saves your store preference. Public storefront API delivery will activate in Milestone 4C.
                </span>
              </div>
            </div>

            {/* Card 2: Button Appearance & Typography */}
            <div className="bg-white rounded-2xl border border-[#E9EAF3] p-5 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-[#E9EAF3] pb-3">
                <Palette className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Button Appearance
                </h3>
              </div>

              {/* Button Label */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="button_label" className="text-xs font-semibold text-zinc-800">
                    Button Label
                  </Label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {formConfig.button_label.length}/50
                  </span>
                </div>
                <Input
                  id="button_label"
                  value={formConfig.button_label}
                  onChange={(e) => handleFieldChange('button_label', e.target.value)}
                  maxLength={50}
                  disabled={!canEdit}
                  placeholder="e.g. Compare My Fit"
                  className="rounded-xl text-xs"
                />
                {formConfig.button_label.trim().length === 0 && (
                  <p className="text-[11px] text-red-600 font-medium">Button label cannot be empty.</p>
                )}
              </div>

              {/* Color Controls (Primary Color & Text Color) */}
              <div className="grid grid-cols-2 gap-4">
                {/* Primary Background Color */}
                <div className="space-y-1.5">
                  <Label htmlFor="primary_color" className="text-xs font-semibold text-zinc-800">
                    Button Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="primary_color_picker"
                      value={HEX_COLOR_REGEX.test(formConfig.primary_color) ? formConfig.primary_color : '#4F46E5'}
                      onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                      disabled={!canEdit}
                      aria-label="Pick button primary color"
                      className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200 p-0.5 bg-white shrink-0"
                    />
                    <Input
                      id="primary_color"
                      value={formConfig.primary_color}
                      onChange={(e) => handleFieldChange('primary_color', e.target.value)}
                      disabled={!canEdit}
                      placeholder="#4F46E5"
                      className="rounded-xl font-mono text-xs uppercase"
                    />
                  </div>
                  {!HEX_COLOR_REGEX.test(formConfig.primary_color) && (
                    <p className="text-[10px] text-red-600 font-medium">Invalid hex (e.g. #4F46E5)</p>
                  )}
                </div>

                {/* Text Color */}
                <div className="space-y-1.5">
                  <Label htmlFor="text_color" className="text-xs font-semibold text-zinc-800">
                    Text Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="text_color_picker"
                      value={HEX_COLOR_REGEX.test(formConfig.text_color) ? formConfig.text_color : '#FFFFFF'}
                      onChange={(e) => handleFieldChange('text_color', e.target.value)}
                      disabled={!canEdit}
                      aria-label="Pick button text color"
                      className="w-8 h-8 rounded-lg cursor-pointer border border-zinc-200 p-0.5 bg-white shrink-0"
                    />
                    <Input
                      id="text_color"
                      value={formConfig.text_color}
                      onChange={(e) => handleFieldChange('text_color', e.target.value)}
                      disabled={!canEdit}
                      placeholder="#FFFFFF"
                      className="rounded-xl font-mono text-xs uppercase"
                    />
                  </div>
                  {!HEX_COLOR_REGEX.test(formConfig.text_color) && (
                    <p className="text-[10px] text-red-600 font-medium">Invalid hex (e.g. #FFFFFF)</p>
                  )}
                </div>
              </div>

              {/* Color Contrast Evaluation Feedback */}
              {contrast.warning && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-950">Low Color Contrast Warning</p>
                    <p className="text-[11px] leading-relaxed text-amber-800">{contrast.warning}</p>
                  </div>
                </div>
              )}

              {/* Button Shape / Border Radius */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-800">Button Corner Shape</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ALLOWED_BORDER_RADII.map((radius) => {
                    const isSelected = formConfig.border_radius === radius;
                    return (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => handleFieldChange('border_radius', radius)}
                        disabled={!canEdit}
                        className={`py-2 px-3 text-xs font-semibold capitalize border transition-all ${
                          isSelected
                            ? 'border-[#4F46E5] bg-indigo-50/60 text-[#4F46E5] shadow-xs'
                            : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        } ${
                          radius === 'pill'
                            ? 'rounded-full'
                            : radius === 'rounded'
                            ? 'rounded-xl'
                            : 'rounded-none'
                        }`}
                      >
                        {radius}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show Ruler Icon Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                <div className="space-y-0.5">
                  <Label htmlFor="show_ruler_icon" className="text-xs font-semibold text-zinc-800 cursor-pointer">
                    Show Measurement Icon
                  </Label>
                  <p className="text-[11px] text-zinc-500">
                    Display a subtle ruler symbol inside the button.
                  </p>
                </div>
                <Switch
                  id="show_ruler_icon"
                  checked={formConfig.show_ruler_icon}
                  onCheckedChange={(checked) => handleFieldChange('show_ruler_icon', checked)}
                  disabled={!canEdit}
                />
              </div>
            </div>

            {/* Card 3: Localization & Units */}
            <div className="bg-white rounded-2xl border border-[#E9EAF3] p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-[#E9EAF3] pb-3">
                <Globe className="w-4 h-4 text-[#4F46E5]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                  Localization & Default Units
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Default Unit */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-800">Default Unit</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLOWED_DEFAULT_UNITS.map((unit) => {
                      const isSelected = formConfig.default_unit === unit;
                      return (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => handleFieldChange('default_unit', unit)}
                          disabled={!canEdit}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase border transition-all ${
                            isSelected
                              ? 'border-[#4F46E5] bg-indigo-50/70 text-[#4F46E5]'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          {unit}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-400">Default for shopper comparison</p>
                </div>

                {/* Default Language */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-zinc-800">Default Language</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {ALLOWED_LANGUAGES.map((lang) => {
                      const isSelected = formConfig.default_language === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => handleFieldChange('default_language', lang)}
                          disabled={!canEdit}
                          className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase border transition-all ${
                            isSelected
                              ? 'border-[#4F46E5] bg-indigo-50/70 text-[#4F46E5]'
                              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          {lang === 'en' ? 'English' : 'Български'}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-zinc-400">Modal interface language</p>
                </div>
              </div>
            </div>
          </form>

          {/* Card 4: Storefront Installation (Coming Soon - Milestone 4C) */}
          <div className="bg-zinc-50/70 rounded-2xl border border-zinc-200/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-zinc-500" />
                <h4 className="text-xs font-bold text-zinc-800">
                  Storefront Installation
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-semibold text-zinc-500 bg-white">
                Milestone 4C — Coming Soon
              </Badge>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Automated Shopify Liquid snippets, WooCommerce hooks, and custom headless JavaScript loader tags will become available for <strong>{activeStore.name}</strong> upon Milestone 4C activation.
            </p>
          </div>
        </div>

        {/* Right Column: Live Visual PDP Preview (5/6 Cols) */}
        <div className="lg:col-span-6 xl:col-span-7 sticky top-6">
          <WidgetStudioPreview config={formConfig} storeName={activeStore.name} />
        </div>
      </div>
    </div>
  );
};

export default MerchantWidgetStudioView;

