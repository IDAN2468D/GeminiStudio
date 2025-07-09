import React from 'react';
import { View, Button, Text, ToastAndroid, Platform } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

export default function TestClipboard() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="העתק טקסט בדיקה"
        onPress={() => {
          Clipboard.setString('בדיקה');
          if (Platform.OS === 'android') {
            ToastAndroid.show('הועתק!', ToastAndroid.SHORT);
          }
        }}
      />
      <Text style={{ marginTop: 20, fontSize: 16 }}>
        לחץ על הכפתור, ואז נסה להדביק ב-WhatsApp/הערות/דפדפן
      </Text>
    </View>
  );
} 