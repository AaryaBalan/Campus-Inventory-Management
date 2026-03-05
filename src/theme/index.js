export const colors = {
    background: '#0B1120',
    surface: '#111827',
    surfaceElevated: '#1A2540',
    surfaceBorder: '#1E2D45',
    cardBorder: 'rgba(255,255,255,0.07)',
    divider: 'rgba(255,255,255,0.08)',
    overlay: 'rgba(0,0,0,0.75)',

    primary: '#06E5FF',
    primaryDark: '#00B8CC',
    primaryGlow: 'rgba(6,229,255,0.15)',

    secondary: '#6366F1',
    secondaryGlow: 'rgba(99,102,241,0.15)',

    success: '#22C55E',
    successGlow: 'rgba(34,197,94,0.15)',
    warning: '#F59E0B',
    warningGlow: 'rgba(245,158,11,0.15)',
    danger: '#EF4444',
    dangerGlow: 'rgba(239,68,68,0.15)',
    info: '#3B82F6',
    infoGlow: 'rgba(59,130,246,0.15)',

    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    textInverse: '#0B1120',
    white: '#FFFFFF',
    black: '#000000',
};

export const spacing = {
    xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64,
};

export const radius = {
    sm: 6, md: 12, lg: 16, xl: 20, xxl: 28, full: 999,
};

export const fontSize = {
    xs: 11, sm: 13, base: 15, md: 16, lg: 18, xl: 22, xxl: 28, xxxl: 36,
};

export const shadows = {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
    primary: { shadowColor: '#06E5FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
    glow: (color) => ({ shadowColor: color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 }),
};

export const roleColors = {
    admin: { color: '#6366F1', glow: 'rgba(99,102,241,0.15)', icon: 'shield-checkmark', label: 'Administrator' },
    finance: { color: '#F59E0B', glow: 'rgba(245,158,11,0.15)', icon: 'cash', label: 'Finance' },
    inventory: { color: '#22C55E', glow: 'rgba(34,197,94,0.15)', icon: 'cube', label: 'Inventory' },
    department: { color: '#3B82F6', glow: 'rgba(59,130,246,0.15)', icon: 'business', label: 'Department' },
    auditor: { color: '#A78BFA', glow: 'rgba(167,139,250,0.15)', icon: 'search', label: 'Auditor' },
    executive: { color: '#06E5FF', glow: 'rgba(6,229,255,0.15)', icon: 'trending-up', label: 'Executive' },
};

const theme = { colors, spacing, radius, fontSize, shadows, roleColors };
export default theme;
