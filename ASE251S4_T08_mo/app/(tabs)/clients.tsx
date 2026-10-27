import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import { ConfirmDialog } from '../../components/common/confirm-dialog';
import {
  Badge,
  BottomSheetModal,
  CustomerStateBadge,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  SkeletonCard,
} from '../../components/ui';
import { useCrudResource, useSoftDelete } from '../../hooks/use-resource';
import { customerService, isCustomerActive } from '../../services';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatDate } from '../../utils/format';
import type { Customer, CustomerInput, StatusFilter } from '../../types';

// El código siempre arranca con el prefijo CLI- — el usuario solo escribe el número
const CODE_PREFIX = 'CLI-';

// Reglas de validación por tipo de documento
const DOC_RULES: Record<string, { label: string; maxLength: number; hint: string; onlyNumbers: boolean; minLength?: number }> = {
  DNI:      { label: 'DNI',                  maxLength: 8,  hint: 'El DNI debe tener exactamente 8 dígitos.',            onlyNumbers: true  },
  CE:       { label: 'Carné de Extranjería', maxLength: 9,  hint: 'El CE debe tener exactamente 9 dígitos.',             onlyNumbers: true  },
  RUC:      { label: 'RUC',                  maxLength: 11, hint: 'El RUC debe tener exactamente 11 dígitos.',           onlyNumbers: true  },
  PASSPORT: { label: 'Pasaporte',            maxLength: 12, hint: 'El pasaporte debe tener entre 5 y 12 caracteres alfanuméricos.', onlyNumbers: false, minLength: 5 },
};

const EMPTY_FORM: CustomerInput = {
  code: CODE_PREFIX,
  businessName: '',
  ruc: '',
  documentType: 'DNI',
  documentNumber: '',
  country: 'Perú',
  city: '',
  address: '',
  phone: '',
  email: '',
  primaryContact: '',
  customerType: 'DISTRIBUTOR',
};

const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carné de Extranjería' },
  { value: 'RUC', label: 'RUC' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

const CUSTOMER_TYPES = [
  { value: 'DISTRIBUTOR', label: 'Distribuidor' },
  { value: 'FARMACY', label: 'Farmacia' },
  { value: 'STORE', label: 'Tienda' },
  { value: 'OTHER', label: 'Otro' },
];

type FormErrors = Partial<Record<keyof CustomerInput, string>>;

export default function ClientsScreen() {
  const {
    items,
    loading,
    error,
    refetch,
    create,
    update,
  } = useCrudResource<Customer, CustomerInput>({
    label: 'clientes',
    list: customerService.getAll,
    create: customerService.create,
    update: customerService.update,
  });

  const [filter, setFilter] = useState<StatusFilter>('ACTIVE');
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ item: Customer; restore: boolean } | null>(null);
  const [toggling, setToggling] = useState(false);

  const {
    deactivate,
    restore,
    pendingId,
  } = useSoftDelete({
    // El backend de clientes tiene las rutas cruzadas: DELETE desactiva y
    // PATCH /{id}/restaurar reactiva. El servicio ya lo resuelve.
    deactivate: (id) => customerService.deactivate(id),
    restore: (id) => customerService.restore(id),
    refetch,
  });

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const active = isCustomerActive(item);
      if (filter === 'ACTIVE' && !active) return false;
      if (filter === 'INACTIVE' && active) return false;
      if (!needle) return true;
      return [item.businessName, item.code, item.ruc, item.primaryContact, item.email]
        .filter((v): v is string => typeof v === 'string')
        .some((v) => v.toLowerCase().includes(needle));
    });
  }, [items, filter, query]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, code: CODE_PREFIX });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: Customer) => {
    setEditing(item);
    setForm({
      code: item.code ?? '',
      businessName: item.businessName ?? '',
      ruc: item.ruc ?? '',
      documentType: item.documentType ?? 'DNI',
      documentNumber: item.documentNumber ?? '',
      country: item.country ?? 'Perú',
      city: item.city ?? '',
      address: item.address ?? '',
      phone: item.phone ?? '',
      email: item.email ?? '',
      primaryContact: item.primaryContact ?? '',
      customerType: item.customerType ?? 'DISTRIBUTOR',
    });
    setFormErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const validate = useCallback((values: CustomerInput): FormErrors => {
    const errors: FormErrors = {};

    // Código: solo alfanumérico después del prefijo CLI-
    const codeValue = values.code.trim();
    if (!codeValue || codeValue === CODE_PREFIX) {
      errors.code = 'Ingresa el número después de CLI- (ej: CLI-001).';
    } else if (!codeValue.startsWith(CODE_PREFIX)) {
      errors.code = 'El código debe empezar con CLI-.';
    } else if (!/^[A-Z0-9]+$/.test(codeValue.slice(CODE_PREFIX.length))) {
      errors.code = 'El código solo puede tener letras y números (sin espacios ni símbolos).';
    } else if (
      !editing &&
      items.some((c) => c.code?.toLowerCase() === codeValue.toLowerCase())
    ) {
      errors.code = 'Este código ya está registrado, prueba con otro.';
    }

    // Razón social: obligatoria, solo letras, números, espacios y signos básicos
    const businessNameValue = values.businessName.trim();
    if (!businessNameValue) {
      errors.businessName = 'La razón social es obligatoria.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-&.,()0-9]+$/.test(businessNameValue)) {
      errors.businessName = 'La razón social solo puede contener letras, números y caracteres básicos.';
    }

    // El RUC sólo es obligatorio para clientes peruanos con documento RUC.
    // Los clientes internacionales pueden registrarse con pasaporte/CE sin RUC.
    const rucValue = values.ruc.trim();
    const requiresRuc = values.documentType === 'RUC';
    if (requiresRuc && !rucValue) {
      errors.ruc = 'El RUC es obligatorio cuando el tipo de documento es RUC.';
    } else if (rucValue) {
      if (!/^\d+$/.test(rucValue)) {
        errors.ruc = 'El RUC solo puede contener números.';
      } else if (rucValue.length !== 11) {
        errors.ruc = `El RUC debe tener 11 dígitos (tiene ${rucValue.length}).`;
      } else if (!rucValue.startsWith('10') && !rucValue.startsWith('20')) {
        errors.ruc = 'El RUC debe empezar con 10 (persona natural) o 20 (empresa).';
      }
    }

    // Número de documento: reglas según tipo
    const docNumber = values.documentNumber.trim();
    const docRule = DOC_RULES[values.documentType];
    if (!docNumber) {
      errors.documentNumber = 'El número de documento es obligatorio.';
    } else if (values.documentType === 'PASSPORT') {
      // Pasaporte: alfanumérico, entre 5 y 12 caracteres
      if (!/^[A-Za-z0-9]+$/.test(docNumber)) {
        errors.documentNumber = 'El pasaporte solo puede contener letras y números.';
      } else if (docNumber.length < 5) {
        errors.documentNumber = `El pasaporte debe tener al menos 5 caracteres (tiene ${docNumber.length}).`;
      } else if (docNumber.length > 12) {
        errors.documentNumber = `El pasaporte no puede superar 12 caracteres (tiene ${docNumber.length}).`;
      }
    } else {
      // DNI, CE, RUC: solo números con longitud exacta
      if (!/^\d+$/.test(docNumber)) {
        errors.documentNumber = `El ${docRule?.label ?? 'documento'} solo puede contener números.`;
      } else if (docRule && docNumber.length !== docRule.maxLength) {
        errors.documentNumber = `El ${docRule.label} debe tener exactamente ${docRule.maxLength} dígitos (tiene ${docNumber.length}).`;
      }
    }

    // País: obligatorio, solo letras y espacios
    const countryValue = values.country.trim();
    if (!countryValue) {
      errors.country = 'El país es obligatorio.';
    } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(countryValue)) {
      errors.country = 'El país solo puede contener letras.';
    }

    // Ciudad: solo letras y espacios si se ingresa
    if (values.city.trim() && !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(values.city.trim())) {
      errors.city = 'La ciudad solo puede contener letras.';
    }

    // Teléfono: solo números si se ingresa
    if (values.phone.trim() && !/^\d+$/.test(values.phone.trim())) {
      errors.phone = 'El teléfono solo puede contener números.';
    }

    // Contacto principal: solo letras y espacios si se ingresa
    if (values.primaryContact.trim() && !/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(values.primaryContact.trim())) {
      errors.primaryContact = 'El contacto solo puede contener letras.';
    }

    // Email: obligatorio tener @ y dominio con punto
    if (values.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        errors.email = 'El correo debe tener el formato usuario@dominio.com';
      }
    }

    return errors;
  }, [items, editing]);

  const submit = useCallback(async () => {
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError(null);
    const result = editing ? await update(editing.id, form) : await create(form);
    setSaving(false);

    if (result.success) {
      setFormOpen(false);
      setEditing(null);
    } else {
      setFormError(result.error ?? 'No se pudo guardar el cliente.');
    }
  }, [form, validate, editing, update, create]);

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

  const activeCount = items.filter(isCustomerActive).length;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Clientes"
          subtitle={`${activeCount} activos de ${items.length} registrados`}
          onRefresh={refetch}
          loading={loading}
          onAdd={openCreate}
        />

        <AppInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por razón social, RUC o contacto"
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
            <SkeletonCard height={140} count={4} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Sin clientes"
            subtitle={
              items.length === 0
                ? 'Registra el primer cliente para poder crear pedidos.'
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
              <CustomerCard
                key={item.id}
                item={item}
                busy={pendingId === item.id}
                onEdit={() => openEdit(item)}
                onToggle={() =>
                  // fix: restore=true solo cuando el cliente está INACTIVO (queremos reactivarlo)
                  setConfirm({ item, restore: !isCustomerActive(item) })
                }
              />
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        <AppInput
          label="Código"
          required
          value={form.code}
          onChangeText={(v) => {
            // El prefijo CLI- no se puede borrar
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
          placeholder="CLI-001"
          hint="El prefijo CLI- se agrega automáticamente. Solo letras y números."
        />
        <AppInput
          label="Razón social"
          required
          value={form.businessName}
          onChangeText={(v) => {
            // Letras, números, espacios y signos básicos de razón social
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s\-&.,()0-9]/g, '');
            setForm((f) => ({ ...f, businessName: clean }));
          }}
          error={formErrors.businessName}
          hint="Solo letras, números y caracteres básicos."
        />
        <AppInput
          label="RUC"
          required={form.documentType === 'RUC'}
          value={form.ruc}
          onChangeText={(v) => {
            // Solo números, máximo 11 dígitos
            const clean = v.replace(/\D/g, '').slice(0, 11);
            setForm((f) => ({ ...f, ruc: clean }));
          }}
          error={formErrors.ruc}
          keyboardType="number-pad"
          maxLength={11}
          hint="Obligatorio solo si el documento es RUC. Clientes del exterior pueden dejarlo vacío."
        />
        <SelectField
          label="Tipo de documento"
          required
          value={form.documentType}
          options={DOCUMENT_TYPES}
          onChange={(v) => setForm((f) => ({ ...f, documentType: v, documentNumber: '' }))}
        />
        <AppInput
          label="Número de documento"
          required
          value={form.documentNumber}
          onChangeText={(v) => {
            const rule = DOC_RULES[form.documentType];
            if (form.documentType === 'PASSPORT') {
              // Pasaporte: alfanumérico, máximo 12 caracteres
              const clean = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
              setForm((f) => ({ ...f, documentNumber: clean }));
            } else {
              // DNI / CE / RUC: solo números con límite exacto
              const clean = v.replace(/\D/g, '').slice(0, rule?.maxLength ?? 12);
              setForm((f) => ({ ...f, documentNumber: clean }));
            }
          }}
          error={formErrors.documentNumber}
          keyboardType={form.documentType === 'PASSPORT' ? 'default' : 'number-pad'}
          maxLength={DOC_RULES[form.documentType]?.maxLength ?? 12}
          hint={DOC_RULES[form.documentType]?.hint ?? 'Ingresa el número de documento.'}
          autoCapitalize={form.documentType === 'PASSPORT' ? 'characters' : 'none'}
        />
        <AppInput
          label="País"
          required
          value={form.country}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            setForm((f) => ({ ...f, country: clean }));
          }}
          error={formErrors.country}
          hint="Solo letras."
        />
        <AppInput
          label="Ciudad"
          value={form.city}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            setForm((f) => ({ ...f, city: clean }));
          }}
          error={formErrors.city}
          hint="Solo letras."
        />
        <AppInput
          label="Dirección"
          value={form.address}
          onChangeText={(v) => setForm((f) => ({ ...f, address: v }))}
        />
        <AppInput
          label="Teléfono"
          value={form.phone}
          onChangeText={(v) => {
            // Solo números, máximo 12 dígitos (9 celular PE + 3 código país)
            const clean = v.replace(/\D/g, '').slice(0, 12);
            setForm((f) => ({ ...f, phone: clean }));
          }}
          error={formErrors.phone}
          keyboardType="phone-pad"
          maxLength={12}
          hint="Solo números. Máximo 12 dígitos (ej: 987654321)."
        />
        <AppInput
          label="Correo"
          value={form.email}
          onChangeText={(v) => setForm((f) => ({ ...f, email: v.trim() }))}
          keyboardType="email-address"
          autoCapitalize="none"
          error={formErrors.email}
          hint="Ejemplo: nombre@empresa.com"
        />
        <AppInput
          label="Contacto principal"
          value={form.primaryContact}
          onChangeText={(v) => {
            // Solo letras y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]/g, '');
            setForm((f) => ({ ...f, primaryContact: clean }));
          }}
          error={formErrors.primaryContact}
          hint="Solo letras."
        />
        <SelectField
          label="Tipo de cliente"
          value={form.customerType}
          options={CUSTOMER_TYPES}
          onChange={(v) => setForm((f) => ({ ...f, customerType: v }))}
        />

        <AppButton
          label={editing ? 'Guardar cambios' : 'Crear cliente'}
          onPress={submit}
          loading={saving}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>

      <ConfirmDialog
        visible={confirm !== null}
        title={confirm?.restore ? 'Reactivar cliente' : 'Desactivar cliente'}
        message={
          confirm?.restore
            ? `${confirm.item.businessName ?? 'Este cliente'} volverá a estado activo y podrá recibir pedidos.`
            : `${confirm?.item.businessName ?? 'Este cliente'} pasará a estado I. No se puede asignar a pedidos nuevos mientras esté inactivo, pero su historial se conserva.`
        }
        confirmLabel={confirm?.restore ? 'Reactivar' : 'Desactivar'}
        tone={confirm?.restore ? 'default' : 'danger'}
        loading={toggling}
        onConfirm={confirmToggle}
        onCancel={() => setConfirm(null)}
      />
    </SafeAreaView>
  );
}

function CustomerCard({
  item,
  busy,
  onEdit,
  onToggle,
}: {
  item: Customer;
  busy: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const active = isCustomerActive(item);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.businessName ?? 'Sin razón social'}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.code ?? 'Sin código'} · RUC {item.ruc?.trim() || '—'}
          </Text>
        </View>
        {/* El backend nunca escribe `active`; la fuente de verdad es `state`. */}
        <CustomerStateBadge state={item.state} />
      </View>

      <View style={styles.chips}>
        {item.customerType ? <Badge label={item.customerType} tone="info" /> : null}
        {item.city ? <Badge label={item.city} tone="neutral" /> : null}
        {item.email ? <Badge label={item.email} tone="neutral" /> : null}
      </View>

      <View style={styles.meta}>
        <Meta label="Documento" value={`${item.documentType ?? '—'} ${item.documentNumber ?? ''}`.trim()} />
        <Meta label="Teléfono" value={item.phone ?? '—'} />
        <Meta label="Contacto" value={item.primaryContact ?? '—'} />
        <Meta label="Alta" value={formatDate(item.createdAt)} />
      </View>

      <View style={styles.cardActions}>
        <AppButton label="Editar" onPress={onEdit} variant="ghost" style={styles.cardAction} />
        <AppButton
          label={active ? 'Desactivar' : 'Reactivar'}
          onPress={onToggle}
          variant="ghost"
          disabled={busy}
          style={styles.cardAction}
          textStyle={active ? styles.dangerText : undefined}
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
