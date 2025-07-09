import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, TouchableOpacity, ScrollView, ToastAndroid, Platform } from 'react-native';
import axios from 'axios';
import { GEMINI_API_KEY } from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { saveToHistory } from '../utils/storage';
import Clipboard from '@react-native-clipboard/clipboard';

export default function StoryGeneratorScreen() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'song' | 'story'>('story');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const sendPromptToGemini = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    let prompt = '';
    if (mode === 'song') {
      prompt = `כתוב לי שיר בנושא: ${input}`;
    } else {
      prompt = `כתוב לי סיפור קצר בנושא: ${input}`;
    }
    try {
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        }
      );
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'לא התקבלה תשובה';
      setResult(text);
      // Save to history
      await saveToHistory({
        type: 'story',
        content: `נושא: ${input}\n---\n${text}`,
      });
    } catch (e: any) {
      setResult('שגיאה בשליחה ל-Gemini: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (result) {
      Clipboard.setString(result);
      setCopied(true);
      if (Platform.OS === 'android') {
        ToastAndroid.show('הטקסט הועתק', ToastAndroid.SHORT);
      }
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <View style={styles.bg}>
      <View style={styles.headerBox}>
        <Ionicons name="create-outline" size={32} color="#2563EB" style={{ marginBottom: 8 }} />
        <Text style={styles.title}>מחולל שירים / סיפורים קצרים</Text>
        <Text style={styles.subtitle}>הזן נושא, בחר סוג, וקבל יצירה מקורית מ-Gemini</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'story' && styles.modeButtonActive]}
            onPress={() => setMode('story')}
            activeOpacity={0.8}
          >
            <Ionicons name="book-outline" size={20} color={mode === 'story' ? '#fff' : '#2563EB'} />
            <Text style={[styles.modeButtonText, mode === 'story' && { color: '#fff' }]}>סיפור קצר</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'song' && styles.modeButtonActive]}
            onPress={() => setMode('song')}
            activeOpacity={0.8}
          >
            <Ionicons name="musical-notes-outline" size={20} color={mode === 'song' ? '#fff' : '#2563EB'} />
            <Text style={[styles.modeButtonText, mode === 'song' && { color: '#fff' }]}>שיר</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="הכנס נושא או רעיון..."
          value={input}
          onChangeText={setInput}
          multiline
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.generateButton} onPress={sendPromptToGemini} activeOpacity={0.85}>
          <Ionicons name="sparkles-outline" size={22} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.generateButtonText}>{mode === 'song' ? 'צור שיר' : 'צור סיפור קצר'}</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator style={{ marginTop: 16 }} />}
        {result && (
          <View style={styles.resultBox}>
            <ScrollView>
              <Text selectable style={styles.resultText}>{result}</Text>
            </ScrollView>
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy} activeOpacity={0.8}>
              <Ionicons name="copy-outline" size={20} color="#2563EB" />
              <Text style={styles.copyButtonText}>העתק</Text>
            </TouchableOpacity>
            {copied && <Text style={styles.copiedMsg}>הטקסט הועתק!</Text>}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    backgroundColor: '#F3F6FA',
    padding: 0,
  },
  headerBox: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'System',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#2563EB',
    marginHorizontal: 6,
    backgroundColor: '#fff',
  },
  modeButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  modeButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'System',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    minHeight: 48,
    fontSize: 16,
    backgroundColor: '#F8FAFC',
    fontFamily: 'System',
    color: '#222',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  generateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'System',
  },
  resultBox: {
    backgroundColor: '#F8FAFC',
    padding: 14,
    marginTop: 16,
    borderRadius: 10,
    minHeight: 80,
    maxHeight: 260,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  resultText: {
    fontSize: 16,
    color: '#222',
    fontFamily: 'System',
    lineHeight: 24,
    textAlign: 'right',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E0E7FF',
  },
  copyButtonText: {
    color: '#2563EB',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  copiedMsg: {
    color: '#10B981',
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'right',
  },
}); 