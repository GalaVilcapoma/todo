import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, Spacing } from '../../constants/theme';
export function ErrorBanner({ message }: { message: string }) {
  return <View style={styles.container}><Ionicons name="alert-circle" size={18} color={Colors.error} /><Text style={styles.text}>{message}</Text></View>;
}
const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.errorBorder, borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  text: { flex: 1, fontSize: FontSize.sm, color: '#fda4af' },
});
export default ErrorBanner;
