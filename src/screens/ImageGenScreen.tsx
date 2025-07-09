import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert } from 'react-native';
import { saveToHistory } from '../utils/storage';

// Fallback API key in case environment variable is not loaded
const API_KEY = 'AIzaSyAvIJLSIiDA1wSrnsjKIkeGPfBO-RIrTxA';

const ImageGenScreen = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Function to call Gemini Image Generation API
  const generateImage = async () => {
    setError('');
    setGeneratedImage(null);
    setSaveSuccess(false);
    if (!prompt.trim()) {
      setError('נא להזין טקסט ליצירת תמונה');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048,
              responseModalities: ["TEXT", "IMAGE"]
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.candidates || data.candidates.length === 0) {
        setError('לא התקבלה תמונה. נסה שוב או נסח את הטקסט אחרת.');
        return;
      }

      // Find the image part in the response
      const imagePart = data.candidates[0].content.parts.find(
        (part: { inlineData?: { mimeType?: string; data: string } }) => part.inlineData?.mimeType?.startsWith('image/')
      );

      if (imagePart && imagePart.inlineData) {
        const imageUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setGeneratedImage(imageUri);
        
        try {
          // Save to history
          await saveToHistory({
            type: 'image',
            content: imageUri,
            prompt: prompt
          });
          setSaveSuccess(true);
          // Show success message
          Alert.alert(
            'שמירה בוצעה בהצלחה',
            'התמונה נשמרה בהיסטוריה',
            [{ text: 'אישור', style: 'default' }]
          );
        } catch (saveError) {
          console.error('Error saving to history:', saveError);
          Alert.alert(
            'שגיאה בשמירה',
            'לא הצלחנו לשמור את התמונה בהיסטוריה',
            [{ text: 'אישור', style: 'default' }]
          );
        }
      } else {
        setError('לא התקבלה תמונה בפורמט צפוי. נסה שוב או נסח את הטקסט אחרת.');
      }

    } catch (e) {
      let errorMsg = 'שגיאה ביצירת תמונה.';
      if (e instanceof Error) {
        errorMsg += ' ' + e.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>צור תמונה מטקסט (GoogleStudio)</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="הכנס תיאור לתמונה..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={generateImage} 
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'יוצר...' : 'צור תמונה'}</Text>
          </TouchableOpacity>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {saveSuccess && (
          <Text style={styles.successText}>התמונה נשמרה בהצלחה בהיסטוריה</Text>
        )}
        
        {generatedImage ? (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: generatedImage }} 
              style={styles.generatedImage} 
              resizeMode="contain"
            />
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    backgroundColor: '#f3f6fa',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'right',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    color: '#10b981',
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f3f6fa',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20,
  },
  generatedImage: {
    width: '100%',
    height: '100%',
  },
});

export default ImageGenScreen; 