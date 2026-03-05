import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi, procurementApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const meta = roleColors.finance;

export default function FinanceDashboard() {
    const { logout, userEmail, profile } = useAuth();
    const [stats, setStats] = useState(null);
    const [queue, setQueue] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const [dash, q] = await Promise.all([
                analyticsApi.procurement().catch(() => null),
                procurementApi.queue().catch(() => []),
            ]);
            setStats(dash); setQueue(Array.isArray(q) ? q.slice(0, 4) : []);
        } catch (_) { }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={[styles.bgGlow, { backgroundColor: meta.glow }]} />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Finance Dashboard</Text>
                    <Text style={styles.name}>{profile?.name || userEmail?.split('@')[0]}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: `${meta.color}18` }]}>
                    <Text style={[styles.rolePillText, { color: meta.color }]}>FINANCE</Text>
                </View>
            </View>

            <Text style={styles.section}>Procurement Overview</Text>
            <View style={styles.statsRow}>
                <StatCard label="Total PRs" value={stats?.totalPRs ?? '—'} icon="document-text-outline" color={meta.color} />
                <StatCard label="Pending" value={queue.length} icon="time-outline" color={colors.warning} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Approved" value={stats?.approved ?? '—'} icon="checkmark-circle-outline" color={colors.success} />
                <StatCard label="Rejected" value={stats?.rejected ?? '—'} icon="close-circle-outline" color={colors.danger} />
            </View>

            <Text style={styles.section}>Pending Approval Queue</Text>
            <Card style={{ gap: 10 }}>
                {queue.length === 0
                    ? <Text style={styles.emptyText}>No PRs awaiting your approval</Text>
                    : queue.map((pr, i) => (
                        <View key={pr.id || i} style={styles.prRow}>
                            <View style={[styles.prDot, { backgroundColor: meta.color }]} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.prTitle}>{pr.title || `PR #${pr.id?.slice(-6)}`}</Text>
                                <Text style={styles.prSub}>{pr.department || 'Department'} · ₹{pr.totalAmount || '—'}</Text>
                            </View>
                            <View style={[styles.statusBadge, { backgroundColor: 'rgba(245,158,11,0.15)' }]}>
                                <Text style={[styles.statusText, { color: colors.warning }]}>PENDING</Text>
                            </View>
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
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.xxxl },
    bgGlow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, opacity: 0.5 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    greeting: { fontSize: fontSize.sm, color: colors.textSecondary },
    name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: 2 },
    rolePill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start' },
    rolePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    emptyText: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
    prRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    prDot: { width: 8, height: 8, borderRadius: 4 },
    prTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    prSub: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
    statusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
});
