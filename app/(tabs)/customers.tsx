import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCustomers, deleteCustomer, searchCustomers, Customer } from '../../services/firestoreService';
import { getCurrentUser, isAdmin } from '../../services/authService';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const userData = await getCurrentUser();
    setIsUserAdmin(isAdmin(userData));
    loadCustomers();
  };

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      loadCustomers();
    } else {
      try {
        setLoading(true);
        const results = await searchCustomers(text);
        setCustomers(results);
      } catch (error) {
        Alert.alert('Error', 'Gagal mencari pelanggan');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!isUserAdmin) {
      Alert.alert('Akses Ditolak', 'Hanya admin yang dapat menghapus pelanggan');
      return;
    }
    Alert.alert('Hapus Pelanggan', `Apakah Anda yakin ingin menghapus pelanggan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await deleteCustomer(id);
          Alert.alert('Berhasil', 'Pelanggan berhasil dihapus');
          loadCustomers();
        } catch (error) {
          Alert.alert('Error', 'Gagal menghapus pelanggan');
        }
      }},
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCustomers();
    setRefreshing(false);
  }, []);

  const renderCustomer = ({ item }: { item: Customer }) => (
    <View style={styles.customerCard}>
      <View style={styles.customerInfo}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{item.name.charAt(0)}</Text></View>
        <View style={styles.customerDetails}>
          <Text style={styles.customerName}>{item.name}</Text>
          <Text style={styles.customerPhone}><Ionicons name="call" size={14} color="#7F8C8D" /> {item.phone}</Text>
          <Text style={styles.customerOrders}>Total Pesanan: {item.totalOrders || 0}</Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Info', 'Edit pelanggan belum diimplementasikan')}>
          <Ionicons name="create-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        {isUserAdmin && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id!, item.name)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
        <TextInput style={styles.searchInput} placeholder="Cari pelanggan..." placeholderTextColor="#999" value={searchQuery} onChangeText={handleSearch} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => handleSearch('')}><Ionicons name="close-circle" size={20} color="#7F8C8D" /></TouchableOpacity>}
      </View>
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Tidak ada pelanggan</Text>
          </View>
        }
      />
      {isUserAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => Alert.alert('Info', 'Tambah pelanggan belum diimplementasikan')}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12, marginBottom: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#2C3E50' },
  listContent: { padding: 16, paddingBottom: 80 },
  customerCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  customerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  customerDetails: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  customerPhone: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  customerOrders: { fontSize: 12, color: '#4CAF50', marginTop: 2 },
  actionButtons: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4CAF50', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
});