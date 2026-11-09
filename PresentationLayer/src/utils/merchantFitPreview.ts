/**
 * merchantFitPreview.ts
 * Pure utility functions for the Merchant Fit Comparison Preview component.
 */

import type { FitPreviewResult, FitPreviewPayload } from '../services/storeService';

export interface ValidationFeedback {
  isValid: boolean;
  error?: string;
  cleanedPayload?: FitPreviewPayload;
}

/**
 * Validates simulated customer body measurements before dispatch.
 * Enforces positive real numbers, rejects <= 0, NaN, and infinity.
 */
export function validatePreviewInputs(
  inputs: { chest?: string; waist?: string; hips?: string; height?: string },
  units: 'cm' | 'inch'
): ValidationFeedback {
  const measurements: Record<string, number> = {};

  const fields: Array<keyof typeof inputs> = ['chest', 'waist', 'hips', 'height'];

  for (const field of fields) {
    const raw = (inputs[field] || '').trim();
    if (!raw) continue;

    const num = parseFloat(raw);
    if (isNaN(num) || !isFinite(num) || num <= 0) {
      const label = field.charAt(0).toUpperCase() + field.slice(1);
      return {
        isValid: false,
        error: `${label} measurement must be a positive number greater than 0.`,
      };
    }

    measurements[field] = Math.round(num * 100) / 100;
  }

  if (Object.keys(measurements).length === 0) {
    return {
      isValid: false,
      error: 'Please provide at least one customer body measurement to evaluate fit.',
    };
  }

  return {
    isValid: true,
    cleanedPayload: {
      units,
      measurements,
    },
  };
}

/**
 * Derives user-facing status callout message based strictly on API status.
 * Never invents subjective comfort or size recommendations.
 */
export function deriveStatusCallout(status: FitPreviewResult['status'], notes?: string): {
  headline: string;
  description: string;
  badgeType: 'info' | 'warning' | 'error';
} {
  switch (status) {
    case 'fit_rules_required':
      return {
        headline: 'Factual Dimensional Comparisons Ready',
        description:
          'Measurement differences are available, but FitVision does not yet have calibrated rules to identify the best-fitting size.',
        badgeType: 'info',
      };
    case 'insufficient_data':
      return {
        headline: 'Missing Sizing Information',
        description:
          notes || 'Additional customer or garment measurements are required before comparisons can be made.',
        badgeType: 'warning',
      };
    case 'unsupported_category':
      return {
        headline: 'Unsupported Apparel Category',
        description:
          notes || 'This category cannot currently be mapped to dimensional seam comparisons.',
        badgeType: 'warning',
      };
    case 'unsupported_measurement_convention':
      return {
        headline: 'Unrecognized Measurement Convention',
        description:
          notes || 'The assigned size chart uses an unsupported measurement convention.',
        badgeType: 'error',
      };
    default:
      return {
        headline: 'Sizing Evaluation Status',
        description: notes || 'Status update from sizing engine.',
        badgeType: 'info',
      };
  }
}

/**
 * Formats a dimensional difference with clear mathematical sign and units.
 */
export function formatDifference(diff: number, unit: string): string {
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff} ${unit}`;
}

/**
 * Checks whether an active store switch should reset preview state.
 */
export function shouldResetOnStoreSwitch(currentStoreId: number | null, previousStoreId: number | null): boolean {
  return currentStoreId !== null && previousStoreId !== null && currentStoreId !== previousStoreId;
}

/**
 * Converts a numerical measurement value between cm and inch.
 * Standard factor: 1 inch = 2.54 cm.
 * Rounds to 1 decimal place to prevent floating-point artifacts.
 */
export function convertMeasurement(
  val: number,
  fromUnit: 'cm' | 'inch',
  toUnit: 'cm' | 'inch'
): number {
  if (fromUnit === toUnit) return val;
  if (fromUnit === 'cm' && toUnit === 'inch') {
    return Math.round((val / 2.54) * 10) / 10;
  }
  // inch to cm
  return Math.round(val * 2.54 * 10) / 10;
}

/**
 * Converts a string measurement input between cm and inch.
 * Preserves empty inputs as empty strings.
 * Rejects invalid strings safely without modifying.
 */
export function convertMeasurementString(
  valStr: string,
  fromUnit: 'cm' | 'inch',
  toUnit: 'cm' | 'inch'
): string {
  if (fromUnit === toUnit) return valStr;
  const trimmed = valStr.trim();
  if (!trimmed) return '';
  const num = parseFloat(trimmed);
  if (isNaN(num) || !isFinite(num) || num <= 0) return valStr;
  const converted = convertMeasurement(num, fromUnit, toUnit);
  return String(converted);
}

