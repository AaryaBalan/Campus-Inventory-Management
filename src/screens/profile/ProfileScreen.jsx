import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, radius, shadows, roleColors } from '../../theme';
import Button from '../../components/ui/Button';

export default function ProfileScreen() {
    const { logout, user, profile, userRole } = useAuth();
    const meta = roleColors[userRole] || roleColors.admin;

    const handleLogout = () => Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);

    const infoRows = [
        { icon: 'mail-outline', label: 'Email', value: user?.email },
        { icon: 'person-outline', label: 'Name', value: profile?.name },
        { icon: 'business-outline', label: 'Department', value: profile?.department },
        { icon: 'shield-outline', label: 'Role', value: meta.label },
        { icon: 'calendar-outline', label: 'Joined', value: user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : '—' },
    ];

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={[styles.avatar, { borderColor: `${meta.color}50` }]}>
                    <Text style={[styles.avatarInitial, { color: meta.color }]}>
                        {(profile?.name || user?.email || 'U')[0].toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.displayName}>{profile?.name || user?.email?.split('@')[0]}</Text>
                <View style={[styles.rolePill, { backgroundColor: meta.glow }]}>
                    <Ionicons name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.roleLabel, { color: meta.color }]}>{meta.label}</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.card}>
                {infoRows.map((row, i) => row.value ? (
                    <View key={row.label} style={[styles.row, i > 0 && styles.rowBorder]}>
                        <View style={styles.rowLeft}>
                            <Ionicons name={row.icon} size={16} color={colors.textMuted} />
                            <Text style={styles.rowLabel}>{row.label}</Text>
                        </View>
                        <Text style={styles.rowValue} numberOfLines={1}>{row.value}</Text>
                    </View>
                ) : null)}
            </View>

            {/* Actions */}
            <View style={styles.card}>
                {[
                    { icon: 'lock-closed-outline', label: 'Change Password', color: colors.text, onPress: () => Alert.alert('Info', 'Password change is managed via the web portal.') },
                    { icon: 'help-circle-outline', label: 'Help & Support', color: colors.text, onPress: () => { } },
                    { icon: 'information-circle-outline', label: 'About CITIL v2.0', color: colors.textSecondary, onPress: () => Alert.alert('CITIL Mobile', 'Version 2.0\nCampus Inventory & Asset Traceability\n\n© 2025 CITIL') },
                ].map((action, i) => (
                    <TouchableOpacity key={action.label} onPress={action.onPress}
                        style={[styles.action, i > 0 && styles.actionBorder]} activeOpacity={0.7}>
                        <Ionicons name={action.icon} size={18} color={colors.textMuted} />
                        <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                    </TouchableOpacity>
                ))}
            </View>

            <Button title="Sign Out" variant="danger" onPress={handleLogout} leftIcon="log-out-outline" />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80, gap: spacing.base },
    avatarSection: { alignItems: 'center', gap: 10, marginBottom: spacing.sm },
    avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, borderWidth: 2, alignItems: 'center', justifyContent: 'center', ...shadows.md },
    avatarInitial: { fontSize: 38, fontWeight: '800' },
    displayName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
    rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 5 },
    roleLabel: { fontSize: fontSize.sm, fontWeight: '600' },
    card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder, overflow: 'hidden', ...shadows.sm },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
    rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    rowValue: { fontSize: fontSize.sm, fontWeight: '500', color: colors.text, maxWidth: '55%', textAlign: 'right' },
    action: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
    actionBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
    actionLabel: { flex: 1, fontSize: fontSize.base, fontWeight: '500' },
});
