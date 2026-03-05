import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { inventoryApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Badge from '../../components/ui/Badge';

const stockVariant = (cur, min) => cur === 0 ? 'danger' : cur <= min ? 'warning' : 'success';
const stockLabel = (cur, min) => cur === 0 ? 'OUT' : cur <= min ? 'LOW' : 'OK';

export default function StockLevelsScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setItems(await inventoryApi.list().catch(() => [])); }
        catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const pct = (item) => Math.min(100, Math.round((item.currentStock / (item.maxStockLevel || item.currentStock || 1)) * 100));

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Inventory</Text>
            </View>
            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={items} keyExtractor={(_, i) => String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 8 }}
                    ListEmptyComponent={<Text style={styles.empty}>No inventory items found</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('InventoryDetail', { itemId: item.id })} activeOpacity={0.75}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.topRow}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Badge label={stockLabel(item.currentStock, item.minStockLevel)} variant={stockVariant(item.currentStock, item.minStockLevel)} />
                                </View>
                                <Text style={styles.itemSub}>{item.category} · {item.unit || 'units'}</Text>
                                <View style={styles.barTrack}>
                                    <View style={[styles.barFill, { width: `${pct(item)}%`, backgroundColor: item.currentStock <= item.minStockLevel ? colors.warning : colors.success }]} />
                                </View>
                                <Text style={styles.itemQty}>{item.currentStock} / {item.maxStockLevel || '—'} {item.unit || 'units'}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.sm },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    item: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.sm },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    itemName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, flex: 1 },
    itemSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: 8 },
    barTrack: { height: 4, backgroundColor: colors.surfaceBorder, borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
    barFill: { height: '100%', borderRadius: 2 },
    itemQty: { fontSize: fontSize.xs, color: colors.textMuted },
});
