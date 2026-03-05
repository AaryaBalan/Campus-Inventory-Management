import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, fontSize, shadows, spacing } from '../../theme';

const StatCard = ({ label, value, icon, color = colors.primary, trend, subtitle, style }) => (
    <View style={[styles.card, style]}>
        <View style={[styles.iconWrap, { backgroundColor: `${color}18` }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.value, { color }]}>{value ?? '—'}</Text>
        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {trend !== undefined && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Ionicons
                    name={trend >= 0 ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={trend >= 0 ? colors.success : colors.danger}
                />
                <Text style={{ fontSize: fontSize.xs, color: trend >= 0 ? colors.success : colors.danger, marginLeft: 3 }}>
                    {Math.abs(trend)}%
                </Text>
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder,
        ...shadows.sm,
        gap: 4,
    },
    iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
    value: { fontSize: fontSize.xl, fontWeight: '800', },
    label: { fontSize: 10, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, textAlign: 'center' },
    subtitle: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'center' },
});

export default StatCard;
