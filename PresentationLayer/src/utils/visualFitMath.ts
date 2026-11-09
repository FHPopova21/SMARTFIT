/**
 * Visual Fit Mathematical & Measurement Engine for FitVision (B2B SaaS)
 * 
 * DESIGN PRINCIPLES:
 * 1. Technical honesty: 2D silhouettes are geometric approximations, not 3D physics simulations.
 * 2. Explicit data contracts: Never guess measurement conventions (flat width vs. circumference)
 *    via numerical thresholds.
 * 3. Descriptive metrics: Display real measurement differences (deltas) rather than universal,
 *    unvalidated fit categories.
 * 4. Missing data preservation: Missing values remain undefined; never fabricate user or garment dimensions.
 * 5. Size charts: Alternative sizes use real size chart data if supplied; never synthesize dimensions
 *    by scaling size labels.
 */

export type GarmentMeasurementType = 'flat_width' | 'circumference';

export interface GarmentMeasurementSpec {
  value: number; // in centimeters
  type: GarmentMeasurementType;
}

export interface SizeChartEntry {
  chest?: GarmentMeasurementSpec;
  waist?: GarmentMeasurementSpec;
  length?: number; // in centimeters
}

export type ProductSizeChart = Record<string, SizeChartEntry>;

export interface VisualFitCalculationInput {
  userChest?: number; // Full body circumference in cm
  userWaist?: number; // Full body circumference in cm
  gender?: string;
  bodyType?: string;
  clothingWidth?: number; // Legacy prop (cm)
  clothingMeasurementType?: GarmentMeasurementType; // Explicit convention
  clothingLength?: number;
  activeSize: string;
  recommendedSize: string;
  isAlternative?: boolean;
  sizeChart?: ProductSizeChart;
}

export interface VisualFitCalculationResult {
  hasBodyMeasurements: boolean;
  hasGarmentMeasurements: boolean;
  isSchematic: boolean;
  schematicReason?: string;
  
  // Real or resolved measurements (undefined if missing)
  userChestCm?: number;
  userWaistCm?: number;
  garmentFlatWidthCm?: number;
  garmentCircumferenceCm?: number;
  measurementConventionKnown: boolean;
  
  // Descriptive difference (ease delta)
  chestDeltaCm?: number;
  deltaDescription?: string;
  
  // SVG 2D Proportional Projection (pixels for standard 320x380 viewBox, cx=160)
  canvasCenterPx: number;
  bodyShoulderHalfPx: number;
  bodyChestHalfPx: number;
  bodyWaistHalfPx: number;
  bodyHipHalfPx: number;
  
  garmentShoulderHalfPx: number;
  garmentChestHalfPx: number;
  garmentWaistHalfPx: number;
  garmentLengthOffsetPx: number;
}

// Fixed scale for standard 320x380 SVG canvas
export const SVG_SCALE_PX_PER_CM = 2.1;
export const CHEST_FRONTAL_BREADTH_RATIO = 0.35;
export const WAIST_FRONTAL_BREADTH_RATIO = 0.33;

/**
 * Validates a positive physical measurement in centimeters.
 */
export function isValidMeasurement(val?: number): val is number {
  return typeof val === 'number' && !isNaN(val) && isFinite(val) && val > 0;
}

/**
 * Normalizes model confidence score from either a probability (0.0 to 1.0)
 * or an already scaled percentage (0 to 100).
 * Prevents double percentage conversion (e.g., 88 -> 8800).
 * Returns null if missing, zero, NaN, negative, or invalid (> 100).
 */
export function normalizeConfidence(val?: number | null): number | null {
  if (typeof val !== 'number' || isNaN(val) || !isFinite(val) || val <= 0) {
    return null;
  }
  // If in (0.0, 1.0] range (raw float probability from Flask predict_proba API)
  if (val <= 1.0) {
    const pct = Math.round(val * 100);
    return pct > 0 ? Math.min(100, pct) : null;
  }
  // If in (1.0, 100.0] range (already expressed as percentage)
  if (val <= 100) {
    return Math.round(val);
  }
  return null;
}

export const formatModelConfidence = normalizeConfidence;

/**
 * Resolves garment chest dimensions from either explicit size chart or direct props.
 * Strictly respects explicit measurement types.
 */
export function resolveGarmentChest({
  clothingWidth,
  clothingMeasurementType,
  activeSize,
  sizeChart
}: {
  clothingWidth?: number;
  clothingMeasurementType?: GarmentMeasurementType;
  activeSize: string;
  sizeChart?: ProductSizeChart;
}): {
  flatWidthCm?: number;
  circumferenceCm?: number;
  conventionKnown: boolean;
  isFromSizeChart: boolean;
} {
  // 1. Check size chart first for the active size
  if (sizeChart && sizeChart[activeSize]?.chest) {
    const chartChest = sizeChart[activeSize].chest!;
    if (isValidMeasurement(chartChest.value)) {
      if (chartChest.type === 'flat_width') {
        return {
          flatWidthCm: chartChest.value,
          circumferenceCm: chartChest.value * 2,
          conventionKnown: true,
          isFromSizeChart: true
        };
      }
      if (chartChest.type === 'circumference') {
        return {
          flatWidthCm: chartChest.value / 2,
          circumferenceCm: chartChest.value,
          conventionKnown: true,
          isFromSizeChart: true
        };
      }
    }
  }

  // 2. Check direct props
  if (isValidMeasurement(clothingWidth)) {
    if (clothingMeasurementType === 'flat_width') {
      return {
        flatWidthCm: clothingWidth,
        circumferenceCm: clothingWidth * 2,
        conventionKnown: true,
        isFromSizeChart: false
      };
    }
    if (clothingMeasurementType === 'circumference') {
      return {
        flatWidthCm: clothingWidth / 2,
        circumferenceCm: clothingWidth,
        conventionKnown: true,
        isFromSizeChart: false
      };
    }

    // Explicit type not provided: DO NOT guess with a numerical threshold.
    // Defaulting safely to conventionUnknown while keeping raw width.
    return {
      flatWidthCm: clothingWidth,
      circumferenceCm: undefined,
      conventionKnown: false,
      isFromSizeChart: false
    };
  }

  // No valid measurement provided
  return {
    flatWidthCm: undefined,
    circumferenceCm: undefined,
    conventionKnown: false,
    isFromSizeChart: false
  };
}

/**
 * Computes 2D geometric projection and descriptive measurement comparison.
 * Never fabricates missing biometric or garment data.
 */
export function calculateVisualFit(input: VisualFitCalculationInput): VisualFitCalculationResult {
  const cx = 160;
  const isMale = input.gender === 'male';

  const hasBodyMeasurements = isValidMeasurement(input.userChest) && input.userChest >= 50 && input.userChest <= 190;
  const userChestCm = hasBodyMeasurements ? input.userChest : undefined;
  const userWaistCm = isValidMeasurement(input.userWaist) ? input.userWaist : undefined;

  // Resolve garment dimensions for the active size
  const garmentResolved = resolveGarmentChest({
    clothingWidth: input.clothingWidth,
    clothingMeasurementType: input.clothingMeasurementType,
    activeSize: input.activeSize,
    sizeChart: input.sizeChart
  });

  const hasGarmentMeasurements = garmentResolved.flatWidthCm !== undefined;

  // Determine if visualization is schematic (incomplete data)
  let isSchematic = false;
  let schematicReason: string | undefined = undefined;

  if (!hasBodyMeasurements && !hasGarmentMeasurements) {
    isSchematic = true;
    schematicReason = 'Липсват телесни мерки на потребителя и технически мерки на артикула.';
  } else if (!hasBodyMeasurements) {
    isSchematic = true;
    schematicReason = 'Липсват въведени телесни мерки за потребителя. Манекенът е схематичен.';
  } else if (!hasGarmentMeasurements) {
    isSchematic = true;
    schematicReason = 'Търговецът не е предоставил мерки за този артикул/размер.';
  } else if (input.isAlternative && !garmentResolved.isFromSizeChart) {
    // If viewing alternative size without specific size-chart measurements for that size
    isSchematic = true;
    schematicReason = `Липсват специфични мерки за размер ${input.activeSize}. Сравнението е ориентировъчно.`;
  } else if (!garmentResolved.conventionKnown) {
    isSchematic = true;
    schematicReason = 'Типът на измерване (плоска ширина vs. обиколка) не е изрично уточнен от търговеца.';
  }

  // Calculate descriptive delta if both userChest and garment circumference are compatible
  let chestDeltaCm: number | undefined = undefined;
  let deltaDescription: string | undefined = undefined;

  if (userChestCm !== undefined && garmentResolved.circumferenceCm !== undefined) {
    chestDeltaCm = Math.round((garmentResolved.circumferenceCm - userChestCm) * 10) / 10;
    if (chestDeltaCm > 0) {
      deltaDescription = `Обиколката на дрехата (${garmentResolved.circumferenceCm} см) надвишава гръдната мярка (${userChestCm} см) с +${chestDeltaCm} см свобода.`;
    } else if (chestDeltaCm === 0) {
      deltaDescription = `Обиколката на дрехата съвпада точно с гръдната мярка (${userChestCm} см) — плътно прилягане без толеранс.`;
    } else {
      deltaDescription = `Обиколката на дрехата (${garmentResolved.circumferenceCm} см) е с ${Math.abs(chestDeltaCm)} см по-малка от гръдната мярка — изисква високоеластичен плат.`;
    }
  } else if (garmentResolved.flatWidthCm !== undefined && userChestCm !== undefined && !garmentResolved.conventionKnown) {
    deltaDescription = `Плоска ширина: ${garmentResolved.flatWidthCm} см • Гръдна обиколка: ${userChestCm} см (Неуточнен тип измерване)`;
  }

  // Neutral reference geometry for schematic fallback (standard visual baseline)
  const refChestCm = userChestCm ?? (isMale ? 100 : 90);
  const refWaistCm = userWaistCm ?? (isMale ? 84 : 74);
  const refGarmentFlatWidth = garmentResolved.flatWidthCm ?? 50;

  // Frontal plane breadth calculation (body silhouette)
  const bodyChestBreadth = refChestCm * CHEST_FRONTAL_BREADTH_RATIO * SVG_SCALE_PX_PER_CM;
  const bodyWaistBreadth = refWaistCm * WAIST_FRONTAL_BREADTH_RATIO * SVG_SCALE_PX_PER_CM;
  const shoulderRatio = isMale ? 1.20 : 1.10;
  const hipRatio = isMale ? 1.05 : 1.18;

  const bodyShoulderHalfPx = (bodyChestBreadth * shoulderRatio) / 2;
  const bodyChestHalfPx = bodyChestBreadth / 2;
  const bodyWaistHalfPx = bodyWaistBreadth / 2;
  const bodyHipHalfPx = (bodyWaistBreadth * hipRatio) / 2;

  // Frontal plane breadth calculation (garment silhouette)
  const garmentChestBreadth = refGarmentFlatWidth * (SVG_SCALE_PX_PER_CM * 0.95);
  const garmentChestHalfPx = garmentChestBreadth / 2;
  const garmentWaistHalfPx = garmentChestHalfPx * 0.92;
  const garmentShoulderHalfPx = bodyShoulderHalfPx + Math.max(2, (garmentChestHalfPx - bodyChestHalfPx) * 0.4);
  const garmentLengthOffsetPx = Math.max(-10, Math.min(15, (refGarmentFlatWidth - 50) * 0.5));

  return {
    hasBodyMeasurements,
    hasGarmentMeasurements,
    isSchematic,
    schematicReason,
    userChestCm,
    userWaistCm,
    garmentFlatWidthCm: garmentResolved.flatWidthCm,
    garmentCircumferenceCm: garmentResolved.circumferenceCm,
    measurementConventionKnown: garmentResolved.conventionKnown,
    chestDeltaCm,
    deltaDescription,
    canvasCenterPx: cx,
    bodyShoulderHalfPx,
    bodyChestHalfPx,
    bodyWaistHalfPx,
    bodyHipHalfPx,
    garmentShoulderHalfPx,
    garmentChestHalfPx,
    garmentWaistHalfPx,
    garmentLengthOffsetPx
  };
}
