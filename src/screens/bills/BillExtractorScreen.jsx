import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../../utils/api';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function BillExtractorScreen() {
    const [image, setImage] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Photo library access is needed.'); return; }
        const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!res.canceled && res.assets[0]) { setImage(res.assets[0]); setResult(null); }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission required', 'Camera access is needed.'); return; }
        const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!res.canceled && res.assets[0]) { setImage(res.assets[0]); setResult(null); }
    };

    const extractBill = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const token = await getToken();
            const fd = new FormData();
            fd.append('bill', { uri: image.uri, type: 'image/jpeg', name: 'bill.jpg' });
            const res = await fetch(`${BASE_URL}/bills/extract`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }, body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || 'Extraction failed');
            setResult(data);
        } catch (e) { Alert.alert('Error', e.message); }
        finally { setLoading(false); }
    };

    return (
        <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Bill Extractor</Text>
            <Text style={styles.sub}>Upload a bill image to extract line items using OCR + AI</Text>

            <View style={styles.btnRow}>
                <Button title="Camera" onPress={takePhoto} variant="outline" leftIcon="camera-outline" style={{ flex: 1 }} />
                <Button title="Gallery" onPress={pickImage} variant="secondary" leftIcon="images-outline" style={{ flex: 1 }} />
            </View>

            {image && (
                <>
                    <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
                    <Button title={loading ? 'Extracting…' : 'Extract Bill Data'} onPress={extractBill} loading={loading} leftIcon="scan-outline" />
                </>
            )}

            {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}

            {result && (
                <>
                    <Text style={styles.section}>Extracted Data</Text>
                    <Card style={{ gap: 8 }}>
                        {[['Vendor', result.vendor], ['Date', result.date], ['Total', result.total ? `₹${result.total}` : null], ['GST', result.gst ? `₹${result.gst}` : null]].map(([k, v]) => v ? (
                            <View key={k} style={styles.resultRow}>
                                <Text style={styles.resultLabel}>{k}</Text>
                                <Text style={styles.resultValue}>{v}</Text>
                            </View>
                        ) : null)}
                    </Card>
                    {result.items?.length > 0 && (
                        <>
                            <Text style={styles.section}>Line Items</Text>
                            <Card style={{ gap: 8 }}>
                                {result.items.map((item, i) => (
                                    <View key={i} style={[styles.resultRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 8, marginTop: 0 }]}>
                                        <Text style={styles.resultLabel}>{item.name}</Text>
                                        <Text style={styles.resultValue}>₹{item.amount}</Text>
                                    </View>
                                ))}
                            </Card>
                        </>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: spacing.lg, paddingTop: 58, paddingBottom: 80, gap: spacing.md },
    title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
    sub: { fontSize: fontSize.base, color: colors.textSecondary },
    btnRow: { flexDirection: 'row', gap: spacing.sm },
    preview: { width: '100%', height: 220, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.cardBorder },
    section: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.sm },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between' },
    resultLabel: { fontSize: fontSize.sm, color: colors.textSecondary },
    resultValue: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
});
