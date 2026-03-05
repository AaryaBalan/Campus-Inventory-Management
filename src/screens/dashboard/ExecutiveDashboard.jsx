import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { analyticsApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const meta = roleColors.executive;

export default function ExecutiveDashboard() {
    const { logout, userEmail, profile } = useAuth();
    const [data, setData] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setData(await analyticsApi.dashboard().catch(() => null)); } catch (_) { }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Executive Overview</Text>
                    <Text style={styles.name}>{profile?.name || userEmail?.split('@')[0]}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: `${meta.color}18` }]}>
                    <Text style={[styles.rolePillText, { color: meta.color }]}>EXEC</Text>
                </View>
            </View>

            <Text style={styles.section}>Platform Health</Text>
            <View style={styles.statsRow}>
                <StatCard label="Total Assets" value={data?.totalAssets ?? '—'} icon="cube-outline" color={meta.color} />
                <StatCard label="Inventory Items" value={data?.totalInventory ?? '—'} icon="layers-outline" color={colors.success} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Active PRs" value={data?.pendingPRs ?? '—'} icon="document-text-outline" color={colors.secondary} />
                <StatCard label="Alerts" value={data?.activeAlerts ?? '—'} icon="alert-circle-outline" color={colors.warning} />
            </View>

            <Text style={styles.section}>Key Insights</Text>
            <Card>
                {[
                    { icon: '📦', text: `${data?.totalAssets ?? '—'} assets tracked campus-wide` },
                    { icon: '📋', text: `${data?.pendingPRs ?? '—'} purchase requests in pipeline` },
                    { icon: '⚠️', text: `${data?.activeAlerts ?? '—'} active stock alerts` },
                ].map((ins, i) => (
                    <View key={i} style={[styles.insight, i > 0 && { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider }]}>
                        <Text style={styles.insightIcon}>{ins.icon}</Text>
                        <Text style={styles.insightText}>{ins.text}</Text>
                    </View>
                ))}
            </Card>

            <Button title="Sign Out" variant="danger" onPress={handleLogout} leftIcon="log-out-outline" style={{ marginTop: spacing.lg }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    greeting: { fontSize: fontSize.sm, color: colors.textSecondary },
    name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, marginTop: 2 },
    rolePill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
    rolePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    insight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    insightIcon: { fontSize: 20 },
    insightText: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
});
