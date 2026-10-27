import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, AppHeader, AppInput, SelectField } from '../../components/common';
import {
  ApplicationStatusBadge,
  BottomSheetModal,
  CategoryBadge,
  EmptyState,
  ErrorBanner,
  FilterTabs,
  SkeletonCard,
} from '../../components/ui';
import { useCrudResource, useResource } from '../../hooks/use-resource';
import { agrochemicalService, applicationService } from '../../services';
import {
  AGRO_CATEGORIES,
  APPLICATION_STATUS_LABELS,
  UNIT_MEASURE_OPTIONS,
  WIND_CONDITIONS,
} from '../../constants/config';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { formatCurrency, formatDate, formatNumber, todayISO } from '../../utils/format';
import type {
  Agrochemical,
  Application,
  ApplicationDetailInput,
  ApplicationInput,
} from '../../types';

type StatusFilter = 'ALL' | 'SCHEDULED' | 'IN_PROCESS' | 'COMPLETED' | 'CANCELLED';

const EMPTY_FORM: ApplicationInput = {
  fieldName: '',
  areaHectares: null,
  applicationDate: todayISO(),
  responsible: '',
  temperatureCelsius: null,
  humidityPercentage: null,
  windConditions: 'LIGHT',
  remarks: '',
  details: [],
};

const emptyDetail = (): ApplicationDetailInput => ({
  agrochemicalId: '',
  appliedDose: 0,
  unitMeasure: 'Litros',
  treatedAreaHectares: 0,
  remark: '',
});

type FormErrors = Partial<Record<keyof ApplicationInput, string>>;

export default function ApplicationsScreen() {
  const {
    items,
    loading,
    error,
    refetch,
    create,
    update,
  } = useCrudResource<Application, ApplicationInput, number>({
    label: 'aplicaciones',
    list: applicationService.getAll,
    create: applicationService.create,
    update: applicationService.update,
  });

  /**
   * Solo se ofrecen agroquímicos activos: el backend rechaza la aplicación si
   * alguno de sus detalles apunta a un agroquímico inactivo o inexistente.
   */
  const agrochemicals = useResource<Agrochemical>({
    label: 'agroquímicos',
    list: agrochemicalService.getAll,
    initialLoading: false,
  });

  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [form, setForm] = useState<ApplicationInput>(EMPTY_FORM);
  // Arrays paralelos a form.details para permitir campo vacío mientras el usuario escribe
  const [detailDoses, setDetailDoses] = useState<string[]>([]);
  const [detailAreas, setDetailAreas] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [detailErrors, setDetailErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeAgrochemicals = useMemo(
    () => agrochemicals.items.filter((a) => a.active === true && a.maxDose !== null),
    [agrochemicals.items],
  );

  const agroOptions = useMemo(
    () =>
      activeAgrochemicals.map((a) => ({
        value: a.id,
        label: a.commercialName ?? 'Sin nombre',
        hint: `Dosis máx. ${formatNumber(a.maxDose)}`,
      })),
    [activeAgrochemicals],
  );

  const visible = useMemo(
    () =>
      items.filter((item) => {
        if (filter === 'ALL') return true;
        return item.status === filter;
      }),
    [items, filter],
  );

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, details: [emptyDetail()] });
    setDetailDoses(['']);
    setDetailAreas(['']);
    setFormErrors({});
    setDetailErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((item: Application) => {
    if (item.status === 'COMPLETED' || item.status === 'CANCELLED') return;
    setEditing(item);
    const mappedDetails = item.details.map((d) => ({
      agrochemicalId: d.agrochemicalId,
      appliedDose: d.appliedDose ?? 0,
      unitMeasure: d.unitMeasure ?? 'LITRO',
      treatedAreaHectares: d.treatedAreaHectares ?? 0,
      remark: d.remark ?? '',
    }));
    setForm({
      fieldName: item.fieldName ?? '',
      areaHectares: item.areaHectares ?? null,
      applicationDate: item.applicationDate ?? todayISO(),
      responsible: item.responsible ?? '',
      temperatureCelsius: item.temperatureCelsius ?? null,
      humidityPercentage: item.humidityPercentage ?? null,
      windConditions: item.windConditions ?? 'LIGHT',
      remarks: item.remarks ?? '',
      details: mappedDetails,
    });
    setDetailDoses(mappedDetails.map((d) => d.appliedDose != null ? String(d.appliedDose) : ''));
    setDetailAreas(mappedDetails.map((d) => d.treatedAreaHectares != null ? String(d.treatedAreaHectares) : ''));
    setFormErrors({});
    setDetailErrors({});
    setFormError(null);
    setFormOpen(true);
  }, []);

  /**
   * El backend valida en servidor: `details` no vacío, cada agroquímico
   * activo, `appliedDose` dentro de (0, maxDose] y `treatedAreaHectares`
   * positivo. Se replica aquí para no gastar un round-trip en algo que ya se
   * conoce, y para poder señalar la fila exacta que falla.
   */
  const validate = useCallback(
    (values: ApplicationInput): { errors: FormErrors; details: Record<number, string> } => {
      const errors: FormErrors = {};
      const details: Record<number, string> = {};

      // Nombre del campo: obligatorio, solo letras, números y espacios
      const fieldNameValue = values.fieldName.trim();
      if (!fieldNameValue) {
        errors.fieldName = 'El nombre del campo es obligatorio.';
      } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]+$/.test(fieldNameValue)) {
        errors.fieldName = 'El nombre del campo solo puede contener letras, números y espacios.';
      }

      // Responsable: obligatorio, solo letras y espacios
      const responsableValue = values.responsible.trim();
      if (!responsableValue) {
        errors.responsible = 'El responsable es obligatorio.';
      } else if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/.test(responsableValue)) {
        errors.responsible = 'El responsable solo puede contener letras.';
      }

      // Área total: obligatoria, número mayor que 0
      if (values.areaHectares === null || values.areaHectares === undefined) {
        errors.areaHectares = 'El área total es obligatoria.';
      } else if (isNaN(values.areaHectares) || !(values.areaHectares > 0)) {
        errors.areaHectares = 'El área debe ser un número mayor que 0.';
      }

      // Fecha de aplicación: obligatoria, formato AAAA-MM-DD
      if (!values.applicationDate) {
        errors.applicationDate = 'La fecha de aplicación es obligatoria.';
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.applicationDate)) {
        errors.applicationDate = 'El formato debe ser AAAA-MM-DD (ej: 2026-10-15).';
      }

      // Temperatura: número en rango si se ingresa
      if (values.temperatureCelsius !== null) {
        if (isNaN(values.temperatureCelsius)) {
          errors.temperatureCelsius = 'La temperatura debe ser un número.';
        } else if (values.temperatureCelsius < -50 || values.temperatureCelsius > 60) {
          errors.temperatureCelsius = 'La temperatura debe estar entre -50°C y 60°C.';
        }
      }

      // Humedad: número entre 0 y 100 si se ingresa
      if (values.humidityPercentage !== null) {
        if (isNaN(values.humidityPercentage)) {
          errors.humidityPercentage = 'La humedad debe ser un número.';
        } else if (values.humidityPercentage < 0 || values.humidityPercentage > 100) {
          errors.humidityPercentage = 'La humedad debe estar entre 0 y 100%.';
        }
      }

      // Al menos un agroquímico en el detalle
      if (values.details.length === 0) {
        errors.details = 'Agrega al menos un agroquímico aplicado.';
        return { errors, details };
      }

      // Validar cada línea de detalle
      values.details.forEach((detail, index) => {
        const agro = activeAgrochemicals.find((a) => a.id === detail.agrochemicalId);
        if (!detail.agrochemicalId) {
          details[index] = 'Selecciona un agroquímico.';
          return;
        }
        if (!agro) {
          details[index] = 'Ese agroquímico no está activo o no existe.';
          return;
        }
        if (isNaN(detail.appliedDose) || !(detail.appliedDose > 0)) {
          details[index] = 'La dosis debe ser un número mayor que 0.';
          return;
        }
        if (agro.maxDose !== null && detail.appliedDose > agro.maxDose) {
          details[index] = `Supera la dosis máxima permitida (${formatNumber(agro.maxDose)}). Reduce la dosis.`;
          return;
        }
        if (isNaN(detail.treatedAreaHectares) || !(detail.treatedAreaHectares > 0)) {
          details[index] = 'El área tratada debe ser un número mayor que 0.';
        }
      });

      return { errors, details };
    },
    [activeAgrochemicals],
  );

  const submit = useCallback(async () => {
    // Sincronizar arrays de strings → números en form.details
    const syncedForm: ApplicationInput = {
      ...form,
      details: form.details.map((d, i) => ({
        ...d,
        appliedDose: parseFloat(detailDoses[i] ?? '0') || 0,
        treatedAreaHectares: parseFloat(detailAreas[i] ?? '0') || 0,
      })),
    };
    const { errors, details } = validate(syncedForm);
    setFormErrors(errors);
    setDetailErrors(details);
    if (Object.keys(errors).length > 0 || Object.keys(details).length > 0) return;

    setSaving(true);
    setFormError(null);
    const result = editing ? await update(editing.id, syncedForm) : await create(syncedForm);
    setSaving(false);

    if (result.success) {
      setFormOpen(false);
      setEditing(null);
    } else {
      setFormError(result.error ?? 'No se pudo guardar la aplicación.');
    }
  }, [form, detailDoses, detailAreas, validate, editing, update, create]);

  const addDetail = useCallback(() => {
    setForm((f) => ({ ...f, details: [...f.details, emptyDetail()] }));
    setDetailDoses((d) => [...d, '']);
    setDetailAreas((a) => [...a, '']);
  }, []);

  const removeDetail = useCallback((index: number) => {
    setForm((f) => ({ ...f, details: f.details.filter((_, i) => i !== index) }));
    setDetailDoses((d) => d.filter((_, i) => i !== index));
    setDetailAreas((a) => a.filter((_, i) => i !== index));
    setDetailErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  }, []);

  const updateDetail = useCallback(
    (index: number, patch: Partial<ApplicationDetailInput>) => {
      setForm((f) => ({
        ...f,
        details: f.details.map((d, i) => (i === index ? { ...d, ...patch } : d)),
      }));
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.body}>
        <AppHeader
          title="Aplicaciones"
          subtitle={`${items.length} registradas`}
          onRefresh={refetch}
          loading={loading}
          onAdd={openCreate}
          addLabel="Nueva"
        />

        <FilterTabs
          tabs={[
            { value: 'ALL', label: 'Todas' },
            { value: 'SCHEDULED', label: 'Program.' },
            { value: 'IN_PROCESS', label: 'En proceso' },
            { value: 'COMPLETED', label: 'Complet.' },
            { value: 'CANCELLED', label: 'Cancel.' },
          ]}
          selected={filter}
          onSelect={(v) => setFilter(v as StatusFilter)}
        />

        {error ? (
          <View style={styles.bannerWrap}>
            <ErrorBanner message={error} />
          </View>
        ) : null}

        {loading ? (
          <View style={styles.list}>
            <SkeletonCard height={150} count={3} />
          </View>
        ) : visible.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="Sin aplicaciones"
            subtitle={
              items.length === 0
                ? 'Registra la primera aplicación de agroquímicos en campo.'
                : 'No hay aplicaciones en el estado seleccionado.'
            }
          />
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {visible.map((item) => (
              <ApplicationCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item)}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <BottomSheetModal
        visible={formOpen}
        title={editing ? 'Editar aplicación' : 'Nueva aplicación'}
        onClose={() => setFormOpen(false)}
      >
        {formError ? <ErrorBanner message={formError} /> : null}

        <AppInput
          label="Nombre del campo"
          required
          value={form.fieldName}
          onChangeText={(v) => {
            // Letras, números y espacios
            const clean = v.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñÜü0-9\s\-]/g, '');
            setForm((f) => ({ ...f, fieldName: clean }));
          }}
          error={formErrors.fieldName}
          hint="Solo letras, números y espacios."
        />
        <AppInput
          label="Área total (ha)"
          required
          value={form.areaHectares === null ? '' : String(form.areaHectares)}
          onChangeText={(v) => {
            if (v === '' || v === '.' || v === ',') {
              setForm((f) => ({ ...f, areaHectares: null }));
              return;
            }
            // Solo números y un punto decimal
            const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            const parsed = parseFloat(clean);
            setForm((f) => ({ ...f, areaHectares: isNaN(parsed) ? null : parsed }));
          }}
          keyboardType="decimal-pad"
          error={formErrors.areaHectares}
          hint="Solo números. Ej: 3.5"
        />
        <AppInput
          label="Fecha de aplicación"
          required
          value={form.applicationDate ?? ''}
          onChangeText={(v) => {
            // Solo números y guiones, máximo 10 chars (AAAA-MM-DD)
            const clean = v.replace(/[^0-9\-]/g, '').slice(0, 10);
            setForm((f) => ({ ...f, applicationDate: clean || null }));
          }}
          placeholder="AAAA-MM-DD"
          keyboardType="numbers-and-punctuation"
          error={formErrors.applicationDate}
          hint="Formato: 2026-10-15. Solo números y guiones."
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
          error={formErrors.responsible}
          hint="Solo letras."
        />
        <AppInput
          label="Temperatura (°C)"
          value={form.temperatureCelsius === null ? '' : String(form.temperatureCelsius)}
          onChangeText={(v) => {
            if (v === '' || v === '-' || v === '.' || v === '-.') {
              setForm((f) => ({ ...f, temperatureCelsius: null }));
              return;
            }
            // Números, signo negativo al inicio y punto decimal
            const clean = v.replace(/[^0-9.\-]/g, '').replace(/(?!^)-/g, '').replace(/(\..*)\./g, '$1');
            const parsed = parseFloat(clean);
            setForm((f) => ({ ...f, temperatureCelsius: isNaN(parsed) ? null : parsed }));
          }}
          keyboardType="numbers-and-punctuation"
          error={formErrors.temperatureCelsius}
          hint="Solo números. Rango: -50 a 60."
        />
        <AppInput
          label="Humedad (%)"
          value={form.humidityPercentage === null ? '' : String(form.humidityPercentage)}
          onChangeText={(v) => {
            if (v === '') {
              setForm((f) => ({ ...f, humidityPercentage: null }));
              return;
            }
            // Solo números y un punto decimal
            const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
            const parsed = parseFloat(clean);
            setForm((f) => ({ ...f, humidityPercentage: isNaN(parsed) ? null : parsed }));
          }}
          keyboardType="decimal-pad"
          error={formErrors.humidityPercentage}
          hint="Solo números. Rango: 0 a 100."
        />
        <SelectField
          label="Condición de viento"
          value={form.windConditions}
          options={WIND_CONDITIONS.map((w) => ({ value: w.value, label: w.label }))}
          onChange={(v) => setForm((f) => ({ ...f, windConditions: v }))}
        />
        <AppInput
          label="Observaciones"
          value={form.remarks}
          onChangeText={(v) => setForm((f) => ({ ...f, remarks: v }))}
          multiline
        />

        <View style={styles.detailsHeader}>
          <Text style={styles.detailsTitle}>Agroquímicos aplicados</Text>
          <AppButton
            label="Agregar"
            onPress={addDetail}
            variant="ghost"
            style={styles.addDetailBtn}
          />
        </View>
        {formErrors.details ? <Text style={styles.detailError}>{formErrors.details}</Text> : null}

        {activeAgrochemicals.length === 0 ? (
          <ErrorBanner message="No hay agroquímicos activos. Crea uno antes de registrar una aplicación." />
        ) : (
          form.details.map((detail, index) => (
            <View key={index} style={styles.detailCard}>
              <View style={styles.detailCardTop}>
                <Text style={styles.detailIndex}>Detalle {index + 1}</Text>
                {form.details.length > 1 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar detalle ${index + 1}`}
                    onPress={() => removeDetail(index)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={17} color={Colors.error} />
                  </Pressable>
                ) : null}
              </View>

              <SelectField
                label="Agroquímico"
                required
                value={detail.agrochemicalId || null}
                options={agroOptions}
                onChange={(v) => updateDetail(index, { agrochemicalId: v })}
              />

              <View style={styles.detailRow}>
                <View style={styles.detailRowItem}>
                  <AppInput
                    label="Dosis"
                    required
                    value={detailDoses[index] ?? ''}
                    onChangeText={(v) => {
                      const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                      setDetailDoses((d) => d.map((val, i) => i === index ? clean : val));
                    }}
                    keyboardType="decimal-pad"
                    hint="Solo números."
                    placeholder="0.00"
                  />
                </View>
                <View style={styles.detailRowItem}>
                  <SelectField
                    label="Unidad"
                    value={detail.unitMeasure}
                    options={[
                      ...UNIT_MEASURE_OPTIONS.map((u) => ({ value: u.value, label: u.label })),
                      ...(UNIT_MEASURE_OPTIONS.some((u) => u.value === detail.unitMeasure)
                        ? []
                        : [{ value: detail.unitMeasure, label: detail.unitMeasure }]),
                    ]}
                    onChange={(v) => updateDetail(index, { unitMeasure: v })}
                  />
                </View>
              </View>

              <AppInput
                label="Área tratada (ha)"
                required
                value={detailAreas[index] ?? ''}
                onChangeText={(v) => {
                  const clean = v.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                  setDetailAreas((a) => a.map((val, i) => i === index ? clean : val));
                }}
                keyboardType="decimal-pad"
                hint="Solo números. Ej: 1.5"
                placeholder="0.00"
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
          ))
        )}

        <AppButton
          label={editing ? 'Guardar cambios' : 'Crear aplicación'}
          onPress={submit}
          loading={saving}
          fullWidth
          style={styles.submit}
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}

function ApplicationCard({ item, onEdit }: { item: Application; onEdit: () => void }) {
  const editable = item.status === 'SCHEDULED' || item.status === 'IN_PROCESS';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.fieldName ?? 'Sin nombre de campo'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {item.applicationNumber ?? `#${item.id}`} · {formatDate(item.applicationDate)}
          </Text>
        </View>
        <ApplicationStatusBadge status={item.status} labels={APPLICATION_STATUS_LABELS} />
      </View>

      <View style={styles.meta}>
        <Meta label="Área" value={`${formatNumber(item.areaHectares)} ha`} />
        <Meta label="Responsable" value={item.responsible ?? '—'} />
        <Meta
          label="Clima"
          value={
            [
              item.temperatureCelsius !== null ? `${formatNumber(item.temperatureCelsius, 0)}°C` : null,
              item.humidityPercentage !== null ? `${formatNumber(item.humidityPercentage, 0)}%` : null,
            ]
              .filter(Boolean)
              .join(' · ') || '—'
          }
        />
        <Meta label="Costo" value={formatCurrency(item.totalCost)} />
      </View>

      {item.details.length > 0 ? (
        <View style={styles.details}>
          {item.details.map((detail) => (
            <View key={detail.id} style={styles.detailRowItem}>
              <View style={styles.detailRowText}>
                <Text style={styles.detailName} numberOfLines={1}>
                  {detail.agrochemicalName ?? 'Agroquímico eliminado'}
                </Text>
                <Text style={styles.detailMeta} numberOfLines={1}>
                  {formatNumber(detail.appliedDose)} {detail.unitMeasure ?? ''} ·{' '}
                  {formatNumber(detail.treatedAreaHectares)} ha
                </Text>
              </View>
              {detail.category ? (
                <CategoryBadge category={detail.category} labels={AGRO_CATEGORIES} />
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.noDetails}>Sin detalle de agroquímicos.</Text>
      )}

      {item.remarks ? (
        <Text style={styles.remarks} numberOfLines={2}>
          {item.remarks}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <AppButton
          label={editable ? 'Editar' : 'No editable'}
          onPress={onEdit}
          variant="ghost"
          disabled={!editable}
          style={styles.cardAction}
        />
        <View style={styles.totalBlock}>
          <Text style={styles.metaLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(item.totalCost)}</Text>
        </View>
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
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.md,
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
  details: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  noDetails: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.md },
  remarks: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  cardAction: { flex: 1, minHeight: 38, paddingVertical: Spacing.sm },
  totalBlock: { alignItems: 'flex-end' },
  totalValue: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
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
  addDetailBtn: { minHeight: 34, paddingVertical: Spacing.xs },
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
  detailRow: { flexDirection: 'row', gap: Spacing.md },
  detailRowItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  detailRowText: { flex: 1 },
  detailName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: FontWeight.medium },
  detailMeta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  detailError: { fontSize: FontSize.xs, color: Colors.error, marginTop: 4 },
  submit: { marginTop: Spacing.sm },
});