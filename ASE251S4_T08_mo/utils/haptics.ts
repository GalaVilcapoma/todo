import * as Haptics from 'expo-haptics';

/**
 * Envoltura tolerante a fallos de la retroalimentación háptica.
 *
 * En web la API de vibración puede estar bloqueada y en iOS el Taptic Engine
 * queda deshabilitado en bajo consumo; ninguno de los dos casos debe romper la
 * interacción, así que los errores se silencian.
 */

const run = (task: () => Promise<void>): void => {
  task().catch(() => undefined);
};

/** Confirmación de una acción exitosa (guardar, eliminar, restaurar). */
export const hapticSuccess = (): void =>
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

/** Error o rechazo de una acción. */
export const hapticError = (): void =>
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));

/** Aviso no bloqueante, por ejemplo al surpassar un límite. */
export const hapticWarning = (): void =>
  run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));

/** Cambio de selección: filtros, tabs, campos segmentados. */
export const hapticSelection = (): void => run(() => Haptics.selectionAsync());

/** Impacto ligero al tocar un control. */
export const hapticLight = (): void =>
  run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));