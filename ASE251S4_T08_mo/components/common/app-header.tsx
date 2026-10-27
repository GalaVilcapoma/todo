import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
interface Props { title: string; subtitle?: string; onRefresh?: () => void; onAdd?: () => void; addLabel?: string; loading?: boolean; }
export function AppHeader({ title, subtitle, onRefresh, onAdd, addLabel = 'Nuevo', loading = false }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {onRefresh && <TouchableOpacity onPress={onRefresh} style={styles.iconBtn} activeOpacity={0.7}><Ionicons name={loading ? 'sync' : 'refresh'} size={18} color={Colors.textSecondary} /></TouchableOpacity>}
        {onAdd && <TouchableOpacity onPress={onAdd} style={styles.addBtn} activeOpacity={0.8}><Ionicons name="add" size={16} color={Colors.white} /><Text style={styles.addLabel}>{addLabel}</Text></TouchableOpacity>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  titleBlock: { flex: 1 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 36, height: 36, borderRadius: BorderRadius.md, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.primaryDark, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, borderRadius: BorderRadius.lg },
  addLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.white },
});
export default AppHeader;
