import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getServiceTypes, addServiceType, updateServiceType, deleteServiceType, ServiceType } from '../../services/firestoreService';

export default function ServicesScreen() {
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<ServiceType | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '' });

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await getServiceTypes();
      setServices(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data layanan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices(); }, []);

  const handleAdd = async () => {
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Nama dan harga harus diisi');
      return;
    }
    try {
      await addServiceType({ name: formData.name, price: parseFloat(formData.price), description: formData.description });
      Alert.alert('Berhasil', 'Layanan berhasil ditambahkan');
      setModalVisible(false);
      resetForm();
      loadServices();
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan layanan');
    }
  };

  const handleEdit = async () => {
    if (!editingService?.id) return;
    if (!formData.name || !formData.price) {
      Alert.alert('Error', 'Nama dan harga harus diisi');
      return;
    }
    try {
      await updateServiceType(editingService.id, { name: formData.name, price: parseFloat(formData.price), description: formData.description });
      Alert.alert('Berhasil', 'Layanan berhasil diupdate');
      setModalVisible(false);
      resetForm();
      loadServices();
    } catch (error) {
      Alert.alert('Error', 'Gagal mengupdate layanan');
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Hapus Layanan', `Apakah Anda yakin ingin menghapus "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await deleteServiceType(id);
          Alert.alert('Berhasil', 'Layanan berhasil dihapus');
          loadServices();
        } catch (error) {
          Alert.alert('Error', 'Gagal menghapus layanan');
        }
      }},
    ]);
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '' });
    setEditingService(null);
  };

  const openEditModal = (service: ServiceType) => {
    setEditingService(service);
    setFormData({ name: service.name, price: service.price.toString(), description: service.description || '' });
    setModalVisible(true);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadServices();
    setRefreshing(false);
  }, []);

  const renderService = ({ item }: { item: ServiceType }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.servicePrice}>Rp {item.price.toLocaleString()}</Text>
        {item.description && <Text style={styles.serviceDescription}>{item.description}</Text>}
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id!, item.name)}>
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat layanan...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jenis Layanan</Text>
        <Text style={styles.subtitle}>Kelola layanan laundry</Text>
      </View>
      <FlatList
        data={services}
        renderItem={renderService}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetag-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Belum ada layanan</Text>
          </View>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={() => { resetForm(); setModalVisible(true); }}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => { setModalVisible(false); resetForm(); }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingService ? 'Edit Layanan' : 'Tambah Layanan'}</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Layanan *</Text>
              <TextInput style={styles.input} placeholder="Contoh: Cuci Kering" value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Harga (Rp) *</Text>
              <TextInput style={styles.input} placeholder="Contoh: 15000" value={formData.price} onChangeText={(text) => setFormData({ ...formData, price: text })} keyboardType="numeric" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Deskripsi</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Deskripsi layanan" value={formData.description} onChangeText={(text) => setFormData({ ...formData, description: text })} multiline numberOfLines={3} />
            </View>
            <TouchableOpacity style={styles.modalButton} onPress={editingService ? handleEdit : handleAdd}>
              <Text style={styles.modalButtonText}>{editingService ? 'Simpan Perubahan' : 'Tambah Layanan'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => { setModalVisible(false); resetForm(); }}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50' },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 80 },
  serviceCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  servicePrice: { fontSize: 14, color: '#4CAF50', fontWeight: '500', marginTop: 2 },
  serviceDescription: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4CAF50', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, backgroundColor: '#F8F9FA' },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  modalButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  modalCancelButton: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCancelText: { color: '#7F8C8D', fontSize: 16 },
});