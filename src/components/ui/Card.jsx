import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../../theme';

const BORDER = {
    default: colors.cardBorder,
    primary: 'rgba(6,229,255,0.2)',
    secondary: 'rgba(99,102,241,0.2)',
    success: 'rgba(34,197,94,0.2)',
    warning: 'rgba(245,158,11,0.2)',
    danger: 'rgba(239,68,68,0.2)',
};

const Card = ({ children, style, variant = 'default', padding = 16, noBorder = false }) => (
    <View style={[styles.card, { padding, borderColor: noBorder ? 'transparent' : (BORDER[variant] || BORDER.default) }, style]}>
        {children}
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        borderWidth: 1,
        ...shadows.md,
    },
});

export default Card;
