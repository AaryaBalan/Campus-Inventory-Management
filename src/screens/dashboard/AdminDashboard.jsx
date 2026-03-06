import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { analyticsAPI, alertsAPI } from '../../utils/api';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, shadows, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const meta = roleColors.admin;

export default function AdminDashboard({ navigation }) {
    const { logout, userEmail, profile, isDemoMode } = useAuth();
    const { notificationsCount } = useApp();
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            if (isDemoMode) {
                const s = await localDatabase.getDashboardStats();
                setStats(s);
                setAlerts(s.lowStock.map(i => ({
                    id: i.id,
                    title: 'Low Stock Alert',
                    message: `${i.name} is below threshold.`,
                    severity: 'high'
                })));
            } else {
                const [dash, activeAlerts] = await Promise.all([
                    analyticsAPI.getDashboard().catch(() => null),
                    alertsAPI.list().catch(() => []),
                ]);
                setStats(dash);
                setAlerts(Array.isArray(activeAlerts) ? activeAlerts.slice(0, 3) : []);
            }
        } catch (_) { }
    }, [isDemoMode]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

    const name = profile?.name || userEmail?.split('@')[0] || 'Admin';

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            showsVerticalScrollIndicator={false}>
            <View style={styles.bgGlow} />

            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Good day 👋</Text>
                    <Text style={styles.name}>{name}</Text>
                </View>
                <TouchableOpacity style={styles.notifBtn} onPress={() => navigation.navigate('More', { screen: 'Notifications' })}>
                    <Ionicons name="notifications-outline" size={22} color={colors.text} />
                    {notificationsCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{notificationsCount > 9 ? '9+' : notificationsCount}</Text></View>}
                </TouchableOpacity>
            </View>

            <View style={[styles.roleBanner, { borderColor: `${meta.color}30` }]}>
                <View style={[styles.roleIcon, { backgroundColor: meta.glow }]}>
                    <Ionicons name={meta.icon} size={26} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.roleChip}>Your Role</Text>
                    <Text style={[styles.roleLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
                <View style={[styles.rolePill, { backgroundColor: `${meta.color}18` }]}>
                    <Text style={[styles.rolePillText, { color: meta.color }]}>ADMIN</Text>
                </View>
            </View>

            <Text style={styles.section}>Platform Overview</Text>
            <View style={styles.statsRow}>
                <StatCard label="Total Assets" value={stats?.totalAssets ?? '—'} icon="cube-outline" color={colors.primary} />
                <StatCard label="Inventory Items" value={stats?.totalInventory ?? '—'} icon="layers-outline" color={colors.success} />
            </View>
            <View style={[styles.statsRow, { marginTop: spacing.sm }]}>
                <StatCard label="Pending PRs" value={stats?.pendingPRs ?? '—'} icon="document-text-outline" color={colors.secondary} />
                <StatCard label="Active Alerts" value={stats?.activeAlerts ?? alerts.length} icon="alert-circle-outline" color={colors.warning} />
            </View>

            {alerts.length > 0 && (
                <>
                    <Text style={styles.section}>Active Alerts</Text>
                    <Card style={{ gap: 10 }}>
                        {alerts.map((a, i) => (
                            <View key={a.id || i} style={styles.alertRow}>
                                <View style={[styles.alertDot, { backgroundColor: a.severity === 'high' ? colors.danger : colors.warning }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.alertTitle}>{a.title || 'Alert'}</Text>
                                    <Text style={styles.alertDesc} numberOfLines={1}>{a.message || a.description || ''}</Text>
                                </View>
                            </View>
                        ))}
                    </Card>
                </>
            )}

            <Text style={styles.section}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
                {[
                    { icon: 'cube', label: 'Assets', color: colors.primary, onPress: () => navigation.navigate('Assets') },
                    { icon: 'layers', label: 'Inventory', color: colors.success, onPress: () => navigation.navigate('More', { screen: 'StockLevels' }) },
                    { icon: 'document-text', label: 'Procurement', color: colors.secondary, onPress: () => navigation.navigate('Procurement') },
                    { icon: 'bar-chart', label: 'Analytics', color: colors.info, onPress: () => navigation.navigate('More', { screen: 'Analytics' }) },
                ].map(a => (
                    <TouchableOpacity key={a.label} style={[styles.actionCard, { borderColor: `${a.color}25` }]} onPress={a.onPress} activeOpacity={0.75}>
                        <View style={[styles.actionIcon, { backgroundColor: `${a.color}15` }]}>
                            <Ionicons name={`${a.icon}-outline`} size={24} color={a.color} />
                        </View>
                        <Text style={styles.actionLabel}>{a.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Button title="Sign Out" variant="danger" onPress={handleLogout} leftIcon="log-out-outline" style={{ marginTop: 12 }} />
            <Text style={styles.version}>CITIL Mobile v2.0 • Admin</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.xxxl },
    bgGlow: { position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(99,102,241,0.07)' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
    greeting: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: 2 },
    name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.cardBorder, position: 'relative' },
    badge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 9, color: colors.white, fontWeight: '700' },
    roleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.base, borderWidth: 1, marginBottom: spacing.lg, gap: spacing.md, ...shadows.md },
    roleIcon: { width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
    roleChip: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
    roleLabel: { fontSize: fontSize.lg, fontWeight: '700', marginTop: 1 },
    rolePill: { borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4 },
    rolePillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    section: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    alertRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    alertDot: { width: 8, height: 8, borderRadius: 4 },
    alertTitle: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    alertDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    actionCard: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, gap: 10, ...shadows.sm },
    actionIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    actionLabel: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    version: { marginTop: spacing.lg, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
