import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { procurementAPI } from '../../utils/api';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const meta = roleColors.finance;

export default function FinanceDashboard() {
    const { userEmail, profile, isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [queue, setQueue] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            if (isDemoMode) {
                const s = await localDatabase.getDashboardStats();
                setStats({
                    total: s.totalPRs,
                    approved: s.approvedPRs,
                    amount: s.totalSpend,
                    pending: s.pendingPRs
                });
                setQueue([
                    { id: '1', title: 'IT equipment for Research Lab', department: 'Computer Science', estimatedCost: 150000 },
                    { id: '2', title: 'New Reference Books', department: 'Central Library', estimatedCost: 45000 },
                    { id: '3', title: 'Office Supplies Q3', department: 'Administration', estimatedCost: 12000 }
                ]);
            } else {
                const [allPRs, pending] = await Promise.all([
                    procurementAPI.getRequests().catch(() => []),
                    procurementAPI.getQueue().catch(() => []),
                ]);

                const total = allPRs.length;
                const approved = allPRs.filter(p => p.status === 'approved').length;
                const amount = allPRs.reduce((sum, p) => sum + (parseFloat(p.estimatedCost || p.totalAmount) || 0), 0);

                setStats({ total, approved, amount, pending: pending.length });
                setQueue(Array.isArray(pending) ? pending.slice(0, 3) : []);
            }
        } catch (_) { }
    }, [isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const name = profile?.name || userEmail?.split('@')[0] || 'Finance User';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(name || 'F')[0].toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Welcome back,</Text>
                    <Text style={styles.name}>{name}</Text>
                </View>
            </View>

            <View style={[styles.roleTag, { backgroundColor: meta.glow }]}>
                <Ionicons name={meta.icon} size={14} color={meta.color} />
                <Text style={[styles.roleTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard label="Pending Approval" value={stats?.pending ?? '—'} icon="time-outline" color={colors.warning} />
                <StatCard label="Total PRs" value={stats?.total ?? '—'} icon="document-text-outline" color={colors.primary} />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
                <StatCard label="Total Spend" value={stats?.amount ? `₹${(stats.amount / 1000).toFixed(1)}k` : '—'} icon="cash-outline" color={colors.success} />
                <StatCard label="Approved" value={stats?.approved ?? '—'} icon="checkmark-circle-outline" color={colors.info} />
            </View>

            <Text style={styles.sectionTitle}>Awaiting Action</Text>
            {queue.length > 0 ? (
                <View style={{ gap: spacing.sm }}>
                    {queue.map((item, i) => (
                        <Card key={item.id || i} style={styles.queueCard}>
                            <View style={styles.queueTop}>
                                <Text style={styles.queueTitle} numberOfLines={1}>{item.title || 'Purchase Request'}</Text>
                                <Badge label="PENDING" variant="warning" />
                            </View>
                            <Text style={styles.queueMeta}>{item.department} · ₹{item.estimatedCost || item.totalAmount || '—'}</Text>
                        </Card>
                    ))}
                </View>
            ) : (
                <Card style={styles.emptyCard}>
                    <Text style={styles.emptyTxt}>No pending approvals</Text>
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
    queueCard: { padding: 12 },
    queueTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    queueTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    queueMeta: { fontSize: fontSize.xs, color: colors.textSecondary },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyTxt: { color: colors.textMuted, fontSize: fontSize.sm },
});
