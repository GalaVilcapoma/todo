import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import { ConfirmDialog } from '../../components/common/confirm-dialog';
import {
  Badge,
  BottomSheetModal,
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  SkeletonCard,
  StatusBadge,
} from '../../components/ui';
import { useCrudResource, useSoftDelete } from '../../hooks/use-resource';
import { agrochemicalService } from '../../services';
import { AGRO_CATEGORIES } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { daysUntil, formatDate, formatNumber } from '../../utils/format';
import type { Agrochemical, AgrochemicalInput, StatusFilter } from '../../types';

const EMPTY_FORM: AgrochemicalInput = {
  commercialName: '',
  activeIngredient: '',
  category: 'INSECTICIDE',
  senasaRegistrationNumber: '',
  registrationExpiry: null,
  maxDose: 0,
  waitingPeriodDays: 0,
  manufacturer: '',
};

// Estado string para campos numéricos — permite campo vacío mientras el usuario escribe
type NumericStrings = { maxDose: string; waitingPeriodDays: string };
const EMPTY_NUMERIC: NumericStrings = { maxDose: '', waitingPeriodDays: '0' };

type FormErrors = Partial<Record<keyof AgrochemicalInput, string>>;

export default function AgrochemicalsScreen() {
  const {
    items,
    loading,
    error,
    refetch,
    create,
    update,
  } = useCrudResource<Agrochemical, AgrochemicalInput>({
    label: 'agroquímicos',
    list: agrochemicalService.getAll,
    create: agrochemicalService.create,
    update: agrochemicalService.update,
  });

  const [filter, setFilter] = useState<StatusFilter>('ACTIVE');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Agrochemical | null>(null);
  const [form, setForm] = useState<AgrochemicalInput>(EMPTY_FORM);
  const [numeric, setNumeric] = useState<NumericStrings>(EMPTY_NUMERIC);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ item: Agrochemical; restore: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);

  const {
    deactivate,
    restore,
    pendingId,
  } = useSoftDelete({
    deactivate: (id) => agrochemicalService.deactivate(id),
    restore: (id) => agrochemicalService.restore(id),
    refetch,
  });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === 'ACTIVE' && item.active !== true) return false;
      if (filter === 'INACTIVE' && item.active === true) return false;
      if (!needle) return true;
      return [item.commercialName, item.activeIngredient, item.manufacturer]
        .filter((v): v is string => typeof v === 'string')
        .some((v) => v.toLowerCase().includes(needle));
    });
  }, [items, filter, query]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setNumeric(EMPTY_NUMERIC);
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: Agrochemical) => {
    setEditing(item);
    setForm({
      commercialName: item.commercialName ?? '',
      activeIngredient: item.activeIngredient ?? '',
      category: item.category ?? 'OTHER',
      senasaRegistrationNumber: item.senasaRegistrationNumber ?? '',
      registrationExpiry: item.registrationExpiry ?? null,
      maxDose: item.maxDose ?? 0,
      waitingPeriodDays: item.waitingPeriodDays ?? 0,
      manufacturer: item.manufacturer ?? '',
    });
    setNumeric({
      maxDose: item.maxDose != null ? String(item.maxDose) : '',
      waitingPeriodDays: String(item.waitingPeriodDays ?? 0),
    });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const validate = useCallback((values: AgrochemicalInput, num: NumericStrings): FormErrors => {
    const errors: FormErrors = {};

    // Nombre comercial: obligatorio, solo letras, números y espacios; no duplicado
    const nameValue = values.commercialName.trim();
    if (!nameValue) {
      errors.commercialName = 'El nombre comercial es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-®™]+$/.test(nameValue)) {
      errors.commercialName = 'El nombre comercial solo puede contener letras, números y espacios.';
    } else if (
      !editing &&
      items.some((a) => a.commercialName?.toLowerCase() === nameValue.toLowerCase())
    ) {
      errors.commercialName = 'Ya existe un agroquímico con ese nombre comercial.';
    }

    // Ingrediente activo: obligatorio, solo letras y espacios
    const ingredientValue = values.activeIngredient.trim();
    if (!ingredientValue) {
      errors.activeIngredient = 'El ingrediente activo es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-,]+$/.test(ingredientValue)) {
      errors.activeIngredient = 'El ingrediente activo solo puede contener letras, números y espacios.';
    }

    // Registro SENASA: obligatorio, alfanumérico (letras, números y guiones)
    const senasaValue = values.senasaRegistrationNumber.trim();
    if (!senasaValue) {
      errors.senasaRegistrationNumber = 'El registro SENASA es obligatorio.';
    } else if (!/^[A-Za-z0-9\-]+$/.test(senasaValue)) {
      errors.senasaRegistrationNumber = 'El registro SENASA solo puede contener letras, números y guiones.';
    }

    // Fabricante: obligatorio, solo letras y espacios
    const manufacturerValue = values.manufacturer.trim();
    if (!manufacturerValue) {
      errors.manufacturer = 'El fabricante es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-&.,]+$/.test(manufacturerValue)) {
      errors.manufacturer = 'El fabricante solo puede contener letras, números y caracteres básicos.';
    }

    // Dosis máxima: número mayor que 0
    const maxDoseVal = parseFloat(num.maxDose);
    if (!num.maxDose.trim() || isNaN(maxDoseVal) || maxDoseVal <= 0) {
      errors.maxDose = 'La dosis máxima debe ser un número mayor que 0.';
    }

    // Periodo de carencia: número no negativo
    const waitingVal = parseInt(num.waitingPeriodDays, 10);
    if (isNaN(waitingVal) || waitingVal < 0) {
      errors.waitingPeriodDays = 'El periodo de carencia debe ser un número mayor o igual a 0.';
    }

    // Fecha de vencimiento: formato YYYY-MM-DD y no en el pasado
    if (values.registrationExpiry) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(values.registrationExpiry)) {
        errors.registrationExpiry = 'El formato debe ser AAAA-MM-DD (ej: 2027-06-15).';
      } else {
        // Comparar como strings para evitar el bug de timezone UTC
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (isNaN(new Date(values.registrationExpiry + 'T00:00:00').getTime())) {
          errors.registrationExpiry = 'La fecha no es válida.';
        } else if (values.registrationExpiry < todayStr) {
          errors.registrationExpiry = 'El registro ya está vencido. Verifica la fecha.';
        }
      }
    }

    return errors;
  }, [items, editing]);

  const submit = useCallback(async () => {
    const payload: AgrochemicalInput = {
      ...form,
      maxDose: parseFloat(numeric.maxDose) || 0,
      waitingPeriodDays: parseInt(numeric.waitingPeriodDays, 10) || 0,
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
      setFormError(result.error ?? 'No se pudo guardar el agroquímico.');
    }
  }, [form, numeric, validate, editing, update, create]);

  const confirmToggle = useCallback(async () => {
    if (!confirm) return;
    setToggling(true);
    const result = confirm.restore ? await restore(confirm.item.id) : await deactivate(confirm.item.id);
    setToggling(false);
    if (result.success) setConfirm(null);
    else if (result.error) setFormError(result.error);
  }, [confirm, restore, deactivate]);

  const toggle = useCallback(
    (item: Agrochemical, nextState: boolean) => {
      setFormError(null);
      setConfirm({ item, restore: nextState });
    },
    [],
  );

  const activeCount = items.filter((i) => i.active === true).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Agroquímicos"
          subtitle={`${activeCount} activos de ${items.length} registrados`}
          onRefresh={refetch}
          loading={loading}
          onAdd={openCreate}
          addLabel="Nuevo"
        />

        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por nombre, ingrediente o fabricante"
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
            <SkeletonCard height={128} count={4} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title="Sin agroquímicos"
            subtitle={
              items.length === 0
                ? 'Registra el primer agroquímico del catálogo.'
                : 'No hay resultados para el filtro o la búsqueda actual.'
            }
          />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visible.map((item) => (
              <AgroCard
                key={item.id}
                item={item}
                busy={pendingId === item.id}
                onEdit={() => openEdit(item)}
                onToggle={() => toggle(item, item.active !== true)} // fix: restore=true solo cuando está INACTIVO
              />
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={editing ? 'Editar agroquímico' : 'Nuevo agroquímico'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        <AppInput
          label="Nombre comercial"
          required
          value={form.commercialName}
          onChangeText={(v) => {
            // Letras, números, espacios y símbolos de marca básicos
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-®™]/g, '');
            setForm((f) => ({ ...f, commercialName: clean }));
          }}
          error={formErrors.commercialName}
          hint="Solo letras, números y espacios."
        />
        <AppInput
          label="Ingrediente activo"
          required
          value={form.activeIngredient}
          onChangeText={(v) => {
            // Letras, números, espacios y comas (para múltiples ingredientes)
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-,]/g, '');
            setForm((f) => ({ ...f, activeIngredient: clean }));
          }}
          error={formErrors.activeIngredient}
          hint="Solo letras, números y espacios."
        />
        <SelectField
          label="Categoría"
          required
          value={form.category}
          options={AGRO_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          onChange={(v) => setForm((f) => ({ ...f, category: v as AgrochemicalInput['category'] }))}
          error={formErrors.category}
        />
        <AppInput
          label="Registro SENASA"
          required
          value={form.senasaRegistrationNumber}
          onChangeText={(v) => {
            // Alfanumérico con guiones (formato típico SENASA)
            const clean = v.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
            setForm((f) => ({ ...f, senasaRegistrationNumber: clean }));
          }}
          error={formErrors.senasaRegistrationNumber}
          autoCapitalize="characters"
          hint="Solo letras, números y guiones. Ej: SV-00-1234"
        />
        <AppInput
          label="Vencimiento del registro"
          value={form.registrationExpiry ?? ''}
          onChangeText={(v) => {
            // Solo números y guiones, formato AAAA-MM-DD
            const clean = v.replace(/[^0-9\-]/g, '').slice(0, 10);
            setForm((f) => ({ ...f, registrationExpiry: clean || null }));
          }}
          placeholder="AAAA-MM-DD"
          error={formErrors.registrationExpiry}
          hint="Formato: 2027-06-15. Solo números y guiones."
          keyboardType="numbers-and-punctuation"
        />
        <AppInput
          label="Dosis máxima"
          required
          value={numeric.maxDose}
          onChangeText={(v) => {
            const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            setNumeric((n) => ({ ...n, maxDose: clean }));
          }}
          keyboardType="decimal-pad"
          error={formErrors.maxDose}
          hint="Solo números. Ej: 2.5"
          placeholder="0.00"
        />
        <AppInput
          label="Periodo de carencia (días)"
          required
          value={numeric.waitingPeriodDays}
          onChangeText={(v) => {
            const clean = v.replace(/\D/g, '');
            setNumeric((n) => ({ ...n, waitingPeriodDays: clean }));
          }}
          keyboardType="number-pad"
          error={formErrors.waitingPeriodDays}
          hint="Solo números enteros. Ej: 14"
          placeholder="0"
        />
        <AppInput
          label="Fabricante"
          required
          value={form.manufacturer}
          onChangeText={(v) => {
            // Letras, números, espacios y signos básicos de empresa
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-&.,]/g, '');
            setForm((f) => ({ ...f, manufacturer: clean }));
          }}
          error={formErrors.manufacturer}
          hint="Solo letras, números y caracteres básicos."
        />

        <AppButton
          label={editing ? 'Guardar cambios' : 'Crear agroquímico'}
          onPress={submit}
          loading={saving}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>

      <ConfirmDialog
        visible={confirm !== null}
        title={confirm?.restore ? 'Restaurar agroquímico' : 'Desactivar agroquímico'}
        message={
          confirm?.restore
            ? `${confirm.item.commercialName ?? 'Este registro'} volverá a estar activo y podrá usarse en nuevas aplicaciones.`
            : `${confirm?.item.commercialName ?? 'Este registro'} dejará de estar disponible para nuevas aplicaciones. No se borra de la base de datos.`
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

function AgroCard({
  item,
  busy,
  onEdit,
  onToggle,
}: {
  item: Agrochemical;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const expiryIn = daysUntil(item.registrationExpiry);
  const isExpired = expiryIn !== null && expiryIn < 0;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.commercialName ?? 'Sin nombre comercial'}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.activeIngredient ?? 'Sin ingrediente activo'}
          </Text>
        </View>
        <StatusBadge active={item.active === true} />
      </View>

      <View style={styles.chips}>
        {item.category ? <CategoryBadge category={item.category} labels={AGRO_CATEGORIES} /> : null}
        {item.manufacturer ? <Badge label={item.manufacturer} tone="neutral" /> : null}
        {expiryIn !== null ? (
          <Badge
            label={isExpired ? 'Registro vencido' : `Vence en ${expiryIn} d`}
            tone={isExpired ? 'danger' : expiryIn <= 30 ? 'warning' : 'neutral'}
          />
        ) : null}
      </View>

      <View style={styles.meta}>
        <Meta label="SENASA" value={item.senasaRegistrationNumber ?? '—'} />
        <Meta label="Dosis máx." value={formatNumber(item.maxDose)} />
        <Meta label="Carencia" value={`${formatNumber(item.waitingPeriodDays, 0)} d`} />
        <Meta label="Vence" value={formatDate(item.registrationExpiry)} />
      </View>

      <View style={styles.cardActions}>
        <AppButton label="Editar" onPress={onEdit} variant="ghost" style={styles.cardAction} />
        <AppButton
          label={item.active === true ? 'Desactivar' : 'Restaurar'}
          onPress={onToggle}
          variant={item.active === true ? 'ghost' : 'secondary'}
          disabled={busy}
          style={styles.cardAction}
          textStyle={item.active === true ? styles.dangerText : undefined}
        />
      </View>
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
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.md,
  },
  metaItem: { minWidth: '40%', flexGrow: 1 },
  metaLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  metaValue: { fontSize: FontSize.sm, color: Colors.textPrimary, marginTop: 1 },
  cardActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  cardAction: { flex: 1, minHeight: 38, paddingVertical: Spacing.sm },
  dangerText: { color: Colors.error },
  submit: { marginTop: Spacing.sm },
});