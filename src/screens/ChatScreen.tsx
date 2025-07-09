import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, ToastAndroid, Image } from 'react-native'; // Added Image
import { RouteProp, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker'; // Added import
import { saveToHistory } from '../utils/storage';
import { GEMINI_API_KEY } from '@env';
import Clipboard from '@react-native-clipboard/clipboard';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'gemini';
  imageUri?: string; // Added optional imageUri
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ uri: string; base64: string } | null>(null); // Added state for selected image
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // API key is now imported from .env
  if (!GEMINI_API_KEY) {
    console.error('API Key is not set in .env file');
  }

  React.useEffect(() => {
    const loadMessages = async () => {
      try {
        const saved = await AsyncStorage.getItem('chat_messages');
        if (saved) setMessages(JSON.parse(saved));
      } catch {}
    };
    loadMessages();
  }, []);

  React.useEffect(() => {
    AsyncStorage.setItem('chat_messages', JSON.stringify(messages));
  }, [messages]);

  const selectImage = () => { // Added image selection function
    launchImageLibrary({ mediaType: 'photo', includeBase64: true }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const asset = response.assets[0];
        if (asset.uri && asset.base64) {
          setSelectedImage({ uri: asset.uri, base64: asset.base64 });
        }
      }
    });
  };

  const sendMessage = async () => {
    if (!input.trim() && !selectedImage) return; // Allow sending only image

    const userMsg: Message = {
      id: Date.now() + '',
      text: input,
      sender: 'user',
      imageUri: selectedImage?.uri, // Include imageUri in message
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSelectedImage(null); // Clear selected image after sending
    setLoading(true);

    try {
      // Save user message to history
      await saveToHistory({
        type: 'chat',
        content: `שאלה: ${input}`,
      });

      const parts: any[] = [];
      if (selectedImage) {
        // Remove base64 prefix if exists
        let base64Data = selectedImage.base64;
        if (base64Data.startsWith('data:')) {
          base64Data = base64Data.substring(base64Data.indexOf(',') + 1);
        }
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Data,
          },
        });
      }
      if (input.trim()) {
        parts.push({ text: input });
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }] }),
      });

      if (!res.ok) {
        setMessages((prev) => [...prev, { id: Date.now() + 'e', text: 'שגיאה בשרת Gemini: ' + res.status, sender: 'gemini' }]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const geminiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!geminiText) {
        setMessages((prev) => [...prev, { id: Date.now() + 'e', text: 'שגיאה בתשובה מהשרת. נסה שוב מאוחר יותר.', sender: 'gemini' }]);
        console.error('API response error:', data);
      } else {
        const geminiMsg: Message = { id: Date.now() + 'g', text: String(geminiText), sender: 'gemini' };
        setMessages((prev) => [...prev, geminiMsg]);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

        // Save bot response to history
        await saveToHistory({
          type: 'chat',
          content: `תשובה: ${geminiText}`,
        });
      }
    } catch (e) {
      setMessages((prev) => [...prev, { id: Date.now() + 'e', text: 'שגיאה בשליחה: ' + (e instanceof Error ? e.message : ''), sender: 'gemini' }]);
      console.error('Error sending message (fetch failed):', e);
    } finally {
      setLoading(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
    // ל-iOS אפשר להוסיף ספריית טוסט בעתיד
  };

  const handleDeleteMessage = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('ההודעה נמחקה');
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const isGemini = item.sender === 'gemini';
    const isLastGemini = isGemini && messages.filter(m => m.sender === 'gemini').slice(-1)[0]?.id === item.id;
    const BubbleView = isLastGemini ? Animated.View : View;
    return (
      <View style={{ flexDirection: item.sender === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 2 }}>
        {isGemini ? (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGemini}><Ionicons name="sparkles-outline" size={18} color="#fff" /></View>
          </View>
        ) : (
          <View style={styles.avatarContainer} />
        )}
        <BubbleView
          style={[
            styles.bubble,
            item.sender === 'user' ? styles.userBubble : styles.geminiBubble,
            isLastGemini && { opacity: fadeAnim },
            { alignSelf: item.sender === 'user' ? 'flex-end' : 'flex-start' },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => handleDeleteMessage(item.id)}
            delayLongPress={400}
          >
            <View style={{ flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              {item.imageUri && (
                <Image source={{ uri: item.imageUri }} style={[styles.chatImage, { marginBottom: 8 }]} />
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                <Text style={item.sender === 'user' ? styles.userText : styles.geminiText} selectable>{String(item.text ?? '')}</Text>
                {item.sender === 'user' && (
                  <Ionicons name="pencil-outline" size={16} color="#9ca3af" style={{ marginLeft: 4, marginTop: 2 }} />
                )}
              </View>
            </View>
          </TouchableOpacity>
          {isGemini && (
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Clipboard.setString(item.text);
                showToast('הועתק!');
              }}
            >
              <Ionicons name="copy-outline" size={16} color="#2563EB" style={{ marginRight: 2 }} />
            </TouchableOpacity>
          )}
          <Text style={styles.timeText}>{new Date(Number(item.id.replace(/\D/g, ''))).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</Text>
        </BubbleView>
        {item.sender === 'user' ? (
          <View style={styles.avatarContainer}>
            <View style={styles.avatarUser}><Ionicons name="person" size={18} color="#2563EB" /></View>
          </View>
        ) : (
          <View style={styles.avatarContainer} />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.bg} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>צ'אט עם Gemini</Text>
        <TouchableOpacity
          style={styles.topBarCopyButton}
          onPress={() => {
            const allGeminiText = messages.filter(m => m.sender === 'gemini').map(m => m.text).join('\n\n');
            // Clipboard.setString(allGeminiText);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="copy-outline" size={22} color="#fff" />
            <Text style={styles.topBarCopyText}>העתק</Text>
          </View>
        </TouchableOpacity>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item, index }) => renderItem({ item, index })}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {loading && (
        <View style={styles.typingIndicator}><Text style={styles.typingText}>Gemini מקליד</Text><ActivityIndicator size="small" color="#2563EB" /></View>
      )}
      {selectedImage && ( // Display selected image preview
        <View style={styles.selectedImageContainer}>
          <Image source={{ uri: selectedImage.uri }} style={styles.selectedImagePreview} />
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.removeImageButton}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.inputRow}>
        <TouchableOpacity onPress={selectImage} style={styles.imageButton}> 
          <Ionicons name="image-outline" size={24} color="#2563EB" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="כתוב הודעה..."
          editable={!loading}
          onSubmitEditing={sendMessage}
          blurOnSubmit={false}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={loading || (!input.trim() && !selectedImage)}> 
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.clearButtonBottom} onPress={() => setMessages([])}>
          <Text style={styles.clearButtonText}>נקה</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#f0f4fa', // רקע עדין
  },
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 80 },
  avatarContainer: { width: 32, alignItems: 'center' },
  avatarGemini: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
    // אין שימוש בתמונה, רק אייקון
  },
  avatarUser: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#2563EB', alignItems: 'center', justifyContent: 'center',
  },
  topBar: {
    height: 80, // הגדלה משמעותית של גובה הטאב העליון
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20, // הגדלת רווח עליון
    borderBottomWidth: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 0,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 24, // הגדלת גודל כותרת
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    textAlign: 'center',
  },
  topBarCopyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  topBarCopyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  clearButton: {
    display: 'none', // הסתרה של הכפתור למעלה
  },
  clearButtonBottom: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
    marginLeft: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  bubble: {
    minWidth: 0,
    maxWidth: '60%',
    marginVertical: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    backgroundColor: '#fff',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#F3F4F6',
    borderTopRightRadius: 8,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 0,
    maxWidth: '60%',
  },
  geminiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8EDFB',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 16,
    minWidth: 0,
    maxWidth: '60%',
  },
  userText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  geminiText: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'right',
    minHeight: 20,
    minWidth: 10,
    maxWidth: '100%',
    writingDirection: 'rtl',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderWidth: 0,
  },
  sendButton: {
    backgroundColor: '#2563EB',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, marginBottom: 8 },
  typingText: { marginRight: 8, color: '#2563EB' },
  copyButton: {
    marginTop: 4,
    alignSelf: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  timeText: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  clearButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  imageButton: { // Added style for image button
    padding: 8,
    marginRight: 8,
  },
  chatImage: { // Added style for image in chat bubble
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 8,
  },
  selectedImageContainer: { // Added style for selected image preview container
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  selectedImagePreview: { // Added style for selected image preview
    width: 50,
    height: 50,
    borderRadius: 5,
    marginRight: 8,
  },
  removeImageButton: { // Added style for remove image button
    padding: 4,
  },
});

export default ChatScreen;
