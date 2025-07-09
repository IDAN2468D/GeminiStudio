import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

const AboutScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gemini Agent</Text>
      <Text style={styles.version}>גרסה: v1.0.0</Text>
      <Text style={styles.desc}>אפליקציית צ'אט עם Gemini AI מבית Google</Text>
      <TouchableOpacity onPress={() => Linking.openURL('https://github.com/idan')} style={styles.linkBtn}>
        <Text style={styles.link}>לגיטהאב של המפתח</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://linkedin.com/in/idan')} style={styles.linkBtn}>
        <Text style={styles.link}>לינקדאין</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => Linking.openURL('https://yourapp.com/terms')} style={styles.linkBtn}>
        <Text style={styles.link}>תנאי שימוש</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#2563EB', marginBottom: 12 },
  version: { fontSize: 16, color: '#888', marginBottom: 8 },
  desc: { fontSize: 16, color: '#111827', marginBottom: 24 },
  linkBtn: { marginBottom: 12 },
  link: { color: '#2563EB', fontSize: 16 },
});

export default AboutScreen;
