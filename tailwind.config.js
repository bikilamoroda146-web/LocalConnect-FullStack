/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#2563EB', 50: '#EFF6FF', 100: '#DBEAFE', 600: '#2563EB', 700: '#1D4ED8', 800: '#1E40AF', 900: '#1E3A8A' },
        secondary: { DEFAULT: '#4F46E5', 50: '#EEF2FF', 100: '#E0E7FF', 600: '#4F46E5', 700: '#4338CA', 800: '#3730A3' },
        navy: { DEFAULT: '#0F172A', 700: '#1E293B' },
        canvas: '#F8FAFC',
        surface: '#FFFFFF',
        ink: { DEFAULT: '#0F172A', soft: '#475569', muted: '#64748B' },
        line: '#E2E8F0',
        success: { DEFAULT: '#16A34A', 50: '#F0FDF4', 100: '#DCFCE7', 700: '#15803D', 800: '#166534' },
        error: { DEFAULT: '#DC2626', 50: '#FEF2F2', 100: '#FEE2E2', 700: '#B91C1C', 800: '#991B1B' },
        warning: { 50: '#FFFBEB', 100: '#FEF3C7', 800: '#92400E', 900: '#78350F' },
        info: { 50: '#EFF6FF', 100: '#DBEAFE', 800: '#1E40AF', 900: '#1E3A8A' },
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'] },
      fontSize: {
        display: ['clamp(2.25rem, 5vw, 3.5rem)', { lineHeight: '1.08', letterSpacing: '-0.04em', fontWeight: '700' }],
        'page-title': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em', fontWeight: '600' }],
        'section-title': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      borderRadius: { control: '0.625rem', card: '0.875rem', panel: '1rem', pill: '9999px' },
      boxShadow: {
        card: '0 1px 2px rgba(15,23,42,.05), 0 1px 3px rgba(15,23,42,.04)',
        lift: '0 10px 28px rgba(15,23,42,.10)',
      },
      maxWidth: { page: '80rem' },
    },
  },
  plugins: [],
}
