import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet } from 'react-native';
import { Camera, useCameraDevices } from 'react-native-vision-camera';
import axios from 'axios';
import RNFetchBlob from 'rn-fetch-blob';
import { GEMINI_API_KEY } from '@env';

// TODO: Replace with your actual Gemini API key

export default function LiveAudioScreen() {
  const camera = useRef<Camera>(null);
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      await Camera.requestCameraPermission();
    })();
  }, []);

  const sendFrameToGemini = async () => {
    if (camera.current) {
      setLoading(true);
      setResult(null);
      try {
        const photo = await camera.current.takePhoto();
        // Convert image to base64
        const base64Data = await RNFetchBlob.fs.readFile(photo.path, 'base64');
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + GEMINI_API_KEY,
          {
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
          }
        );
        setResult(JSON.stringify(response.data));
      } catch (e: any) {
        setResult('שגיאה בשליחה ל-Gemini: ' + (e.response?.data ? JSON.stringify(e.response.data) : e.message));
      }
      setLoading(false);
    }
  };

  if (!device) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={camera}
        style={{ flex: 1 }}
        device={device}
        isActive={true}
        photo={true}
      />
      <Button title="צלם ושלח ל-Gemini" onPress={sendFrameToGemini} />
      {loading && <ActivityIndicator />}
      {result && (
        <View style={styles.resultBox}>
          <Text selectable>{result}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  resultBox: {
    backgroundColor: '#fff',
    padding: 10,
    margin: 10,
    borderRadius: 8,
    maxHeight: 200,
  },
});