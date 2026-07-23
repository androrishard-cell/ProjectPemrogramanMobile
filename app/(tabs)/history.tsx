import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrentUser } from '../../services/authService';
import { getTransactionsByUser, Transaction } from '../../services/firestoreService';

export default function HistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      if (userData) {
        const data = await getTransactionsByUser(userData.uid);
        setTransactions(data);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

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
          <Text style={styles.serviceName}>{item.service}</Text>
          <Text style={styles.customerName}>{item.customerName}</Text>
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
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Transaksi</Text>
        <Text style={styles.subtitle}>{user?.name || 'User'}, Anda memiliki {transactions.length} transaksi</Text>
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
            <Text style={styles.emptyText}>Belum ada transaksi</Text>
            <Text style={styles.emptySubText}>Mulai pesan laundry sekarang!</Text>
          </View>
        }
      />
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
  transactionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#4CAF50' },
  customerName: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginTop: 2 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  transactionFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  transactionDetail: { flexDirection: 'row', alignItems: 'center' },
  detailText: { fontSize: 12, color: '#7F8C8D', marginLeft: 4 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: '#7F8C8D', marginTop: 12 },
  emptySubText: { fontSize: 14, color: '#B0B0B0', marginTop: 4 },
});