import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getTransactions, deleteTransaction, getTransactionsByStatus, searchTransactions, Transaction } from '../../services/firestoreService';
import { getCurrentUser, isAdmin } from '../../services/authService';

export default function TransactionsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Semua');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  const statusOptions = ['Semua', 'Menunggu', 'Diproses', 'Selesai', 'Diambil'];

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    const userData = await getCurrentUser();
    setIsUserAdmin(isAdmin(userData));
    loadTransactions();
  };

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredTransactions = async (status: string) => {
    try {
      setLoading(true);
      if (status === 'Semua') {
        const data = await getTransactions();
        setTransactions(data);
      } else {
        const data = await getTransactionsByStatus(status);
        setTransactions(data);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      loadFilteredTransactions(filterStatus);
    } else {
      try {
        setLoading(true);
        const results = await searchTransactions(text);
        setTransactions(results);
      } catch (error) {
        Alert.alert('Error', 'Gagal mencari transaksi');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFilterChange = async (status: string) => {
    setFilterStatus(status);
    await loadFilteredTransactions(status);
  };

  const handleDelete = (id: string, customerName: string) => {
    if (!isUserAdmin) {
      Alert.alert('Akses Ditolak', 'Hanya admin yang dapat menghapus transaksi');
      return;
    }
    Alert.alert('Hapus Transaksi', `Apakah Anda yakin ingin menghapus transaksi "${customerName}"?`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          await deleteTransaction(id);
          Alert.alert('Berhasil', 'Transaksi berhasil dihapus');
          loadFilteredTransactions(filterStatus);
        } catch (error) {
          Alert.alert('Error', 'Gagal menghapus transaksi');
        }
      }},
    ]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFilteredTransactions(filterStatus);
    setRefreshing(false);
  }, [filterStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu': return '#FF9800';
      case 'Diproses': return '#2196F3';
      case 'Selesai': return '#4CAF50';
      case 'Diambil': return '#9C27B0';
      default: return '#7F8C8D';
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity style={styles.transactionCard} onPress={() => router.push(`/transaction/detail?id=${item.id}`)}>
      <View style={styles.transactionHeader}>
        <View>
          <Text style={styles.customerName}>{item.customerName}</Text>
          <Text style={styles.serviceName}><Ionicons name="shirt" size={14} color="#7F8C8D" /> {item.service}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles.transactionFooter}>
        <View style={styles.transactionDetail}><Ionicons name="scale" size={16} color="#7F8C8D" /><Text style={styles.detailText}>{item.weight} kg</Text></View>
        <View style={styles.transactionDetail}><Ionicons name="cash" size={16} color="#7F8C8D" /><Text style={styles.detailText}>Rp {item.price.toLocaleString()}</Text></View>
        <View style={styles.transactionDetail}><Ionicons name="calendar" size={16} color="#7F8C8D" /><Text style={styles.detailText}>{item.date}</Text></View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push(`/transaction/detail?id=${item.id}`)}>
          <Ionicons name="eye-outline" size={20} color="#2196F3" />
        </TouchableOpacity>
        {isUserAdmin && (
          <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item.id!, item.customerName)}>
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
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
        <TextInput style={styles.searchInput} placeholder="Cari transaksi..." placeholderTextColor="#999" value={searchQuery} onChangeText={handleSearch} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => handleSearch('')}><Ionicons name="close-circle" size={20} color="#7F8C8D" /></TouchableOpacity>}
      </View>
      <View style={styles.filterContainer}>
        <FlatList horizontal data={statusOptions} renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filterChip, filterStatus === item && styles.filterChipActive]} onPress={() => handleFilterChange(item)}>
            <Text style={[styles.filterChipText, filterStatus === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} />
      </View>
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Tidak ada transaksi</Text>
          </View>
        }
      />
      {isUserAdmin && (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/transaction/add')}>
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
  filterContainer: { paddingHorizontal: 16, paddingVertical: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E0E0E0', marginRight: 8 },
  filterChipActive: { backgroundColor: '#4CAF50' },
  filterChipText: { fontSize: 14, color: '#7F8C8D' },
  filterChipTextActive: { color: '#FFFFFF' },
  listContent: { padding: 16, paddingBottom: 80 },
  transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  serviceName: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  transactionDetail: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#7F8C8D', marginLeft: 4 },
  actionButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  actionButton: { padding: 8, marginLeft: 8 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: '#4CAF50', width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6 },
});