import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { analyticsAPI } from '../../utils/api';
import apiClient from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Loading from '../../components/ui/Loading';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

const { width } = Dimensions.get('window');

const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(6, 229, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity * 0.7})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary }
};

export default function AnalyticsDashboardScreen() {
    const { isDemoMode } = useAuth();
    const [stats, setStats] = useState(null);
    const [assetDist, setAssetDist] = useState([]);
    const [procurementData, setProcurementData] = useState(null);
    const [inventoryData, setInventoryData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            if (isDemoMode) {
                const [assets, inventory, lowStock] = await Promise.all([
                    localDatabase.getAssets(),
                    localDatabase.getInventory(),
                    localDatabase.getLowStock()
                ]);

                setStats({
                    totalAssets: assets.length,
                    totalInventory: inventory.length,
                    activeAlerts: lowStock.length + 2,
                    pendingPRs: 5,
                    totalPRs: 142,
                    approvedPRs: 98
                });

                const cats = {};
                assets.forEach(a => cats[a.category] = (cats[a.category] || 0) + 1);
                const colors_list = [colors.primary, colors.secondary, colors.success, colors.warning, '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'];
                setAssetDist(Object.keys(cats).map((c, i) => ({
                    name: c,
                    population: cats[c],
                    color: colors_list[i % colors_list.length],
                    legendFontColor: colors.textSecondary,
                    legendFontSize: 11
                })));

                setProcurementData({
                    labels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
                    datasets: [{ data: [20, 45, 28, 80, 99, 43] }]
                });

                const topInv = inventory.slice(0, 5);
                setInventoryData({
                    labels: topInv.map(i => i.name.split(' ')[0]),
                    datasets: [{ data: topInv.map(i => i.currentStock) }]
                });

            } else {
                const [d, p] = await Promise.all([
                    analyticsAPI.getDashboard().catch(() => null),
                    apiClient.get('/analytics/procurement').catch(() => null),
                ]);
                setStats(d);
                setProcurementData(p ? {
                    labels: p.monthlyBreakdown?.map(m => m.month) || [],
                    datasets: [{ data: p.monthlyBreakdown?.map(m => m.count) || [] }]
                } : null);
            }
        } catch (_) { } finally { setLoading(false); }
    }, [isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    if (loading) return <Loading fullScreen message="Loading analytics…" />;

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <Text style={styles.title}>Analytics</Text>

            <Text style={styles.section}>Platform Overview</Text>
            <View style={styles.statsRow}>
                <StatCard label="Total Assets" value={stats?.totalAssets ?? '—'} icon="cube-outline" color={colors.primary} />
                <StatCard label="Inventory Items" value={stats?.totalInventory ?? '—'} icon="layers-outline" color={colors.success} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Active Alerts" value={stats?.activeAlerts ?? '—'} icon="alert-circle-outline" color={colors.warning} />
                <StatCard label="Pending PRs" value={stats?.pendingPRs ?? '—'} icon="document-text-outline" color={colors.secondary} />
            </View>

            {assetDist.length > 0 && (
                <>
                    <Text style={styles.section}>Asset Distribution</Text>
                    <View style={styles.chartCard}>
                        <PieChart
                            data={assetDist}
                            width={width - 80}
                            height={220}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </View>
                </>
            )}

            {procurementData && (
                <>
                    <Text style={styles.section}>Procurement Trends</Text>
                    <View style={styles.chartCard}>
                        <LineChart
                            data={procurementData}
                            width={width - 80}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>
                </>
            )}

            {inventoryData && (
                <>
                    <Text style={styles.section}>Inventory Levels</Text>
                    <View style={styles.chartCard}>
                        <BarChart
                            data={inventoryData}
                            width={width - 84}
                            height={220}
                            yAxisLabel=""
                            chartConfig={chartConfig}
                            verticalLabelRotation={15}
                            style={{ marginVertical: 8, borderRadius: 16 }}
                        />
                    </View>
                </>
            )}

            <Text style={styles.section}>Summary Data</Text>
            <View style={styles.summaryCard}>
                {[
                    { label: 'Total Requests', value: stats?.totalPRs || 120, color: colors.text },
                    { label: 'Approval Rate', value: '82%', color: colors.success },
                    { label: 'Compliance Score', value: '94%', color: colors.info },
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
    chartCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.sm, borderWidth: 1, borderColor: colors.cardBorder, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', ...shadows.sm },
    summaryCard: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.sm },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: fontSize.base, color: colors.textSecondary },
    summaryValue: { fontSize: fontSize.lg, fontWeight: '700' },
});
