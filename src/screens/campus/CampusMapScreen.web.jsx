import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function CampusMapScreen({ navigation }) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Campus Asset Map</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <Ionicons name="map-outline" size={64} color={colors.primary} />
                </View>
                <Text style={styles.title}>Map Unavailable on Web</Text>
                <Text style={styles.sub}>
                    The interactive campus map is optimized for the CITIL mobile app.
                    Please use a physical device to view asset locations.
                </Text>

                <TouchableOpacity
                    style={styles.btn}
                    onPress={() => navigation.navigate('Assets', { screen: 'AssetList' })}
                >
                    <Text style={styles.btnText}>View Asset List Instead</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
        paddingTop: 58,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.background
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.cardBorder
    },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primaryGlow,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl
    },
    title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
    sub: {
        fontSize: fontSize.base,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xxl
    },
    btn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: radius.lg
    },
    btnText: { color: colors.background, fontWeight: '700', fontSize: fontSize.base },
});
