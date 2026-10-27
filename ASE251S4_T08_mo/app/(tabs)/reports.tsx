import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, AppButton } from '../../components/common';
import { Badge, EmptyState, ErrorBanner, SkeletonCard } from '../../components/ui';
import { useResource } from '../../hooks/use-resource';
import { aggregationService } from '../../services';
import { AGRO_CATEGORIES } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatCurrency, formatNumber } from '../../utils/format';
import type { ManufacturerSummary, ProductCategorySummary } from '../../types';

/**
 * Reportes.
 *
 * Ambos endpoints de `/v1/api/aggregations` devuelven `Flux<Map<String, Object>>`:
 * la forma exacta la define el pipeline de MongoDB, no un DTO. El servicio la
 * normaliza defensivamente, y aquí se tolerate cualquier campo ausente en vez
 * de asumir un esquema fijo.
 */
export default function ReportsScreen() {
  const categories = useResource<ProductCategorySummary>({
    label: 'categorías',
    list: aggregationService.productsByCategory,
  });
  const manufacturers = useResource<ManufacturerSummary>({
    label: 'fabricantes',
    list: aggregationService.agrochemicalsByManufacturer,
  });

  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([categories.refetch(), manufacturers.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [categories, manufacturers]);

  const loading = categories.loading || manufacturers.loading;
  const error = categories.error ?? manufacturers.error;

  const maxStock = Math.max(
    1,
    ...categories.items.map((c) => c.totalStock),
  );
  const maxProducts = Math.max(
    1,
    ...manufacturers.items.map((m) => m.totalProducts),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Reportes"
          subtitle="Agregaciones calculadas por el backend"
          onRefresh={refresh}
          loading={loading}
        />

        {error ? <ErrorBanner message={error} /> : null}

        {loading ? (
          <SkeletonCard height={180} count={3} />
        ) : (
          <View style={styles.scroll}>
            <View style={styles.section}>
              <SectionTitle
                icon="cube"
                title="Productos por categoría"
                subtitle="GET /v1/api/aggregations/productos/por-categoria"
              />
              {categories.items.length === 0 ? (
                <EmptyState
                  icon="bar-chart-outline"
                  title="Sin datos"
                  subtitle="El backend no devolvió productos agrupados."
                />
              ) : (
                <View style={styles.list}>
                  {categories.items.map((row) => {
                    const label =
                      AGRO_CATEGORIES.find((c) => c.value === row.category)?.label ??
                      row.category ??
                      'Sin categoría';
                    return (
                      <View key={row.category ?? 'sin-categoria'} style={styles.row}>
                        <View style={styles.rowHead}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {label}
                          </Text>
                          <Text style={styles.rowValue}>
                            {formatNumber(row.totalProducts, 0)} prod.
                          </Text>
                        </View>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${Math.round((row.totalStock / maxStock) * 100)}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.rowMeta}>
                          Stock total {formatNumber(row.totalStock, 0)} · Precio medio{' '}
                          {formatCurrency(row.averagePrice)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <SectionTitle
                icon="flask"
                title="Agroquímicos por fabricante"
                subtitle="GET /v1/api/aggregations/agroquimicos/por-fabricante"
              />
              {manufacturers.items.length === 0 ? (
                <EmptyState
                  icon="bar-chart-outline"
                  title="Sin datos"
                  subtitle="El backend no devolvió fabricantes agrupados."
                />
              ) : (
                <View style={styles.list}>
                  {manufacturers.items.map((row) => (
                    <View key={row.manufacturer ?? 'sin-fabricante'} style={styles.row}>
                      <View style={styles.rowHead}>
                        <Text style={styles.rowTitle} numberOfLines={1}>
                          {row.manufacturer ?? 'Sin fabricante'}
                        </Text>
                        <Text style={styles.rowValue}>
                          {formatNumber(row.totalProducts, 0)} prod.
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${Math.round((row.totalProducts / maxProducts) * 100)}%`,
                              backgroundColor: Colors.info,
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.rowMeta}>
                        {row.categories.length > 0
                          ? `${row.categories.length} categoría(s) · carencia media ${formatNumber(row.averageWaitingDays, 0)} d`
                          : `Carencia media ${formatNumber(row.averageWaitingDays, 0)} d`}
                      </Text>
                      {row.categories.length > 0 ? (
                        <View style={styles.chips}>
                          {row.categories.map((category) => (
                            <Badge
                              key={category}
                              label={
                                AGRO_CATEGORIES.find((c) => c.value === category)?.label ??
                                category
                              }
                              tone="neutral"
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.notice}>
              <Ionicons name="information-circle-outline" size={16} color={Colors.info} />
              <Text style={styles.noticeText}>
                Estas agregaciones no distinguen productos inactivos: el pipeline agrupa el
                documento completo. Úsalas como lectura de tendencia, no como saldo contable.
              </Text>
            </View>

            <AppButton
              label="Actualizar reportes"
              onPress={refresh}
              variant="secondary"
              loading={refreshing}
              fullWidth
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: Spacing.lg },
  scroll: { marginTop: Spacing.lg },
  section: { marginBottom: Spacing['3xl'] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceRaised,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionText: { flex: 1 },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  list: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  row: { gap: 6 },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  rowTitle: { flex: 1, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  rowValue: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  barTrack: {
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  rowMeta: { fontSize: FontSize.xs, color: Colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.infoBg,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noticeText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 16 },
});