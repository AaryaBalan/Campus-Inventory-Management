import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { notificationsAPI } from '../../utils/api';
import apiClient from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { localDatabase } from '../../utils/localDatabase';
import { notificationEngine } from '../../utils/notificationEngine';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';

export default function NotificationsScreen() {
    const { isDemoMode } = useAuth();
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            let data;
            if (isDemoMode) {
                const existing = await localDatabase.getNotifications();
                // If it's a pull-to-refresh, simulate new notifications
                if (refreshing) {
                    data = await notificationEngine.simulate();
                } else {
                    data = existing.length > 0 ? existing : await notificationEngine.simulate();
                }
            } else {
                data = await notificationsAPI.getNotifications().catch(() => []);
            }
            setNotifs(data || []);
        }
        catch (_) { } finally { setLoading(false); }
    }, [isDemoMode, refreshing]);

    useEffect(() => { load(); }, [load]);
    const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

    const markRead = async (n) => {
        try {
            if (isDemoMode) {
                await localDatabase.markNotifRead(n.id);
            } else {
                await notificationsAPI.markRead(n.id);
            }
            load();
        } catch (_) { }
    };

    const markAll = async () => {
        try {
            if (isDemoMode) {
                await localDatabase.markAllNotifsRead();
            } else {
                await apiClient.post('/notifications/read-all');
            }
            load();
        } catch (_) { }
    };

    return (
        <View style={styles.screen}>
            <View style={styles.header}>
                <Text style={styles.title}>Notifications</Text>
                {notifs.some(n => !n.read) && (
                    <TouchableOpacity onPress={markAll} style={styles.markAllBtn}>
                        <Text style={styles.markAllTxt}>Mark all read</Text>
                    </TouchableOpacity>
                )}
            </View>
            {loading
                ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
                : <FlatList data={notifs} keyExtractor={(_, i) => String(i)}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                    contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80, gap: 8 }}
                    ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
                    renderItem={({ item }) => (
                        <TouchableOpacity style={[styles.card, !item.read && styles.unread]} onPress={() => markRead(item)} activeOpacity={0.8}>
                            <View style={[styles.iconWrap, { backgroundColor: item.read ? colors.surfaceElevated : colors.primaryGlow }]}>
                                <Ionicons name="notifications-outline" size={18} color={item.read ? colors.textMuted : colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.notifTitle, !item.read && { color: colors.text, fontWeight: '700' }]}>{item.title}</Text>
                                <Text style={styles.notifBody} numberOfLines={2}>{item.body || item.message || ''}</Text>
                                <Text style={styles.notifTime}>{item.createdAt ? new Date(item.createdAt._seconds * 1000).toLocaleDateString() : ''}</Text>
                            </View>
                            {!item.read && <View style={styles.unreadDot} />}
                        </TouchableOpacity>
                    )}
                />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: spacing.sm },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    markAllBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: colors.primaryGlow, borderRadius: radius.full, borderWidth: 1, borderColor: 'rgba(6,229,255,0.3)' },
    markAllTxt: { fontSize: fontSize.xs, fontWeight: '600', color: colors.primary },
    empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
    card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.sm },
    unread: { borderColor: 'rgba(6,229,255,0.2)', backgroundColor: colors.surfaceElevated },
    iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    notifTitle: { fontSize: fontSize.sm, fontWeight: '500', color: colors.textSecondary },
    notifBody: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
    notifTime: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
    unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 4 },
});
