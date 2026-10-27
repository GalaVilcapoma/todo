import React, { useMemo, useState } from 'react';
import { Pressable, Text, View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '../ui/bottom-sheet-modal';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

export interface SelectOption {
  value: string;
  label: string;
  /** Texto secundario bajo la etiqueta. */
  hint?: string;
  disabled?: boolean;
}

interface Props {
  label?: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  /** Impide abrir la lista (por ejemplo, pedidos ya entregados). */
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Select sin dependencias externas.
 *
 * React Native no trae un picker entre plataformas, y las librerías de terceros
 * (`@react-native-picker/picker`)ímponen un look nativo distinto en iOS y
 * Android. Este selector reutiliza `BottomSheetModal` para que el formulario
 * tenga la misma interacción en toda la app.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  error,
  hint,
  required = false,
  disabled = false,
  containerStyle,
}: Props) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const labelStyle = [
    styles.label,
    selected ? styles.valueSelected : styles.valuePlaceholder,
    disabled && styles.valueDisabled,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: open }}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          error && styles.triggerError,
          pressed && !disabled && styles.triggerPressed,
        ]}
      >
        <View style={styles.triggerRow}>
          <View style={styles.triggerText}>
            <Text style={labelStyle} numberOfLines={1}>
              {selected ? selected.label : placeholder}
            </Text>
            {selected?.hint ? (
              <Text style={styles.selectedHint} numberOfLines={1}>
                {selected.hint}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-down" size={18} color={Colors.textMuted} />
        </View>
      </Pressable>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}

      <BottomSheetModal visible={open} title={label ?? placeholder} onClose={() => setOpen(false)}>
        <View style={styles.list}>
          {options.length === 0 ? (
            <Text style={styles.emptyText}>No hay opciones disponibles.</Text>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled: option.disabled }}
                  disabled={option.disabled}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && !option.disabled && styles.optionPressed,
                    option.disabled && styles.optionDisabled,
                  ]}
                >
                  <View style={styles.optionText}>
                    <Text
                      style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                      numberOfLines={1}
                    >
                      {option.label}
                    </Text>
                    {option.hint ? (
                      <Text style={styles.optionHint} numberOfLines={1}>
                        {option.hint}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? <Ionicons name="checkmark" size={18} color={Colors.primary} /> : null}
                </Pressable>
              );
            })
          )}
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 6, fontWeight: FontWeight.medium },
  required: { color: Colors.primary },
  trigger: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 46,
    justifyContent: 'center',
  },
  triggerError: { borderColor: Colors.error },
  triggerPressed: { opacity: 0.75 },
  triggerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  triggerText: { flex: 1 },
  valueSelected: { fontSize: FontSize.sm, color: Colors.textPrimary },
  valuePlaceholder: { fontSize: FontSize.sm, color: Colors.textMuted },
  valueDisabled: { color: Colors.textMuted },
  selectedHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 5 },
  hintText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 5 },
  list: { gap: Spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: Colors.surfaceRaised, borderColor: Colors.primaryDark },
  optionPressed: { opacity: 0.7 },
  optionDisabled: { opacity: 0.4 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: FontSize.sm, color: Colors.textPrimary },
  optionLabelSelected: { color: Colors.primary, fontWeight: FontWeight.semibold },
  optionHint: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'center', paddingVertical: Spacing.lg },
});

export default SelectField;