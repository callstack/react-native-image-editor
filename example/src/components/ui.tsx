import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

export function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.sectionSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export interface SegmentOption<T> {
  label: string;
  value: T;
  disabled?: boolean;
}

export function Segmented<T extends string | number | null>({
  options,
  value,
  onChange,
  testID,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}) {
  return (
    <View style={styles.segmented} testID={testID}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: option.disabled }}
            disabled={option.disabled}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              selected && styles.segmentSelected,
              option.disabled && styles.disabled,
            ]}
          >
            <Text
              style={[styles.segmentLabel, selected && styles.segmentLabelOn]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <View style={styles.flex}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

export function Stepper({
  value,
  onChange,
  step,
  min,
  max,
  format = String,
}: {
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (value: number) => string;
}) {
  const update = (delta: number) =>
    onChange(Math.min(max, Math.max(min, value + delta)));
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Decrease"
        onPress={() => update(-step)}
        disabled={value <= min}
        style={[styles.stepperButton, value <= min && styles.disabled]}
      >
        <Text style={styles.stepperButtonLabel}>−</Text>
      </Pressable>
      <Text style={styles.stepperValue}>{format(value)}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase"
        onPress={() => update(step)}
        disabled={value >= max}
        style={[styles.stepperButton, value >= max && styles.disabled]}
      >
        <Text style={styles.stepperButtonLabel}>+</Text>
      </Pressable>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={primary ? colors.white : colors.accent} />
      ) : (
        <Text
          style={[styles.buttonLabel, !primary && styles.buttonLabelSecondary]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function InfoRow({
  label,
  value,
  selectable,
}: {
  label: string;
  value: string;
  selectable?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={styles.infoValue}
        selectable={selectable}
        numberOfLines={selectable ? undefined : 1}
      >
        {value}
      </Text>
    </View>
  );
}

export function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'danger' | 'accent';
}) {
  return (
    <View style={[styles.badge, badgeTones[tone]]}>
      <Text style={[styles.badgeLabel, badgeLabelTones[tone]]}>{label}</Text>
    </View>
  );
}

const badgeTones = StyleSheet.create({
  neutral: { backgroundColor: colors.elevated },
  success: { backgroundColor: colors.successSoft },
  danger: { backgroundColor: colors.dangerSoft },
  accent: { backgroundColor: colors.accentSoft },
});

const badgeLabelTones = StyleSheet.create({
  neutral: { color: colors.muted },
  success: { color: colors.success },
  danger: { color: colors.danger },
  accent: { color: colors.accent },
});

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.card,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  field: {
    gap: spacing.sm,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  fieldHint: {
    color: colors.muted,
    fontSize: 12,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 3,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm + 1,
    alignItems: 'center',
  },
  segmentSelected: {
    backgroundColor: colors.accent,
  },
  segmentLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelOn: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  track: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 3,
    backgroundColor: colors.track,
  },
  trackOn: {
    backgroundColor: colors.accent,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  thumbOn: {
    transform: [{ translateX: 20 }],
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: 3,
  },
  stepperButton: {
    width: 40,
    height: 34,
    borderRadius: radius.sm + 1,
    backgroundColor: colors.elevated,
    borderColor: colors.cardBorder,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '500',
  },
  stepperValue: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  buttonPrimary: {
    backgroundColor: colors.accent,
  },
  buttonSecondary: {
    backgroundColor: colors.elevated,
    borderColor: colors.cardBorder,
    borderWidth: 1,
  },
  buttonLabel: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonLabelSecondary: {
    color: colors.text,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 6,
    borderBottomColor: colors.cardBorder,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    width: 84,
    color: colors.muted,
    fontSize: 13,
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
});
