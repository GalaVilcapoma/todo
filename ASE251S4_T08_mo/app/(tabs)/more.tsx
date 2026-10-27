import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/common';
import { ConfirmDialog } from '../../components/common/confirm-dialog';
import { Badge } from '../../components/ui';
import { useAuth } from '../../hooks/use-auth';
import { ROLE_LABELS } from '../../services/auth.service';
import { API_BASE_URL } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

const MODULES = [
  {
    href: '/orders' as const,
    icon: 'cart-outline' as const,
    label: 'Pedidos',
    description: 'Crear pedidos, avanzar su estado y cancelar con devolución de stock.',
  },
  {
    href: '/stock' as const,
    icon: 'swap-vertical-outline' as const,
    label: 'Movimientos de stock',
    description: 'Entradas y salidas de inventario; actualizan el stock del producto.',
  },
  {
    href: '/reports' as const,
    icon: 'bar-chart-outline' as const,
    label: 'Reportes',
    description: 'Productos por categoría y agroquímicos por fabricante.',
  },
];

export default function MoreScreen() {
  const { user, signOut } = useAuth();
  const [confirm, setConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const runSignOut = async () => {
    setSigningOut(true);
    await signOut();
    setSigningOut(false);
    setConfirm(false);
    // No hace falta navegar: `Stack.Protected` en app/_layout.tsx cambia a login.
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader title="Más" subtitle="Módulos y sesión" />

        <View style={styles.scroll}>
          <Text style={styles.sectionLabel}>Módulos</Text>
          {MODULES.map((module) => (
            <Pressable
              key={module.href}
              accessibilityRole="button"
              onPress={() => router.push(module.href)}
              style={({ pressed }) => [styles.moduleRow, pressed && styles.pressed]}
            >
              <View style={styles.moduleIcon}>
                <Ionicons name={module.icon} size={19} color={Colors.primary} />
              </View>
              <View style={styles.moduleText}>
                <Text style={styles.moduleLabel}>{module.label}</Text>
                <Text style={styles.moduleDescription}>{module.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          ))}

          <Text style={styles.sectionLabel}>Sesión</Text>
          <View style={styles.sessionCard}>
            <View style={styles.sessionTop}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.primary} />
              </View>
              <View style={styles.sessionText}>
                <Text style={styles.sessionName} numberOfLines={1}>
                  {user?.name ?? 'Invitado'}
                </Text>
                <Text style={styles.sessionRole}>
                  {user ? ROLE_LABELS[user.role] : ''} · {user?.email ?? ''}
                </Text>
              </View>
              {user ? <Badge label={user.role} tone="info" /> : null}
            </View>

            <View style={styles.notice}>
              <Ionicons name="shield-outline" size={16} color={Colors.warning} />
              <Text style={styles.noticeText}>
                Sesión local de demostración. El backend no valida credenciales, así que cerrar
                sesión solo borra los datos guardados en este dispositivo.
              </Text>
            </View>

            <View style={styles.apiRow}>
              <Text style={styles.apiLabel}>Backend</Text>
              <Text style={styles.apiValue} numberOfLines={1}>
                {API_BASE_URL}
              </Text>
            </View>

            <View style={styles.signOut}>
              <ConfirmDialog
                visible={confirm}
                title="Cerrar sesión"
                message="Se borrará la sesión guardada en este dispositivo. Tendrás que volver a elegir un perfil de demostración."
                confirmLabel="Cerrar sesión"
                tone="danger"
                loading={signingOut}
                onConfirm={runSignOut}
                onCancel={() => setConfirm(false)}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirm(true)}
                style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
              >
                <Ionicons name="log-out-outline" size={18} color={Colors.error} />
                <Text style={styles.signOutText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: Spacing.lg },
  scroll: { marginTop: Spacing.sm },
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  pressed: { opacity: 0.7 },
  moduleIcon: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleText: { flex: 1 },
  moduleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  moduleDescription: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, lineHeight: 15 },
  sessionCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  sessionTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionText: { flex: 1 },
  sessionName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  sessionRole: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.warningBg,
    borderWidth: 1,
    borderColor: Colors.warningBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  noticeText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
  apiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  apiLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  apiValue: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  signOut: { marginTop: Spacing.md },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorBg,
  },
  signOutText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error },
});