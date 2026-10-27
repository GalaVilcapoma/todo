import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import {
  Badge,
  BottomSheetModal,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  SkeletonCard,
} from '../../components/ui';
import { useResource } from '../../hooks/use-resource';
import { isProductActive, productService, stockMovementService } from '../../services';
import { MOVEMENT_REASONS } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatCurrency, formatDateTime, formatNumber, todayISO } from '../../utils/format';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import type { MovementType, Product, StockMovement, StockMovementInput } from '../../types';

type TypeFilter = 'ALL' | 'IN' | 'OUT';

const EMPTY_FORM: StockMovementInput = {
  productId: '',
  quantity: 1,
  movementDate: todayISO(),
  reason: 'PURCHASE',
  warehouse: 'Principal',
  responsible: '',
  remarks: '',
};

export default function StockScreen() {
  const { items, loading, error, refetch } = useResource<StockMovement>({
    label: 'movimientos',
    list: stockMovementService.getAll,
  });

  const products = useResource<Product>({
    label: 'productos',
    list: productService.getAll,
    initialLoading: false,
  });

  const [filter, setFilter] = useState<TypeFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [direction, setDirection] = useState<MovementType>('IN');
  const [form, setForm] = useState<StockMovementInput>(EMPTY_FORM);
  const [quantityStr, setQuantityStr] = useState('1');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeProducts = useMemo(
    () => products.items.filter(isProductActive),
    [products.items],
  );

  const productOptions = useMemo(
    () =>
      activeProducts.map((p) => ({
        value: p.id,
        label: p.name ?? 'Sin nombre',
        hint: `${formatNumber(p.currentStock, 0)} en stock`,
      })),
    [activeProducts],
  );

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filter === 'ALL') return true;
        return item.movementType === filter;
      }),
    [items, filter],
  );

  const totals = useMemo(() => {
    const ins = items.filter((m) => m.movementType === 'IN');
    const outs = items.filter((m) => m.movementType === 'OUT');
    return {
      inCount: ins.length,
      outCount: outs.length,
      inValue: ins.reduce((sum, m) => sum + (m.totalValue ?? 0), 0),
      outValue: outs.reduce((sum, m) => sum + (m.totalValue ?? 0), 0),
    };
  }, [items]);

  const openForm = useCallback((type: MovementType) => {
    setDirection(type);
    setForm(EMPTY_FORM);
    setQuantityStr('1');
    setErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const validate = useCallback(() => {
    const next: Record<string, string> = {};
    const qty = parseInt(quantityStr, 10);
    const product = activeProducts.find((p) => p.id === form.productId);

    if (!form.productId) {
      next.productId = 'Selecciona un producto activo.';
    }

    if (!quantityStr.trim() || isNaN(qty) || !Number.isInteger(qty) || qty <= 0) {
      next.quantity = 'La cantidad debe ser un número entero mayor que 0.';
    } else if (direction === 'OUT' && product && qty > (product.currentStock ?? 0)) {
      next.quantity = `Solo hay ${formatNumber(product.currentStock, 0)} unidades en stock.`;
    }

    // Fecha: formato AAAA-MM-DD si se ingresa
    if (form.movementDate && form.movementDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(form.movementDate.trim())) {
        next.movementDate = 'El formato debe ser AAAA-MM-DD (ej: 2026-10-24).';
      }
    }

    // Almacén: solo letras, números y espacios
    if (!form.warehouse.trim()) {
      next.warehouse = 'El almacén es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]+$/.test(form.warehouse.trim())) {
      next.warehouse = 'El almacén solo puede contener letras, números y espacios.';
    }

    // Responsable: solo letras y espacios
    if (!form.responsible.trim()) {
      next.responsible = 'El responsable es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(form.responsible.trim())) {
      next.responsible = 'El responsable solo puede contener letras.';
    }

    return next;
  }, [quantityStr, form, direction, activeProducts]);

  const submit = useCallback(async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const payload: StockMovementInput = {
      ...form,
      quantity: parseInt(quantityStr, 10) || 0,
    };

    setSaving(true);
    setFormError(null);
    try {
      if (direction === 'IN') {
        await stockMovementService.registerIn(payload);
      } else {
        await stockMovementService.registerOut(payload);
      }
      hapticSuccess();
      setFormOpen(false);
      await Promise.all([refetch(), products.refetch()]);
    } catch (e) {
      hapticError();
      setFormError(e instanceof Error ? e.message : 'No se pudo registrar el movimiento.');
    } finally {
      setSaving(false);
    }
  }, [validate, quantityStr, direction, form, refetch, products]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Movimientos de stock"
          subtitle={`${totals.inCount} entradas · ${totals.outCount} salidas`}
          onRefresh={refetch}
          loading={loading}
          onAdd={() => openForm('IN')}
          addLabel="Entrada"
        />

        <View style={styles.actionRow}>
          <AppButton
            label="Registrar salida"
            onPress={() => openForm('OUT')}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <FilterTabs
          tabs={[
            { value: 'ALL', label: 'Todos' },
            { value: 'IN', label: 'Entradas' },
            { value: 'OUT', label: 'Salidas' },
          ]}
          selected={filter}
          onSelect={(v) => setFilter(v as TypeFilter)}
        />

        {error ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={error} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.list}>
            <SkeletonCard height={110} count={5} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="swap-vertical-outline"
            title="Sin movimientos"
            subtitle="Registra una entrada o una salida para modificar el inventario."
          />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <MovementRow key={item.id} item={item} />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerLabel}>Valor acumulado</Text>
          <Text style={styles.footerText}>
            Entradas {formatCurrency(totals.inValue)} · Salidas {formatCurrency(totals.outValue)}
          </Text>
        </View>
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={direction === 'IN' ? 'Registrar entrada' : 'Registrar salida'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        <View style={styles.directionNote}>
          <Badge
            label={direction === 'IN' ? 'Suma stock' : 'Resta stock'}
            tone={direction === 'IN' ? 'success' : 'warning'}
          />
          <Text style={styles.directionText}>
            {direction === 'IN'
              ? 'El endpoint /in aumenta currentStock del producto.'
              : 'El endpoint /out descuenta stock y falla si no alcanza.'}
          </Text>
        </View>

        {activeProducts.length === 0 ? (
          <ErrorBanner message="No hay productos activos. Registra o reactiva un producto antes de mover stock." />
        ) : (
          <SelectField
            label="Producto"
            required
            value={form.productId || null}
            options={productOptions}
            onChange={(v) => setForm((f) => ({ ...f, productId: v }))}
            error={errors.productId}
          />
        )}

        <AppInput
          label="Cantidad"
          required
          value={quantityStr}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '');
            setQuantityStr(clean);
          }}
          keyboardType="number-pad"
          error={errors.quantity}
          hint="Solo números enteros."
          placeholder="1"
        />
        <AppInput
          label="Fecha"
          value={form.movementDate ?? ''}
          onChangeText={(v) => {
            // Solo números y guiones, máximo 10 chars (AAAA-MM-DD)
            const clean = v.replace(/[^0-9\-]/g, '').slice(0, 10);
            setForm((f) => ({ ...f, movementDate: clean || null }));
          }}
          placeholder="AAAA-MM-DD"
          keyboardType="numbers-and-punctuation"
          error={errors.movementDate}
          hint="Formato: 2026-10-24. Solo números y guiones."
        />
        <SelectField
          label="Motivo"
          value={form.reason}
          options={MOVEMENT_REASONS.map((r) => ({ value: r.value, label: r.label }))}
          onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
        />
        <AppInput
          label="Almacén"
          required
          value={form.warehouse}
          onChangeText={(v) => {
            // Letras, números y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]/g, '');
            setForm((f) => ({ ...f, warehouse: clean }));
          }}
          error={errors.warehouse}
          hint="Solo letras, números y espacios."
        />
        <AppInput
          label="Responsable"
          required
          value={form.responsible}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            setForm((f) => ({ ...f, responsible: clean }));
          }}
          error={errors.responsible}
          hint="Solo letras."
        />
        <AppInput
          label="Observaciones"
          value={form.remarks}
          onChangeText={(v) => setForm((f) => ({ ...f, remarks: v }))}
          multiline
        />

        <AppButton
          label={direction === 'IN' ? 'Registrar entrada' : 'Registrar salida'}
          onPress={submit}
          loading={saving}
          variant={direction === 'IN' ? 'primary' : 'warning'}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function MovementRow({ item }: { item: StockMovement }) {
  const isIn = item.movementType === 'IN';
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.productName ?? 'Producto eliminado'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.movementNumber ?? `#${item.id}`} · {formatDateTime(item.movementDate ?? item.createdAt)}
          </Text>
        </View>
        <Badge
          label={`${isIn ? '+' : '-'}${formatNumber(item.quantity)} ${item.unitMeasure ?? ''}`}
          tone={isIn ? 'success' : 'danger'}
        />
      </View>

      <View style={styles.meta}>
        <Meta label="Motivo" value={item.reason ?? '—'} />
        <Meta label="Almacén" value={item.warehouse ?? '—'} />
        <Meta label="Responsable" value={item.responsible ?? '—'} />
        <Meta label="Valor" value={formatCurrency(item.totalValue)} />
      </View>

      {item.remarks ? (
        <Text style={styles.remarks} numberOfLines={2}>
          {item.remarks}
        </Text>
      ) : null}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: Spacing.lg },
  actionRow: { flexDirection: 'row', marginTop: Spacing.md },
  actionButton: { flex: 1 },
  bannerWrap: { marginTop: Spacing.md },
  list: { flex: 1, marginTop: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  cardSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md, gap: Spacing.md },
  metaItem: { minWidth: '40%', flexGrow: 1 },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: { fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 1 },
  remarks: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: Spacing.md, fontStyle: 'italic' },
  footer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  footerLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  footerText: { fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 2 },
  directionNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  directionText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 15 },
  submit: { marginTop: Spacing.sm },
});