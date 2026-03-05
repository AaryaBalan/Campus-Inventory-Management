import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryApi } from '../../utils/api';
import { colors, spacing, fontSize } from '../../theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function InventoryDetailScreen({ route, navigation }) {
    const { itemId } = route.params || {};
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try { setItem(await inventoryApi.get(itemId)); }
            catch (_) { } finally { setLoading(false); }
        })();
    }, [itemId]);

    if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
    if (!item) return <View style={styles.center}><Text style={styles.err}>Item not found</Text></View>;

    const pct = Math.min(100, Math.round((item.currentStock / (item.maxStockLevel || 100)) * 100));
    const isLow = item.currentStock <= item.minStockLevel;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={styles.backTxt}>Inventory</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{item.name}</Text>
            <Badge label={isLow ? 'LOW STOCK' : 'IN STOCK'} variant={isLow ? 'warning' : 'success'} style={{ marginBottom: spacing.lg }} />

            <Text style={styles.section}>Stock Level</Text>
            <Card>
                <View style={styles.stockRow}>
                    <Text style={styles.stockVal}>{item.currentStock}</Text>
                    <Text style={styles.stockUnit}>/ {item.maxStockLevel || '—'} {item.unit || 'units'}</Text>
                </View>
                <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: isLow ? colors.warning : colors.success }]} />
                </View>
                <Text style={styles.minLabel}>Minimum: {item.minStockLevel} {item.unit || 'units'}</Text>
            </Card>

            <Text style={styles.section}>Details</Text>
            <Card>
                {[['Category', item.category], ['Unit', item.unit], ['Location', item.location], ['Supplier', item.supplier]].map(([k, v], i) => (
                    <View key={k} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <Text style={styles.rowLabel}>{k}</Text>
                        <Text style={styles.rowValue}>{v || '—'}</Text>
                    </View>
                ))}
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
    err: { color: colors.textMuted, fontSize: fontSize.base },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.md },
    backTxt: { fontSize: fontSize.base, color: colors.primary, fontWeight: '500' },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: 10 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    stockRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 },
    stockVal: { fontSize: 40, fontWeight: '800', color: colors.text },
    stockUnit: { fontSize: fontSize.base, color: colors.textSecondary },
    barTrack: { height: 8, backgroundColor: colors.surfaceBorder, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    barFill: { height: '100%', borderRadius: 4 },
    minLabel: { fontSize: fontSize.xs, color: colors.textMuted },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 10, paddingTop: 10 },
    rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    rowValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
