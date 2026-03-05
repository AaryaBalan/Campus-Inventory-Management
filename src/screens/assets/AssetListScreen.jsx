import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assetsApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Badge from '../../components/ui/Badge';

const conditionVariant = (c) => ({ 'good': 'success', 'fair': 'warning', 'poor': 'danger', 'under_maintenance': 'info' }[c] || 'muted');

export default function AssetListScreen({ navigation }) {
    const [assets, setAssets] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setAssets(await assetsApi.list().catch(() => [])); }
        catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const filtered = assets.filter(a =>
        `${a.name} ${a.assetId} ${a.category}`.toLowerCase().includes(query.toLowerCase())
    );

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })} activeOpacity={0.75}>
            <View style={styles.itemIcon}>
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.assetId || item.id?.slice(0, 8)} · {item.location || 'No location'}</Text>
            </View>
            <Badge label={(item.condition || 'good').replace('_', ' ')} variant={conditionVariant(item.condition)} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Assets</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AssetRegister')}>
                    <Ionicons name="add" size={22} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginLeft: 12 }} />
                <TextInput value={query} onChangeText={setQuery} placeholder="Search assets…"
                    placeholderTextColor={colors.textMuted} style={styles.searchInput} />
            </View>

            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={filtered} keyExtractor={(_, i) => String(i)} renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 8 }}
                    ListEmptyComponent={<Text style={styles.empty}>No assets found</Text>}
                />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.sm },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryGlow, borderWidth: 1, borderColor: 'rgba(6,229,255,0.3)', alignItems: 'center', justifyContent: 'center' },
    searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.cardBorder, margin: spacing.lg, marginTop: spacing.xs },
    searchInput: { flex: 1, padding: 12, fontSize: fontSize.base, color: colors.text },
    item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, gap: 12, ...shadows.sm },
    itemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
    itemName: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    itemSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
