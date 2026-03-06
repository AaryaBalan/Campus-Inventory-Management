import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { inventoryAPI, assetsAPI } from '../../utils/api';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const meta = roleColors.inventory;

export default function InventoryDashboard() {
    const { userEmail, profile, isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [lowStock, setLowStock] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            let items, low, assets;
            if (isDemoMode) {
                [items, low, assets] = await Promise.all([
                    localDatabase.getInventory(),
                    localDatabase.getLowStock(),
                    localDatabase.getAssets(),
                ]);
            } else {
                [items, low, assets] = await Promise.all([
                    inventoryAPI.getInventory().catch(() => []),
                    inventoryAPI.getLowStock().catch(() => []),
                    assetsAPI.getAssets().catch(() => []),
                ]);
            }

            setStats({
                totalItems: items.length,
                lowStockCount: low.length,
                totalAssets: assets.length,
                stockValue: items.reduce((sum, item) => sum + (item.currentStock * (item.unitPrice || item.price || 0)), 0)
            });
            setLowStock(Array.isArray(low) ? low.slice(0, 3) : []);
        } catch (_) { }
    }, [isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const name = profile?.name || userEmail?.split('@')[0] || 'Inventory Manager';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(name || 'I')[0].toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Good Session,</Text>
                    <Text style={styles.name}>{name}</Text>
                </View>
            </View>

            <View style={[styles.roleTag, { backgroundColor: meta.glow }]}>
                <Ionicons name={meta.icon} size={14} color={meta.color} />
                <Text style={[styles.roleTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard label="Low Stock" value={stats?.lowStockCount ?? '—'} icon="alert-circle-outline" color={colors.warning} />
                <StatCard label="Total Items" value={stats?.totalItems ?? '—'} icon="layers-outline" color={colors.primary} />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
                <StatCard label="Total Assets" value={stats?.totalAssets ?? '—'} icon="cube-outline" color={colors.success} />
                <StatCard label="Inventory Value" value={stats?.stockValue ? `₹${(stats.stockValue / 1000).toFixed(1)}k` : '—'} icon="wallet-outline" color={colors.info} />
            </View>

            <Text style={styles.sectionTitle}>Critical Low Stock</Text>
            {lowStock.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                    {lowStock.map((item, i) => (
                        <Card key={item.id || i} style={styles.itemCard}>
                            <View style={styles.itemTop}>
                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                <Badge label="REORDER" variant="danger" />
                            </View>
                            <View style={styles.stockInfo}>
                                <Text style={styles.stockLabel}>Current Stock: <Text style={styles.stockValue}>{item.currentStock} {item.unit}</Text></Text>
                                <View style={styles.progressBar}>
                                    <View style={[styles.progressFill, { width: `${Math.min(100, (item.currentStock / item.minStockLevel) * 100)}%`, backgroundColor: colors.danger }]} />
                                </View>
                            </View>
                        </Card>
                    ))}
                </View>
            ) : (
                <Card style={styles.emptyCard}>
                    <Text style={styles.emptyTxt}>All stock levels are healthy</Text>
                </Card>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing.md },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder },
    avatarTxt: { color: colors.primary, fontWeight: '800', fontSize: fontSize.lg },
    welcome: { fontSize: fontSize.sm, color: colors.textSecondary },
    name: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
    roleTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full, marginBottom: spacing.xl },
    roleTxt: { fontSize: fontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
    statsGrid: { flexDirection: 'row', gap: spacing.sm },
    sectionTitle: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md, marginTop: spacing.xl },
    itemCard: { padding: 12 },
    itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    itemName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    stockInfo: { gap: 4 },
    stockLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
    stockValue: { color: colors.text, fontWeight: '700' },
    progressBar: { height: 4, backgroundColor: colors.divider, borderRadius: 2, overflow: 'hidden', marginTop: 4 },
    progressFill: { height: '100%', borderRadius: 2 },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyTxt: { color: colors.textMuted, fontSize: fontSize.sm },
});
