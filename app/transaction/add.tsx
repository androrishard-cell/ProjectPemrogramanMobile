import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addTransaction } from '../../services/firestoreService';
import { getServiceTypes, ServiceType } from '../../services/firestoreService';
import { takePhoto, pickImage, uploadTransactionImage } from '../../services/storageService';
import { getCurrentUser } from '../../services/authService';

export default function AddTransactionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [userId, setUserId] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    service: '',
    weight: '',
    price: '',
    notes: '',
    status: 'Menunggu' as 'Menunggu' | 'Diproses' | 'Selesai' | 'Diambil',
    date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  });

  const [errors, setErrors] = useState({ customerName: '', service: '', weight: '', price: '' });

  useEffect(() => {
    loadServices();
    loadUser();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getServiceTypes();
      setServices(data);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadUser = async () => {
    const user = await getCurrentUser();
    if (user) setUserId(user.uid);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { customerName: '', service: '', weight: '', price: '' };
    if (!formData.customerName.trim()) { newErrors.customerName = 'Nama pelanggan harus diisi'; isValid = false; }
    if (!formData.service) { newErrors.service = 'Jenis layanan harus dipilih'; isValid = false; }
    if (!formData.weight || parseFloat(formData.weight) <= 0) { newErrors.weight = 'Berat harus diisi dan lebih dari 0'; isValid = false; }
    if (!formData.price || parseFloat(formData.price) <= 0) { newErrors.price = 'Harga harus diisi dan lebih dari 0'; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const uploadImageToFirebase = async () => {
    if (!imageUri) return null;
    setUploadingImage(true);
    try {
      const url = await uploadTransactionImage('temp', imageUri);
      return url;
    } catch (error) {
      Alert.alert('Error', 'Gagal upload gambar');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Silakan perbaiki field yang bermasalah');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageUri) {
        const url = await uploadImageToFirebase();
        if (url) imageUrl = url;
      }

      const transactionData = {
        userId: userId,
        customerId: '',
        customerName: formData.customerName,
        phone: formData.phone,
        service: formData.service,
        weight: parseFloat(formData.weight),
        price: parseFloat(formData.price),
        status: formData.status,
        notes: formData.notes,
        date: formData.date,
        imageUrl: imageUrl,
      };

      await addTransaction(transactionData);
      Alert.alert('Berhasil', 'Transaksi baru telah ditambahkan!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan transaksi');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nama Pelanggan *</Text>
            <TextInput style={[styles.input, errors.customerName && styles.inputError]} placeholder="Masukkan nama pelanggan" placeholderTextColor="#999" value={formData.customerName} onChangeText={(text) => { setFormData({ ...formData, customerName: text }); setErrors({ ...errors, customerName: '' }); }} />
            {errors.customerName ? <Text style={styles.errorText}>{errors.customerName}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput style={styles.input} placeholder="Masukkan nomor telepon" placeholderTextColor="#999" value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} keyboardType="phone-pad" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Jenis Layanan *</Text>
            <View style={styles.serviceContainer}>
              {services.map((service) => (
                <TouchableOpacity key={service.id} style={[styles.serviceChip, formData.service === service.name && styles.serviceChipActive]} onPress={() => { setFormData({ ...formData, service: service.name }); setErrors({ ...errors, service: '' }); }}>
                  <Text style={[styles.serviceChipText, formData.service === service.name && styles.serviceChipTextActive]}>{service.name} (Rp {service.price.toLocaleString()})</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.service ? <Text style={styles.errorText}>{errors.service}</Text> : null}
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Berat (kg) *</Text>
              <TextInput style={[styles.input, errors.weight && styles.inputError]} placeholder="0" placeholderTextColor="#999" value={formData.weight} onChangeText={(text) => { setFormData({ ...formData, weight: text }); setErrors({ ...errors, weight: '' }); }} keyboardType="numeric" />
              {errors.weight ? <Text style={styles.errorText}>{errors.weight}</Text> : null}
            </View>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>Harga (Rp) *</Text>
              <TextInput style={[styles.input, errors.price && styles.inputError]} placeholder="0" placeholderTextColor="#999" value={formData.price} onChangeText={(text) => { setFormData({ ...formData, price: text }); setErrors({ ...errors, price: '' }); }} keyboardType="numeric" />
              {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusContainer}>
              {['Menunggu', 'Diproses', 'Selesai', 'Diambil'].map((status) => (
                <TouchableOpacity key={status} style={[styles.statusChip, formData.status === status && { backgroundColor: getStatusColor(status) }]} onPress={() => setFormData({ ...formData, status: status as any })}>
                  <Text style={[styles.statusChipText, formData.status === status && styles.statusChipTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Catatan</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Tambahkan catatan (opsional)" placeholderTextColor="#999" value={formData.notes} onChangeText={(text) => setFormData({ ...formData, notes: text })} multiline numberOfLines={3} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Bukti/Foto</Text>
            <View style={styles.imageUploadContainer}>
              {imageUri ? (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                    <Ionicons name="close-circle" size={24} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color="#CCC" />
                  <Text style={styles.imagePlaceholderText}>Belum ada gambar</Text>
                </View>
              )}
              <View style={styles.imageButtonRow}>
                <TouchableOpacity style={[styles.imageButton, styles.cameraButton]} onPress={async () => { const uri = await takePhoto(); if (uri) setImageUri(uri); }} disabled={uploadingImage}>
                  <Ionicons name="camera" size={20} color="#FFFFFF" /><Text style={styles.imageButtonText}>Kamera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.imageButton, styles.galleryButton]} onPress={async () => { const uri = await pickImage(); if (uri) setImageUri(uri); }} disabled={uploadingImage}>
                  <Ionicons name="images" size={20} color="#FFFFFF" /><Text style={styles.imageButtonText}>Galeri</Text>
                </TouchableOpacity>
              </View>
              {uploadingImage && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={styles.uploadingText}>Mengupload gambar...</Text>
                </View>
              )}
            </View>
          </View>

          <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Simpan Transaksi</Text>}
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
  form: { padding: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#FFFFFF' },
  inputError: { borderColor: '#F44336' },
  errorText: { color: '#F44336', fontSize: 12, marginTop: 4 },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  serviceContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, marginBottom: 8 },
  serviceChipActive: { backgroundColor: '#4CAF50' },
  serviceChipText: { fontSize: 14, color: '#7F8C8D' },
  serviceChipTextActive: { color: '#FFFFFF' },
  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, marginBottom: 8 },
  statusChipText: { fontSize: 14, color: '#7F8C8D' },
  statusChipTextActive: { color: '#FFFFFF' },
  submitButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  cancelButton: { paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  cancelButtonText: { color: '#7F8C8D', fontSize: 16 },
  imageUploadContainer: { backgroundColor: '#F8F9FA', borderRadius: 10, padding: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  imagePreviewContainer: { position: 'relative', alignItems: 'center', marginBottom: 12 },
  imagePreview: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
  removeImageButton: { position: 'absolute', top: 8, right: 8, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4 },
  imagePlaceholder: { alignItems: 'center', paddingVertical: 30 },
  imagePlaceholderText: { color: '#999', fontSize: 14, marginTop: 8 },
  imageButtonRow: { flexDirection: 'row', gap: 12 },
  imageButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center', gap: 8 },
  cameraButton: { backgroundColor: '#2196F3' },
  galleryButton: { backgroundColor: '#4CAF50' },
  imageButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  uploadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, gap: 8 },
  uploadingText: { fontSize: 14, color: '#4CAF50' },
});