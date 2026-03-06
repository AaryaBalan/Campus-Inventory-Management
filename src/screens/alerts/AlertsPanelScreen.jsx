import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertsAPI } from '../../utils/api';
import apiClient from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';

const severityColor = (s) => ({ high: colors.danger, medium: colors.warning, low: colors.info }[s] || colors.textMuted);

export default function AlertsPanelScreen() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try { setAlerts(await alertsAPI.list().catch(() => [])); }
        catch (_) { } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const handleAck = (alert) => Alert.alert('Acknowledge', `Acknowledge "${alert.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Acknowledge', onPress: async () => {
                try {
                    await apiClient.post(`/alerts/${alert.id}/acknowledge`);
                    load();
                } catch (_) { }
            }
        },
    ]);

    return (
        <View style={styles.screen}>
            <View style={styles.header}><Text style={styles.title}>Alerts</Text></View>
            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={alerts} keyExtractor={(_, i) => String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 10 }}
                    ListEmptyComponent={<Text style={styles.empty}>No alerts</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.card, { borderLeftColor: severityColor(item.severity), borderLeftWidth: 3 }]}>
                            <View style={styles.top}>
                                <View style={[styles.dot, { backgroundColor: severityColor(item.severity) }]} />
                                <Text style={styles.alertTitle}>{item.title}</Text>
                                {item.status !== 'acknowledged' && (
                                    <TouchableOpacity onPress={() => handleAck(item)} style={styles.ackBtn}>
                                        <Text style={styles.ackTxt}>Ack</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={styles.alertMsg} numberOfLines={2}>{item.message || item.description || ''}</Text>
                            <View style={styles.meta}>
                                <Text style={[styles.severity, { color: severityColor(item.severity) }]}>{(item.severity || 'info').toUpperCase()}</Text>
                                <Text style={styles.status}>{item.status || 'active'}</Text>
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
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, gap: 6, ...shadows.sm },
    top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    alertTitle: { flex: 1, fontSize: fontSize.base, fontWeight: '600', color: colors.text },
    alertMsg: { fontSize: fontSize.sm, color: colors.textSecondary },
    meta: { flexDirection: 'row', gap: 10 },
    severity: { fontSize: fontSize.xs, fontWeight: '700' },
    status: { fontSize: fontSize.xs, color: colors.textMuted, textTransform: 'capitalize' },
    ackBtn: { backgroundColor: colors.primaryGlow, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(6,229,255,0.3)' },
    ackTxt: { fontSize: 11, fontWeight: '600', color: colors.primary },
});
