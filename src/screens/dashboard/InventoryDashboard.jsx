import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { inventoryApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const meta = roleColors.inventory;

export default function InventoryDashboard() {
    const { logout, userEmail, profile } = useAuth();
    const [lowStock, setLowStock] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setLowStock((await inventoryApi.lowStock().catch(() => [])).slice(0, 5)); } catch (_) { }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <Text style={styles.name}>{profile?.name || userEmail?.split('@')[0]}</Text>
                <View style={[styles.rolePill, { backgroundColor: `${meta.color}18` }]}>
                    <Text style={[styles.rolePillText, { color: meta.color }]}>INVENTORY</Text>
                </View>
            </View>

            <Text style={styles.section}>Stock Health</Text>
            <View style={styles.statsRow}>
                <StatCard label="Low Stock" value={lowStock.length} icon="alert-outline" color={colors.warning} />
                <StatCard label="Out of Stock" value="—" icon="close-circle-outline" color={colors.danger} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Total Items" value="—" icon="layers-outline" color={meta.color} />
                <StatCard label="Reorders" value="—" icon="refresh-outline" color={colors.info} />
            </View>

            <Text style={styles.section}>Low Stock Items</Text>
            <Card style={{ gap: 8 }}>
                {lowStock.length === 0
                    ? <Text style={styles.empty}>All items are sufficiently stocked</Text>
                    : lowStock.map((item, i) => (
                        <View key={item.id || i} style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rowTitle}>{item.name}</Text>
                                <Text style={styles.rowSub}>Qty: {item.currentStock} / Min: {item.minStockLevel}</Text>
                            </View>
                            <Badge label="LOW" variant="warning" />
                        </View>
                    ))
                }
            </Card>

            <Button title="Sign Out" variant="danger" onPress={handleLogout} leftIcon="log-out-outline" style={{ marginTop: spacing.lg }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    rolePill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
    rolePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    rowSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
