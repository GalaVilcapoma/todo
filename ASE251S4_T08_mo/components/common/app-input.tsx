import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

/**
 * Campo de texto con etiqueta, error y pista. Se apoya en `AppInput` el
 * `TextInput` de React Native: el alto mínimo de 44pt mantiene el área táctil
 * por encima del mínimo recomendado por las guías de Material.
 */
export function AppInput({
  label,
  error,
  hint,
  required = false,
  containerStyle,
  style,
  multiline,
  ...props
}: Props) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text style={styles.label}>
          {label}
          {required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          multiline && styles.inputMultiline,
          error ? styles.inputError : null,
          props.editable === false && styles.inputDisabled,
          style,
        ]}
        placeholderTextColor={Colors.textMuted}
        selectionColor={Colors.primary}
        multiline={multiline}
        // Evita que el cursor quede invisible si el placeholder está vacío.
        cursorColor={Colors.primary}
        {...props}
      />
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, marginBottom: 6, fontWeight: FontWeight.medium },
  required: { color: Colors.primary },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.textPrimary,
    minHeight: 46,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top', paddingTop: Spacing.md },
  inputError: { borderColor: Colors.error },
  inputDisabled: { opacity: 0.6 },
  errorText: { fontSize: FontSize.xs, color: Colors.error, marginTop: 5 },
  hintText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 5 },
});

export default AppInput;