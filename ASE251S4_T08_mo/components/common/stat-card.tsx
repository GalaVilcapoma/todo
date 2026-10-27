import React from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import type { BadgeTone } from '../ui/status-badge';

interface Props {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  tone?: BadgeTone;
  /** Píldora secundaria bajo el valor (contexto del número). */
  caption?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<BadgeTone, { fg: string; bg: string; border: string }> = {
  success: { fg: Colors.success, bg: Colors.successBg, border: Colors.successBorder },
  danger: { fg: Colors.error, bg: Colors.errorBg, border: Colors.errorBorder },
  warning: { fg: Colors.warning, bg: Colors.warningBg, border: Colors.warningBorder },
  info: { fg: Colors.info, bg: Colors.infoBg, border: Colors.infoBorder },
  neutral: { fg: Colors.textSecondary, bg: Colors.surfaceRaised, border: Colors.border },
  muted: { fg: Colors.textMuted, bg: Colors.surfaceAlt, border: Colors.borderLight },
};

/** Contenido de la tarjeta; se extrae para no duplicar el marcado. */
function StatCardBody({ label, value, icon, tone = 'neutral', caption }: Omit<Props, 'onPress' | 'style'>) {
  const t = TONES[tone];
  return (
    <>
      <View style={[styles.iconWrap, { backgroundColor: t.bg, borderColor: t.border }]}>
        {icon ? <Ionicons name={icon} size={18} color={t.fg} /> : null}
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
      {caption ? (
        <Text style={[styles.caption, { color: t.fg }]} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </>
  );
}

/**
 * Tarjeta métrica del dashboard. Cuando recibe `onPress` se comporta como
 * enlace corto hacia el módulo correspondiente.
 */
export function StatCard({ onPress, style, ...rest }: Props) {
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${rest.label}: ${rest.value}`}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        <StatCardBody {...rest} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <StatCardBody {...rest} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: 2,
  },
  pressed: { opacity: 0.7 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  value: { fontSize: FontSize['2xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 15 },
  caption: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, marginTop: 2 },
});

export default StatCard;