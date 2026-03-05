import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, fontSize } from '../../theme';

const VARIANTS = {
    primary: { bg: colors.primaryGlow, text: colors.primary },
    secondary: { bg: colors.secondaryGlow, text: colors.secondary },
    success: { bg: colors.successGlow, text: colors.success },
    warning: { bg: colors.warningGlow, text: colors.warning },
    danger: { bg: colors.dangerGlow, text: colors.danger },
    info: { bg: colors.infoGlow, text: colors.info },
    muted: { bg: 'rgba(255,255,255,0.07)', text: colors.textMuted },
};

const Badge = ({ label, variant = 'primary', style }) => {
    const v = VARIANTS[variant] || VARIANTS.primary;
    return (
        <View style={[styles.badge, { backgroundColor: v.bg }, style]}>
            <Text style={[styles.text, { color: v.text }]}>{label}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
    text: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
});

export default Badge;
