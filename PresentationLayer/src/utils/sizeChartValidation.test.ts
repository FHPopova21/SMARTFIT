import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateSizeChartPayload,
  checkSizeChartCoverage,
  checkProductSizingCompleteness,
} from './sizeChartValidation.ts';

describe('Size Chart Validation & Coverage Logic', () => {
  it('rejects payloads missing required name or category', () => {
    const res1 = validateSizeChartPayload({
      name: '',
      garment_category: 'tops',
      measurements: [{ size: 'M' }],
    });
    assert.strictEqual(res1.isValid, false);
    assert.match(res1.error || '', /Size chart name is required/i);

    const res2 = validateSizeChartPayload({
      name: 'Standard Tee',
      garment_category: '',
      measurements: [{ size: 'M' }],
    });
    assert.strictEqual(res2.isValid, false);
    assert.match(res2.error || '', /Garment category is required/i);
  });

  it('rejects payloads with invalid conventions or units', () => {
    const res1 = validateSizeChartPayload({
      name: 'Tee Chart',
      garment_category: 'tops',
      measurement_convention: 'invalid_conv',
      measurements: [{ size: 'M' }],
    });
    assert.strictEqual(res1.isValid, false);
    assert.match(res1.error || '', /Invalid measurement_convention/i);

    const res2 = validateSizeChartPayload({
      name: 'Tee Chart',
      garment_category: 'tops',
      unit: 'feet',
      measurements: [{ size: 'M' }],
    });
    assert.strictEqual(res2.isValid, false);
    assert.match(res2.error || '', /Invalid unit/i);
  });

  it('rejects duplicate sizes in measurement rows (case-insensitive)', () => {
    const res = validateSizeChartPayload({
      name: 'Standard Tee',
      garment_category: 'tops',
      measurements: [
        { size: 'M', flat_chest_width: 50 },
        { size: 'm', flat_chest_width: 52 },
      ],
    });
    assert.strictEqual(res.isValid, false);
    assert.match(res.error || '', /Duplicate size 'm'/i);
  });

  it('rejects negative or zero dimensions', () => {
    const resNegative = validateSizeChartPayload({
      name: 'Standard Tee',
      garment_category: 'tops',
      measurements: [{ size: 'M', flat_chest_width: -10 }],
    });
    assert.strictEqual(resNegative.isValid, false);
    assert.match(resNegative.error || '', /must be a positive number greater than 0/i);

    const resZero = validateSizeChartPayload({
      name: 'Standard Tee',
      garment_category: 'tops',
      measurements: [{ size: 'M', total_length: 0 }],
    });
    assert.strictEqual(resZero.isValid, false);
    assert.match(resZero.error || '', /must be a positive number greater than 0/i);
  });

  it('preserves empty dimensions strictly as null (never coercing to 0)', () => {
    const res = validateSizeChartPayload({
      name: 'Oversized Hoodie Spec',
      garment_category: 'tops',
      measurement_convention: 'flat_garment',
      unit: 'cm',
      measurements: [
        { size: 'S', flat_chest_width: 52, total_length: 68 },
        { size: 'M', flat_chest_width: 55, total_length: null, flat_hip_width: undefined },
      ],
    });

    assert.strictEqual(res.isValid, true);
    assert.ok(res.sanitizedPayload);

    const mRow = res.sanitizedPayload?.measurements[1];
    assert.strictEqual(mRow?.flat_chest_width, 55);
    assert.strictEqual(mRow?.total_length, null);
    assert.strictEqual(mRow?.flat_hip_width, null);
    assert.strictEqual(mRow?.sleeve_length, null);
    assert.notStrictEqual(mRow?.total_length, 0);
  });

  it('accurately verifies size chart variant coverage', () => {
    const chartSizes = [{ size: 'XS' }, { size: 'S' }, { size: 'M' }, { size: 'L' }];

    // Full coverage
    const res1 = checkSizeChartCoverage(['S', 'M', 'L'], chartSizes);
    assert.strictEqual(res1.isFullyCovered, true);
    assert.strictEqual(res1.missingSizes.length, 0);
    assert.strictEqual(res1.coveredSizes.length, 3);

    // Incomplete coverage with case-insensitivity
    const res2 = checkSizeChartCoverage(['s', 'M', 'XL', 'XXL'], chartSizes);
    assert.strictEqual(res2.isFullyCovered, false);
    assert.deepStrictEqual(res2.missingSizes, ['XL', 'XXL']);
    assert.deepStrictEqual(res2.coveredSizes, ['s', 'M']);
  });

  it('validates product sizing completeness enforcing category-specific required dimensions', () => {
    // 1. Tops require chest AND total length
    const incompleteTopMeasurements = [
      { size: 'S', flat_chest_width: 50, total_length: null },
      { size: 'M', flat_chest_width: 52, total_length: 70 },
    ];
    const topRes = checkProductSizingCompleteness('shirt', ['S', 'M'], incompleteTopMeasurements);
    assert.strictEqual(topRes.isFullyCovered, false);
    assert.deepStrictEqual(topRes.missingDimensionsBySize['S'], ['total length']);

    // Complete top
    const completeTopMeasurements = [
      { size: 'S', flat_chest_width: 50, total_length: 68 },
      { size: 'M', flat_chest_width: 52, total_length: 70 },
      { size: 'L', flat_chest_width: 55, total_length: 72 },
    ];
    const completeTopRes = checkProductSizingCompleteness('shirt', ['S', 'M', 'L'], completeTopMeasurements);
    assert.strictEqual(completeTopRes.isFullyCovered, true);
    assert.strictEqual(completeTopRes.missingSizes.length, 0);

    // 2. Bottoms require waist/hip AND length/inseam
    const bottomMeasurements = [
      { size: '32', flat_waist_width: 41, inseam_length: 82 },
    ];
    const completeBottomRes = checkProductSizingCompleteness('pant', ['32'], bottomMeasurements);
    assert.strictEqual(completeBottomRes.isFullyCovered, true);

    const incompleteBottom = [
      { size: '32', flat_waist_width: 41, total_length: null, inseam_length: null },
    ];
    const incompleteBottomRes = checkProductSizingCompleteness('jeans', ['32'], incompleteBottom);
    assert.strictEqual(incompleteBottomRes.isFullyCovered, false);
    assert.deepStrictEqual(incompleteBottomRes.missingDimensionsBySize['32'], ['length']);
  });
});

