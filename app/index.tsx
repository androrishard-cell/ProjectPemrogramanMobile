import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🧺</Text>
        <Text style={styles.title}>Laundry Pro</Text>
        <Text style={styles.subtitle}>Manajemen Laundry Mudah & Cepat</Text>
      </View>
      <Text style={styles.version}>Versi 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center' },
  icon: { fontSize: 60, marginBottom: 12 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  version: { position: 'absolute', bottom: 40, color: 'rgba(255,255,255,0.6)', fontSize: 12 },
});