import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { analyticsApi } from '../../utils/api';
import { colors, spacing, fontSize, radius } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Loading from '../../components/ui/Loading';

const { width } = Dimensions.get('window');
const BAR_MAX_H = 100;

function SimpleBar({ label, value, maxValue, color }) {
    const h = maxValue > 0 ? Math.round((value / maxValue) * BAR_MAX_H) : 0;
    return (
        <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4 }}>{value}</Text>
            <View style={{ width: 24, height: BAR_MAX_H, justifyContent: 'flex-end', backgroundColor: `${color}18`, borderRadius: 4 }}>
                <View style={{ height: h, backgroundColor: color, borderRadius: 4 }} />
            </View>
            <Text style={{ fontSize: 9, color: colors.textMuted, marginTop: 4, textAlign: 'center' }} numberOfLines={1}>{label}</Text>
        </View>
    );
}

export default function AnalyticsDashboardScreen() {
    const [data, setData] = useState(null);
    const [procurement, setProcurement] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [d, p] = await Promise.all([
                analyticsApi.dashboard().catch(() => null),
                analyticsApi.procurement().catch(() => null),
            ]);
            setData(d); setProcurement(p);
        } catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    if (loading) return <Loading fullScreen message="Loading analytics…" />;

    const prData = procurement?.monthlyBreakdown || [];
    const maxPR = prData.reduce((m, d) => Math.max(m, d.count || 0), 1);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <Text style={styles.title}>Analytics</Text>

            <Text style={styles.section}>Platform Overview</Text>
            <View style={styles.statsRow}>
                <StatCard label="Total Assets" value={data?.totalAssets ?? '—'} icon="cube-outline" color={colors.primary} />
                <StatCard label="Inventory Items" value={data?.totalInventory ?? '—'} icon="layers-outline" color={colors.success} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Active Alerts" value={data?.activeAlerts ?? '—'} icon="alert-circle-outline" color={colors.warning} />
                <StatCard label="Pending PRs" value={data?.pendingPRs ?? '—'} icon="document-text-outline" color={colors.secondary} />
            </View>

            {prData.length > 0 && (
                <>
                    <Text style={styles.section}>Monthly PR Volume</Text>
                    <View style={styles.chartCard}>
                        <View style={styles.barChart}>
                            {prData.slice(-6).map((d, i) => (
                                <SimpleBar key={i} label={d.month || `M${i + 1}`} value={d.count || 0} maxValue={maxPR} color={colors.primary} />
                            ))}
                        </View>
                    </View>
                </>
            )}

            <Text style={styles.section}>Procurement Summary</Text>
            <View style={styles.summaryCard}>
                {[
                    { label: 'Total PRs', value: procurement?.totalPRs, color: colors.text },
                    { label: 'Approved', value: procurement?.approved, color: colors.success },
                    { label: 'Rejected', value: procurement?.rejected, color: colors.danger },
                    { label: 'Pending', value: procurement?.pending, color: colors.warning },
                ].map((item, i) => (
                    <View key={item.label} style={[styles.summaryRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: 10, paddingTop: 10 }]}>
                        <Text style={styles.summaryLabel}>{item.label}</Text>
                        <Text style={[styles.summaryValue, { color: item.color }]}>{item.value ?? '—'}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    chartCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder },
    barChart: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', justifyContent: 'space-between' },
    summaryCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: fontSize.base, color: colors.textSecondary },
    summaryValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
