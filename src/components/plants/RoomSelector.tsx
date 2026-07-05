import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize, fontWeight } from '../../constants/theme';
import type { Room } from '../../types';

interface RoomSelectorProps {
  label: string;
  rooms: Room[];
  selectedRoom: string;
  onRoomChange: (roomName: string) => void;
  emptyLabel?: string;
}

export function RoomSelector({
  label,
  rooms,
  selectedRoom,
  onRoomChange,
  emptyLabel = 'No rooms found',
}: RoomSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.roomSelectGrid}>
        {rooms.length === 0 ? (
          <Text style={styles.emptyText}>{emptyLabel}</Text>
        ) : (
          rooms.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[
                styles.roomSelectBtn,
                selectedRoom === r.name && styles.roomSelectBtnActive,
              ]}
              onPress={() => onRoomChange(r.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedRoom === r.name }}
              accessibilityLabel={`Room ${r.name}`}
            >
              <Text
                style={[
                  styles.roomSelectText,
                  selectedRoom === r.name && styles.roomSelectTextActive,
                ]}
                numberOfLines={1}
              >
                {r.name}
              </Text>
              <Text style={styles.roomSelectSub}>{r.type}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  roomSelectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  roomSelectBtn: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  roomSelectBtnActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  roomSelectText: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  roomSelectTextActive: {
    color: colors.accent,
  },
  roomSelectSub: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  emptyText: {
    color: colors.warning,
    fontSize: fontSize.body,
  },
});
