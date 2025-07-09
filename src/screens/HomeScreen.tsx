import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateToChat = () => {
    navigation.navigate('RootTab', {
      screen: 'Chat'
    });
  };

  const navigateToSettings = () => {
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <View style={styles.gradientBackground}>
        <View style={styles.gradientOverlay} />
      </View>
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoTextContainer}>
          <Text style={styles.logoText}>Gemini</Text>
          <Text style={styles.logoTextStudio}>Studio</Text>
        </View>
      </View>

      {/* Welcome text */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>ברוכים הבאים</Text>
        <Text style={styles.subtitle}>לעוזר האישי המתקדם שלך</Text>
      </View>

      {/* Start button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={navigateToChat}
        >
          <Text style={styles.buttonText}>התחל שיחה</Text>
        </TouchableOpacity>
      </View>

      {/* Settings button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={navigateToSettings}
      >
        <Text style={styles.settingsText}>⚙️</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#2563EB',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  logoContainer: {
    width: width * 0.8,
    height: width * 0.3,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTextContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    letterSpacing: 2,
  },
  logoTextStudio: {
    fontSize: 24,
    color: '#4B5563',
    letterSpacing: 4,
    marginTop: -5,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#4B5563',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '80%',
    maxWidth: 300,
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
  },
  settingsText: {
    fontSize: 24,
  },
});

export default HomeScreen;
