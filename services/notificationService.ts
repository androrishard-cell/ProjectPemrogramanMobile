// services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    Alert.alert('Error', 'Push notification hanya tersedia di perangkat fisik');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert('Error', 'Izin notifikasi ditolak');
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '';
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

export const sendNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      } as Notifications.NotificationTriggerInput,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const notifyTransactionStatus = async (
  transactionId: string,
  customerName: string,
  status: string
): Promise<void> => {
  const statusMap: Record<string, string> = {
    'Menunggu': '📋 dalam antrian',
    'Diproses': '👕 sedang diproses',
    'Selesai': '✅ telah selesai',
    'Diambil': '📦 telah diambil',
  };

  const statusText = statusMap[status] || status;
  await sendNotification(
    'Status Pesanan Berubah',
    `Halo ${customerName}, pesanan Anda ${statusText}`,
    { transactionId, status }
  );
};

export const setupNotificationListener = (
  onNotification: (data: Record<string, any>) => void
): (() => void) => {
  const notificationListener = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('Notification received:', notification);
    }
  );

  const responseListener = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data.transactionId) {
        onNotification(data);
      }
    }
  );

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
};