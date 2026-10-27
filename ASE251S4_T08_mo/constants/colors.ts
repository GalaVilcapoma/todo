export const Colors = {
  background:     '#0b1220',
  surface:        '#131c2e',
  surfaceAlt:     '#0f1725',
  surfaceRaised:  '#1a2438',
  border:         '#263449',
  borderLight:    '#1e293b',
  textPrimary:    '#f1f5f9',
  textSecondary:  '#94a3b8',
  textMuted:      '#64748b',
  primary:        '#10b981',
  primaryDark:    '#059669',
  primaryLight:   '#34d399',
  success:        '#10b981',
  warning:        '#f59e0b',
  error:          '#f43f5e',
  errorBg:        '#1c0a0e',
  errorBorder:    '#2b030eff',
  errorText:      '#fda4af',
  info:           '#3b82f6',
  warningBg:      '#1c1204',
  warningBorder:  '#78350f',
  infoBg:         '#0c1a2e',
  infoBorder:     '#1d4ed8',
  successBg:      '#052e16',
  successBorder:  '#166534',

  // Categorías de agroquímico (mismo mapeo que el frontend web).
  categoryInsecticide: '#f59e0b',
  categoryFungicide:   '#a855f7',
  categoryHerbicide:   '#f43f5e',
  categoryFertilizer:  '#10b981',
  categoryBiostimulant:'#22d3ee',
  categoryOther:       '#3b82f6',

  overlay:        'rgba(2, 6, 16, 0.72)',
  transparent:    'transparent',
  white:          '#ffffff',
  black:          '#000000',
} as const;

export type ColorName = keyof typeof Colors;

export default Colors;