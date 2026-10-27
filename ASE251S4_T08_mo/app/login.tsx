import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppInput } from '../components/common';
import { ErrorBanner } from '../components/ui';
import { useAuth } from '../hooks/use-auth';
import { DEMO_PROFILES, ROLE_LABELS } from '../services/auth.service';
import { Colors } from '../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../constants/theme';
import { hapticError } from '../utils/haptics';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await signIn({ username, password });
      if (!result.success) {
        hapticError();
        setError(result.error ?? 'No se pudo iniciar sesión.');
      }
      // Si tiene éxito, `isAuthenticated` cambia y `Stack.Protected` en
      // app/_layout.tsx reemplaza el login por las pestañas: no hace falta
      // navegar a mano y así no se ve un parpadeo de la pantalla de login.
    } finally {
      setLoading(false);
    }
  }, [signIn, username, password]);

  const fillProfile = useCallback((profileUser: string, profilePassword: string) => {
    setUsername(profileUser);
    setPassword(profilePassword);
    setError(null);
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={30} color={Colors.primary} />
            </View>
            <Text style={styles.brand}>AVSA</Text>
            <Text style={styles.tagline}>Sistema de Gestión Agroquímica</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Iniciar sesión</Text>

            {error ? <ErrorBanner message={error} /> : null}

            <AppInput
              label="Usuario"
              value={username}
              onChangeText={setUsername}
              placeholder="admin"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
            />

            <View>
              <AppInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                secureTextEntry={!showPassword}
                returnKeyType="go"
                onSubmitEditing={submit}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eye}
                hitSlop={8}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={19}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>

            <AppButton
              label="Entrar"
              onPress={submit}
              loading={loading}
              fullWidth
              style={styles.submit}
            />
          </View>

          {/* Aviso honesto: el backend no valida credenciales, así que se dice
              explícitamente en lugar de fingir un login seguro. */}
          <View style={styles.notice}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
            <Text style={styles.noticeText}>
              El backend no implementa autenticación: todos sus endpoints son públicos. Estos
              perfiles son de demostración y solo ordenan el flujo de la app, no protegen datos.
            </Text>
          </View>

          <Text style={styles.demoTitle}>Perfiles de demostración</Text>
          {DEMO_PROFILES.map((profile) => (
            <Pressable
              key={profile.username}
              accessibilityRole="button"
              onPress={() => fillProfile(profile.username, profile.password)}
              style={({ pressed }) => [styles.demoRow, pressed && styles.demoRowPressed]}
            >
              <View style={styles.demoInfo}>
                <Text style={styles.demoUser}>{profile.username}</Text>
                <Text style={styles.demoRole}>{ROLE_LABELS[profile.user.role]}</Text>
              </View>
              <Text style={styles.demoPass}>{profile.password}</Text>
              <Ionicons name="arrow-forward-circle" size={20} color={Colors.primary} />
            </Pressable>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  content: { padding: Spacing.xl, paddingBottom: Spacing['4xl'], gap: Spacing.lg },
  hero: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.sm },
  logo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  brand: { fontSize: FontSize['3xl'], fontWeight: FontWeight.bold, color: Colors.textPrimary },
  tagline: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xl,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  eye: { position: 'absolute', right: Spacing.md, bottom: Spacing.md + 5 },
  submit: { marginTop: Spacing.sm },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 17 },
  demoTitle: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  demoRowPressed: { opacity: 0.7 },
  demoInfo: { flex: 1 },
  demoUser: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  demoRole: { fontSize: FontSize.xs, color: Colors.textMuted },
  demoPass: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});