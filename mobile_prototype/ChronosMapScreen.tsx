import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Region, Camera } from 'react-native-maps';
import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

/**
 * CHRONOS MAPS - MOBILE COMPONENT (PROTOTYPE)
 * Tech: React Native + Expo + Google Maps SDK
 * 
 * Features:
 * - Dark Mode by default
 * - 3D/2D Camera Toggle
 * - Glassmorphism Header
 * - POI Markers
 */

// --- CONFIGURATION ---
const DARK_MAP_STYLE = [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#3c3c3c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

const INITIAL_REGION = {
    latitude: 41.3851,
    longitude: 2.1734,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
};

// --- TYPES ---
interface POI {
    id: string;
    title: string;
    lat: number;
    lng: number;
    rarity: 'common' | 'rare' | 'legendary';
}

const SAMPLE_POIS: POI[] = [
    { id: '1', title: 'Catedral de Barcelona', lat: 41.3833, lng: 2.1766, rarity: 'legendary' },
    { id: '2', title: 'Plaza Real', lat: 41.3792, lng: 2.1754, rarity: 'rare' },
];

export default function ChronosMapScreen() {
    // State
    const mapRef = useRef<MapView>(null);
    const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [is3D, setIs3D] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);

    // Effects
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);
            if (status !== 'granted') return;

            let loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);

            // Auto-center on load
            mapRef.current?.animateCamera({
                center: {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                },
                zoom: 17,
            });
        })();
    }, []);

    // Handlers
    const toggleCameraMode = () => {
        const nextMode = !is3D;
        setIs3D(nextMode);

        if (nextMode) {
            // Switch to 3D
            mapRef.current?.animateCamera({
                pitch: 65,
                heading: 0,
                zoom: 18,
                altitude: 200 // Only useful on iOS often
            }, { duration: 1000 });
        } else {
            // Switch to 2D
            mapRef.current?.animateCamera({
                pitch: 0,
                heading: 0,
                zoom: 17,
            }, { duration: 1000 });
        }
    };

    const centerOnUser = () => {
        if (!location) return;
        mapRef.current?.animateCamera({
            center: {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            },
            heading: 0,
            pitch: is3D ? 65 : 0,
            zoom: 18
        });
    };

    const handleMapPress = () => {
        // Simple interaction: Toggle header visibility on empty space tap
        setHeaderVisible(!headerVisible);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* MAP LAYER */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={INITIAL_REGION}
                showsUserLocation={true}
                showsCompass={false}
                showsMyLocationButton={false} // Custom button used
                onPress={handleMapPress}
                onPanDrag={() => { if (headerVisible) setHeaderVisible(false); }}
                onRegionChangeComplete={() => { if (!headerVisible) setHeaderVisible(true); }}
            >
                {SAMPLE_POIS.map(poi => (
                    <Marker
                        key={poi.id}
                        coordinate={{ latitude: poi.lat, longitude: poi.lng }}
                        title={poi.title}
                        pinColor={poi.rarity === 'legendary' ? 'gold' : 'blue'}
                    />
                ))}
            </MapView>

            {/* FLOAT HEADER (GLASS) */}
            {headerVisible && (
                <BlurView intensity={80} tint="dark" style={styles.glassHeader}>
                    <TouchableOpacity style={styles.headerBtn}>
                        <View style={styles.avatarBorder}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.headerTitleContainer}>
                        <Ionicons name="compass" size={24} color="#f59e0b" />
                    </View>

                    <View style={styles.rightControls}>
                        <TouchableOpacity style={styles.headerBtn}>
                            <Ionicons name="map-outline" size={24} color="#fff" />
                            {/* Badge */}
                            <View style={styles.badgeDot} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.headerBtn}>
                            <Ionicons name="book-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </BlurView>
            )}

            {/* FLOAT CONTROLS (BOTTOM RIGHT) */}
            <View style={styles.fabContainer}>
                <TouchableOpacity
                    style={[styles.fab, is3D && styles.fabActive]}
                    onPress={toggleCameraMode}
                    activeOpacity={0.8}
                >
                    <Text style={styles.fabText}>{is3D ? '3D' : '2D'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.fab}
                    onPress={centerOnUser}
                    activeOpacity={0.8}
                >
                    <Ionicons name="navigate" size={24} color="#2563eb" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    map: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    glassHeader: {
        position: 'absolute',
        top: 50, // SafeArea
        left: 20,
        right: 20,
        height: 60,
        borderRadius: 30,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    headerBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 22,
        // backgroundColor: 'rgba(255,255,255,0.05)' // Optional tap bg
    },
    avatarBorder: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f59e0b'
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    rightControls: {
        flexDirection: 'row',
        gap: 4
    },
    badgeDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ef4444',
        borderWidth: 1,
        borderColor: '#000'
    },
    // FABs
    fabContainer: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        gap: 16
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    fabActive: {
        backgroundColor: '#2563eb', // Blue when 3D is active
        borderWidth: 2,
        borderColor: '#fff'
    },
    fabText: {
        fontWeight: 'bold',
        color: '#111827'
    }
});
