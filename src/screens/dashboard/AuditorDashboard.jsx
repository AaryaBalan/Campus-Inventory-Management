import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { analyticsAPI, assetsAPI } from '../../utils/api';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';

const meta = roleColors.auditor;

export default function AuditorDashboard() {
    const { userEmail, profile, isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [auditLog, setAuditLog] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            if (isDemoMode) {
                const [s, assets] = await Promise.all([
                    localDatabase.getDashboardStats(),
                    localDatabase.getAssets(),
                ]);
                setStats({
                    totalAssets: assets.length,
                    complianceScore: s.complianceScore,
                    auditCount: s.auditScore * 2,
                    pendingVerification: assets.filter(a => a.status === 'Pending Verification').length,
                });
                setAuditLog([
                    { id: 1, type: 'Movement', desc: 'Asset #4521 moved to Block C', user: 'admin@citil.com' },
                    { id: 2, type: 'Creation', desc: 'New asset #8821 registered', user: 'inventory@citil.com' },
                    { id: 3, type: 'Approval', desc: 'PR #2210 approved by Finance', user: 'finance@citil.com' },
                ]);
            } else {
                const [dash, assets] = await Promise.all([
                    analyticsAPI.getDashboard().catch(() => null),
                    assetsAPI.getAssets().catch(() => []),
                ]);

                setStats({
                    totalAssets: assets.length,
                    complianceScore: 94, // Mock score for auditor
                    auditCount: dash?.totalAuditLogs || 154,
                    pendingVerification: assets.filter(a => a.status === 'pending_verification').length,
                });
                // Mock log data for auditor
                setAuditLog([
                    { id: 1, type: 'Movement', desc: 'Asset #4521 moved to Block C', user: 'admin@citil.com' },
                    { id: 2, type: 'Creation', desc: 'New asset #8821 registered', user: 'inventory@citil.com' },
                    { id: 3, type: 'Approval', desc: 'PR #2210 approved by Finance', user: 'finance@citil.com' },
                ]);
            }
        } catch (_) { }
    }, [isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const name = profile?.name || userEmail?.split('@')[0] || 'Auditor';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarTxt}>{(name || 'A')[0].toUpperCase()}</Text>
                </View>
                <View>
                    <Text style={styles.welcome}>Ready to Audit,</Text>
                    <Text style={styles.name}>{name}</Text>
                </View>
            </View>

            <View style={[styles.roleTag, { backgroundColor: meta.glow }]}>
                <Ionicons name={meta.icon} size={14} color={meta.color} />
                <Text style={[styles.roleTxt, { color: meta.color }]}>{meta.label}</Text>
            </View>

            <View style={styles.statsGrid}>
                <StatCard label="Audit Checks" value={stats?.auditCount ?? '—'} icon="shield-checkmark-outline" color={colors.primary} />
                <StatCard label="Compliance" value={stats?.complianceScore ? `${stats.complianceScore}%` : '—'} icon="ribbon-outline" color={colors.success} />
            </View>
            <View style={[styles.statsGrid, { marginTop: spacing.sm }]}>
                <StatCard label="Total Assets" value={stats?.totalAssets ?? '—'} icon="cube-outline" color={colors.info} />
                <StatCard label="Pending Verify" value={stats?.pendingVerification ?? '—'} icon="help-circle-outline" color={colors.warning} />
            </View>

            <Text style={styles.sectionTitle}>Recent Activity Log</Text>
            {auditLog.length > 0 ? (
                <View style={styles.list}>
                    {auditLog.map((log, i) => (
                        <Card key={log.id || i} style={styles.logCard}>
                            <View style={styles.logHeader}>
                                <Badge label={log.type.toUpperCase()} variant="info" />
                                <Text style={styles.logTime}>2h ago</Text>
                            </View>
                            <Text style={styles.logDesc}>{log.desc}</Text>
                            <Text style={styles.logUser}>Performer: {log.user}</Text>
                        </Card>
                    ))}
                </View>
            ) : (
                <Card style={styles.emptyCard}>
                    <Text style={styles.emptyTxt}>No recent activity</Text>
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
    logCard: { padding: 12 },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
    logTime: { fontSize: 10, color: colors.textMuted },
    logDesc: { fontSize: fontSize.sm, color: colors.text, fontWeight: '500', marginBottom: 4 },
    logUser: { fontSize: 10, color: colors.textSecondary },
    emptyCard: { padding: 20, alignItems: 'center' },
    emptyTxt: { color: colors.textMuted, fontSize: fontSize.sm },
});
