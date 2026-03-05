import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadows, fontSize, spacing } from '../../theme';

const V = {
    primary: { bg: colors.primary, text: colors.textInverse, border: 'transparent', shadow: shadows.primary },
    secondary: { bg: colors.secondaryGlow, text: colors.secondary, border: `${colors.secondary}40`, shadow: {} },
    outline: { bg: 'transparent', text: colors.primary, border: colors.primary, shadow: {} },
    ghost: { bg: 'transparent', text: colors.textSecondary, border: 'transparent', shadow: {} },
    danger: { bg: colors.dangerGlow, text: colors.danger, border: `${colors.danger}40`, shadow: {} },
    success: { bg: colors.successGlow, text: colors.success, border: `${colors.success}40`, shadow: {} },
};
const S = {
    sm: { h: 36, px: 12, fs: fontSize.sm, is: 14 },
    md: { h: 48, px: 16, fs: fontSize.base, is: 18 },
    lg: { h: 56, px: 24, fs: fontSize.md, is: 20 },
};

const Button = ({ title, onPress, variant = 'primary', size = 'md', disabled, loading, leftIcon, rightIcon, style, fullWidth = true }) => {
    const v = V[variant] || V.primary;
    const s = S[size] || S.md;
    const off = disabled || loading;
    return (
        <TouchableOpacity activeOpacity={0.75} disabled={off} onPress={onPress}
            style={[styles.base, { backgroundColor: v.bg, borderColor: v.border, height: s.h, paddingHorizontal: s.px, ...v.shadow }, fullWidth && { width: '100%' }, off && { opacity: 0.5 }, style]}>
            {loading
                ? <ActivityIndicator size="small" color={v.text} />
                : <View style={styles.inner}>
                    {leftIcon && <Ionicons name={leftIcon} size={s.is} color={v.text} style={{ marginRight: 6 }} />}
                    <Text style={[styles.label, { fontSize: s.fs, color: v.text }]}>{title}</Text>
                    {rightIcon && <Ionicons name={rightIcon} size={s.is} color={v.text} style={{ marginLeft: 6 }} />}
                </View>
            }
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: { borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    inner: { flexDirection: 'row', alignItems: 'center' },
    label: { fontWeight: '600', letterSpacing: 0.2 },
});

export default Button;
