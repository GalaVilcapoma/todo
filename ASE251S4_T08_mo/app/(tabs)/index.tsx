import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenContainer, StatCard } from '../../components/common';
import { EmptyState, ErrorBanner, SkeletonCard, Badge } from '../../components/ui';
import { useDashboard } from '../../hooks/use-dashboard';
import { useAuth } from '../../hooks/use-auth';
import { ROLE_LABELS } from '../../services/auth.service';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

export default function DashboardScreen() {
  const { user } = useAuth();
  const {
    products,
    agrochemicals,
    orders,
    applications,
    metrics,
    loading,
    refreshing,
    online,
    error,
    refresh,
  } = useDashboard();

  const recentOrders = useMemo(
    () =>
      [...orders]
        .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, 4),
    [orders],
  );

  const upcomingApplications = useMemo(
    () =>
      [...applications]
        .sort((a, b) => (a.applicationDate ?? '').localeCompare(b.applicationDate ?? ''))
        .filter((a) => a.status === 'SCHEDULED' || a.status === 'IN_PROCESS')
        .slice(0, 3),
    [applications],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenContainer refreshing={refreshing} onRefresh={refresh}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Hola, {user?.name ?? 'bienvenido'}</Text>
            <Text style={styles.role}>{user ? ROLE_LABELS[user.role] : ''}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={online ? 'Servidor conectado' : 'Servidor no disponible'}
            onPress={refresh}
            style={styles.status}
          >
            <Badge
              label={loading ? 'Consultando' : online ? 'En línea' : 'Sin conexión'}
              tone={loading ? 'muted' : online ? 'success' : 'danger'}
              dot
            />
          </Pressable>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <SkeletonCard height={104} count={2} />
        ) : (
          <>
            <View style={styles.grid}>
              <StatCard
                label="Agroquímicos activos"
                value={formatNumber(metrics.activeAgrochemicals, 0)}
                icon="flask"
                tone="info"
                onPress={() => router.push('/agrochemicals')}
              />
              <StatCard
                label="Clientes activos"
                value={formatNumber(metrics.activeCustomers, 0)}
                icon="people"
                tone="success"
                onPress={() => router.push('/clients')}
              />
              <StatCard
                label="Productos activos"
                value={formatNumber(metrics.activeProducts, 0)}
                icon="cube"
                tone="neutral"
                caption={`${formatNumber(metrics.totalStockUnits, 0)} unidades`}
                onPress={() => router.push('/products')}
              />
              <StatCard
                label="Pedidos en curso"
                value={formatNumber(metrics.openOrders, 0)}
                icon="cart"
                tone="warning"
                caption={formatCurrency(metrics.pendingRevenue)}
                onPress={() => router.push('/orders')}
              />
            </View>

            <Section
              title="Alertas de inventario"
              icon="warning"
              actionLabel="Ver stock"
              onAction={() => router.push('/stock')}
            >
              {metrics.lowStock.length === 0 ? (
                <EmptyState
                  icon="checkmark-circle-outline"
                  title="Sin stock bajo"
                  subtitle="Todos los productos activos están por encima de su mínimo."
                />
              ) : (
                <View style={styles.list}>
                  {metrics.lowStock.slice(0, 4).map((product) => (
                    <View key={product.id} style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {product.name ?? 'Sin nombre'}
                        </Text>
                        <Text style={styles.rowSubtitle}>
                          Mínimo {formatNumber(product.minimumStock, 0)} ·{' '}
                          {product.unitMeasure ?? 'und.'}
                        </Text>
                      </View>
                      <Badge
                        label={`${formatNumber(product.currentStock, 0)} en stock`}
                        tone={product.currentStock === 0 ? 'danger' : 'warning'}
                      />
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section
              title="Próximas aplicaciones"
              icon="calendar"
              actionLabel="Ver todas"
              onAction={() => router.push('/applications')}
            >
              {upcomingApplications.length === 0 ? (
                <EmptyState
                  icon="calendar-outline"
                  title="Sin aplicaciones programadas"
                  subtitle="No hay aplicaciones en estado programada o en proceso."
                />
              ) : (
                <View style={styles.list}>
                  {upcomingApplications.map((application) => (
                    <View key={application.id} style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {application.fieldName ?? 'Sin nombre de campo'}
                        </Text>
                        <Text style={styles.rowSubtitle}>
                          {formatDate(application.applicationDate)} ·{' '}
                          {formatNumber(application.areaHectares ?? 0)} ha
                        </Text>
                      </View>
                      <Badge
                        label={application.status === 'IN_PROCESS' ? 'En proceso' : 'Programada'}
                        tone={application.status === 'IN_PROCESS' ? 'info' : 'warning'}
                      />
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Section
              title="Pedidos recientes"
              icon="cart"
              actionLabel="Ver todos"
              onAction={() => router.push('/orders')}
            >
              {recentOrders.length === 0 ? (
                <EmptyState
                  icon="cart-outline"
                  title="Aún no hay pedidos"
                  subtitle="Los pedidos registrados aparecerán aquí."
                />
              ) : (
                <View style={styles.list}>
                  {recentOrders.map((order) => (
                    <View key={order.id} style={styles.row}>
                      <View style={styles.rowText}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {order.orderNumber ?? `Pedido #${order.id}`}
                        </Text>
                        <Text style={styles.rowSubtitle} numberOfLines={1}>
                          {order.customerBusinessName ?? 'Cliente desconocido'} ·{' '}
                          {formatDate(order.orderDate)}
                        </Text>
                      </View>
                      <Text style={styles.rowAmount}>{formatCurrency(order.total)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Section>

            <Text style={styles.footnote}>
              {products.length} productos y {agrochemicals.length} agroquímicos leídos del backend.
            </Text>
          </>
        )}
      </ScreenContainer>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name={icon} size={15} color={Colors.textSecondary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.sectionActionPressed}
        >
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerText: { flex: 1 },
  greeting: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  role: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  status: { marginLeft: Spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionAction: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary },
  sectionActionPressed: { opacity: 0.6 },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  rowAmount: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  footnote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});