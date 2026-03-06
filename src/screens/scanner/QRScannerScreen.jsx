import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { assetsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function QRScannerScreen({ navigation }) {
    const { isDemoMode } = useAuth();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [assetDetails, setAssetDetails] = useState(null);

    const handleScan = async ({ data }) => {
        if (scanned || loading) return;
        setScanned(true);
        setLoading(true);
        try {
            // Try to parse as asset ID or QR token
            let assetId = data;
            try {
                const parsed = JSON.parse(data);
                assetId = parsed.assetId || parsed.id || data;
            } catch (_) { }

            let asset;
            if (isDemoMode) {
                asset = await localDatabase.getAssetById(assetId);
            } else {
                asset = await assetsAPI.getAssetById(assetId).catch(() => null);
                // Fallback to local if not found on API (useful for hybrid demos)
                if (!asset) asset = await localDatabase.getAssetById(assetId);
            }

            if (asset) {
                setAssetDetails(asset);
            } else {
                Alert.alert('Not Found', 'No asset found for this QR code.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
        } catch (e) {
            Alert.alert('Error', 'Could not load asset details.', [{ text: 'Retry', onPress: () => setScanned(false) }]);
        } finally {
            setLoading(false);
        }
    };

    const closePopup = () => {
        setAssetDetails(null);
        setScanned(false);
    };

    const viewFullDetails = () => {
        const id = assetDetails?.id;
        closePopup();
        navigation.navigate('AssetDetail', { assetId: id });
    };

    if (!permission) return <View style={styles.center}><Text style={styles.msg}>Requesting camera…</Text></View>;
    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Ionicons name="camera-outline" size={48} color={colors.textMuted} />
                <Text style={styles.msg}>Camera permission required</Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permTxt}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleScan}
                barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}
            >
                <View style={styles.overlay}>
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.scanTitle}>Scan Asset QR</Text>
                        <View style={{ width: 44 }} />
                    </View>

                    <View style={styles.viewfinder}>
                        {['tl', 'tr', 'bl', 'br'].map(c => (
                            <View key={c} style={[styles.corner, styles[c]]} />
                        ))}
                    </View>

                    <Text style={styles.hint}>Point camera at a CITIL QR code</Text>
                </View>
            </CameraView>

            {/* Asset Details Popup */}
            <Modal
                visible={!!assetDetails || loading}
                transparent={true}
                animationType="slide"
                onRequestClose={closePopup}
            >
                <View style={styles.modalOverlay}>
                    <Card style={styles.popupCard}>
                        {loading ? (
                            <View style={styles.loadingBox}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.loadingText}>Fetching Asset Details...</Text>
                            </View>
                        ) : assetDetails ? (
                            <View>
                                <View style={styles.popupHeader}>
                                    <Text style={styles.popupTitle}>Asset Found</Text>
                                    <TouchableOpacity onPress={closePopup}>
                                        <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Name:</Text>
                                    <Text style={styles.infoValue}>{assetDetails.name}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>ID:</Text>
                                    <Text style={styles.infoValue}>{assetDetails.assetId || assetDetails.id}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Location:</Text>
                                    <Text style={styles.infoValue}>{assetDetails.location || 'N/A'}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Status:</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: assetDetails.status === 'active' ? colors.successGlow : colors.warningGlow }]}>
                                        <Text style={[styles.statusText, { color: assetDetails.status === 'active' ? colors.success : colors.warning }]}>
                                            {(assetDetails.status || 'Active').toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Button
                                    title="View Full Details"
                                    onPress={viewFullDetails}
                                    style={styles.popupBtn}
                                    rightIcon="arrow-forward"
                                />
                            </View>
                        ) : null}
                    </Card>
                </View>
            </Modal>
        </View>
    );
}

const CORNER = 28;
const styles = StyleSheet.create({
    center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 16 },
    msg: { fontSize: fontSize.base, color: colors.textSecondary },
    permBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12 },
    permTxt: { fontSize: fontSize.base, fontWeight: '700', color: colors.background },
    overlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingBottom: 80 },
    topBar: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg },
    closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
    scanTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.white },
    viewfinder: { width: 240, height: 240, position: 'relative' },
    corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: colors.primary, borderWidth: 3 },
    tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    hint: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.8)', textAlign: 'center', paddingHorizontal: spacing.xl },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    popupCard: { width: '100%', maxWidth: 400, padding: spacing.lg },
    popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    popupTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
    infoRow: { flexDirection: 'row', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingBottom: 8 },
    infoLabel: { width: 90, fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: '600' },
    infoValue: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: '500' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm },
    statusText: { fontSize: 10, fontWeight: '800' },
    popupBtn: { marginTop: spacing.md },
    loadingBox: { padding: spacing.xl, alignItems: 'center' },
    loadingText: { marginTop: 12, color: colors.textSecondary, fontSize: fontSize.sm },
});
