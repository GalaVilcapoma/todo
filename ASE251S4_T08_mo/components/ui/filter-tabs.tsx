import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
interface Tab { value: string; label: string; }
interface Props { tabs: Tab[]; selected: string; onSelect: (v: string) => void; }
export function FilterTabs({ tabs, selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      {tabs.map(tab => (
        <TouchableOpacity key={tab.value} onPress={() => onSelect(tab.value)} style={[styles.tab, selected === tab.value && styles.tabActive]} activeOpacity={0.8}>
          <Text style={[styles.label, selected === tab.value && styles.labelActive]}>{tab.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight, padding: 3, gap: 2 },
  tab: { flex: 1, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.primary },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  labelActive: { color: Colors.white, fontWeight: FontWeight.semibold },
});
export default FilterTabs;
