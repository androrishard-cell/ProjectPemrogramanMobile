import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { storage } from '../firebase/firebase';

export const requestPermissions = async (): Promise<boolean> => {
  try {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan izin kamera');
      return false;
    }

    const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!galleryPermission.granted) {
      Alert.alert('Izin Diperlukan', 'Aplikasi membutuhkan izin galeri');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Gagal mengambil foto');
    return null;
  }
};

export const pickImage = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Gagal memilih gambar');
    return null;
  }
};

export const uploadImage = async (imageUri: string, path: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    Alert.alert('Error', 'Gagal upload gambar');
    return null;
  }
};

export const uploadTransactionImage = async (transactionId: string, imageUri: string): Promise<string | null> => {
  const path = `transactions/${transactionId}/${Date.now()}.jpg`;
  return await uploadImage(imageUri, path);
};

export const uploadCustomerImage = async (customerId: string, imageUri: string): Promise<string | null> => {
  const path = `customers/${customerId}/${Date.now()}.jpg`;
  return await uploadImage(imageUri, path);
};