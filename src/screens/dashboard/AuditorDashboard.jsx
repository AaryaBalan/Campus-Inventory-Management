import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { auditApi } from '../../utils/api';
import { colors, spacing, fontSize, radius, roleColors } from '../../theme';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const meta = roleColors.auditor;

export default function AuditorDashboard() {
    const { logout, userEmail, profile } = useAuth();
    const [logs, setLogs] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setLogs((await auditApi.list().catch(() => [])).slice(0, 5)); } catch (_) { }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: logout }]);

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <Text style={styles.name}>{profile?.name || userEmail?.split('@')[0]}</Text>
                <View style={[styles.rolePill, { backgroundColor: `${meta.color}18` }]}>
                    <Text style={[styles.rolePillText, { color: meta.color }]}>AUDITOR</Text>
                </View>
            </View>

            <Text style={styles.section}>Audit Overview</Text>
            <View style={styles.statsRow}>
                <StatCard label="Log Entries" value={logs.length > 0 ? `${logs.length}+` : '—'} icon="list-outline" color={meta.color} />
                <StatCard label="Read Only" value="✓" icon="shield-checkmark-outline" color={colors.success} />
            </View>

            <Text style={styles.section}>Recent Audit Logs</Text>
            <Card style={{ gap: 10 }}>
                {logs.length === 0
                    ? <Text style={styles.empty}>No audit logs found</Text>
                    : logs.map((log, i) => (
                        <View key={log.id || i} style={styles.logRow}>
                            <View style={[styles.logIcon, { backgroundColor: `${meta.color}15` }]}>
                                <Ionicons name="document-text-outline" size={14} color={meta.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.logAction}>{log.action || 'Action'}</Text>
                                <Text style={styles.logMeta}>{log.module || 'System'} · {log.userId?.slice(0, 8) || 'User'}</Text>
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
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    name: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    rolePill: { borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
    rolePillText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.lg },
    statsRow: { flexDirection: 'row', gap: spacing.sm },
    empty: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center', paddingVertical: 12 },
    logRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    logIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    logAction: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
    logMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
});
