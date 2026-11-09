/**
 * widgetConfigValidation.ts
 * Validation utilities and color contrast calculations for FitVision Widget Studio.
 * Enforces strict alignment with store_routes.py backend constraints and WCAG 2.1 accessibility.
 */

import type { UpdateWidgetConfigPayload } from '../services/storeService';

export const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const ALLOWED_BORDER_RADII = ['pill', 'rounded', 'square'] as const;
export const ALLOWED_DEFAULT_UNITS = ['cm', 'inch'] as const;
export const ALLOWED_LANGUAGES = ['en', 'bg'] as const;

export interface ValidationFeedback {
  isValid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates a widget configuration payload before dispatching to the merchant API.
 */
export function validateWidgetConfigForm(payload: UpdateWidgetConfigPayload): ValidationFeedback {
  if (payload.button_label !== undefined) {
    const trimmed = (payload.button_label || '').trim();
    if (!trimmed) {
      return { isValid: false, error: 'Button label cannot be empty.', field: 'button_label' };
    }
    if (trimmed.length > 50) {
      return { isValid: false, error: 'Button label cannot exceed 50 characters.', field: 'button_label' };
    }
  }

  if (payload.primary_color !== undefined) {
    const trimmed = (payload.primary_color || '').trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: `Invalid button color '${trimmed}'. Must be a valid hex color code (e.g. #4F46E5).`,
        field: 'primary_color',
      };
    }
  }

  if (payload.text_color !== undefined) {
    const trimmed = (payload.text_color || '').trim();
    if (!HEX_COLOR_REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: `Invalid text color '${trimmed}'. Must be a valid hex color code (e.g. #FFFFFF).`,
        field: 'text_color',
      };
    }
  }

  if (payload.border_radius !== undefined) {
    if (!ALLOWED_BORDER_RADII.includes(payload.border_radius as any)) {
      return {
        isValid: false,
        error: `Invalid border radius. Allowed values: ${ALLOWED_BORDER_RADII.join(', ')}.`,
        field: 'border_radius',
      };
    }
  }

  if (payload.default_unit !== undefined) {
    if (!ALLOWED_DEFAULT_UNITS.includes(payload.default_unit as any)) {
      return {
        isValid: false,
        error: `Invalid default unit. Allowed values: ${ALLOWED_DEFAULT_UNITS.join(', ')}.`,
        field: 'default_unit',
      };
    }
  }

  if (payload.default_language !== undefined) {
    if (!ALLOWED_LANGUAGES.includes(payload.default_language as any)) {
      return {
        isValid: false,
        error: `Invalid default language. Allowed values: ${ALLOWED_LANGUAGES.join(', ')}.`,
        field: 'default_language',
      };
    }
  }

  return { isValid: true };
}

/**
 * Converts border radius setting to corresponding Tailwind CSS class for live preview rendering.
 */
export function getBorderRadiusClass(radius?: 'pill' | 'rounded' | 'square'): string {
  switch (radius) {
    case 'pill':
      return 'rounded-full';
    case 'square':
      return 'rounded-none';
    case 'rounded':
    default:
      return 'rounded-xl';
  }
}

/**
 * Parses a hex color string into RGB channels [0-255].
 * Supports #RGB and #RRGGBB formats.
 */
export function parseHexColor(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.trim();
  if (!HEX_COLOR_REGEX.test(clean)) return null;

  let rStr: string, gStr: string, bStr: string;
  if (clean.length === 4) {
    rStr = clean[1] + clean[1];
    gStr = clean[2] + clean[2];
    bStr = clean[3] + clean[3];
  } else if (clean.length === 7) {
    rStr = clean.slice(1, 3);
    gStr = clean.slice(3, 5);
    bStr = clean.slice(5, 7);
  } else {
    return null;
  }

  return {
    r: parseInt(rStr, 16),
    g: parseInt(gStr, 16),
    b: parseInt(bStr, 16),
  };
}

/**
 * Calculates sRGB relative luminance according to WCAG 2.1 specifications.
 * Formula: https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
export function calculateRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Returns ratio as a rounded number (e.g. 4.5 for 4.5:1), or null if inputs are invalid.
 */
export function calculateContrastRatio(colorA: string, colorB: string): number | null {
  const rgbA = parseHexColor(colorA);
  const rgbB = parseHexColor(colorB);
  if (!rgbA || !rgbB) return null;

  const lumA = calculateRelativeLuminance(rgbA.r, rgbA.g, rgbA.b);
  const lumB = calculateRelativeLuminance(rgbB.r, rgbB.g, rgbB.b);

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export interface ContrastFeedback {
  ratio: number | null;
  isAccessible: boolean;
  warning?: string;
}

/**
 * Evaluates WCAG AA contrast compliance (4.5:1 minimum for normal text).
 */
export function evaluateColorContrast(bgColor: string, textColor: string): ContrastFeedback {
  const ratio = calculateContrastRatio(bgColor, textColor);
  if (ratio === null) {
    return { ratio: null, isAccessible: false, warning: 'Invalid hex color code provided.' };
  }
  if (ratio < 4.5) {
    return {
      ratio,
      isAccessible: false,
      warning: `Contrast ratio is ${ratio}:1, below the WCAG AA minimum of 4.5:1 for standard text. Text readability may be impaired.`,
    };
  }
  return { ratio, isAccessible: true };
}
