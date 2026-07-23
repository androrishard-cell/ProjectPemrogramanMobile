import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getTransaction, updateTransactionStatus, deleteTransaction, Transaction } from '../../services/firestoreService';
import { notifyTransactionStatus } from '../../services/notificationService';
import { getCurrentUser, isAdmin } from '../../services/authService';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    loadUser();
    if (id) loadTransaction(id);
  }, [id]);

  const loadUser = async () => {
    const user = await getCurrentUser();
    setIsUserAdmin(isAdmin(user));
  };

  const loadTransaction = async (transactionId: string) => {
    try {
      setLoading(true);
      const data = await getTransaction(transactionId);
      setTransaction(data);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!transaction) return;
    try {
      await updateTransactionStatus(id, newStatus);
      await notifyTransactionStatus(id, transaction.customerName, newStatus);
      Alert.alert('Berhasil', `Status diubah menjadi ${newStatus}`);
      loadTransaction(id);
    } catch (error) {
      Alert.alert('Error', 'Gagal mengubah status');
    }
  };

  const handleDelete = () => {
    Alert.alert('Hapus Transaksi', 'Apakah Anda yakin ingin menghapus transaksi ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: async () => {
        try {
          setDeleting(true);
          await deleteTransaction(id);
          Alert.alert('Berhasil', 'Transaksi berhasil dihapus');
          router.back();
        } catch (error) {
          Alert.alert('Error', 'Gagal menghapus transaksi');
        } finally {
          setDeleting(false);
        }
      }},
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Menunggu': return '#FF9800';
      case 'Diproses': return '#2196F3';
      case 'Selesai': return '#4CAF50';
      case 'Diambil': return '#9C27B0';
      default: return '#7F8C8D';
    }
  };

  const generateQR = () => {
    const qrData = `transaction:${transaction?.id}`;
    Alert.alert('QR Code Transaksi', qrData, [
      { text: 'OK' },
      { text: 'Salin', onPress: () => Alert.alert('Berhasil', 'QR Code disalin') }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Memuat detail...</Text>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#CCC" />
        <Text style={styles.loadingText}>Transaksi tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
              <Text style={styles.statusText}>{transaction.status}</Text>
            </View>
          </View>
          <Text style={styles.transactionId}>ID: {transaction.id}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Pelanggan</Text>
          <View style={styles.infoRow}><Ionicons name="person" size={20} color="#7F8C8D" /><Text style={styles.infoText}>{transaction.customerName}</Text></View>
          <View style={styles.infoRow}><Ionicons name="call" size={20} color="#7F8C8D" /><Text style={styles.infoText}>{transaction.phone || '-'}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detail Layanan</Text>
          <View style={styles.infoRow}><Ionicons name="shirt" size={20} color="#7F8C8D" /><Text style={styles.infoText}>{transaction.service}</Text></View>
          <View style={styles.infoRow}><Ionicons name="scale" size={20} color="#7F8C8D" /><Text style={styles.infoText}>{transaction.weight} kg</Text></View>
          <View style={styles.infoRow}><Ionicons name="cash" size={20} color="#7F8C8D" /><Text style={styles.infoText}>Rp {transaction.price.toLocaleString()}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informasi Tambahan</Text>
          <View style={styles.infoRow}><Ionicons name="calendar" size={20} color="#7F8C8D" /><Text style={styles.infoText}>{transaction.date}</Text></View>
          {transaction.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Catatan:</Text>
              <Text style={styles.notesText}>{transaction.notes}</Text>
            </View>
          )}
          {transaction.imageUrl && (
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>Bukti/Foto:</Text>
              <Image source={{ uri: transaction.imageUrl }} style={styles.detailImage} />
            </View>
          )}
        </View>

        {isUserAdmin && (
          <View style={styles.statusButtons}>
            <Text style={styles.statusButtonsLabel}>Ubah Status:</Text>
            <View style={styles.statusButtonRow}>
              {['Menunggu', 'Diproses', 'Selesai', 'Diambil'].map((status) => (
                <TouchableOpacity key={status} style={[styles.statusButton, transaction.status === status && styles.statusButtonActive]} onPress={() => updateStatus(status)}>
                  <Text style={[styles.statusButtonText, transaction.status === status && styles.statusButtonTextActive]}>{status}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push(`/transaction/edit?id=${transaction.id}`)}>
            <Ionicons name="create" size={20} color="#FFFFFF" /><Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.qrButton} onPress={generateQR}>
            <Ionicons name="qr-code" size={20} color="#FFFFFF" /><Text style={styles.actionButtonText}>QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
            {deleting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <><Ionicons name="trash" size={20} color="#FFFFFF" /><Text style={styles.actionButtonText}>Hapus</Text></>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#7F8C8D' },
  header: { backgroundColor: '#FFFFFF', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', alignItems: 'center' },
  statusContainer: { marginBottom: 8 },
  statusBadge: { paddingHorizontal: 20, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  transactionId: { fontSize: 12, color: '#7F8C8D' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2C3E50', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoText: { fontSize: 15, color: '#2C3E50', marginLeft: 12 },
  notesContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  notesLabel: { fontSize: 14, fontWeight: '500', color: '#2C3E50', marginBottom: 4 },
  notesText: { fontSize: 14, color: '#7F8C8D', lineHeight: 20 },
  imageContainer: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  imageLabel: { fontSize: 14, fontWeight: '500', color: '#2C3E50', marginBottom: 8 },
  detailImage: { width: '100%', height: 200, borderRadius: 10, resizeMode: 'cover' },
  statusButtons: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginTop: 16 },
  statusButtonsLabel: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 12 },
  statusButtonRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8, marginBottom: 8 },
  statusButtonActive: { backgroundColor: '#4CAF50' },
  statusButtonText: { fontSize: 14, color: '#7F8C8D' },
  statusButtonTextActive: { color: '#FFFFFF' },
  actionContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 24, gap: 12 },
  editButton: { flex: 1, flexDirection: 'row', backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  qrButton: { flex: 1, flexDirection: 'row', backgroundColor: '#9C27B0', borderRadius: 10, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  deleteButton: { flex: 1, flexDirection: 'row', backgroundColor: '#F44336', borderRadius: 10, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', gap: 8 },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});