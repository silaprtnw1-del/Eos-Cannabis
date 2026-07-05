/**
 * StepperInput – Increment / decrement numeric input
 *
 * Used across VPD Calculator and Nutrient Logging screens for values
 * like temperature, humidity, water volume, pH, and EC. Supports an
 * optional inline TextInput for direct keyboard entry.
 */
import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';

interface StepperInputProps {
  /** Display label (e.g. "Temperature °C") */
  label: string;
  /** Current numeric value */
  value: number;
  /** Override the displayed value string */
  displayValue?: string;
  /** Unit suffix shown after the value (e.g. "°C") */
  unit?: string;
  /** Amount to add/subtract per press */
  step: number;
  /** Human-readable step label (e.g. "50 L") */
  stepLabel?: string;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Callback when the value changes */
  onValueChange: (value: number) => void;
  /** When true, render a TextInput instead of the static value */
  showTextInput?: boolean;
  /** Controlled text value for the TextInput */
  textInputValue?: string;
  /** Callback for TextInput changes */
  onTextInputChange?: (text: string) => void;
  /** Custom accessibility label */
  accessibilityLabel?: string;
}

export function StepperInput({
  label,
  value,
  displayValue,
  unit,
  step,
  stepLabel,
  min,
  max,
  onValueChange,
  showTextInput,
  textInputValue,
  onTextInputChange,
  accessibilityLabel,
}: StepperInputProps) {
  const handleDecrement = () => {
    const raw = Number((value - step).toFixed(1));
    const newVal = min !== undefined ? Math.max(min, raw) : raw;
    onValueChange(newVal);
  };

  const handleIncrement = () => {
    const raw = Number((value + step).toFixed(1));
    const newVal = max !== undefined ? Math.min(max, raw) : raw;
    onValueChange(newVal);
  };

  const decrementLabel = stepLabel ? `-${stepLabel}` : '-';
  const incrementLabel = stepLabel ? `+${stepLabel}` : '+';

  return (
    <View style={styles.controlRow}>
      <View style={styles.labelCol}>
        <Text style={styles.controlName}>{label}</Text>

        {showTextInput && textInputValue !== undefined && onTextInputChange ? (
          <TextInput
            style={styles.numericInput}
            keyboardType="decimal-pad"
            value={textInputValue}
            onChangeText={onTextInputChange}
            accessibilityLabel={accessibilityLabel || label}
          />
        ) : (
          <Text style={styles.controlValue}>
            {displayValue || value.toFixed(1)} {unit || ''}
          </Text>
        )}
      </View>

      <View style={styles.btnControls}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleDecrement}
          accessibilityLabel={`${label} decrease by ${step}`}
          accessibilityRole="button"
        >
          <Text style={styles.stepBtnText}>{decrementLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.stepBtn}
          onPress={handleIncrement}
          accessibilityLabel={`${label} increase by ${step}`}
          accessibilityRole="button"
        >
          <Text style={styles.stepBtnText}>{incrementLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  labelCol: {
    flex: 1,
  },
  controlName: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 4,
  },
  controlValue: {
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: fontWeight.bold,
  },
  numericInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    color: colors.accent,
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: fontWeight.bold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    width: 100,
  },
  btnControls: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
