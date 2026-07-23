import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Vibration, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QRScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getBarCodeScannerPermissions = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getBarCodeScannerPermissions();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    Vibration.vibrate();

    try {
      if (data.startsWith('transaction:')) {
        const transactionId = data.replace('transaction:', '');
        router.push(`/transaction/detail?id=${transactionId}`);
      } else {
        Alert.alert('QR Tidak Valid', 'QR Code ini bukan untuk transaksi Laundry Pro');
        setScanned(false);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memproses QR Code');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.permissionText}>Meminta izin kamera...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#CCC" />
        <Text style={styles.permissionText}>Tidak ada akses kamera</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#FFFFFF" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.scannerContainer}>
        <BarCodeScanner onBarCodeScanned={scanned ? undefined : handleBarCodeScanned} style={StyleSheet.absoluteFillObject} />
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanInstruction}>Arahkan kamera ke QR Code</Text>
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Memproses...</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => setScanned(false)} disabled={!scanned}>
          <Ionicons name="scan" size={24} color="#FFFFFF" />
          <Text style={styles.scanAgainText}>Scan Lagi</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#4CAF50' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF' },
  scannerContainer: { flex: 1, position: 'relative' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  scanFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#4CAF50', borderRadius: 12, backgroundColor: 'transparent' },
  scanInstruction: { color: '#FFFFFF', fontSize: 16, marginTop: 24, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  loadingText: { color: '#FFFFFF', fontSize: 16, marginTop: 12 },
  footer: { padding: 20, backgroundColor: '#000000', alignItems: 'center' },
  scanAgainButton: { flexDirection: 'row', backgroundColor: '#4CAF50', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, alignItems: 'center', gap: 8 },
  scanAgainText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  permissionText: { fontSize: 16, color: '#7F8C8D', marginTop: 12, textAlign: 'center' },
});