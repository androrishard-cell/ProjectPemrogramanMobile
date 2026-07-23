import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentUser } from '../../services/authService';
import { getDashboardStats } from '../../services/firestoreService';

export default function DashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    todayTransactions: 0,
    processedOrders: 0,
    completedOrders: 0,
    recentTransactions: [],
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      const dashboardStats = await getDashboardStats();
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const statItems = [
    { id: 1, title: 'Total Pelanggan', value: stats.totalCustomers.toString(), icon: 'people', color: '#4CAF50' },
    { id: 2, title: 'Transaksi Hari Ini', value: stats.todayTransactions.toString(), icon: 'receipt', color: '#2196F3' },
    { id: 3, title: 'Diproses', value: stats.processedOrders.toString(), icon: 'time', color: '#FF9800' },
    { id: 4, title: 'Selesai', value: stats.completedOrders.toString(), icon: 'checkmark-circle', color: '#8BC34A' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Diproses': return '#FF9800';
      case 'Selesai': return '#4CAF50';
      case 'Menunggu': return '#F44336';
      case 'Diambil': return '#9C27B0';
      default: return '#7F8C8D';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, {user?.name || 'User'}!</Text>
            <Text style={styles.subGreeting}>Selamat datang di Laundry Pro</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#2C3E50" />
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>{stats.processedOrders > 0 ? stats.processedOrders : 0}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {statItems.map((stat) => (
            <View key={stat.id} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity><Text style={styles.seeAll}>Lihat Semua</Text></TouchableOpacity>
          </View>
          {stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((item: any) => (
              <View key={item.id} style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.serviceName}>{item.service}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                  </View>
                  <Text style={styles.transactionDate}>{item.date}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Belum ada transaksi</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  subGreeting: { fontSize: 14, color: '#7F8C8D', marginTop: 2 },
  notificationButton: { position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#F44336', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, width: '47%', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3 },
  statIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#2C3E50' },
  statTitle: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  section: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  seeAll: { color: '#4CAF50', fontSize: 14, fontWeight: '500' },
  transactionItem: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  transactionInfo: { flex: 1 },
  customerName: { fontSize: 16, fontWeight: '600', color: '#2C3E50' },
  serviceName: { fontSize: 13, color: '#7F8C8D', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginBottom: 4 },
  statusText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  transactionDate: { fontSize: 11, color: '#7F8C8D' },
  emptyContainer: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 14, color: '#7F8C8D' },
});