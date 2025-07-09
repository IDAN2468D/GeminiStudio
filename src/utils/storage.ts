import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HistoryItem {
  id: string;
  type: 'chat' | 'image' | 'story';
  content: string;
  prompt?: string;
  timestamp: number;
}

const HISTORY_STORAGE_KEY = 'app_history';

export const saveToHistory = async (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
  try {
    // Get existing history
    const existingHistory = await getHistory();
    
    // Create new history item
    const newItem: HistoryItem = {
      ...item,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };

    // Add to history
    const updatedHistory = [newItem, ...existingHistory];
    
    // Save to storage
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
    
    return newItem;
  } catch (error) {
    console.error('Error saving to history:', error);
    throw error;
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const history = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Error getting history:', error);
    return [];
  }
};

export const clearHistory = async () => {
  try {
    await AsyncStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing history:', error);
    throw error;
  }
}; 