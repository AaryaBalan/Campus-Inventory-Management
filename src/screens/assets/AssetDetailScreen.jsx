import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assetsApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const conditionVariant = (c) => ({ good: 'success', fair: 'warning', poor: 'danger', under_maintenance: 'info' }[c] || 'muted');

export default function AssetDetailScreen({ route, navigation }) {
    const { assetId } = route.params || {};
    const [asset, setAsset] = useState(null);
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const [a, m] = await Promise.all([assetsApi.get(assetId), assetsApi.movements(assetId).catch(() => [])]);
                setAsset(a); setMovements(Array.isArray(m) ? m.slice(0, 5) : []);
            } catch (_) { } finally { setLoading(false); }
        })();
    }, [assetId]);

    if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
    if (!asset) return <View style={styles.center}><Text style={styles.err}>Asset not found</Text></View>;

    const fields = [
        { label: 'Asset ID', value: asset.assetId || asset.id },
        { label: 'Category', value: asset.category },
        { label: 'Location', value: asset.location },
        { label: 'Department', value: asset.department },
        { label: 'Purchase Value', value: asset.purchaseValue ? `₹${asset.purchaseValue}` : '—' },
        { label: 'Acquired', value: asset.purchaseDate ? new Date(asset.purchaseDate._seconds * 1000).toLocaleDateString() : '—' },
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
                <Text style={styles.backTxt}>Assets</Text>
            </TouchableOpacity>

            <View style={styles.titleRow}>
                <View style={styles.assetIcon}><Ionicons name="cube" size={28} color={colors.primary} /></View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.assetName}>{asset.name}</Text>
                    <Badge label={(asset.condition || 'good').replace('_', ' ')} variant={conditionVariant(asset.condition)} />
                </View>
            </View>

            <Text style={styles.section}>Details</Text>
            <Card>
                {fields.map((f, i) => (
                    <View key={f.label} style={[styles.fieldRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 10, paddingTop: 10 }]}>
                        <Text style={styles.fieldLabel}>{f.label}</Text>
                        <Text style={styles.fieldValue}>{f.value || '—'}</Text>
                    </View>
                ))}
            </Card>

            {movements.length > 0 && (
                <>
                    <Text style={styles.section}>Movement History</Text>
                    <Card style={{ gap: 10 }}>
                        {movements.map((m, i) => (
                            <View key={i} style={styles.movRow}>
                                <View style={styles.movDot} />
                                <Text style={styles.movText}>{m.type || 'Transfer'} · {m.fromLocation || '?'} → {m.toLocation || '?'}</Text>
                            </View>
                        ))}
                    </Card>
                </>
            )}
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
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: spacing.lg },
    assetIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center', ...shadows.primary },
    assetName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: 6 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    fieldValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
    movRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    movDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
    movText: { fontSize: fontSize.sm, color: colors.textSecondary },
});
