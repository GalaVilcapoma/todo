import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, Spacing } from '../../constants/theme';
export function EmptyState({ icon = 'file-tray-outline', title, subtitle }: { icon?: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={Colors.textMuted} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: Spacing['4xl'], backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'], borderWidth: 1, borderColor: Colors.borderLight, gap: Spacing.sm },
  title: { fontSize: FontSize.base, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
});
export default EmptyState;
