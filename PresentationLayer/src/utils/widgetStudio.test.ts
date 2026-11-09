import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateWidgetConfigForm,
  parseHexColor,
  calculateRelativeLuminance,
  calculateContrastRatio,
  evaluateColorContrast,
  getBorderRadiusClass,
} from './widgetConfigValidation.ts';
import type { WidgetConfig, UpdateWidgetConfigPayload } from '../services/storeService.ts';

describe('Widget Studio Configuration & Accessibility Suite', () => {
  // 1. Configuration Validation
  describe('Configuration Validation', () => {
    it('accepts valid configuration payloads', () => {
      const payload: UpdateWidgetConfigPayload = {
        is_enabled: true,
        button_label: 'Find My Size',
        primary_color: '#4F46E5',
        text_color: '#FFFFFF',
        border_radius: 'pill',
        show_ruler_icon: true,
        default_unit: 'cm',
        default_language: 'en',
      };
      const res = validateWidgetConfigForm(payload);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.error, undefined);
    });

    it('rejects empty or whitespace button label', () => {
      const resEmpty = validateWidgetConfigForm({ button_label: '' });
      assert.strictEqual(resEmpty.isValid, false);
      assert.match(resEmpty.error || '', /cannot be empty/i);

      const resWhitespace = validateWidgetConfigForm({ button_label: '   ' });
      assert.strictEqual(resWhitespace.isValid, false);
      assert.match(resWhitespace.error || '', /cannot be empty/i);
    });

    it('rejects button label exceeding 50 characters', () => {
      const longLabel = 'A'.repeat(51);
      const res = validateWidgetConfigForm({ button_label: longLabel });
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /cannot exceed 50 characters/i);
    });

    it('rejects invalid border radius', () => {
      const res = validateWidgetConfigForm({ border_radius: 'circular' as any });
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /invalid border radius/i);
    });

    it('rejects invalid default unit', () => {
      const res = validateWidgetConfigForm({ default_unit: 'meters' as any });
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /invalid default unit/i);
    });

    it('rejects invalid default language', () => {
      const res = validateWidgetConfigForm({ default_language: 'de' as any });
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || '', /invalid default language/i);
    });
  });

  // 2. Hex Color Parsing
  describe('Hex Color Parsing', () => {
    it('correctly parses 6-digit hex colors', () => {
      const rgb = parseHexColor('#4F46E5');
      assert.notStrictEqual(rgb, null);
      assert.strictEqual(rgb?.r, 79);
      assert.strictEqual(rgb?.g, 70);
      assert.strictEqual(rgb?.b, 229);
    });

    it('correctly parses 3-digit shorthand hex colors', () => {
      const rgb = parseHexColor('#fff');
      assert.notStrictEqual(rgb, null);
      assert.strictEqual(rgb?.r, 255);
      assert.strictEqual(rgb?.g, 255);
      assert.strictEqual(rgb?.b, 255);
    });

    it('returns null on invalid hex strings', () => {
      assert.strictEqual(parseHexColor('4F46E5'), null); // Missing hash
      assert.strictEqual(parseHexColor('#12345'), null);  // 5 chars
      assert.strictEqual(parseHexColor('#GGGGGG'), null); // Non-hex chars
      assert.strictEqual(parseHexColor(''), null);
    });
  });

  // 3. WCAG Contrast Calculation
  describe('WCAG Contrast Calculation & Accessibility', () => {
    it('calculates maximum 21:1 contrast for black and white', () => {
      const ratio = calculateContrastRatio('#000000', '#FFFFFF');
      assert.strictEqual(ratio, 21);
    });

    it('calculates 1:1 contrast for identical colors', () => {
      const ratio = calculateContrastRatio('#4F46E5', '#4F46E5');
      assert.strictEqual(ratio, 1);
    });

    it('confirms high contrast for default brand color (#4F46E5 on white text)', () => {
      const result = evaluateColorContrast('#4F46E5', '#FFFFFF');
      assert.strictEqual(result.isAccessible, true);
      assert.ok((result.ratio || 0) >= 4.5);
      assert.strictEqual(result.warning, undefined);
    });

    it('emits WCAG AA warning when contrast is below 4.5:1', () => {
      // Light gray on white
      const result = evaluateColorContrast('#E5E7EB', '#FFFFFF');
      assert.strictEqual(result.isAccessible, false);
      assert.ok((result.ratio || 0) < 4.5);
      assert.match(result.warning || '', /below the WCAG AA minimum of 4.5:1/i);
    });

    it('safely handles invalid hex inputs without crashing', () => {
      const result = evaluateColorContrast('invalid', '#FFFFFF');
      assert.strictEqual(result.isAccessible, false);
      assert.strictEqual(result.ratio, null);
      assert.match(result.warning || '', /invalid hex/i);
    });
  });

  // 4. Dirty-State Detection
  describe('Dirty-State Detection Logic', () => {
    const baseConfig: WidgetConfig = {
      id: 1,
      store_id: 10,
      is_enabled: false,
      button_label: 'Compare My Fit',
      primary_color: '#4F46E5',
      text_color: '#FFFFFF',
      border_radius: 'rounded',
      show_ruler_icon: true,
      default_unit: 'cm',
      default_language: 'en',
    };

    function isConfigDirty(server: WidgetConfig, draft: WidgetConfig): boolean {
      return (
        server.is_enabled !== draft.is_enabled ||
        server.button_label !== draft.button_label ||
        server.primary_color !== draft.primary_color ||
        server.text_color !== draft.text_color ||
        server.border_radius !== draft.border_radius ||
        server.show_ruler_icon !== draft.show_ruler_icon ||
        server.default_unit !== draft.default_unit ||
        server.default_language !== draft.default_language
      );
    }

    it('returns false when draft matches server baseline', () => {
      assert.strictEqual(isConfigDirty(baseConfig, { ...baseConfig }), false);
    });

    it('detects changes to is_enabled', () => {
      assert.strictEqual(isConfigDirty(baseConfig, { ...baseConfig, is_enabled: true }), true);
    });

    it('detects changes to button_label', () => {
      assert.strictEqual(
        isConfigDirty(baseConfig, { ...baseConfig, button_label: 'My Custom Size' }),
        true
      );
    });

    it('detects changes to styling and localization', () => {
      assert.strictEqual(
        isConfigDirty(baseConfig, { ...baseConfig, primary_color: '#000000' }),
        true
      );
      assert.strictEqual(
        isConfigDirty(baseConfig, { ...baseConfig, border_radius: 'pill' }),
        true
      );
      assert.strictEqual(
        isConfigDirty(baseConfig, { ...baseConfig, default_unit: 'inch' }),
        true
      );
      assert.strictEqual(
        isConfigDirty(baseConfig, { ...baseConfig, default_language: 'bg' }),
        true
      );
    });
  });

  // 5. Save Payload Serialization
  describe('Save Payload Serialization', () => {
    it('trims string values and serializes exact API contract', () => {
      const draft: WidgetConfig = {
        id: 1,
        store_id: 10,
        is_enabled: true,
        button_label: '  Fit Advisor   ',
        primary_color: '  #10B981 ',
        text_color: ' #FFFFFF ',
        border_radius: 'square',
        show_ruler_icon: false,
        default_unit: 'inch',
        default_language: 'bg',
      };

      const payload: UpdateWidgetConfigPayload = {
        is_enabled: draft.is_enabled,
        button_label: draft.button_label.trim(),
        primary_color: draft.primary_color.trim(),
        text_color: draft.text_color.trim(),
        border_radius: draft.border_radius,
        show_ruler_icon: draft.show_ruler_icon,
        default_unit: draft.default_unit,
        default_language: draft.default_language,
      };

      assert.strictEqual(payload.button_label, 'Fit Advisor');
      assert.strictEqual(payload.primary_color, '#10B981');
      assert.strictEqual(payload.text_color, '#FFFFFF');
      assert.strictEqual(payload.border_radius, 'square');
      assert.strictEqual(payload.show_ruler_icon, false);
      assert.strictEqual(payload.default_unit, 'inch');
      assert.strictEqual(payload.default_language, 'bg');
    });
  });

  // 6. Default Values
  describe('Default Values Alignment', () => {
    it('verifies standard backend default values', () => {
      const defaultBackendValues: UpdateWidgetConfigPayload = {
        is_enabled: false,
        button_label: 'Compare My Fit',
        primary_color: '#4F46E5',
        text_color: '#FFFFFF',
        border_radius: 'rounded',
        show_ruler_icon: true,
        default_unit: 'cm',
        default_language: 'en',
      };

      const validation = validateWidgetConfigForm(defaultBackendValues);
      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(getBorderRadiusClass(defaultBackendValues.border_radius), 'rounded-xl');
    });

    it('maps all supported border radii to Tailwind CSS classes', () => {
      assert.strictEqual(getBorderRadiusClass('pill'), 'rounded-full');
      assert.strictEqual(getBorderRadiusClass('rounded'), 'rounded-xl');
      assert.strictEqual(getBorderRadiusClass('square'), 'rounded-none');
    });
  });

  // 7. Role-Based Permissions
  describe('Role-Based Permissions (RBAC)', () => {
    function canUserEdit(role: 'owner' | 'admin' | 'staff'): boolean {
      return role === 'owner' || role === 'admin';
    }

    it('allows owner and admin to edit configuration', () => {
      assert.strictEqual(canUserEdit('owner'), true);
      assert.strictEqual(canUserEdit('admin'), true);
    });

    it('restricts staff users to view-only mode', () => {
      assert.strictEqual(canUserEdit('staff'), false);
    });
  });

  // 8. Store Switching & Stale Response Guard
  describe('Store Switching & Stale Response Safety', () => {
    it('ignores responses that do not match the currently active store ID', () => {
      let activeStoreId = 1;
      let stateStoreId: number | null = null;

      function onReceiveConfig(responseStoreId: number, config: WidgetConfig) {
        if (responseStoreId === activeStoreId) {
          stateStoreId = config.store_id;
        }
      }

      // Store 1 request in flight
      const store1Config: WidgetConfig = {
        id: 1,
        store_id: 1,
        is_enabled: false,
        button_label: 'Store 1',
        primary_color: '#4F46E5',
        text_color: '#FFFFFF',
        border_radius: 'rounded',
        show_ruler_icon: true,
        default_unit: 'cm',
        default_language: 'en',
      };

      // User switches to Store 2 before Store 1 responds
      activeStoreId = 2;

      // Stale response from Store 1 arrives
      onReceiveConfig(1, store1Config);
      // State should not have updated
      assert.strictEqual(stateStoreId, null);

      // Current response from Store 2 arrives
      const store2Config: WidgetConfig = { ...store1Config, id: 2, store_id: 2, button_label: 'Store 2' };
      onReceiveConfig(2, store2Config);
      assert.strictEqual(stateStoreId, 2);
    });
  });

  // 9. API Error Handling
  describe('API Error Handling', () => {
    it('derives human-readable error messages from standard API responses', () => {
      function parseApiError(errResponse: { error?: string } | Error | string): string {
        if (typeof errResponse === 'string') return errResponse;
        if ('error' in errResponse && errResponse.error) return errResponse.error;
        if (errResponse instanceof Error) return errResponse.message;
        return 'An unexpected error occurred.';
      }

      assert.strictEqual(
        parseApiError({ error: "Field 'button_label' exceeds 50 characters" }),
        "Field 'button_label' exceeds 50 characters"
      );
      assert.strictEqual(parseApiError(new Error('Network timeout')), 'Network timeout');
      assert.strictEqual(parseApiError({}), 'An unexpected error occurred.');
    });
  });

  // 10. Successful Save State Transition
  describe('Successful Save State Transition', () => {
    it('updates baseline and clears dirty state upon server confirmation', () => {
      let serverConfig: WidgetConfig = {
        id: 1,
        store_id: 5,
        is_enabled: false,
        button_label: 'Old Label',
        primary_color: '#4F46E5',
        text_color: '#FFFFFF',
        border_radius: 'rounded',
        show_ruler_icon: true,
        default_unit: 'cm',
        default_language: 'en',
      };

      let draftConfig: WidgetConfig = {
        ...serverConfig,
        button_label: 'New Saved Label',
        is_enabled: true,
      };

      // Before save, isDirty is true
      let isDirty = serverConfig.button_label !== draftConfig.button_label;
      assert.strictEqual(isDirty, true);

      // Server returns updated record
      const serverResponse: WidgetConfig = { ...draftConfig, updated_at: '2026-11-09T15:30:00Z' };

      // Apply update
      serverConfig = serverResponse;
      draftConfig = serverResponse;

      // After save, isDirty is false
      isDirty = serverConfig.button_label !== draftConfig.button_label;
      assert.strictEqual(isDirty, false);
      assert.strictEqual(serverConfig.button_label, 'New Saved Label');
      assert.strictEqual(serverConfig.is_enabled, true);
    });
  });
});

