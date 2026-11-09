import { csrfManager } from './csrfManager';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface MerchantStore {
  id: number;
  organization_id: number;
  organization_name?: string;
  name: string;
  slug: string;
  currency: string;
  platform_type: 'custom' | 'shopify' | 'woocommerce' | 'magento';
  connection_status: 'connected' | 'disconnected' | 'sandbox';
  role: 'owner' | 'admin' | 'staff';
  is_org_wide?: boolean;
  created_at: string;
}

export interface CreateStorePayload {
  name: string;
  currency: string;
  platform_type: string;
  website_url?: string;
  organization_id?: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  store_id: number;
  size: string;
  sku?: string | null;
  barcode?: string | null;
  created_at?: string;
}

export interface MerchantProduct {
  id: number;
  store_id: number;
  size_chart_id?: number | null;
  size_chart_name?: string | null;
  name: string;
  category: string;
  material_stretch: 'unknown' | 'non_stretch' | 'low_stretch' | 'medium_stretch' | 'high_stretch';
  brand?: string | null;
  sku_prefix?: string | null;
  description?: string | null;
  image_url?: string | null;
  external_reference?: string | null;
  status: 'draft' | 'active' | 'archived';
  variants_count: number;
  variants?: ProductVariant[];
  size_chart?: SizeChart | null;
  created_at?: string;
  updated_at?: string;
}

export interface GarmentMeasurement {
  id?: number;
  size_chart_id?: number;
  size: string;
  flat_chest_width?: number | null;
  flat_waist_width?: number | null;
  flat_hip_width?: number | null;
  garment_chest_circumference?: number | null;
  garment_waist_circumference?: number | null;
  garment_hip_circumference?: number | null;
  body_chest_circumference?: number | null;
  body_waist_circumference?: number | null;
  body_hip_circumference?: number | null;
  total_length?: number | null;
  sleeve_length?: number | null;
  inseam_length?: number | null;
  shoulder_width?: number | null;
}

export interface SizeChart {
  id: number;
  store_id: number;
  name: string;
  garment_category: string;
  chart_type: 'garment_dimensions' | 'body_measurements';
  measurement_convention: 'flat_garment' | 'garment_circumference' | 'body_circumference';
  unit: 'cm' | 'inch';
  version: number;
  measurements?: GarmentMeasurement[];
  active_products_count?: number;
  total_products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  brand?: string | null;
  sku_prefix?: string | null;
  description?: string | null;
  image_url?: string | null;
  external_reference?: string | null;
  material_stretch?: string;
  size_chart_id?: number | null;
  variants?: Array<{
    size: string;
    sku?: string | null;
    barcode?: string | null;
  }>;
}

export interface UpdateProductPayload {
  name?: string;
  category?: string;
  brand?: string | null;
  sku_prefix?: string | null;
  description?: string | null;
  image_url?: string | null;
  external_reference?: string | null;
  material_stretch?: string;
  size_chart_id?: number | null;
  status?: 'draft' | 'active' | 'archived';
}

export interface CreateSizeChartPayload {
  name: string;
  garment_category: string;
  chart_type?: 'garment_dimensions' | 'body_measurements';
  measurement_convention?: 'flat_garment' | 'garment_circumference' | 'body_circumference';
  unit?: 'cm' | 'inch';
  measurements: GarmentMeasurement[];
}

export interface UpdateSizeChartPayload {
  name?: string;
  garment_category?: string;
  chart_type?: 'garment_dimensions' | 'body_measurements';
  measurement_convention?: 'flat_garment' | 'garment_circumference' | 'body_circumference';
  unit?: 'cm' | 'inch';
  measurements?: GarmentMeasurement[];
}

export interface FitPreviewPayload {
  units?: 'cm' | 'inch';
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    height?: number;
  };
}

export interface CircumferenceComparisonItem {
  shopper_measurement: number;
  garment_specification: number;
  difference: number;
  unit: string;
  comparison_type: string;
  is_approximation: boolean;
}

export interface VariantFitComparison {
  size: string;
  circumference_comparisons: Record<string, CircumferenceComparisonItem>;
  linear_dimensions: {
    total_length?: number | null;
    sleeve_length?: number | null;
    inseam_length?: number | null;
    shoulder_width?: number | null;
  };
  missing_chart_dimensions: string[];
}

export interface FitPreviewResult {
  status: 'fit_rules_required' | 'insufficient_data' | 'unsupported_category' | 'unsupported_measurement_convention';
  product_id: number;
  product_name?: string;
  product_status?: string;
  category?: string;
  measurement_convention?: string | null;
  units?: string;
  fabric_stretch?: string;
  missing_dimensions?: string[];
  variant_comparisons: VariantFitComparison[];
  notes?: string;
}

export interface WidgetConfig {
  id: number | null;
  store_id: number;
  is_enabled: boolean;
  button_label: string;
  primary_color: string;
  text_color: string;
  border_radius: 'pill' | 'rounded' | 'square';
  show_ruler_icon: boolean;
  default_unit: 'cm' | 'inch';
  default_language: 'en' | 'bg';
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UpdateWidgetConfigPayload {
  is_enabled?: boolean;
  button_label?: string;
  primary_color?: string;
  text_color?: string;
  border_radius?: 'pill' | 'rounded' | 'square';
  show_ruler_icon?: boolean;
  default_unit?: 'cm' | 'inch';
  default_language?: 'en' | 'bg';
}

const handleResponse = async (response: Response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      csrfManager.clearToken();
      throw new Error(data.error || 'Session expired. Please sign in again.');
    }
    if (response.status === 403 && data.code?.startsWith('CSRF_')) {
      csrfManager.clearToken();
      throw new Error(data.error || 'Security verification failed. Please try again.');
    }
    const err = new Error(data.error || `Request failed with status ${response.status}`) as Error & {
      validationErrors?: string[];
      activeProductsCount?: number;
    };
    if (data.validation_errors) {
      err.validationErrors = data.validation_errors;
    }
    if (data.active_products_count) {
      err.activeProductsCount = data.active_products_count;
    }
    throw err;
  }
  return data;
};

async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  let csrfToken = await csrfManager.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('X-Requested-With', 'XMLHttpRequest');
  headers.set('X-CSRFToken', csrfToken);

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 403) {
    const errData = await response.clone().json().catch(() => ({}));
    if (
      errData.code === 'CSRF_SESSION_EXPIRED' ||
      errData.code === 'CSRF_TOKEN_INVALID' ||
      errData.code === 'CSRF_TOKEN_MISSING'
    ) {
      csrfToken = await csrfManager.refreshToken();
      headers.set('X-CSRFToken', csrfToken);
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  return response;
}

export const storeService = {
  // Store Management
  async listStores(): Promise<MerchantStore[]> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.stores || [];
    } catch (error) {
      console.error('Error fetching merchant stores:', error);
      throw error;
    }
  },

  async createStore(payload: CreateStorePayload): Promise<MerchantStore> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.store;
    } catch (error) {
      console.error('Error creating merchant store:', error);
      throw error;
    }
  },

  async getStore(storeId: number): Promise<MerchantStore> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.store;
    } catch (error) {
      console.error(`Error fetching store ${storeId}:`, error);
      throw error;
    }
  },

  async updateStore(storeId: number, data: Partial<CreateStorePayload>): Promise<MerchantStore> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const res = await handleResponse(response);
      return res.store;
    } catch (error) {
      console.error(`Error updating store ${storeId}:`, error);
      throw error;
    }
  },

  // ==========================================
  // Product Management (Milestone 3B API)
  // ==========================================

  async listProducts(
    storeId: number,
    filters?: { status?: string; category?: string; search?: string }
  ): Promise<{ products: MerchantProduct[]; total: number }> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.search) params.append('search', filters.search);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}/products${qs}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return {
        products: data.products || [],
        total: data.total || 0,
      };
    } catch (error) {
      console.error(`Error fetching products for store ${storeId}:`, error);
      throw error;
    }
  },

  async getProduct(storeId: number, productId: number): Promise<MerchantProduct> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}/products/${productId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.product;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  },

  async createProduct(storeId: number, payload: CreateProductPayload): Promise<MerchantProduct> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/products`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.product;
    } catch (error) {
      console.error(`Error creating product in store ${storeId}:`, error);
      throw error;
    }
  },

  async updateProduct(storeId: number, productId: number, payload: UpdateProductPayload): Promise<MerchantProduct> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.product;
    } catch (error) {
      console.error(`Error updating product ${productId}:`, error);
      throw error;
    }
  },

  async deleteProduct(storeId: number, productId: number, hardDelete = false): Promise<void> {
    try {
      const qs = hardDelete ? '?hard_delete=true' : '';
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/products/${productId}${qs}`, {
        method: 'DELETE',
      });
      await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting product ${productId}:`, error);
      throw error;
    }
  },

  async addVariant(
    storeId: number,
    productId: number,
    payload: { size: string; sku?: string | null; barcode?: string | null }
  ): Promise<ProductVariant> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.variant;
    } catch (error) {
      console.error(`Error adding variant to product ${productId}:`, error);
      throw error;
    }
  },

  async deleteVariant(storeId: number, productId: number, variantId: number): Promise<void> {
    try {
      const response = await fetchWithCsrf(
        `${API_URL}/v1/merchant/stores/${storeId}/products/${productId}/variants/${variantId}`,
        {
          method: 'DELETE',
        }
      );
      await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting variant ${variantId}:`, error);
      throw error;
    }
  },

  // ==========================================
  // Size Charts Management (Milestone 3B API)
  // ==========================================

  async listSizeCharts(storeId: number): Promise<SizeChart[]> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}/size-charts`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.size_charts || [];
    } catch (error) {
      console.error(`Error fetching size charts for store ${storeId}:`, error);
      throw error;
    }
  },

  async getSizeChart(storeId: number, chartId: number): Promise<SizeChart> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}/size-charts/${chartId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.size_chart;
    } catch (error) {
      console.error(`Error fetching size chart ${chartId}:`, error);
      throw error;
    }
  },

  async createSizeChart(storeId: number, payload: CreateSizeChartPayload): Promise<SizeChart> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/size-charts`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.size_chart;
    } catch (error) {
      console.error(`Error creating size chart in store ${storeId}:`, error);
      throw error;
    }
  },

  async updateSizeChart(storeId: number, chartId: number, payload: UpdateSizeChartPayload): Promise<SizeChart> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/size-charts/${chartId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.size_chart;
    } catch (error) {
      console.error(`Error updating size chart ${chartId}:`, error);
      throw error;
    }
  },

  async deleteSizeChart(storeId: number, chartId: number): Promise<void> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/size-charts/${chartId}`, {
        method: 'DELETE',
      });
      await handleResponse(response);
    } catch (error) {
      console.error(`Error deleting size chart ${chartId}:`, error);
      throw error;
    }
  },

  // ==========================================
  // Merchant Fit Comparison Preview (Milestone 3E-C)
  // ==========================================

  async previewProductFit(
    storeId: number,
    productId: number,
    payload: FitPreviewPayload,
    signal?: AbortSignal
  ): Promise<FitPreviewResult> {
    try {
      const response = await fetchWithCsrf(
        `${API_URL}/v1/merchant/stores/${storeId}/products/${productId}/fit-preview`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
          signal,
        }
      );
      const data = await response.json().catch(() => ({}));
      if (response.status === 422 && data.status) {
        return data as FitPreviewResult;
      }
      if (!response.ok) {
        const err = new Error(data.error || data.notes || `Request failed with status ${response.status}`) as Error & {
          code?: string;
        };
        err.code = data.code;
        throw err;
      }
      return data as FitPreviewResult;
    } catch (error) {
      console.error(`Error previewing fit for product ${productId}:`, error);
      throw error;
    }
  },

  // ==========================================
  // Storefront Widget Studio (Milestone 4B)
  // ==========================================

  async getWidgetConfig(storeId: number): Promise<WidgetConfig> {
    try {
      const response = await fetch(`${API_URL}/v1/merchant/stores/${storeId}/widget-config`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
      });
      const data = await handleResponse(response);
      return data.widget_config;
    } catch (error) {
      console.error(`Error fetching widget config for store ${storeId}:`, error);
      throw error;
    }
  },

  async updateWidgetConfig(storeId: number, payload: UpdateWidgetConfigPayload): Promise<WidgetConfig> {
    try {
      const response = await fetchWithCsrf(`${API_URL}/v1/merchant/stores/${storeId}/widget-config`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await handleResponse(response);
      return data.widget_config;
    } catch (error) {
      console.error(`Error updating widget config for store ${storeId}:`, error);
      throw error;
    }
  },
};

export default storeService;
