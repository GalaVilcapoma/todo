import React from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight, Spacing } from '../../constants/theme';
import { AppButton } from './app-button';
import { hapticError, hapticLight } from '../../utils/haptics';

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para borrados y cancelaciones irreversibles. */
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Confirmación para acciones destructivas o irreversibles (desactivar un
 * maestro, cancelar un pedido, cerrar sesión).
 *
 * Es un modal propio en lugar de `Alert.alert` porque los alerts nativos no
 * permiten estilizar el mensaje ni bloquear la acción mientras corre la
 * petición, y este diálogo sí expone estado `loading`.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  const handleConfirm = async () => {
    if (tone === 'danger') hapticError();
    else hapticLight();
    await onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={[styles.iconWrap, tone === 'danger' ? styles.iconDanger : styles.iconDefault]}>
            <Ionicons
              name={tone === 'danger' ? 'alert' : 'help-circle'}
              size={26}
              color={tone === 'danger' ? Colors.error : Colors.info}
            />
          </View>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <View style={styles.actions}>
            <AppButton
              label={cancelLabel}
              onPress={onCancel}
              variant="secondary"
              disabled={loading}
              style={styles.action}
            />
            <AppButton
              label={confirmLabel}
              onPress={handleConfirm}
              variant={tone === 'danger' ? 'danger' : 'primary'}
              loading={loading}
              style={styles.action}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default ConfirmDialog;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  iconDefault: { backgroundColor: Colors.infoBg, borderWidth: 1, borderColor: Colors.infoBorder },
  iconDanger: { backgroundColor: Colors.errorBg, borderWidth: 1, borderColor: Colors.errorBorder },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  actions: { flexDirection: 'row', gap: Spacing.sm, width: '100%' },
  action: { flex: 1 },
});
