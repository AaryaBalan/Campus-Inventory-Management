import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { assetsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Badge from '../../components/ui/Badge';

const conditionVariant = (c) => ({ 'good': 'success', 'fair': 'warning', 'poor': 'danger', 'under_maintenance': 'info' }[c] || 'muted');

export default function AssetListScreen({ navigation }) {
    const { isDemoMode } = useAuth();
    const [assets, setAssets] = useState([]);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const data = isDemoMode
                ? await localDatabase.getAssets(query)
                : await assetsAPI.getAssets().catch(() => []);
            setAssets(data || []);
        }
        catch (_) { } finally { setLoading(false); }
    }, [isDemoMode, query]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    // Search is handled in localDatabase for demo mode, or locally for API mode
    const filtered = isDemoMode ? assets : assets.filter(a =>
        `${a.name} ${a.assetId || a.id} ${a.category} ${a.building} ${a.assetTag || ''}`.toLowerCase().includes(query.toLowerCase())
    );

    const renderItem = useCallback(({ item }) => (
        <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('AssetDetail', { assetId: item.id })} activeOpacity={0.75}>
            <View style={styles.itemIcon}>
                <Ionicons name="cube-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.assetId || item.id?.slice(0, 8)} · {item.building || item.location || 'N/A'}</Text>
            </View>
            <Badge label={(item.condition || 'good').replace('_', ' ')} variant={conditionVariant(item.condition)} />
        </TouchableOpacity>
    ), [navigation]);

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
                : <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 8 }}
                    ListEmptyComponent={<Text style={styles.empty}>No assets found</Text>}
                    initialNumToRender={10}
                    windowSize={5}
                    maxToRenderPerBatch={5}
                    removeClippedSubviews={true}
                    getItemLayout={(data, index) => (
                        { length: 76, offset: 76 * index, index }
                    )}
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
