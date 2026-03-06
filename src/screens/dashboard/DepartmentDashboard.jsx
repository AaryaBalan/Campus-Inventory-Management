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

const meta = roleColors.department;

export default function DepartmentDashboard() {
    const { userEmail, profile, isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentRequests, setRecentRequests] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            let myRequests = [];
            let deptAssetsCount = profile?.assetsCount || 0;

            if (isDemoMode) {
                // Mock requests for department
                myRequests = [
                    { id: '1', title: 'Monitors for Faculty', status: 'approved', date: '2 days ago' },
                    { id: '2', title: 'Whiteboard markers', status: 'pending', date: '5h ago' },
                ];
                const assets = await localDatabase.getAssets();
                deptAssetsCount = assets.filter(a => a.department === profile?.department).length || 42;
            } else {
                const requests = await procurementAPI.getRequests().catch(() => []);
                myRequests = Array.isArray(requests) ? requests.filter(r => r.createdBy === userEmail || r.department === profile?.department) : [];
            }

            setStats({
                totalRequests: myRequests.length,
                approvedCount: myRequests.filter(r => r.status === 'approved').length,
                pendingCount: myRequests.filter(r => r.status === 'pending' || r.status === 'submitted' || r.status === 'PENDING').length,
                deptAssets: deptAssetsCount
            });
            setRecentRequests(myRequests.slice(0, 5));
        } catch (_) { }
    }, [userEmail, profile, isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const name = profile?.name || userEmail?.split('@')[0] || 'Member';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(name || 'D')[0].toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Hello,</Text>
                    <Text style={styles.name}>{name}</Text>
                </View>
            </View>

            <View style={[styles.roleTag, { backgroundColor: meta.glow }]}>
                <Ionicons name={meta.icon} size={14} color={meta.color} />
                <Text style={[styles.roleTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard label="My Requests" value={stats?.totalRequests ?? '—'} icon="document-text-outline" color={colors.primary} />
                <StatCard label="Pending" value={stats?.pendingCount ?? '—'} icon="time-outline" color={colors.warning} />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
                <StatCard label="Approved" value={stats?.approvedCount ?? '—'} icon="checkmark-circle-outline" color={colors.success} />
                <StatCard label="Dept Assets" value={stats?.deptAssets ?? '—'} icon="cube-outline" color={colors.info} />
            </View>

            <Text style={styles.sectionTitle}>Recent Requests</Text>
            {recentRequests.length > 0 ? (
                <View style={styles.list}>
                    {recentRequests.map((item, i) => (
                        <Card key={item.id || i} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Purchase Request'}</Text>
                                <Badge
                                    label={(item.status || 'pending').toUpperCase()}
                                    variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
                                />
                            </View>
                            <Text style={styles.cardDate}>{item.date || 'Today'}</Text>
                        </Card>
                    ))}
                </View>
            ) : (
                <Card style={styles.emptyCard}>
                    <Text style={styles.emptyTxt}>No requests yet</Text>
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
    list: { gap: spacing.sm },
    card: { padding: 12 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardTitle: { fontSize: fontSize.base, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
    cardDate: { fontSize: fontSize.xs, color: colors.textSecondary },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyTxt: { color: colors.textMuted, fontSize: fontSize.sm },
});
