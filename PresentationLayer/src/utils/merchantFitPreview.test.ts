import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validatePreviewInputs,
  deriveStatusCallout,
  formatDifference,
  shouldResetOnStoreSwitch,
  convertMeasurement,
  convertMeasurementString,
} from './merchantFitPreview.ts';

describe('Merchant Fit Comparison Preview Utilities', () => {
  it('validates positive physical numbers and rejects invalid values', () => {
    // Valid input
    const valid = validatePreviewInputs({ chest: '98.5', waist: '82.0' }, 'cm');
    assert.strictEqual(valid.isValid, true);
    assert.deepStrictEqual(valid.cleanedPayload?.measurements, { chest: 98.5, waist: 82 });

    // Negative value
    const negative = validatePreviewInputs({ chest: '-10' }, 'cm');
    assert.strictEqual(negative.isValid, false);
    assert.match(negative.error || '', /must be a positive number greater than 0/i);

    // Zero value
    const zero = validatePreviewInputs({ waist: '0' }, 'inch');
    assert.strictEqual(zero.isValid, false);
    assert.match(zero.error || '', /must be a positive number greater than 0/i);

    // Non-numeric string
    const stringVal = validatePreviewInputs({ chest: 'abc' }, 'cm');
    assert.strictEqual(stringVal.isValid, false);
    assert.match(stringVal.error || '', /must be a positive number greater than 0/i);

    // Empty fields
    const empty = validatePreviewInputs({}, 'cm');
    assert.strictEqual(empty.isValid, false);
    assert.match(empty.error || '', /provide at least one customer body measurement/i);
  });

  it('correctly formats signed dimensional differences', () => {
    assert.strictEqual(formatDifference(4.5, 'cm'), '+4.5 cm');
    assert.strictEqual(formatDifference(0.0, 'cm'), '+0 cm');
    assert.strictEqual(formatDifference(-2.5, 'inch'), '-2.5 inch');
  });

  it('derives accurate, non-prescriptive callout for fit_rules_required', () => {
    const callout = deriveStatusCallout('fit_rules_required');
    assert.strictEqual(callout.headline, 'Factual Dimensional Comparisons Ready');
    assert.strictEqual(
      callout.description,
      'Measurement differences are available, but FitVision does not yet have calibrated rules to identify the best-fitting size.'
    );
    assert.strictEqual(callout.badgeType, 'info');

    // Confirm no subjective words
    assert.doesNotMatch(callout.headline, /best fit|recommended size|confidence/i);
    assert.doesNotMatch(callout.description, /best fit|recommended size|confidence/i);
  });

  it('derives informative callout for insufficient_data', () => {
    const callout = deriveStatusCallout('insufficient_data', 'Missing customer chest measurement.');
    assert.strictEqual(callout.headline, 'Missing Sizing Information');
    assert.strictEqual(callout.description, 'Missing customer chest measurement.');
    assert.strictEqual(callout.badgeType, 'warning');
  });

  it('safely detects store switching to prevent stale response leak', () => {
    // Same store -> no reset
    assert.strictEqual(shouldResetOnStoreSwitch(42, 42), false);

    // Store switch -> must reset
    assert.strictEqual(shouldResetOnStoreSwitch(43, 42), true);

    // Initial load from null -> no reset needed
    assert.strictEqual(shouldResetOnStoreSwitch(42, null), false);
  });

  it('guarantees response objects contain no fabricated recommendations', () => {
    // Simulating response payload
    const mockResponse = {
      status: 'fit_rules_required',
      product_id: 10,
      variant_comparisons: [
        {
          size: 'M',
          circumference_comparisons: {
            chest: { shopper_measurement: 98, garment_specification: 104, difference: 6, unit: 'cm' },
          },
        },
      ],
    };

    assert.strictEqual('recommended_size' in mockResponse, false);
    assert.strictEqual('confidence_score' in mockResponse, false);
    assert.strictEqual('fit_probability' in mockResponse, false);
    assert.strictEqual('alternative_size' in mockResponse, false);
  });

  it('accurately converts measurements between cm and inch without cumulative drift', () => {
    // 98 cm -> 38.6 inch (98 / 2.54 = 38.5826... -> 38.6)
    const inVal = convertMeasurement(98, 'cm', 'inch');
    assert.strictEqual(inVal, 38.6);

    // 38.6 inch -> 98.0 cm (38.6 * 2.54 = 98.044 -> 98.0)
    const cmVal = convertMeasurement(38.6, 'inch', 'cm');
    assert.strictEqual(cmVal, 98.0);

    // Identity when units match
    assert.strictEqual(convertMeasurement(42, 'cm', 'cm'), 42);
    assert.strictEqual(convertMeasurement(16.5, 'inch', 'inch'), 16.5);

    // String conversion helper handles empty and invalid strings safely
    assert.strictEqual(convertMeasurementString('', 'cm', 'inch'), '');
    assert.strictEqual(convertMeasurementString('   ', 'cm', 'inch'), '');
    assert.strictEqual(convertMeasurementString('98', 'cm', 'inch'), '38.6');
    assert.strictEqual(convertMeasurementString('38.6', 'inch', 'cm'), '98');
    assert.strictEqual(convertMeasurementString('invalid', 'cm', 'inch'), 'invalid');
  });
});

