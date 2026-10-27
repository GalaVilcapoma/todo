import React, { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/theme';
interface Props { children: ReactNode; scrollable?: boolean; refreshing?: boolean; onRefresh?: () => void; padded?: boolean; }
export function ScreenContainer({ children, scrollable = true, refreshing = false, onRefresh, padded = true }: Props) {
  const content = <View style={[styles.inner, padded && styles.padded]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe}>
      {scrollable ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} /> : undefined}>
          {content}
        </ScrollView>
      ) : content}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  inner: { flex: 1 },
  padded: { padding: Spacing.lg },
});
export default ScreenContainer;
