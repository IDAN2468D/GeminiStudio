import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PermissionsAndroid,
  ToastAndroid,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { GEMINI_API_KEY } from '@env';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import { generateResponse } from '../utils/gemini';

const audioRecorderPlayer = new AudioRecorderPlayer();

const LiveAudioScreen = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [playTime, setPlayTime] = useState('00:00');
  const [playDuration, setPlayDuration] = useState('00:00');
  const [recordPath, setRecordPath] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if API key is set
    if (!GEMINI_API_KEY) {
      setError('API Key לא מוגדר. אנא הגדר את ה-API Key בקובץ .env');
    }
    
    return () => {
      if (isRecording) {
        onStopRecord();
      }
      if (isPlaying) {
        onStopPlay();
      }
    };
  }, []);

  const requestAudioPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'הרשאת הקלטת שמע',
            message: 'האפליקציה צריכה גישה למיקרופון כדי להקליט שמע',
            buttonNeutral: 'שאל אותי מאוחר יותר',
            buttonNegative: 'בטל',
            buttonPositive: 'אשר',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } catch (err) {
      console.warn('Error requesting audio permission:', err);
      return false;
    }
  };

  const processAudioWithAI = useCallback(async () => {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('API Key לא מוגדר. אנא הגדר את ה-API Key בקובץ .env');
      }

      setIsProcessing(true);
      setError('');
      
      Alert.alert(
        'שליחת הקלטה ל-Gemini AI',
        'כרגע, אנחנו יכולים להשתמש במודל gemini-pro לעיבוד טקסט. בחר את השאלה שתרצה לשאול:',
        [
          { 
            text: 'מה המשמעות של החיים?',
            onPress: async () => await sendToGemini("מה המשמעות של החיים?")
          },
          {
            text: 'איך להיות מאושר?',
            onPress: async () => await sendToGemini("איך אפשר להיות מאושר יותר בחיים?")
          },
          {
            text: 'טיפים ללמידה',
            onPress: async () => await sendToGemini("תן לי 5 טיפים ללמידה יעילה יותר")
          },
          {
            text: 'ביטול',
            style: 'cancel'
          }
        ]
      );
    } catch (error: any) {
      console.error('AI processing error:', error);
      setError('שגיאה בעיבוד השמע: ' + (error.message || 'שגיאה לא ידועה'));
      setIsProcessing(false);
    }
  }, []);

  const sendToGemini = async (text: string) => {
    try {
      const response = await generateResponse(text);
      setAiResponse(response);
    } catch (error: any) {
      console.error('Gemini API error:', error);
      setError(error.message || 'שגיאה לא ידועה בקבלת תשובה מ-Gemini');
    } finally {
      setIsProcessing(false);
    }
  };

  const onStartRecord = async () => {
    try {
      const hasPermission = await requestAudioPermission();
      if (!hasPermission) {
        ToastAndroid.show('נדרשת הרשאת מיקרופון להקלטה', ToastAndroid.SHORT);
        return;
      }

      setError('');
      setAiResponse('');

      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,
        AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: AVEncodingOption.aac,
      };

      const timestamp = new Date().getTime();
      const path = Platform.select({
        ios: `recording_${timestamp}.m4a`,
        android: `sdcard/Download/recording_${timestamp}.mp3`,
      });

      const result = await audioRecorderPlayer.startRecorder(path, audioSet);
      audioRecorderPlayer.addRecordBackListener((e) => {
        const time = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        setRecordTime(time.slice(0, 5));
      });

      setRecordPath(result);
      setIsRecording(true);
      ToastAndroid.show('מתחיל הקלטה...', ToastAndroid.SHORT);
    } catch (error: any) {
      console.error('Recording error:', error);
      ToastAndroid.show('שגיאה בהקלטה', ToastAndroid.SHORT);
      setError('שגיאה בהקלטה: ' + (error.message || 'שגיאה לא ידועה'));
    }
  };

  const onStopRecord = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setRecordTime('00:00');
      setIsRecording(false);
      
      Alert.alert(
        'ההקלטה הושלמה',
        'האם תרצה לשלוח את ההקלטה ל-Gemini AI? (שים לב: כרגע נשלח טקסט לדוגמה במקום ההקלטה)',
        [
          { text: 'לא', style: 'cancel' },
          { text: 'כן', onPress: () => processAudioWithAI() }
        ]
      );
    } catch (error: any) {
      console.error('Stop recording error:', error);
      ToastAndroid.show('שגיאה בעצירת ההקלטה', ToastAndroid.SHORT);
      setError('שגיאה בעצירת ההקלטה: ' + (error.message || 'שגיאה לא ידועה'));
    }
  };

  const onStartPlay = async () => {
    try {
      if (!recordPath) {
        ToastAndroid.show('אין הקלטה זמינה להשמעה', ToastAndroid.SHORT);
        return;
      }

      const msg = await audioRecorderPlayer.startPlayer(recordPath);
      audioRecorderPlayer.addPlayBackListener((e) => {
        if (e.currentPosition === e.duration) {
          onStopPlay();
          return;
        }
        const playTimeStr = audioRecorderPlayer.mmssss(Math.floor(e.currentPosition));
        const durationStr = audioRecorderPlayer.mmssss(Math.floor(e.duration));
        setPlayTime(playTimeStr.slice(0, 5));
        setPlayDuration(durationStr.slice(0, 5));
      });

      setIsPlaying(true);
      console.log('Started playing:', msg);
    } catch (error: any) {
      console.error('Play error:', error);
      ToastAndroid.show('שגיאה בהשמעת ההקלטה', ToastAndroid.SHORT);
      setError('שגיאה בהשמעה: ' + (error.message || 'שגיאה לא ידועה'));
    }
  };

  const onStopPlay = async () => {
    try {
      await audioRecorderPlayer.stopPlayer();
      audioRecorderPlayer.removePlayBackListener();
      setPlayTime('00:00');
      setIsPlaying(false);
    } catch (error: any) {
      console.error('Stop play error:', error);
      ToastAndroid.show('שגיאה בעצירת ההשמעה', ToastAndroid.SHORT);
      setError('שגיאה בעצירת ההשמעה: ' + (error.message || 'שגיאה לא ידועה'));
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      await onStartRecord();
    } else {
      await onStopRecord();
    }
  };

  const togglePlaying = async () => {
    if (!isPlaying) {
      await onStartPlay();
    } else {
      await onStopPlay();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor="#fff"
        barStyle="dark-content"
      />
      <View style={styles.header}>
        <Text style={styles.title}>הקלטה חיה</Text>
        <Text style={styles.subtitle}>* כרגע בגרסת בטא - תמיכה בהקלטות שמע תתווסף בקרוב</Text>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.timer}>{isRecording ? recordTime : playTime}</Text>
        {isPlaying && <Text style={styles.duration}>משך: {playDuration}</Text>}
        
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordingButton]}
          onPress={toggleRecording}
          disabled={isPlaying || isProcessing}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
        
        {recordPath && !isRecording && (
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playingButton]}
            onPress={togglePlaying}
            disabled={isProcessing}
          >
            <Ionicons
              name={isPlaying ? 'stop' : 'play'}
              size={30}
              color="#fff"
            />
          </TouchableOpacity>
        )}

        <Text style={styles.statusText}>
          {isRecording ? 'מקליט...' : 
           isPlaying ? 'משמיע...' :
           isProcessing ? 'מעבד את ההקלטה...' :
           recordPath ? 'לחץ להשמעת ההקלטה האחרונה' : 
           'לחץ להתחלת הקלטה'}
        </Text>

        {isProcessing && (
          <ActivityIndicator size="large" color="#2563EB" style={styles.loader} />
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : aiResponse ? (
          <View style={styles.responseContainer}>
            <Text style={styles.responseTitle}>תשובת Gemini AI:</Text>
            <Text style={styles.responseText}>{aiResponse}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2563EB',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 20,
  },
  recordingButton: {
    backgroundColor: '#DC2626',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 20,
  },
  playingButton: {
    backgroundColor: '#DC2626',
  },
  statusText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 10,
  },
  duration: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
  },
  loader: {
    marginVertical: 20,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'right',
  },
  responseContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  responseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 8,
    textAlign: 'right',
  },
  responseText: {
    color: '#1F2937',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
});

export default LiveAudioScreen; 