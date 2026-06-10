import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../../styles/theme';

interface LogoutButtonProps {
  onPress: () => void;
}

/** Shared logout button used at the bottom of every role drawer. */
export default function LogoutButton({ onPress }: LogoutButtonProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.button}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.label}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.overlayBorder },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADII.md,
    backgroundColor: COLORS.dangerTint,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  label: { color: COLORS.danger, fontWeight: 'bold', marginLeft: SPACING.md, fontSize: 14 },
});
