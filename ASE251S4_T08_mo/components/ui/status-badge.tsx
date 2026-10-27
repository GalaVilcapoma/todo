import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, FontWeight } from '../../constants/theme';

export type BadgeTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'muted';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  /** Punto de color a la izquierda; útil para estados sin semántica de color fuerte. */
  dot?: boolean;
}

const TONES: Record<BadgeTone, { bg: string; border: string; fg: string; dot: string }> = {
  success: { bg: Colors.successBg, border: Colors.successBorder, fg: Colors.success, dot: Colors.success },
  danger: { bg: Colors.errorBg, border: Colors.errorBorder, fg: Colors.error, dot: Colors.error },
  warning: { bg: Colors.warningBg, border: Colors.warningBorder, fg: Colors.warning, dot: Colors.warning },
  info: { bg: Colors.infoBg, border: Colors.infoBorder, fg: Colors.info, dot: Colors.info },
  neutral: { bg: Colors.surfaceRaised, border: Colors.border, fg: Colors.textSecondary, dot: Colors.textSecondary },
  muted: { bg: Colors.surfaceAlt, border: Colors.borderLight, fg: Colors.textMuted, dot: Colors.textMuted },
};

/** Badge genérico por tono. */
export function Badge({ label, tone = 'neutral', dot = false }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg, borderColor: t.border }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text style={[styles.text, { color: t.fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Estado activo/inactivo de los maestros de MongoDB (agroquímicos y
 * productos). El backend nunca devuelve `active: null`, así que cualquier valor
 * distinto de `true` se muestra como inactivo.
 */
export function StatusBadge({
  active,
  activeLabel = 'Activo',
  inactiveLabel = 'Inactivo',
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <Badge label={active ? activeLabel : inactiveLabel} tone={active ? 'success' : 'muted'} dot />
  );
}

/**
 * Estado de un cliente. El campo real es `state` ('A' | 'I'); `active` llega
 * siempre `null` desde el backend y por eso no se usa como fuente de verdad.
 */
export function CustomerStateBadge({ state }: { state: string | null }) {
  return state === 'A' ? <Badge label="Activo" tone="success" dot /> : <Badge label="Inactivo" tone="muted" dot />;
}

const ORDER_TONES: Record<string, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  IN_PROCESS: 'info',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const APPLICATION_TONES: Record<string, BadgeTone> = {
  SCHEDULED: 'warning',
  IN_PROCESS: 'info',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export function OrderStatusBadge({ status, labels }: { status: string | null; labels: Record<string, string> }) {
  const key = status ?? '';
  return <Badge label={labels[key] ?? key ?? '—'} tone={ORDER_TONES[key] ?? 'neutral'} dot />;
}

export function ApplicationStatusBadge({
  status,
  labels,
}: {
  status: string | null;
  labels: Record<string, string>;
}) {
  const key = status ?? '';
  return <Badge label={labels[key] ?? key ?? '—'} tone={APPLICATION_TONES[key] ?? 'neutral'} dot />;
}

const CATEGORY_COLORS: Record<string, string> = {
  INSECTICIDE: Colors.categoryInsecticide,
  FUNGICIDE: Colors.categoryFungicide,
  HERBICIDE: Colors.categoryHerbicide,
  FERTILIZER: Colors.categoryFertilizer,
  BIOSTIMULANT: Colors.categoryBiostimulant,
  OTHER: Colors.categoryOther,
};

/** Badge de categoría con el color de la paleta compartida con el frontend web. */
export function CategoryBadge({ category, labels }: { category: string; labels: readonly { value: string; label: string }[] }) {
  const color = CATEGORY_COLORS[category] ?? Colors.categoryOther;
  const label = labels.find((c) => c.value === category)?.label ?? category;
  return (
    <View style={[styles.badge, { backgroundColor: `${color}1a`, borderColor: `${color}55` }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.3 },
});

export default StatusBadge;