import { StyleSheet } from 'react-native';

export const COLORS = {
  primaryGreen: '#059669', // Emerald
  darkGreen: '#052e16',    // Dark Forest Green (AppBar / drawer background)
  mediumGreen: '#10B981',  // Medium Emerald
  lightGreen: '#A7F3D0',   // Light Emerald
  accentGreen: '#34d399',  // Bright Emerald (drawer accents / active states)
  disabledBg: '#CBD5E1',   // Light gray for disabled state
  danger: '#EF4444',       // Red (logout / destructive)
  background: '#F8FAFC',
  textDark: '#1E293B',
  textLight: '#FFFFFF',
  textSecondary: '#64748B',
  textMuted: 'gray',
  borderColor: '#E2E8F0',
  // Translucent overlays used on the dark drawer surface
  overlayBorder: 'rgba(255, 255, 255, 0.08)',
  overlaySubtle: 'rgba(255, 255, 255, 0.04)',
  overlayText: 'rgba(255, 255, 255, 0.6)',
  overlayTextFaint: 'rgba(255, 255, 255, 0.4)',
  accentTint: 'rgba(52, 211, 153, 0.12)',
  drawerActiveBg: 'rgba(52, 211, 153, 0.15)',
  dangerTint: 'rgba(239, 68, 68, 0.12)',
  dangerBorder: 'rgba(239, 68, 68, 0.2)',
};

// 4pt spacing scale — use instead of scattering magic numbers in layouts.
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const RADII = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 28,
};

export const globalStyles = StyleSheet.create({
  // Next Step / Primary Buttons (Dark Green theme)
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: COLORS.disabledBg,
  },
  primaryButtonText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: '700',
  },
  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
