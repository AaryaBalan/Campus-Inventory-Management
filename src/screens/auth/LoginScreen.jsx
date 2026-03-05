import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
    const { login, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const shake = useRef(new Animated.Value(0)).current;

    const triggerShake = () => Animated.sequence([
        Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -10, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();

    const handleLogin = async () => {
        if (!email.trim() || !password) { triggerShake(); return; }
        setLoading(true); clearError();
        try { await login(email.trim(), password); }
        catch (e) { triggerShake(); }
        finally { setLoading(false); }
    };

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={[styles.scroll, { minHeight: height }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    {/* Background glows */}
                    <View style={styles.glow1} /><View style={styles.glow2} />

                    <View style={styles.inner}>
                        {/* Brand */}
                        <View style={styles.brand}>
                            <View style={styles.logoBox}>
                                <Ionicons name="layers" size={34} color={colors.primary} />
                            </View>
                            <Text style={styles.brandName}>CITIL</Text>
                            <Text style={styles.brandSub}>Campus Inventory & Asset Traceability</Text>
                        </View>

                        {/* Card */}
                        <Animated.View style={[styles.card, { transform: [{ translateX: shake }] }]}>
                            <Text style={styles.cardTitle}>Welcome back</Text>
                            <Text style={styles.cardSub}>Sign in to your account to continue</Text>

                            {error && (
                                <View style={styles.errorBanner}>
                                    <Ionicons name="alert-circle" size={15} color={colors.danger} />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            )}

                            <View style={styles.fields}>
                                <Input
                                    label="Email address"
                                    value={email} onChangeText={setEmail}
                                    placeholder="you@university.edu"
                                    keyboardType="email-address"
                                    returnKeyType="next"
                                    leftIcon="mail-outline"
                                />
                                <Input
                                    label="Password"
                                    value={password} onChangeText={setPassword}
                                    placeholder="Enter your password"
                                    secureTextEntry={!showPw}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    leftIcon="lock-closed-outline"
                                    rightIcon={showPw ? 'eye-off-outline' : 'eye-outline'}
                                    onRightIconPress={() => setShowPw(p => !p)}
                                />
                            </View>

                            <Button title="Sign In" onPress={handleLogin} loading={loading} disabled={loading} rightIcon="arrow-forward" style={{ marginBottom: 20 }} />

                            <View style={styles.divider}>
                                <View style={styles.line} /><Text style={styles.divText}>secure access</Text><View style={styles.line} />
                            </View>
                            <View style={styles.badges}>
                                {[['shield-checkmark-outline', 'Firebase Secured', colors.success], ['lock-closed-outline', 'Encrypted', colors.primary], ['server-outline', 'RBAC Enforced', colors.secondary]].map(([icon, txt, c]) => (
                                    <View key={txt} style={styles.badge}>
                                        <Ionicons name={icon} size={11} color={c} />
                                        <Text style={[styles.badgeText, { color: c }]}>{txt}</Text>
                                    </View>
                                ))}
                            </View>
                        </Animated.View>

                        <Text style={styles.footer}>Access is managed by your campus administrator.</Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
}

const styles = StyleSheet.create({
    kav: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1 },
    inner: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
    glow1: { position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(6,229,255,0.05)' },
    glow2: { position: 'absolute', bottom: 0, right: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(99,102,241,0.06)' },

    brand: { alignItems: 'center', marginBottom: spacing.xl },
    logoBox: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primaryGlow, borderWidth: 1.5, borderColor: 'rgba(6,229,255,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 14, ...shadows.primary },
    brandName: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: 5 },
    brandSub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },

    card: { width: '100%', backgroundColor: colors.surface, borderRadius: 24, padding: spacing.lg, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.lg },
    cardTitle: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginBottom: 4 },
    cardSub: { fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.lg },

    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', borderRadius: 10, padding: 12, marginBottom: 14 },
    errorText: { fontSize: fontSize.sm, color: colors.danger, flex: 1 },

    fields: { gap: 14, marginBottom: spacing.lg },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
    line: { flex: 1, height: 1, backgroundColor: colors.divider },
    divText: { fontSize: fontSize.xs, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },

    badges: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: colors.cardBorder },
    badgeText: { fontSize: 10, fontWeight: '600' },

    footer: { marginTop: spacing.xl, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
