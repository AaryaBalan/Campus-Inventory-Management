import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { assetsApi } from '../../utils/api';
import { colors, spacing, fontSize, radius } from '../../theme';

export default function QRScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);

    const handleScan = async ({ data }) => {
        if (scanned || scanning) return;
        setScanned(true); setScanning(true);
        try {
            // Try to parse as asset ID or QR token
            let assetId = data;
            try {
                const parsed = JSON.parse(data);
                assetId = parsed.assetId || parsed.id || data;
            } catch (_) { }

            const asset = await assetsApi.get(assetId);
            if (asset) {
                navigation.navigate('AssetDetail', { assetId: asset.id });
            } else {
                Alert.alert('Not Found', 'No asset found for this QR code.', [{ text: 'OK', onPress: () => setScanned(false) }]);
            }
        } catch (e) {
            Alert.alert('Error', 'Could not load asset details.', [{ text: 'Retry', onPress: () => setScanned(false) }]);
        } finally { setScanning(false); }
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
            <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={scanned ? undefined : handleScan} barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'ean13'] }}>
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

                    <Text style={styles.hint}>{scanning ? 'Loading asset…' : scanned ? 'Processing…' : 'Point camera at a CITIL QR code'}</Text>
                    {scanned && !scanning && (
                        <TouchableOpacity style={styles.rescanBtn} onPress={() => setScanned(false)}>
                            <Text style={styles.rescanTxt}>Scan Again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </CameraView>
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
    rescanBtn: { backgroundColor: 'rgba(6,229,255,0.2)', borderRadius: radius.md, paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1, borderColor: colors.primary },
    rescanTxt: { fontSize: fontSize.base, fontWeight: '700', color: colors.primary },
});
