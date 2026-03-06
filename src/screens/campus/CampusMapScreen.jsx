import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { localDatabase } from '../../utils/localDatabase';
import { colors, spacing, fontSize, radius, shadows } from '../../theme';

const { width, height } = Dimensions.get('window');

const CAMPUS_REGION = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
};

const BUILDINGS = [
    { id: 'b1', name: 'Engineering Block', lat: 12.9720, lng: 77.5940, icon: 'business' },
    { id: 'b2', name: 'Library', lat: 12.9710, lng: 77.5950, icon: 'library' },
    { id: 'b3', name: 'Admin Building', lat: 12.9730, lng: 77.5945, icon: 'home' },
    { id: 'b4', name: 'Computer Lab', lat: 12.9715, lng: 77.5935, icon: 'desktop' },
    { id: 'b5', name: 'Research Center', lat: 12.9725, lng: 77.5955, icon: 'flask' },
];

export default function CampusMapScreen({ navigation }) {
    const { isDemoMode } = useAuth();
    const [markers, setMarkers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCounts = async () => {
            try {
                const assets = await localDatabase.getAssets();
                const updatedMarkers = BUILDINGS.map(b => {
                    const buildingAssets = assets.filter(a => a.building === b.name);
                    const depts = [...new Set(buildingAssets.map(a => a.department))];
                    return {
                        ...b,
                        count: buildingAssets.length,
                        departments: depts.slice(0, 2).join(', ') + (depts.length > 2 ? '...' : '')
                    };
                });
                setMarkers(updatedMarkers);
            } catch (e) {
                console.error('Map Load Error:', e);
            } finally {
                setLoading(false);
            }
        };
        loadCounts();
    }, [isDemoMode]);

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={CAMPUS_REGION}
                customMapStyle={darkMapStyle}
            >
                {markers.map(m => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.lat, longitude: m.lng }}
                        title={m.name}
                        pinColor={colors.primary}
                    >
                        <View style={styles.markerContainer}>
                            <View style={styles.markerBadge}>
                                <Text style={styles.markerText}>{m.count}</Text>
                            </View>
                            <Ionicons name={m.icon} size={24} color={colors.primary} />
                        </View>
                        <Callout onPress={() => navigation.navigate('Assets', { screen: 'AssetList', params: { query: m.name } })}>
                            <View style={styles.callout}>
                                <Text style={styles.calloutTitle}>{m.name}</Text>
                                <Text style={styles.calloutSub}>Assets: {m.count}</Text>
                                <Text style={styles.calloutDepts}>{m.departments}</Text>
                                <Text style={styles.calloutAction}>Tap to view list</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={colors.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Campus Asset Map</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}
        </View>
    );
}

const darkMapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#121b2b" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
    { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#142236" }] }
];

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    map: { width, height },
    header: { position: 'absolute', top: 58, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
    backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, textShadowColor: 'black', textShadowRadius: 4 },
    markerContainer: { alignItems: 'center', justifyContent: 'center' },
    markerBadge: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, position: 'absolute', top: -8, right: -8, zIndex: 1, borderWidth: 1, borderColor: colors.background },
    markerText: { color: colors.background, fontSize: 10, fontWeight: '800' },
    callout: { width: 160, padding: 8, backgroundColor: colors.surface },
    calloutTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
    calloutSub: { fontSize: 12, fontWeight: '600', color: colors.primary, marginBottom: 4 },
    calloutDepts: { fontSize: 10, color: colors.textSecondary, marginBottom: 6 },
    calloutAction: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textAlign: 'center', marginTop: 4, borderTopWidth: 1, borderTopColor: colors.divider, paddingTop: 4 },
    loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -25, marginTop: -25 },
});
