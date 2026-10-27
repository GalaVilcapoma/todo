import React, { useEffect, useState } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/theme';
function SkeletonItem({ height }: { height: number }) {
  // `useState` con inicializador diferido en lugar de `useRef(...).current`:
  // el valor Animated es un objeto mutable que React nunca reemplaza, y así no
  // se accede a un ref durante el render.
  const [opacity] = useState(() => new Animated.Value(0.3));
  useEffect(() => { const a = Animated.loop(Animated.sequence([Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }), Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true })])); a.start(); return () => a.stop(); }, [opacity]);
  return <Animated.View style={[styles.card, { height, opacity }]} />;
}
export function SkeletonCard({ height = 100, count = 3 }: { height?: number; count?: number }) {
  return <View style={styles.container}>{Array.from({ length: count }).map((_, i) => <SkeletonItem key={i} height={height} />)}</View>;
}
const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius['2xl'], borderWidth: 1, borderColor: Colors.borderLight },
});
export default SkeletonCard;
