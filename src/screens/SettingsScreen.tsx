import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [language, setLanguage] = useState('he');
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    AsyncStorage.getItem('settings').then((data) => {
      if (data) {
        const s = JSON.parse(data);
        setDarkMode(s.darkMode);
        setUsername(s.username || '');
        setLanguage(s.language || 'he');
      }
    });
  }, []);

  const saveSettings = (newSettings: any) => {
    AsyncStorage.setItem('settings', JSON.stringify(newSettings));
  };

  const handleResetHistory = () => {
    Alert.alert('איפוס היסטוריה', 'האם לאפס את כל השיחות?', [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: () => AsyncStorage.removeItem('conversations') },
    ]);
  };

  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#121212' }]}> 
      <View style={styles.row}>
        <Text style={[styles.label, darkMode && { color: '#F9FAFB' }]}>מצב כהה</Text>
        <Switch value={darkMode} onValueChange={(v) => { setDarkMode(v); saveSettings({ darkMode: v, username, language }); }} />
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, darkMode && { color: '#F9FAFB' }]}>שם משתמש</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.value}>{username || 'הגדר שם'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        <Text style={[styles.label, darkMode && { color: '#F9FAFB' }]}>שפה</Text>
        <TouchableOpacity onPress={() => setLanguage(language === 'he' ? 'en' : 'he')}>
          <Text style={styles.value}>{language === 'he' ? 'עברית' : 'English'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.resetBtn} onPress={handleResetHistory}>
        <Text style={styles.resetText}>איפוס היסטוריה</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.aboutBtn} onPress={() => navigation.navigate('About')}>
        <Text style={styles.aboutText}>אודות</Text>
      </TouchableOpacity>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>שם משתמש</Text>
            <TextInput value={username} onChangeText={setUsername} style={styles.input} />
            <TouchableOpacity onPress={() => { setModalVisible(false); saveSettings({ darkMode, username, language }); }} style={styles.saveBtn}>
              <Text style={styles.saveText}>שמור</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  label: { fontSize: 18, color: '#111827' },
  value: { fontSize: 16, color: '#2563EB' },
  resetBtn: { marginTop: 40, backgroundColor: '#2563EB', borderRadius: 20, padding: 14 },
  resetText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  aboutBtn: { marginTop: 20, alignSelf: 'center' },
  aboutText: { color: '#2563EB', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 300 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, padding: 10, marginBottom: 16 },
  saveBtn: { backgroundColor: '#2563EB', borderRadius: 10, padding: 12 },
  saveText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
});

export default SettingsScreen;
