import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, RADII } from '../../styles/theme';

interface DrawerHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  subtitle: string;
}

/** Shared drawer header (avatar circle + app name + role subtitle). */
export default function DrawerHeader({ icon, subtitle }: DrawerHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name={icon} size={26} color={COLORS.accentGreen} />
      </View>
      <Text style={styles.title}>ResilienceHub</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.overlayBorder,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.accentTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.accentGreen,
  },
  title: { color: COLORS.textLight, fontSize: 18, fontWeight: 'bold' },
  subtitle: {
    color: COLORS.overlayTextFaint,
    fontSize: 11,
    marginTop: SPACING.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
});
