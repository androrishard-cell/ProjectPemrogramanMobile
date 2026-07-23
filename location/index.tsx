import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, FlatList, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';

interface Outlet {
  id: string; name: string; address: string; phone: string; latitude: number; longitude: number; distance?: number;
}

const outlets: Outlet[] = [
  { id: '1', name: 'Laundry Pro Pusat', address: 'Jl. Merdeka No. 123, Jakarta', phone: '081234567890', latitude: -6.2088, longitude: 106.8456 },
  { id: '2', name: 'Laundry Pro Cabang 1', address: 'Jl. Sudirman No. 45, Bandung', phone: '082345678901', latitude: -6.9175, longitude: 107.6191 },
  { id: '3', name: 'Laundry Pro Cabang 2', address: 'Jl. Diponegoro No. 78, Surabaya', phone: '083456789012', latitude: -7.2575, longitude: 112.7521 },
];

export default function LocationScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [outletsWithDistance, setOutletsWithDistance] = useState<Outlet[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => { getLocation(); }, []);

  const getLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Izin lokasi ditolak');
        setLoading(false);
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      const outletsWithDist = outlets.map((outlet) => {
        const distance = calculateDistance(currentLocation.coords.latitude, currentLocation.coords.longitude, outlet.latitude, outlet.longitude);
        return { ...outlet, distance };
      });
      outletsWithDist.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setOutletsWithDistance(outletsWithDist);
    } catch (error) {
      setErrorMsg('Gagal mendapatkan lokasi');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round((R * c) * 10) / 10;
  };

  const openMaps = (outlet: Outlet) => {
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${outlet.latitude},${outlet.longitude}`);
  };

  const callOutlet = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Mendapatkan lokasi...</Text>
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="location-outline" size={64} color="#CCC" />
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getLocation}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Outlet Terdekat</Text>
        <TouchableOpacity onPress={getLocation}><Ionicons name="refresh" size={24} color="#FFFFFF" /></TouchableOpacity>
      </View>
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={20} color="#4CAF50" />
        <Text style={styles.locationText}>{location ? `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}` : 'Lokasi tidak ditemukan'}</Text>
      </View>
      <FlatList
        data={outletsWithDistance}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.outletCard}>
            <View style={styles.outletHeader}>
              <View style={styles.outletIcon}><Ionicons name="business" size={24} color="#4CAF50" /></View>
              <View style={styles.outletInfo}>
                <Text style={styles.outletName}>{item.name}</Text>
                <Text style={styles.outletAddress}>{item.address}</Text>
              </View>
              <View style={styles.distanceBadge}><Text style={styles.distanceText}>{item.distance !== undefined ? `${item.distance} km` : '?'}</Text></View>
            </View>
            <View style={styles.outletActions}>
              <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={() => openMaps(item)}>
                <Ionicons name="map" size={18} color="#FFFFFF" /><Text style={styles.actionButtonText}>Petunjuk</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => callOutlet(item.phone)}>
                <Ionicons name="call" size={18} color="#FFFFFF" /><Text style={styles.actionButtonText}>Hubungi</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Tidak ada outlet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#4CAF50' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  locationInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 16, marginTop: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  locationText: { fontSize: 14, color: '#2C3E50', marginLeft: 8 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#7F8C8D' },
  errorText: { fontSize: 16, color: '#F44336', marginTop: 12, textAlign: 'center' },
  retryButton: { backgroundColor: '#4CAF50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 16 },
  retryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  outletCard: { backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  outletHeader: { flexDirection: 'row', alignItems: 'center' },
  outletIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
  outletInfo: { flex: 1, marginLeft: 12 },
  outletName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  outletAddress: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  distanceBadge: { backgroundColor: '#4CAF50', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  distanceText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  outletActions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 6 },
  mapButton: { backgroundColor: '#2196F3' },
  callButton: { backgroundColor: '#4CAF50' },
  actionButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginTop: 12 },
});