import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { procurementApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Badge from '../../components/ui/Badge';

export default function ApprovalQueueScreen() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setQueue(await procurementApi.queue().catch(() => [])); }
        catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleApprove = async (pr) => {
        Alert.alert(`Approve "${pr.title}"?`, 'This action cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Approve', onPress: async () => {
                    try { await procurementApi.approve(pr.id, { comments: 'Approved via mobile' }); load(); }
                    catch (e) { Alert.alert('Error', e.message); }
                }
            },
        ]);
    };
    const handleReject = async (pr) => {
        Alert.prompt('Reject Reason', 'Enter rejection reason:', async (reason) => {
            if (!reason) return;
            try { await procurementApi.reject(pr.id, { reason }); load(); }
            catch (e) { Alert.alert('Error', e.message); }
        });
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}><Text style={styles.title}>Approval Queue</Text></View>
            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={queue} keyExtractor={(_, i) => String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 10 }}
                    ListEmptyComponent={<Text style={styles.empty}>No PRs awaiting approval</Text>}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.top}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.prTitle}>{item.title || 'Purchase Request'}</Text>
                                    <Text style={styles.prSub}>{item.department} · ₹{item.estimatedCost || item.totalAmount || '—'}</Text>
                                </View>
                                <Badge label="PENDING" variant="warning" />
                            </View>
                            {item.description ? <Text style={styles.prDesc} numberOfLines={2}>{item.description}</Text> : null}
                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                                    <Ionicons name="close" size={14} color={colors.danger} />
                                    <Text style={[styles.actionTxt, { color: colors.danger }]}>Reject</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                                    <Ionicons name="checkmark" size={14} color={colors.background} />
                                    <Text style={[styles.actionTxt, { color: colors.background, fontWeight: '700' }]}>Approve</Text>
                                </TouchableOpacity>
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
    header: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.sm },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, gap: 10, ...shadows.sm },
    top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    prTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    prSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
    prDesc: { fontSize: fontSize.sm, color: colors.textSecondary },
    actions: { flexDirection: 'row', gap: 10 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.dangerGlow, borderWidth: 1, borderColor: `${colors.danger}30` },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.success },
    actionTxt: { fontSize: fontSize.sm, fontWeight: '600' },
});
