export const FontSize = { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30 } as const;
export const FontWeight = { regular: '400' as const, medium: '500' as const, semibold: '600' as const, bold: '700' as const, extrabold: '800' as const };
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 40 } as const;
export const BorderRadius = { sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, full: 9999 } as const;
export const Shadow = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3, elevation: 2 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
} as const;
