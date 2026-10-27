import { Link, Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { FontSize, Spacing } from '../constants/theme';
export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'No encontrado' }} />
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.sub}>Pantalla no encontrada.</Text>
        <Link href="/(tabs)" style={styles.link}>Volver al Inicio</Link>
      </View>
    </>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, gap: Spacing.md },
  title: { fontSize: FontSize['3xl'], color: Colors.textPrimary, fontWeight: '800' },
  sub: { fontSize: FontSize.base, color: Colors.textSecondary },
  link: { fontSize: FontSize.sm, color: Colors.primary, marginTop: Spacing.md },
});
