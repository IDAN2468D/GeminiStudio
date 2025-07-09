import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StatusBar,
  Platform,
  ToastAndroid,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { getHistory, HistoryItem, clearHistory } from '../utils/storage';
import Ionicons from 'react-native-vector-icons/Ionicons';
import RNFetchBlob from 'rn-fetch-blob';
import Clipboard from '@react-native-clipboard/clipboard';

const HistoryScreen = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadHistory = async () => {
    const items = await getHistory();
    setHistory(items);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setHistory([]);
  };

  const requestStoragePermission = async () => {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
            {
              title: 'הרשאת גישה לתמונות',
              message: 'האפליקציה צריכה גישה לתמונות כדי לשמור את התמונה',
              buttonNeutral: 'שאל אותי מאוחר יותר',
              buttonNegative: 'בטל',
              buttonPositive: 'אשר',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
          const granted = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ]);
          return (
            granted['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
            granted['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED
          );
        }
      }
      return true;
    } catch (err) {
      console.warn('Error requesting permission:', err);
      return false;
    }
  };

  const downloadImage = async (imageUrl: string) => {
    if (isDownloading) {
      ToastAndroid.show('הורדה כבר מתבצעת, אנא המתן', ToastAndroid.SHORT);
      return;
    }

    try {
      setIsDownloading(true);
      const hasPermission = await requestStoragePermission();
      if (!hasPermission) {
        ToastAndroid.show('נדרשת הרשאה לשמירת תמונות', ToastAndroid.SHORT);
        return;
      }
      ToastAndroid.show('מתחיל הורדה...', ToastAndroid.SHORT);
      const date = new Date();
      const fileName = `gemini_studio_${Math.floor(date.getTime())}.png`;
      const { dirs } = RNFetchBlob.fs;
      const dirToSave = Platform.select({
        ios: dirs.DocumentDir,
        android: dirs.DownloadDir,
      });
      const filePath = `${dirToSave}/${fileName}`;
      if (imageUrl.startsWith('http')) {
        // הורדה רגילה
        const configOptions = {
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: 'הורדת תמונה',
            description: 'מוריד את התמונה...',
            mime: 'image/png',
            path: filePath,
            mediaScannable: true,
          },
        };
        const response = await RNFetchBlob.config(configOptions)
          .fetch('GET', imageUrl)
          .catch((error) => {
            console.error('Download error:', error);
            ToastAndroid.show('שגיאה בהורדה: ' + error.message, ToastAndroid.LONG);
            throw new Error('שגיאה בהורדת התמונה');
          });
        if (response.info().status === 200) {
          ToastAndroid.show('התמונה נשמרה בהצלחה בתיקיית ההורדות', ToastAndroid.LONG);
        } else {
          throw new Error(`שגיאה בהורדה: ${response.info().status}`);
        }
      } else if (imageUrl.startsWith('data:image')) {
        // שמירה מ-base64
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        await RNFetchBlob.fs.writeFile(filePath, base64Data, 'base64');
        ToastAndroid.show('התמונה נשמרה בהצלחה בתיקיית ההורדות', ToastAndroid.LONG);
      } else {
        ToastAndroid.show('פורמט תמונה לא נתמך', ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Download failed:', error);
      Alert.alert(
        'שגיאה בהורדה',
        'לא הצלחנו להוריד את התמונה. אנא נסה שוב מאוחר יותר.',
        [{ text: 'אישור', style: 'default' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.itemContainer}>
      {item.type === 'image' ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.content }} style={styles.image} />
          <TouchableOpacity 
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={() => downloadImage(item.content)}
            disabled={isDownloading}
          >
            <Ionicons 
              name={isDownloading ? "time-outline" : "download-outline"} 
              size={24} 
              color="#2563EB" 
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <Text style={styles.chatText}>{item.content}</Text>
          <TouchableOpacity
            style={styles.copyBelowButton}
            onPress={() => {
              Clipboard.setString(item.content);
              if (Platform.OS === 'android') {
                ToastAndroid.show('הועתק!', ToastAndroid.SHORT);
              }
            }}
          >
            <Ionicons name="copy-outline" size={20} color="#2563EB" />
            <Text style={styles.copyBelowButtonText}>העתק</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={styles.timestamp}>{item.timestamp}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>היסטוריה</Text>
        <TouchableOpacity onPress={handleClearHistory} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>נקה היסטוריה</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>אין פריטים בהיסטוריה</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    backgroundColor: '#f3f6fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 8,
    textAlign: 'right',
  },
  itemType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
    textAlign: 'right',
  },
  prompt: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
    textAlign: 'right',
  },
  content: {
    fontSize: 14,
    color: '#1f2937',
    textAlign: 'right',
  },
  historyImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#e5e7eb',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6b7280',
    marginTop: 32,
  },
  downloadButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  chatContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    minHeight: 60,
    position: 'relative',
  },
  chatText: {
    // Add appropriate styles for chat text
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  copyBelowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#E0E7FF',
    elevation: 2,
    shadowColor: '#2563EB',
    shadowOpacity: 0.10,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  copyBelowButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
});

export default HistoryScreen;
