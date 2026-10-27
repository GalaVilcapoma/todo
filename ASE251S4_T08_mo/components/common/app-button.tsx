import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { hapticLight } from '../../utils/haptics';

export type AppButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'warning';

interface Props {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

/**
 * Botón con pressed-state real. Se usa `Pressable` en lugar de `TouchableOpacity`
 * para poder differentiate el estado `pressed` y reducir la opacidad al tocar.
 */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'secondary' || variant === 'ghost' ? Colors.primary : Colors.white;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={() => {
        hapticLight();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 46,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  primary: { backgroundColor: Colors.primaryDark },
  secondary: { backgroundColor: Colors.surfaceRaised, borderWidth: 1, borderColor: Colors.border },
  danger: { backgroundColor: Colors.error },
  warning: { backgroundColor: Colors.warning, borderWidth: 1, borderColor: Colors.warningBorder },
  ghost: { backgroundColor: Colors.transparent },
  text: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  primaryText: { color: Colors.white },
  secondaryText: { color: Colors.textPrimary },
  dangerText: { color: Colors.white },
  warningText: { color: Colors.black },
  ghostText: { color: Colors.primary },
});

export default AppButton;