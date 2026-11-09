import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidMeasurement,
  resolveGarmentChest,
  calculateVisualFit,
  normalizeConfidence,
  formatModelConfidence,
  type ProductSizeChart
} from './visualFitMath.ts';

test('isValidMeasurement: strictly validates positive physical numbers', () => {
  assert.equal(isValidMeasurement(50), true);
  assert.equal(isValidMeasurement(0), false);
  assert.equal(isValidMeasurement(-10), false);
  assert.equal(isValidMeasurement(NaN), false);
  assert.equal(isValidMeasurement(undefined), false);
  assert.equal(isValidMeasurement(Infinity), false);
});

test('resolveGarmentChest: never guesses flat width vs. circumference with numerical thresholds', () => {
  // Explicit flat_width
  const explicitFlat = resolveGarmentChest({
    clothingWidth: 52,
    clothingMeasurementType: 'flat_width',
    activeSize: 'M'
  });
  assert.equal(explicitFlat.flatWidthCm, 52);
  assert.equal(explicitFlat.circumferenceCm, 104);
  assert.equal(explicitFlat.conventionKnown, true);

  // Explicit circumference
  const explicitCirc = resolveGarmentChest({
    clothingWidth: 104,
    clothingMeasurementType: 'circumference',
    activeSize: 'M'
  });
  assert.equal(explicitCirc.flatWidthCm, 52);
  assert.equal(explicitCirc.circumferenceCm, 104);
  assert.equal(explicitCirc.conventionKnown, true);

  // Unspecified type: must NOT guess even if > 75 or < 75!
  const unspecified80 = resolveGarmentChest({
    clothingWidth: 80,
    clothingMeasurementType: undefined,
    activeSize: 'M'
  });
  assert.equal(unspecified80.flatWidthCm, 80);
  assert.equal(unspecified80.circumferenceCm, undefined);
  assert.equal(unspecified80.conventionKnown, false); // Explicitly unknown!

  const unspecified50 = resolveGarmentChest({
    clothingWidth: 50,
    clothingMeasurementType: undefined,
    activeSize: 'M'
  });
  assert.equal(unspecified50.flatWidthCm, 50);
  assert.equal(unspecified50.circumferenceCm, undefined);
  assert.equal(unspecified50.conventionKnown, false); // Explicitly unknown!
});

test('resolveGarmentChest: reads actual per-size measurements from size chart', () => {
  const mockSizeChart: ProductSizeChart = {
    S: { chest: { value: 48, type: 'flat_width' } },
    M: { chest: { value: 51, type: 'flat_width' } },
    L: { chest: { value: 55, type: 'flat_width' } }
  };

  const resM = resolveGarmentChest({
    clothingWidth: 51,
    clothingMeasurementType: 'flat_width',
    activeSize: 'M',
    sizeChart: mockSizeChart
  });
  assert.equal(resM.flatWidthCm, 51);
  assert.equal(resM.isFromSizeChart, true);

  const resL = resolveGarmentChest({
    activeSize: 'L',
    sizeChart: mockSizeChart
  });
  assert.equal(resL.flatWidthCm, 55);
  assert.equal(resL.circumferenceCm, 110);
  assert.equal(resL.isFromSizeChart, true);

  // Missing size in size chart
  const resXL = resolveGarmentChest({
    activeSize: 'XL',
    sizeChart: mockSizeChart
  });
  assert.equal(resXL.flatWidthCm, undefined);
  assert.equal(resXL.isFromSizeChart, false);
});

test('calculateVisualFit: preserves missing measurements without fabricating fake defaults', () => {
  const result = calculateVisualFit({
    activeSize: 'M',
    recommendedSize: 'M'
  });

  // Missing body measurements must remain undefined
  assert.equal(result.userChestCm, undefined);
  assert.equal(result.userWaistCm, undefined);
  assert.equal(result.hasBodyMeasurements, false);
  assert.equal(result.isSchematic, true);
  assert.ok(result.schematicReason?.includes('Липсват'));
});

test('calculateVisualFit: calculates compatible measurement differences honestly', () => {
  // User chest 96 cm, Garment flat width 50 cm with explicit type (100 cm circ)
  const result = calculateVisualFit({
    userChest: 96,
    userWaist: 78,
    clothingWidth: 50,
    clothingMeasurementType: 'flat_width',
    activeSize: 'M',
    recommendedSize: 'M'
  });

  assert.equal(result.hasBodyMeasurements, true);
  assert.equal(result.hasGarmentMeasurements, true);
  assert.equal(result.isSchematic, false);
  assert.equal(result.userChestCm, 96);
  assert.equal(result.garmentCircumferenceCm, 100);
  assert.equal(result.chestDeltaCm, 4.0);
  assert.ok(result.deltaDescription?.includes('+4 см'));
});

test('calculateVisualFit: marks alternative size as schematic when size chart is missing', () => {
  // Viewing alternative size 'L' while only recommended size 'M' measurement was given
  const result = calculateVisualFit({
    userChest: 96,
    clothingWidth: 50,
    clothingMeasurementType: 'flat_width',
    activeSize: 'L',
    recommendedSize: 'M',
    isAlternative: true
    // no sizeChart provided
  });

  // Must NOT invent +2.5cm or pretend it has real L dimensions
  assert.equal(result.isSchematic, true);
  assert.ok(result.schematicReason?.includes('Липсват специфични мерки за размер L'));
});

test('normalizeConfidence: strictly handles probabilities, missing data, and prevents double conversion', () => {
  // 1. Valid probabilities from Flask predict_proba [0.0 to 1.0]
  assert.equal(normalizeConfidence(0.874), 87);
  assert.equal(normalizeConfidence(0.85), 85);
  assert.equal(normalizeConfidence(0.999), 100);
  assert.equal(normalizeConfidence(0.01), 1);
  assert.equal(normalizeConfidence(1.0), 100);

  // 2. Already normalized percentages [1 to 100] - must NOT multiply by 100 again!
  assert.equal(normalizeConfidence(88), 88);
  assert.notEqual(normalizeConfidence(88), 8800);
  assert.equal(normalizeConfidence(95.4), 95);
  assert.equal(normalizeConfidence(100), 100);

  // 3. Missing values (must return null, never invent numbers like 88)
  assert.equal(normalizeConfidence(undefined), null);
  assert.equal(normalizeConfidence(null), null);

  // 4. Zero values (zero confidence is not a valid prediction confidence)
  assert.equal(normalizeConfidence(0), null);
  assert.equal(normalizeConfidence(0.0), null);

  // 5. Invalid, NaN, negative, or out-of-bounds numbers
  assert.equal(normalizeConfidence(NaN), null);
  assert.equal(normalizeConfidence(-0.25), null);
  assert.equal(normalizeConfidence(-10), null);
  assert.equal(normalizeConfidence(101), null);
  assert.equal(normalizeConfidence(500), null);
});
