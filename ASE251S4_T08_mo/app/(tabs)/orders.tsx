import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import { ConfirmDialog } from '../../components/common/confirm-dialog';
import {
  Badge,
  BottomSheetModal,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  OrderStatusBadge,
  SkeletonCard,
} from '../../components/ui';
import { useCrudResource, useResource } from '../../hooks/use-resource';
import { customerService, isCustomerActive, isProductActive, orderService, productService } from '../../services';
import { isOrderEditable } from '../../services/order.service';
import { ORDER_NEXT_STATUSES, ORDER_STATUS_LABELS } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatCurrency, formatDate, formatNumber } from '../../utils/format';
import { hapticError, hapticSuccess } from '../../utils/haptics';
import type {
  Customer,
  Order,
  OrderDetailInput,
  OrderInput,
  OrderStatus,
  Product,
} from '../../types';

type StatusFilter = 'ALL' | 'OPEN' | 'DELIVERED' | 'CANCELLED';

const FILTER_TABS = [
  { value: 'OPEN', label: 'En curso' },
  { value: 'DELIVERED', label: 'Entregados' },
  { value: 'CANCELLED', label: 'Cancelados' },
  { value: 'ALL', label: 'Todos' },
];

const emptyDetail = (): OrderDetailInput => ({
  productId: '',
  quantity: 1,
  remark: '',
});

export default function OrdersScreen() {
  const {
    items,
    loading,
    error,
    refetch,
    create,
    update,
  } = useCrudResource<Order, OrderInput, number>({
    label: 'pedidos',
    list: orderService.getAll,
    create: orderService.create,
    update: orderService.update,
  });

  const customers = useResource<Customer>({
    label: 'clientes',
    list: customerService.getAll,
    initialLoading: false,
  });
  const products = useResource<Product>({
    label: 'productos',
    list: productService.getAll,
    initialLoading: false,
  });

  const [filter, setFilter] = useState<StatusFilter>('OPEN');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [details, setDetails] = useState<OrderDetailInput[]>([emptyDetail()]);
  // Array paralelo a details: guarda la cantidad como string para permitir campo vacío mientras escribe
  const [detailQuantities, setDetailQuantities] = useState<string[]>(['1']);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [detailErrors, setDetailErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ order: Order; action: 'status' | 'cancel' } | null>(null);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus>('CONFIRMED');

  // El backend exige cliente activo para crear o editar un pedido.
  const activeCustomers = useMemo(() => customers.items.filter(isCustomerActive), [customers.items]);
  const activeProducts = useMemo(
    () => products.items.filter((p) => isProductActive(p)),
    [products.items],
  );

  const customerOptions = useMemo(
    () =>
      activeCustomers.map((c) => ({
        value: c.id,
        label: c.businessName ?? 'Sin razón social',
        hint: c.ruc ? `RUC ${c.ruc}` : undefined,
      })),
    [activeCustomers],
  );

  const productOptions = useMemo(
    () =>
      activeProducts.map((p) => ({
        value: p.id,
        label: p.name ?? 'Sin nombre',
        hint: `${formatNumber(p.currentStock, 0)} en stock · ${formatCurrency(p.unitPrice)}`,
      })),
    [activeProducts],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((order) => {
      if (filter === 'OPEN' && (order.status === 'DELIVERED' || order.status === 'CANCELLED')) {
        return false;
      }
      if (filter === 'DELIVERED' && order.status !== 'DELIVERED') return false;
      if (filter === 'CANCELLED' && order.status !== 'CANCELLED') return false;
      if (!needle) return true;
      return [order.orderNumber, order.customerBusinessName, order.remarks]
        .filter((v): v is string => typeof v === 'string')
        .some((v) => v.toLowerCase().includes(needle));
    });
  }, [items, filter, query]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setCustomerId(null);
    setEstimatedDeliveryDate('');
    setRemarks('');
    setDetails([emptyDetail()]);
    setDetailQuantities(['1']);
    setErrors({});
    setDetailErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((order: Order) => {
    if (!isOrderEditable(order)) return;
    setEditing(order);
    setCustomerId(order.customerId);
    setEstimatedDeliveryDate(order.estimatedDeliveryDate ?? '');
    setRemarks(order.remarks ?? '');
    const mappedDetails = order.details.length > 0
      ? order.details.map((d) => ({
          productId: d.productId,
          quantity: d.quantity ?? 1,
          remark: d.remark ?? '',
        }))
      : [emptyDetail()];
    setDetails(mappedDetails);
    setDetailQuantities(mappedDetails.map((d) => String(d.quantity)));
    setErrors({});
    setDetailErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  /**
   * El servidor valida que el cliente esté activo, que cada producto exista y
   * esté activo y que la cantidad no supere el stock disponible. Aquí se
   * comprueba el stock para avisar antes del round-trip.
   */
  const validate = useCallback((syncedDetails: OrderDetailInput[]) => {
    const next: Record<string, string> = {};
    const nextDetail: Record<number, string> = {};

    if (!customerId) next.customerId = 'Selecciona un cliente activo.';

    // Fecha de entrega: formato AAAA-MM-DD y no en el pasado si se ingresa
    if (estimatedDeliveryDate.trim()) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(estimatedDeliveryDate.trim())) {
        next.estimatedDeliveryDate = 'El formato debe ser AAAA-MM-DD (ej: 2026-12-31).';
      } else {
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (estimatedDeliveryDate.trim() < todayStr) {
          next.estimatedDeliveryDate = 'La fecha de entrega no puede ser anterior a hoy.';
        }
      }
    }

    if (syncedDetails.length === 0) {
      next.details = 'Agrega al menos un producto.';
      return { next, nextDetail };
    }

    syncedDetails.forEach((detail, index) => {
      const product = activeProducts.find((p) => p.id === detail.productId);
      if (!detail.productId) {
        nextDetail[index] = 'Selecciona un producto.';
        return;
      }
      if (!product) {
        nextDetail[index] = 'Ese producto no está activo.';
        return;
      }
      if (!Number.isInteger(detail.quantity) || !(detail.quantity > 0)) {
        nextDetail[index] = 'La cantidad debe ser un número entero mayor que 0.';
        return;
      }
      const stock = product.currentStock ?? 0;
      if (detail.quantity > stock) {
        nextDetail[index] = `Solo hay ${formatNumber(stock, 0)} unidades disponibles.`;
      }
    });

    return { next, nextDetail };
  }, [customerId, estimatedDeliveryDate, activeProducts]);

  const submit = useCallback(async () => {
    // Sincronizar detailQuantities (string) → details.quantity (number)
    const syncedDetails = details.map((d, i) => ({
      ...d,
      quantity: parseInt(detailQuantities[i] ?? '0', 10) || 0,
    }));

    const { next, nextDetail } = validate(syncedDetails);
    setErrors(next);
    setDetailErrors(nextDetail);
    if (Object.keys(next).length > 0 || Object.keys(nextDetail).length > 0) return;

    const payload: OrderInput = {
      customerId: customerId as string,
      estimatedDeliveryDate: estimatedDeliveryDate || null,
      remarks,
      details: syncedDetails,
    };

    setSaving(true);
    setFormError(null);
    const result = editing ? await update(editing.id, payload) : await create(payload);
    setSaving(false);

    if (result.success) {
      setFormOpen(false);
      setEditing(null);
    } else {
      setFormError(result.error ?? 'No se pudo guardar el pedido.');
    }
  }, [validate, customerId, estimatedDeliveryDate, remarks, details, detailQuantities, editing, update, create]);

  const changeStatus = useCallback(
    async (order: Order, status: OrderStatus) => {
      setBusyId(order.id);
      try {
        await orderService.updateStatus(order.id, status);
        await refetch();
        hapticSuccess();
      } catch (e) {
        hapticError();
        setFormError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.');
      } finally {
        setBusyId(null);
      }
    },
    [refetch],
  );

  const cancelOrder = useCallback(
    async (order: Order) => {
      setBusyId(order.id);
      try {
        await orderService.cancel(order.id);
        await refetch();
        hapticSuccess();
      } catch (e) {
        hapticError();
        setFormError(e instanceof Error ? e.message : 'No se pudo cancelar el pedido.');
      } finally {
        setBusyId(null);
      }
    },
    [refetch],
  );

  const runConfirm = useCallback(async () => {
    if (!confirm) return;
    if (confirm.action === 'cancel') {
      await cancelOrder(confirm.order);
    } else {
      await changeStatus(confirm.order, pendingStatus);
    }
    setConfirm(null);
  }, [confirm, cancelOrder, changeStatus, pendingStatus]);

  const addDetail = useCallback(() => {
    setDetails((d) => [...d, emptyDetail()]);
    setDetailQuantities((q) => [...q, '1']);
  }, []);

  const removeDetail = useCallback((index: number) => {
    setDetails((d) => d.filter((_, i) => i !== index));
    setDetailQuantities((q) => q.filter((_, i) => i !== index));
    setDetailErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const updateDetail = useCallback((index: number, patch: Partial<OrderDetailInput>) => {
    setDetails((d) => d.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }, []);

  const openTotal = useMemo(
    () =>
      details.reduce((sum, detail, i) => {
        const product = activeProducts.find((p) => p.id === detail.productId);
        const qty = parseInt(detailQuantities[i] ?? '0', 10) || 0;
        return sum + (product?.unitPrice ?? 0) * qty;
      }, 0),
    [details, detailQuantities, activeProducts],
  );

  const openCount = items.filter((o) => o.status !== 'CANCELLED').length;
  const openAmount = items
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Pedidos"
          subtitle={`${openCount} en curso · ${formatCurrency(openAmount)}`}
          onRefresh={refetch}
          loading={loading}
          onAdd={openCreate}
        />

        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por número o cliente"
          returnKeyType="search"
          clearButtonMode="while-editing"
          containerStyle={styles.search}
        />

        <FilterTabs tabs={FILTER_TABS} selected={filter} onSelect={(v) => setFilter(v as StatusFilter)} />

        {formError ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={formError} />
          </View>
        ) : null}
        {error ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={error} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.list}>
            <SkeletonCard height={180} count={3} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title="Sin pedidos"
            subtitle={
              items.length === 0
                ? 'Crea el primer pedido para un cliente activo.'
                : 'No hay pedidos en el estado seleccionado.'
            }
          />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onEdit={() => openEdit(order)}
                onStatus={(status) => {
                  setPendingStatus(status);
                  setConfirm({ order, action: 'status' });
                }}
                onCancel={() => setConfirm({ order, action: 'cancel' })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={editing ? 'Editar pedido' : 'Nuevo pedido'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        {activeCustomers.length === 0 ? (
          <ErrorBanner message="No hay clientes activos. Reactiva o registra un cliente antes de crear un pedido." />
        ) : (
          <SelectField
            label="Cliente"
            required
            value={customerId}
            options={customerOptions}
            onChange={setCustomerId}
            error={errors.customerId}
          />
        )}

        <AppInput
          label="Fecha de entrega estimada"
          value={estimatedDeliveryDate}
          onChangeText={(v) => {
            // Solo números y guiones, formato AAAA-MM-DD, máximo 10 chars
            const clean = v.replace(/[^0-9\-]/g, '').slice(0, 10);
            setEstimatedDeliveryDate(clean);
          }}
          placeholder="AAAA-MM-DD"
          keyboardType="numbers-and-punctuation"
          error={errors.estimatedDeliveryDate}
          hint="Formato: 2026-12-31. Debe ser hoy o una fecha futura."
        />
        <AppInput
          label="Observaciones"
          value={remarks}
          onChangeText={setRemarks}
          multiline
        />

        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Productos del pedido</Text>
          <AppButton label="Agregar" onPress={addDetail} variant="ghost" style={styles.addBtn} />
        </View>
        {errors.details ? <Text style={styles.detailError}>{errors.details}</Text> : null}

        {details.map((detail, index) => (
          <View key={index} style={styles.detailCard}>
            <View style={styles.detailCardTop}>
              <Text style={styles.detailIndex}>Ítem {index + 1}</Text>
              {details.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ítem ${index + 1}`}
                  onPress={() => removeDetail(index)}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.error} />
                </Pressable>
              ) : null}
            </View>

            <SelectField
              label="Producto"
              required
              value={detail.productId || null}
              options={productOptions}
              onChange={(v) => updateDetail(index, { productId: v })}
            />
            <AppInput
              label="Cantidad"
              required
              value={detailQuantities[index] ?? '1'}
              onChangeText={(v) => {
                const clean = v.replace(/\D/g, '');
                setDetailQuantities((q) => q.map((val, i) => i === index ? clean : val));
              }}
              keyboardType="number-pad"
              hint="Solo números enteros."
              placeholder="1"
            />
            <AppInput
              label="Nota"
              value={detail.remark}
              onChangeText={(v) => updateDetail(index, { remark: v })}
            />
            {detailErrors[index] ? (
              <Text style={styles.detailError}>{detailErrors[index]}</Text>
            ) : null}
          </View>
        ))}

        {openTotal > 0 ? (
          <View style={styles.estimate}>
            <Text style={styles.estimateLabel}>Estimado sin IGV</Text>
            <Text style={styles.estimateValue}>{formatCurrency(openTotal)}</Text>
          </View>
        ) : null}
        <Text style={styles.estimateHint}>
          El subtotal, el IGV y el total los calcula el backend con el precio vigente del producto.
        </Text>

        <AppButton
          label={editing ? 'Guardar cambios' : 'Crear pedido'}
          onPress={submit}
          loading={saving}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>

      <ConfirmDialog
        visible={confirm !== null}
        title={
          confirm?.action === 'cancel'
            ? 'Cancelar pedido'
            : `Marcar como ${ORDER_STATUS_LABELS[pendingStatus] ?? pendingStatus}`
        }
        message={
          confirm?.action === 'cancel'
            ? `Se devolverá al inventario el stock de ${confirm.order.details.length} ítem(s) del pedido ${confirm.order.orderNumber ?? `#${confirm.order.id}`}.`
            : `El pedido ${confirm?.order.orderNumber ?? ''} pasará de ${ORDER_STATUS_LABELS[confirm?.order.status ?? ''] ?? ''} a ${ORDER_STATUS_LABELS[pendingStatus] ?? pendingStatus}.`
        }
        confirmLabel={confirm?.action === 'cancel' ? 'Cancelar pedido' : 'Cambiar estado'}
        tone={confirm?.action === 'cancel' ? 'danger' : 'default'}
        loading={busyId === confirm?.order.id}
        onConfirm={runConfirm}
        onCancel={() => setConfirm(null)}
      />
    </SafeAreaView>
  );
}

function OrderCard({
  order,
  busy,
  onEdit,
  onStatus,
  onCancel,
}: {
  order: Order;
  busy: boolean;
  onEdit: () => void;
  onStatus: (status: OrderStatus) => void;
  onCancel: () => void;
}) {
  const editable = isOrderEditable(order);
  const next = ORDER_NEXT_STATUSES[order.status ?? ''] ?? [];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {order.orderNumber ?? `Pedido #${order.id}`}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {order.customerBusinessName ?? 'Cliente desconocido'}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} labels={ORDER_STATUS_LABELS} />
      </View>

      <View style={styles.chips}>
        <Badge label={`${order.details.length} ítem(s)`} tone="neutral" />
        <Badge label={`Entrega ${formatDate(order.estimatedDeliveryDate)}`} tone="info" />
      </View>

      <View style={styles.totals}>
        <Total label="Subtotal" value={formatCurrency(order.subtotal)} />
        <Total label="IGV" value={formatCurrency(order.taxAmount)} />
        <Total label="Total" value={formatCurrency(order.total)} strong />
      </View>

      {editable ? (
        <View style={styles.actions}>
          <AppButton
            label="Editar"
            onPress={onEdit}
            variant="ghost"
            disabled={busy}
            style={styles.action}
          />
          {next
            .filter((s) => s !== 'CANCELLED')
            .map((status) => (
              <AppButton
                key={status}
                label={ORDER_STATUS_LABELS[status] ?? status}
                onPress={() => onStatus(status as OrderStatus)}
                variant="secondary"
                disabled={busy}
                style={styles.action}
              />
            ))}
          {next.includes('CANCELLED') ? (
            <AppButton
              label="Cancelar"
              onPress={onCancel}
              variant="ghost"
              disabled={busy}
              style={styles.action}
              textStyle={styles.dangerText}
            />
          ) : null}
        </View>
      ) : (
        <Text style={styles.lockedNote}>
          {order.status === 'DELIVERED'
            ? 'Pedido entregado: el backend ya no permite editarlo ni devolver el stock.'
            : 'Pedido cancelado: sin acciones disponibles.'}
        </Text>
      )}
    </View>
  );
}

function Total({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.totalItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.totalValue, strong && styles.totalValueStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: Spacing.lg },
  search: { marginBottom: Spacing.md },
  bannerWrap: { marginTop: Spacing.md },
  list: { flex: 1, marginTop: Spacing.lg },
  listContent: { gap: Spacing.md, paddingBottom: Spacing.xl },
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: Spacing.md },
  totals: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  totalItem: { flex: 1 },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  totalValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 1 },
  totalValueStrong: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  action: { flexGrow: 1, minHeight: 36, paddingVertical: Spacing.xs },
  dangerText: { color: Colors.error },
  lockedNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailsTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addBtn: { minHeight: 34, paddingVertical: Spacing.xs },
  detailCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  detailCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  detailIndex: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailError: { fontSize: FontSize.xs, color: Colors.error, marginTop: 4 },
  estimate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  estimateLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  estimateValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  estimateHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 6, lineHeight: 15 },
  submit: { marginTop: Spacing.md },
});