import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getCurrentUser, logoutUser, UserProfile } from '../../services/authService';
import { useTheme } from '../../contexts/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme, isDark, colors } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUser(); }, []);

  const loadUser = async () => {
    setLoading(true);
    const userData = await getCurrentUser();
    setUser(userData);
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert('Keluar', 'Apakah Anda yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: async () => {
        const result = await logoutUser();
        if (result.success) {
          router.replace('/(auth)/login');
        } else {
          Alert.alert('Error', result.error);
        }
      }},
    ]);
  };

  const handleMenuPress = (id: number) => {
    switch (id) {
      case 3: router.push('/(tabs)/history'); break;
      case 4: router.push('/location'); break;
      case 5: router.push('/qr-scanner'); break;
      default: Alert.alert('Info', 'Fitur ini sedang dalam pengembangan');
    }
  };

  const menuItems = [
    { id: 1, title: 'Edit Profil', icon: 'person-outline', color: '#2196F3' },
    { id: 2, title: 'Pengaturan', icon: 'settings-outline', color: '#FF9800' },
    { id: 3, title: 'Riwayat Transaksi', icon: 'time-outline', color: '#4CAF50' },
    { id: 4, title: 'Mode Gelap', icon: 'moon-outline', color: '#607D8B', isSwitch: true },
    { id: 5, title: 'Outlet Terdekat', icon: 'location-outline', color: '#4CAF50' },
    { id: 6, title: 'Scan QR', icon: 'qr-code-outline', color: '#9C27B0' },
    { id: 7, title: 'Bantuan', icon: 'help-circle-outline', color: '#9C27B0' },
    { id: 8, title: 'Tentang Aplikasi', icon: 'information-circle-outline', color: '#607D8B' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
          </View>
          <View style={[styles.roleBadge, user?.role === 'admin' ? styles.adminBadge : styles.userBadge]}>
            <Text style={styles.roleBadgeText}>{user?.role === 'admin' ? 'Admin' : 'User'}</Text>
          </View>
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>
      </View>

      <View style={[styles.menuContainer, { backgroundColor: colors.card }]}>
        {menuItems.map((item) => (
          <TouchableOpacity key={item.id} style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={() => {
            if (item.isSwitch) { toggleTheme(); } else { handleMenuPress(item.id); }
          }}>
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
            </View>
            {item.isSwitch ? (
              <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: '#767577', true: '#4CAF50' }} thumbColor={isDark ? '#FFFFFF' : '#F4F3F4'} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#F44336" />
        <Text style={styles.logoutText}>Keluar</Text>
      </TouchableOpacity>

      <Text style={[styles.version, { color: colors.textSecondary }]}>Laundry Pro v1.0.0</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F6FA' },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 32, borderBottomWidth: 1 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: 'bold' },
  roleBadge: { position: 'absolute', bottom: -4, right: -4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, borderWidth: 2, borderColor: '#FFFFFF' },
  adminBadge: { backgroundColor: '#F44336' },
  userBadge: { backgroundColor: '#2196F3' },
  roleBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  name: { fontSize: 20, fontWeight: 'bold' },
  email: { fontSize: 14, marginTop: 4 },
  menuContainer: { borderRadius: 12, margin: 16, paddingVertical: 8 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuTitle: { fontSize: 16 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 8, paddingVertical: 14, backgroundColor: '#FFEBEE', borderRadius: 10 },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#F44336', marginLeft: 8 },
  version: { textAlign: 'center', fontSize: 12, marginTop: 24 },
});