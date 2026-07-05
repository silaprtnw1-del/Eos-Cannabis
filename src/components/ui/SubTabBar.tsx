/**
 * SubTabBar – Reusable horizontal segmented control
 *
 * Used in PlantDirectory, SopLogs, and VpdCalc to switch between
 * sub-views. Supports conditional tab visibility via the `visible`
 * flag on each TabItem.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';

export interface TabItem {
  /** Unique identifier for the tab */
  key: string;
  /** Display label */
  label: string;
  /** Defaults to `true` – set `false` to hide a tab conditionally */
  visible?: boolean;
}

interface SubTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function SubTabBar({ tabs, activeTab, onTabChange }: SubTabBarProps) {
  const visibleTabs = tabs.filter(t => t.visible !== false);

  return (
    <View style={styles.tabRow}>
      {visibleTabs.map(tab => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
          onPress={() => onTabChange(tab.key)}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab.key }}
          accessibilityLabel={tab.label}
        >
          <Text
            style={[
              styles.tabBtnText,
              activeTab === tab.key && styles.tabBtnTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.lg,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabBtnActive: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
  tabBtnText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  tabBtnTextActive: {
    color: colors.accent,
  },
});
