import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { procurementApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Badge from '../../components/ui/Badge';

const statusVariant = { approved: 'success', rejected: 'danger', pending: 'warning', submitted: 'info', draft: 'muted' };

export default function PurchaseHistoryScreen({ navigation }) {
    const [prs, setPrs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setPrs(await procurementApi.list().catch(() => [])); }
        catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Purchase History</Text>
                <Text style={styles.newPR} onPress={() => navigation.navigate('PurchaseRequest')}>+ New PR</Text>
            </View>
            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={prs} keyExtractor={(_, i) => String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 8 }}
                    ListEmptyComponent={<Text style={styles.empty}>No purchase requests found</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.prTitle}>{item.title || `PR #${(item.id || '').slice(-6)}`}</Text>
                                    <Text style={styles.prSub}>{item.department} · ₹{item.estimatedCost || item.totalAmount || '—'}</Text>
                                </View>
                                <Badge label={(item.status || 'draft').toUpperCase()} variant={statusVariant[item.status] || 'muted'} />
                            </View>
                        </View>
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
    newPR: { fontSize: fontSize.base, color: colors.primary, fontWeight: '600' },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    prTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    prSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
