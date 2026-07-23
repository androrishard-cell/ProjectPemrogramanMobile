import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTransaction, updateTransaction } from '../../services/firestoreService';
import { getServiceTypes, ServiceType } from '../../services/firestoreService';

export default function EditTransactionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    service: '',
    weight: '',
    price: '',
    status: 'Menunggu' as 'Menunggu' | 'Diproses' | 'Selesai' | 'Diambil',
    notes: '',
  });

  const statusOptions = ['Menunggu', 'Diproses', 'Selesai', 'Diambil'];

  useEffect(() => {
    loadServices();
    if (id) loadTransaction();
  }, [id]);

  const loadServices = async () => {
    try {
      const data = await getServiceTypes();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadTransaction = async () => {
    try {
      const data = await getTransaction(id as string);
      if (data) {
        setFormData({
          customerName: data.customerName,
          phone: data.phone || '',
          service: data.service,
          weight: data.weight.toString(),
          price: data.price.toString(),
          status: data.status,
          notes: data.notes || '',
        });
      } else {
        Alert.alert('Error', 'Transaksi tidak ditemukan');
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!formData.customerName || !formData.service || !formData.weight || !formData.price) {
      Alert.alert('Error', 'Semua field wajib diisi');
      return;
    }

    setLoading(true);
    try {
      await updateTransaction(id as string, {
        customerName: formData.customerName,
        phone: formData.phone,
        service: formData.service,
        weight: parseFloat(formData.weight),
        price: parseFloat(formData.price),
        status: formData.status,
        notes: formData.notes,
      });
      Alert.alert('Berhasil', 'Transaksi berhasil diupdate!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengupdate transaksi');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <Text style={styles.title}>Edit Transaksi</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Pelanggan *</Text>
            <TextInput style={styles.input} placeholder="Masukkan nama pelanggan" placeholderTextColor="#999" value={formData.customerName} onChangeText={(text) => setFormData({ ...formData, customerName: text })} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput style={styles.input} placeholder="Masukkan nomor telepon" placeholderTextColor="#999" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Layanan *</Text>
            <View style={styles.serviceContainer}>
              {services.map((service) => (
                <TouchableOpacity key={service.id} style={[styles.serviceChip, formData.service === service.name && styles.serviceChipActive]} onPress={() => setFormData({ ...formData, service: service.name })}>
                  <Text style={[styles.serviceChipText, formData.service === service.name && styles.serviceChipTextActive]}>{service.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Berat (kg) *</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#999" value={formData.weight} onChangeText={(text) => setFormData({ ...formData, weight: text })} keyboardType="numeric" />
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Harga (Rp) *</Text>
              <TextInput style={styles.input} placeholder="0" placeholderTextColor="#999" value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} keyboardType="numeric" />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {statusOptions.map((status) => (
                <TouchableOpacity key={status} style={[styles.statusChip, formData.status === status && styles.statusChipActive, { backgroundColor: formData.status === status ? getStatusColor(status) : '#F0F0F0' }]} onPress={() => setFormData({ ...formData, status: status as any })}>
                  <Text style={[styles.statusChipText, formData.status === status && styles.statusChipTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catatan</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Tambahkan catatan" placeholderTextColor="#999" value={formData.notes} onChangeText={(text) => setFormData({ ...formData, notes: text })} multiline numberOfLines={3} />
          </View>

          <TouchableOpacity style={[styles.updateButton, loading && styles.buttonDisabled]} onPress={handleUpdate} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.updateButtonText}>Simpan Perubahan</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Batal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Menunggu': return '#FF9800';
    case 'Diproses': return '#2196F3';
    case 'Selesai': return '#4CAF50';
    case 'Diambil': return '#9C27B0';
    default: return '#7F8C8D';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  form: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50', marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF' },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  serviceContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, marginBottom: 8 },
  serviceChipActive: { backgroundColor: '#4CAF50' },
  serviceChipText: { fontSize: 14, color: '#7F8C8D' },
  serviceChipTextActive: { color: '#FFFFFF' },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 },
  statusChipActive: { borderWidth: 2, borderColor: '#4CAF50' },
  statusChipText: { fontSize: 14, color: '#7F8C8D' },
  statusChipTextActive: { color: '#FFFFFF' },
  updateButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  updateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#7F8C8D', fontSize: 16 },
});