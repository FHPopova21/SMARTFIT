/**
 * sizeChartValidation.ts
 * Shared validation and coverage utilities for store-scoped size charts.
 */

import type { GarmentMeasurement, CreateSizeChartPayload } from '../services/storeService';

export const VALID_CHART_TYPES = ['garment_dimensions', 'body_measurements'] as const;
export const VALID_CONVENTIONS = ['flat_garment', 'garment_circumference', 'body_circumference'] as const;
export const VALID_UNITS = ['cm', 'inch'] as const;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedPayload?: CreateSizeChartPayload;
}

export interface SizeCoverageResult {
  isFullyCovered: boolean;
  missingSizes: string[];
  coveredSizes: string[];
}

/**
 * Validates a size chart creation or update payload.
 * Enforces:
 * - Non-empty name (max 150 chars)
 * - Non-empty garment_category (max 50 chars)
 * - Allowed chart_type, convention, and unit
 * - At least one measurement row
 * - Unique size labels (case-insensitive)
 * - Positive numerical dimensions (strictly > 0)
 * - Preserves empty/unspecified dimensions as null (never converts to 0)
 */
export function validateSizeChartPayload(input: {
  name: string;
  garment_category: string;
  chart_type?: string;
  measurement_convention?: string;
  unit?: string;
  measurements: GarmentMeasurement[];
}): ValidationResult {
  const name = (input.name || '').trim();
  if (!name) {
    return { isValid: false, error: 'Size chart name is required.' };
  }
  if (name.length > 150) {
    return { isValid: false, error: 'Size chart name cannot exceed 150 characters.' };
  }

  const garment_category = (input.garment_category || '').trim();
  if (!garment_category) {
    return { isValid: false, error: 'Garment category is required.' };
  }
  if (garment_category.length > 50) {
    return { isValid: false, error: 'Garment category cannot exceed 50 characters.' };
  }

  const chart_type = (input.chart_type || 'garment_dimensions') as 'garment_dimensions' | 'body_measurements';
  if (!VALID_CHART_TYPES.includes(chart_type)) {
    return { isValid: false, error: `Invalid chart_type: must be one of ${VALID_CHART_TYPES.join(', ')}` };
  }

  const measurement_convention = (input.measurement_convention || 'flat_garment') as
    | 'flat_garment'
    | 'garment_circumference'
    | 'body_circumference';
  if (!VALID_CONVENTIONS.includes(measurement_convention)) {
    return {
      isValid: false,
      error: `Invalid measurement_convention: must be one of ${VALID_CONVENTIONS.join(', ')}`,
    };
  }

  const unit = (input.unit || 'cm') as 'cm' | 'inch';
  if (!VALID_UNITS.includes(unit)) {
    return { isValid: false, error: `Invalid unit: must be one of ${VALID_UNITS.join(', ')}` };
  }

  if (!Array.isArray(input.measurements) || input.measurements.length === 0) {
    return { isValid: false, error: 'At least one size measurement row is required.' };
  }

  const seenSizes = new Set<string>();
  const sanitizedMeasurements: GarmentMeasurement[] = [];

  for (let i = 0; i < input.measurements.length; i++) {
    const row = input.measurements[i];
    const size = (row.size || '').trim();
    if (!size) {
      return { isValid: false, error: `Measurement row #${i + 1} is missing a size label.` };
    }
    const lowerSize = size.toLowerCase();
    if (seenSizes.has(lowerSize)) {
      return { isValid: false, error: `Duplicate size '${size}' detected in measurement rows.` };
    }
    seenSizes.add(lowerSize);

    // Validate numerical values
    const cleanedRow: GarmentMeasurement = { size };
    const dimensionFields: Array<keyof GarmentMeasurement> = [
      'flat_chest_width',
      'flat_waist_width',
      'flat_hip_width',
      'garment_chest_circumference',
      'garment_waist_circumference',
      'garment_hip_circumference',
      'body_chest_circumference',
      'body_waist_circumference',
      'body_hip_circumference',
      'total_length',
      'sleeve_length',
      'inseam_length',
      'shoulder_width',
    ];

    for (const field of dimensionFields) {
      const val = row[field];
      if (val === null || val === undefined || val === ('' as any)) {
        cleanedRow[field] = null;
      } else {
        const num = typeof val === 'number' ? val : parseFloat(String(val));
        if (isNaN(num) || num <= 0) {
          return {
            isValid: false,
            error: `Dimension '${field}' for size '${size}' must be a positive number greater than 0.`,
          };
        }
        cleanedRow[field] = Math.round(num * 100) / 100;
      }
    }

    sanitizedMeasurements.push(cleanedRow);
  }

  return {
    isValid: true,
    sanitizedPayload: {
      name,
      garment_category,
      chart_type,
      measurement_convention,
      unit,
      measurements: sanitizedMeasurements,
    },
  };
}

/**
 * Checks whether all variant sizes of a product are covered by the specified size chart.
 */
export function checkSizeChartCoverage(
  variantSizes: string[],
  chartMeasurements: Array<{ size: string }>
): SizeCoverageResult {
  const chartSizeSet = new Set(
    chartMeasurements.map((m) => (m.size || '').toLowerCase().trim()).filter(Boolean)
  );

  const missingSizes: string[] = [];
  const coveredSizes: string[] = [];

  for (const vSize of variantSizes) {
    const cleaned = (vSize || '').trim();
    if (!cleaned) continue;
    if (chartSizeSet.has(cleaned.toLowerCase())) {
      coveredSizes.push(cleaned);
    } else {
      missingSizes.push(cleaned);
    }
  }

  return {
    isFullyCovered: missingSizes.length === 0,
    missingSizes,
    coveredSizes,
  };
}

export interface ProductSizingCompleteness {
  isFullyCovered: boolean;
  missingSizes: string[];
  missingDimensionsBySize: Record<string, string[]>;
  summaryMessage: string;
}

/**
 * Validates that all product variants have matching size chart rows AND
 * that the category's required dimensions are present.
 * Aligns strictly with backend validate_product_activation rules:
 * - Tops/shirts/outerwear: require chest (flat or circumference) AND total_length
 * - Bottoms/pants/skirts: require waist or hip (flat or circumference) AND (total_length or inseam_length)
 * - Dresses/jumpsuits: require chest AND total_length
 * - Other/generic: require at least one primary dimension (chest, waist, or hip)
 */
export function checkProductSizingCompleteness(
  category: string,
  variantSizes: string[],
  measurements: GarmentMeasurement[]
): ProductSizingCompleteness {
  const cat = (category || '').trim().toLowerCase();
  const isTop = ['top', 'shirt', 'tee', 'jacket', 'hoodie', 'sweater', 'outerwear', 'blazer'].some((t) =>
    cat.includes(t)
  );
  const isBottom = ['bottom', 'pant', 'jean', 'trouser', 'short', 'skirt'].some((b) => cat.includes(b));
  const isDress = cat.includes('dress') || cat.includes('jumpsuit');

  const chartBySize = new Map<string, GarmentMeasurement>();
  for (const m of measurements) {
    if (m.size) {
      chartBySize.set(m.size.toLowerCase().trim(), m);
    }
  }

  const missingSizes: string[] = [];
  const missingDimensionsBySize: Record<string, string[]> = {};

  for (const rawSize of variantSizes) {
    const size = (rawSize || '').trim();
    if (!size) continue;
    const lower = size.toLowerCase();
    const m = chartBySize.get(lower);

    if (!m) {
      missingSizes.push(size);
      continue;
    }

    const missingDims: string[] = [];
    if (isTop) {
      const hasChest = Boolean(m.flat_chest_width || m.garment_chest_circumference || m.body_chest_circumference);
      const hasLength = Boolean(m.total_length);
      if (!hasChest) missingDims.push('chest');
      if (!hasLength) missingDims.push('total length');
    } else if (isBottom) {
      const hasWaistOrHip = Boolean(
        m.flat_waist_width ||
          m.garment_waist_circumference ||
          m.body_waist_circumference ||
          m.flat_hip_width ||
          m.garment_hip_circumference ||
          m.body_hip_circumference
      );
      const hasLength = Boolean(m.total_length || m.inseam_length);
      if (!hasWaistOrHip) missingDims.push('waist or hip');
      if (!hasLength) missingDims.push('length');
    } else if (isDress) {
      const hasChest = Boolean(m.flat_chest_width || m.garment_chest_circumference || m.body_chest_circumference);
      const hasLength = Boolean(m.total_length);
      if (!hasChest) missingDims.push('chest');
      if (!hasLength) missingDims.push('total length');
    } else {
      const hasPrimary = Boolean(
        m.flat_chest_width ||
          m.garment_chest_circumference ||
          m.body_chest_circumference ||
          m.flat_waist_width ||
          m.garment_waist_circumference ||
          m.body_waist_circumference ||
          m.flat_hip_width ||
          m.garment_hip_circumference ||
          m.body_hip_circumference
      );
      if (!hasPrimary) missingDims.push('primary dimension (chest/waist/hip)');
    }

    if (missingDims.length > 0) {
      missingDimensionsBySize[size] = missingDims;
    }
  }

  const hasMissingSizes = missingSizes.length > 0;
  const hasMissingDims = Object.keys(missingDimensionsBySize).length > 0;
  const isFullyCovered = variantSizes.length > 0 && !hasMissingSizes && !hasMissingDims;

  let summaryMessage = '';
  if (variantSizes.length === 0) {
    summaryMessage = 'No variants defined for this product.';
  } else if (hasMissingSizes) {
    summaryMessage = `Missing size rows: ${missingSizes.join(', ')}.`;
  } else if (hasMissingDims) {
    const details = Object.entries(missingDimensionsBySize)
      .map(([sz, dims]) => `${sz} lacks ${dims.join(', ')}`)
      .join('; ');
    summaryMessage = `Incomplete dimensions: ${details}.`;
  } else {
    summaryMessage = `All ${variantSizes.length} variant sizes covered with required dimensions.`;
  }

  return {
    isFullyCovered,
    missingSizes,
    missingDimensionsBySize,
    summaryMessage,
  };
}


