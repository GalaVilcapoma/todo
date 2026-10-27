import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import { ConfirmDialog } from '../../components/common/confirm-dialog';
import {
  Badge,
  BottomSheetModal,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  SkeletonCard,
  StatusBadge,
} from '../../components/ui';
import { useCrudResource, useSoftDelete } from '../../hooks/use-resource';
import { isProductActive, isLowStock, productService } from '../../services';
import { UNIT_MEASURE_OPTIONS } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatCurrency, formatNumber } from '../../utils/format';
import type { Product, ProductInput, StatusFilter } from '../../types';

// El código siempre arranca con el prefijo PROD- — el usuario solo escribe el número
const CODE_PREFIX = 'PROD-';

const EMPTY_FORM: ProductInput = {
  code: CODE_PREFIX,
  name: '',
  category: '',
  description: '',
  unitMeasure: 'Unidades',
  unitPrice: 0,
  currentStock: 0,
  minimumStock: 0,
  origin: '',
};

// Estado string para campos numéricos — permite campo vacío mientras el usuario escribe
type NumericStrings = { unitPrice: string; currentStock: string; minimumStock: string };
const EMPTY_NUMERIC: NumericStrings = { unitPrice: '', currentStock: '0', minimumStock: '0' };

type FormErrors = Partial<Record<keyof ProductInput, string>>;

export default function ProductsScreen() {
  const {
    items,
    loading,
    error,
    refetch,
    create,
    update,
  } = useCrudResource<Product, ProductInput>({
    label: 'productos',
    list: productService.getAll,
    create: productService.create,
    update: productService.update,
  });

  const [filter, setFilter] = useState<StatusFilter>('ACTIVE');
  const [lowOnly, setLowOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(EMPTY_FORM);
  const [numeric, setNumeric] = useState<NumericStrings>(EMPTY_NUMERIC);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ item: Product; restore: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);

  const {
    deactivate,
    restore,
    pendingId,
  } = useSoftDelete({
    deactivate: (id) => productService.deactivate(id),
    restore: (id) => productService.restore(id),
    refetch,
  });

  const unitMeasureOptions = useMemo(() => {
    const options: { value: string; label: string }[] = UNIT_MEASURE_OPTIONS.map((u) => ({
      value: u.value,
      label: u.label,
    }));
    const current = form.unitMeasure.trim();
    if (current && !options.some((option) => option.value === current)) {
      options.push({ value: current, label: current });
    }
    return options;
  }, [form.unitMeasure]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'ACTIVE' && !isProductActive(item)) return false;
      if (filter === 'INACTIVE' && isProductActive(item)) return false;
      if (lowOnly && !isLowStock(item)) return false;
      if (!needle) return true;
      return [item.code, item.name, item.category, item.origin]
        .filter((v): v is string => typeof v === 'string')
        .some((v) => v.toLowerCase().includes(needle));
    });
  }, [items, filter, query, lowOnly]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, code: CODE_PREFIX });
    setNumeric(EMPTY_NUMERIC);
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  /**
   * Al editar se copian `currentStock` y `minimumStock` al formulario a
   * propósito: `ProductoServiceImpl.editar()` sobrescribe todos los campos
   * desde el body y pone 0 cuando llegan nulos, así que omitirlos borraría el
   * inventario del producto.
   */
  const openEdit = useCallback((item: Product) => {
    setEditing(item);
    setForm({
      code: item.code ?? '',
      name: item.name ?? '',
      category: item.category ?? '',
      description: item.description ?? '',
      unitMeasure: item.unitMeasure ?? 'Unidades',
      unitPrice: item.unitPrice ?? 0,
      currentStock: item.currentStock ?? 0,
      minimumStock: item.minimumStock ?? 0,
      origin: item.origin ?? '',
    });
    setNumeric({
      unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
      currentStock: String(item.currentStock ?? 0),
      minimumStock: String(item.minimumStock ?? 0),
    });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const validate = useCallback((values: ProductInput, num: NumericStrings): FormErrors => {
    const errors: FormErrors = {};

    // Código: sufijo solo alfanumérico, sin espacios ni símbolos
    const codeValue = values.code.trim();
    if (!codeValue || codeValue === CODE_PREFIX) {
      errors.code = 'Ingresa el número después de PROD- (ej: PROD-001).';
    } else if (!codeValue.startsWith(CODE_PREFIX)) {
      errors.code = 'El código debe empezar con PROD-.';
    } else if (!/^[A-Z0-9]+$/.test(codeValue.slice(CODE_PREFIX.length))) {
      errors.code = 'El sufijo del código solo puede tener letras y números (sin espacios ni símbolos).';
    } else if (
      !editing &&
      items.some((p) => p.code?.toLowerCase() === codeValue.toLowerCase())
    ) {
      errors.code = 'Este código ya está registrado, prueba con otro.';
    }

    // Nombre: obligatorio, solo letras, números y espacios
    const nameValue = values.name.trim();
    if (!nameValue) {
      errors.name = 'El nombre es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]+$/.test(nameValue)) {
      errors.name = 'El nombre solo puede contener letras, números y espacios.';
    }

    // Categoría: obligatoria, solo letras y espacios
    const categoryValue = values.category.trim();
    if (!categoryValue) {
      errors.category = 'La categoría es obligatoria.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-]+$/.test(categoryValue)) {
      errors.category = 'La categoría solo puede contener letras.';
    }

    // Origen: obligatorio, solo letras y espacios
    const originValue = values.origin.trim();
    if (!originValue) {
      errors.origin = 'El origen es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-]+$/.test(originValue)) {
      errors.origin = 'El origen solo puede contener letras.';
    }

    // Precio: obligatorio, mayor que 0
    const price = parseFloat(num.unitPrice);
    if (!num.unitPrice.trim() || isNaN(price) || price <= 0) {
      errors.unitPrice = 'El precio debe ser un número mayor que 0.';
    }

    // Stock actual: entero no negativo
    const stock = parseInt(num.currentStock, 10);
    if (isNaN(stock) || stock < 0) {
      errors.currentStock = 'El stock actual debe ser un número mayor o igual a 0.';
    }

    // Stock mínimo: entero no negativo
    const minStock = parseInt(num.minimumStock, 10);
    if (isNaN(minStock) || minStock < 0) {
      errors.minimumStock = 'El stock mínimo debe ser un número mayor o igual a 0.';
    }

    // Stock mínimo no puede superar stock actual
    if (!isNaN(stock) && !isNaN(minStock) && minStock > stock) {
      errors.minimumStock = 'El stock mínimo no puede superar el stock actual.';
    }

    return errors;
  }, [items, editing]);

  const submit = useCallback(async () => {
    // Sincronizar los valores numéricos string → number antes de validar
    const payload: ProductInput = {
      ...form,
      unitPrice: parseFloat(numeric.unitPrice) || 0,
      currentStock: parseInt(numeric.currentStock, 10) || 0,
      minimumStock: parseInt(numeric.minimumStock, 10) || 0,
    };
    const errors = validate(payload, numeric);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError(null);
    const result = editing ? await update(editing.id, payload) : await create(payload);
    setSaving(false);

    if (result.success) {
      setFormOpen(false);
      setEditing(null);
    } else {
      setFormError(result.error ?? 'No se pudo guardar el producto.');
    }
  }, [form, numeric, validate, editing, update, create]);

  const confirmToggle = useCallback(async () => {
    if (!confirm) return;
    setToggling(true);
    const result = confirm.restore
      ? await restore(confirm.item.id)
      : await deactivate(confirm.item.id);
    setToggling(false);
    if (result.success) setConfirm(null);
    else if (result.error) setFormError(result.error);
  }, [confirm, restore, deactivate]);

  const activeCount = items.filter(isProductActive).length;
  const lowCount = items.filter((p) => isProductActive(p) && isLowStock(p)).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Productos"
          subtitle={`${activeCount} activos · ${lowCount} con stock bajo`}
          onRefresh={refetch}
          loading={loading}
          onAdd={openCreate}
        />

        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por código, nombre o categoría"
          returnKeyType="search"
          clearButtonMode="while-editing"
          containerStyle={styles.search}
        />

        <FilterTabs
          tabs={[
            { value: 'ACTIVE', label: 'Activos' },
            { value: 'INACTIVE', label: 'Inactivos' },
            { value: 'ALL', label: 'Todos' },
          ]}
          selected={filter}
          onSelect={(v) => setFilter(v as StatusFilter)}
        />

        <AppButton
          label={lowOnly ? 'Quitar filtro de stock bajo' : 'Ver solo stock bajo'}
          onPress={() => setLowOnly((v) => !v)}
          variant={lowOnly ? 'warning' : 'ghost'}
          style={styles.lowToggle}
        />

        {formError && !formOpen ? (
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
            <SkeletonCard height={136} count={4} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Sin productos"
            subtitle={
              items.length === 0
                ? 'Registra el primer producto del inventario.'
                : 'No hay resultados para los filtros o la búsqueda actual.'
            }
          />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visible.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                busy={pendingId === item.id}
                onEdit={() => openEdit(item)}
                onToggle={() =>
                  // fix: restore=true solo cuando el producto está INACTIVO (queremos restaurarlo)
                  setConfirm({ item, restore: !isProductActive(item) })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        <AppInput
          label="Código"
          required
          value={form.code}
          onChangeText={(v) => {
            // El prefijo PROD- no se puede borrar
            if (!v.startsWith(CODE_PREFIX)) {
              setForm((f) => ({ ...f, code: CODE_PREFIX }));
            } else {
              // Sufijo: solo letras y números (sin espacios ni símbolos)
              const suffix = v.slice(CODE_PREFIX.length).replace(/[^A-Z0-9]/gi, '').toUpperCase();
              setForm((f) => ({ ...f, code: CODE_PREFIX + suffix }));
            }
          }}
          error={formErrors.code}
          autoCapitalize="characters"
          placeholder="PROD-001"
          hint="El prefijo PROD- se agrega automáticamente. Solo letras y números."
        />
        <AppInput
          label="Nombre"
          required
          value={form.name}
          onChangeText={(v) => {
            // Solo letras, números y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]/g, '');
            setForm((f) => ({ ...f, name: clean }));
          }}
          error={formErrors.name}
          hint="Solo letras, números y espacios."
        />
        <AppInput
          label="Categoría"
          required
          value={form.category}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-]/g, '');
            setForm((f) => ({ ...f, category: clean }));
          }}
          error={formErrors.category}
          hint="Solo letras."
        />
        <SelectField
          label="Unidad de medida"
          required
          value={form.unitMeasure}
          options={unitMeasureOptions}
          onChange={(v) => setForm((f) => ({ ...f, unitMeasure: v }))}
        />
        <AppInput
          label="Precio unitario"
          required
          value={numeric.unitPrice}
          onChangeText={(v) => {
            // Solo números y un punto decimal
            const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            setNumeric((n) => ({ ...n, unitPrice: clean }));
          }}
          keyboardType="decimal-pad"
          error={formErrors.unitPrice}
          hint="Solo números. Ej: 15.50"
          placeholder="0.00"
        />
        <AppInput
          label="Origen"
          required
          value={form.origin}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-]/g, '');
            setForm((f) => ({ ...f, origin: clean }));
          }}
          error={formErrors.origin}
          hint="Solo letras. Ej: Perú"
        />
        <AppInput
          label="Descripción"
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          multiline
        />
        <AppInput
          label="Stock actual"
          value={numeric.currentStock}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '');
            setNumeric((n) => ({ ...n, currentStock: clean }));
          }}
          keyboardType="number-pad"
          error={formErrors.currentStock}
          hint="Solo números enteros. El inventario real se ajusta con movimientos de stock."
          placeholder="0"
        />
        <AppInput
          label="Stock mínimo"
          value={numeric.minimumStock}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '');
            setNumeric((n) => ({ ...n, minimumStock: clean }));
          }}
          keyboardType="number-pad"
          error={formErrors.minimumStock}
          hint="Solo números enteros."
          placeholder="0"
        />

        <AppButton
          label={editing ? 'Guardar cambios' : 'Crear producto'}
          onPress={submit}
          loading={saving}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>

      <ConfirmDialog
        visible={confirm !== null}
        title={confirm?.restore ? 'Restaurar producto' : 'Desactivar producto'}
        message={
          confirm?.restore
            ? `${confirm.item.name ?? 'Este producto'} volverá a estar activo y podrá recibir pedidos.`
            : `${confirm?.item.name ?? 'Este producto'} dejará de estar disponible para nuevos pedidos. Su historial de movimientos se conserva.`
        }
        confirmLabel={confirm?.restore ? 'Restaurar' : 'Desactivar'}
        tone={confirm?.restore ? 'default' : 'danger'}
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setConfirm(null)}
      />
    </SafeAreaView>
  );
}

function ProductCard({
  item,
  busy,
  onEdit,
  onToggle,
}: {
  item: Product;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const low = isLowStock(item);
  const stock = item.currentStock ?? 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name ?? 'Sin nombre'}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.code ?? 'Sin código'} · {item.category ?? 'Sin categoría'}
          </Text>
        </View>
        <StatusBadge active={isProductActive(item)} />
      </View>

      <View style={styles.chips}>
        {item.origin ? <Badge label={item.origin} tone="neutral" /> : null}
        {item.unitMeasure ? <Badge label={item.unitMeasure} tone="info" /> : null}
        {low ? (
          <Badge
            label={stock === 0 ? 'Sin stock' : `Stock bajo (mín. ${formatNumber(item.minimumStock, 0)})`}
            tone={stock === 0 ? 'danger' : 'warning'}
          />
        ) : null}
      </View>

      <View style={styles.stockRow}>
        <View>
          <Text style={styles.metaLabel}>Stock</Text>
          <Text style={[styles.stockValue, low && styles.stockValueLow]}>
            {formatNumber(stock, 0)}
          </Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Precio</Text>
          <Text style={styles.stockValue}>{formatCurrency(item.unitPrice)}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <AppButton label="Editar" onPress={onEdit} variant="ghost" style={styles.cardAction} />
        <AppButton
          label={isProductActive(item) ? 'Desactivar' : 'Restaurar'}
          onPress={onToggle}
          variant="ghost"
          disabled={busy}
          style={styles.cardAction}
          textStyle={isProductActive(item) ? styles.dangerText : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1, padding: Spacing.lg },
  search: { marginBottom: Spacing.md },
  lowToggle: { marginTop: Spacing.sm, minHeight: 36, paddingVertical: Spacing.xs },
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
  stockRow: {
    flexDirection: 'row',
    gap: Spacing['3xl'],
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stockValue: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stockValueLow: { color: Colors.error },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cardAction: { flex: 1, minHeight: 38, paddingVertical: Spacing.sm },
  dangerText: { color: Colors.error },
  submit: { marginTop: Spacing.sm },
});