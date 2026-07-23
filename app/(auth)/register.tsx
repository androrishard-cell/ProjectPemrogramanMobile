import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerUser } from '../../services/authService';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Semua field harus diisi');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Password tidak cocok');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter');
      return;
    }

    setLoading(true);
    const result = await registerUser(name, email, password, 'user');
    setLoading(false);

    if (result.success) {
      Alert.alert('Berhasil', 'Akun berhasil dibuat! Silakan login.', [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert('Gagal', result.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.icon}>📝</Text>
            <Text style={styles.title}>Daftar Akun</Text>
            <Text style={styles.subtitle}>Buat akun baru untuk memulai</Text>
          </View>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput style={styles.input} placeholder="Masukkan nama lengkap" placeholderTextColor="#999"
                value={name} onChangeText={setName} editable={!loading} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput style={styles.input} placeholder="Masukkan email" placeholderTextColor="#999"
                value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} placeholder="Minimal 6 karakter" placeholderTextColor="#999"
                value={password} onChangeText={setPassword} secureTextEntry editable={!loading} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Konfirmasi Password</Text>
              <TextInput style={styles.input} placeholder="Ulangi password" placeholderTextColor="#999"
                value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry editable={!loading} />
            </View>
            <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.registerButtonText}>Daftar</Text>}
            </TouchableOpacity>
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Sudah punya akun? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  keyboardView: { flex: 1, paddingHorizontal: 24 },
  header: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
  icon: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50' },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginTop: 4 },
  form: { marginBottom: 40 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C3E50', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, backgroundColor: '#F8F9FA' },
  registerButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  registerButtonDisabled: { opacity: 0.7 },
  registerButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#7F8C8D', fontSize: 14 },
  loginLink: { color: '#4CAF50', fontSize: 14, fontWeight: '600' },
});