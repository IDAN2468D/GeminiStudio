import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Alert, ActivityIndicator 
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { saveToHistory } from '../utils/storage';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API Key
const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const ImageGenScreen = () => {
  // --- State לפיצ'ר יצירת תמונה מטקסט ---
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState('');
  const [saveSuccessPrompt, setSaveSuccessPrompt] = useState(false);

  // --- State לפיצ'ר רטרו ---
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [base64Photo, setBase64Photo] = useState<string | null>(null);
  const [loadingRetro, setLoadingRetro] = useState(false);
  const [retroImages, setRetroImages] = useState<string[]>([]);

  // --- פונקציה ליצירת תמונה מטקסט ---
  const generateImageFromPrompt = async () => {
    setErrorPrompt('');
    setGeneratedImage(null);
    setSaveSuccessPrompt(false);

    if (!prompt.trim()) {
      setErrorPrompt('נא להזין טקסט ליצירת תמונה');
      return;
    }

    setLoadingPrompt(true);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
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

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        setErrorPrompt('לא התקבלה תמונה. נסה שוב או נסח את הטקסט אחרת.');
        return;
      }

      const imagePart = data.candidates[0].content.parts.find(
        (part: { inlineData?: { mimeType?: string; data: string } }) => part.inlineData?.mimeType?.startsWith('image/')
      );

      if (imagePart && imagePart.inlineData) {
        const imageUri = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        setGeneratedImage(imageUri);

        try {
          await saveToHistory({ type: 'image', content: imageUri, prompt });
          setSaveSuccessPrompt(true);
          Alert.alert('שמירה בוצעה בהצלחה', 'התמונה נשמרה בהיסטוריה', [{ text: 'אישור' }]);
        } catch (saveError) {
          console.error('Error saving to history:', saveError);
          Alert.alert('שגיאה בשמירה', 'לא הצלחנו לשמור את התמונה בהיסטוריה', [{ text: 'אישור' }]);
        }
      } else {
        setErrorPrompt('לא התקבלה תמונה בפורמט צפוי. נסה שוב או נסח את הטקסט אחרת.');
      }
    } catch (e) {
      let errorMsg = 'שגיאה ביצירת תמונה.';
      if (e instanceof Error) errorMsg += ' ' + e.message;
      setErrorPrompt(errorMsg);
    } finally {
      setLoadingPrompt(false);
    }
  };

  // --- פיצ'ר רטרו ---
  const handleUpload = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true },
      (response) => {
        if (response.assets && response.assets.length > 0) {
          setPhotoUri(response.assets[0].uri || null);
          setBase64Photo(response.assets[0].base64 || null);
        }
      }
    );
  };

  const generateRetro = async () => {
    if (!base64Photo) return;
    setLoadingRetro(true);
    setRetroImages([]);

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate retro portraits of this person in the styles of the 1920s, 1950s, and 1980s. Return ONLY the images as Base64 JPEGs. No text.`,
              },
              { inlineData: { mimeType: 'image/jpeg', data: base64Photo } },
            ],
          },
        ],
      });

      const outputText = result.response.text();

      const images = outputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 100)
        .map(b64 => `data:image/jpeg;base64,${b64}`);

      if (images.length === 0) {
        Alert.alert('שגיאה', 'לא התקבלו תמונות רטרו. נסה שוב.');
      } else {
        setRetroImages(images);

        // שמירה של כל התמונות בהיסטוריה
        for (let i = 0; i < images.length; i++) {
          await saveToHistory({ 
            type: 'image', 
            content: images[i], 
            prompt: `Retro version ${i + 1} of: ${prompt || 'Uploaded photo'}` 
          });
        }
        Alert.alert('שמירה בוצעה', 'תמונות הרטרו נשמרו בהיסטוריה');
      }
    } catch (err) {
      console.error('Gemini error:', err);
      Alert.alert('שגיאה', 'לא הצלחנו ליצור תמונות רטרו');
    } finally {
      setLoadingRetro(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>צור תמונה מטקסט / רטרו</Text>

        {/* --- יצירת תמונה מטקסט --- */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="הכנס תיאור לתמונה..."
            value={prompt}
            onChangeText={setPrompt}
            multiline
          />
          <TouchableOpacity
            style={[styles.button, loadingPrompt && styles.buttonDisabled]}
            onPress={generateImageFromPrompt}
            disabled={loadingPrompt}
          >
            <Text style={styles.buttonText}>{loadingPrompt ? 'יוצר...' : 'צור תמונה'}</Text>
          </TouchableOpacity>
        </View>
        {errorPrompt ? <Text style={styles.errorText}>{errorPrompt}</Text> : null}
        {saveSuccessPrompt && <Text style={styles.successText}>התמונה נשמרה בהצלחה בהיסטוריה</Text>}
        {generatedImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: generatedImage }} style={styles.generatedImage} resizeMode="contain" />
          </View>
        )}

        {/* --- פיצ'ר רטרו --- */}
        <Text style={[styles.title, { marginTop: 30 }]}>Retro Generator</Text>
        <TouchableOpacity
          onPress={handleUpload}
          style={styles.uploadContainer}
        >
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.uploadImage} resizeMode="cover" />
          ) : (
            <Text style={styles.uploadText}>📸 Upload Photo</Text>
          )}
        </TouchableOpacity>

        {photoUri && (
          <TouchableOpacity
            style={styles.button}
            onPress={generateRetro}
          >
            <Text style={styles.buttonText}>Generate Retro</Text>
          </TouchableOpacity>
        )}

        {loadingRetro && <ActivityIndicator size="large" color="#FFD700" style={{ marginTop: 20 }} />}

        {retroImages.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={[styles.successText, { fontSize: 18, marginBottom: 10 }]}>Your Retro Versions</Text>
            {retroImages.map((uri, i) => (
              <Image
                key={i}
                source={{ uri }}
                style={styles.uploadImage}
                resizeMode="cover"
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1 },
  container: { flex: 1, backgroundColor: '#fff', padding: 20, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2563EB', marginBottom: 15, textAlign: 'center' },
  inputContainer: { width: '100%', backgroundColor: '#f3f6fa', borderRadius: 15, padding: 15, marginBottom: 20 },
  input: { width: '100%', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff', textAlign: 'right', minHeight: 100, textAlignVertical: 'top', marginBottom: 10 },
  button: { backgroundColor: '#2563EB', borderRadius: 10, padding: 15, alignItems: 'center', width: '100%', marginTop: 5 },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  errorText: { color: '#ef4444', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  successText: { color: '#10b981', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  imageContainer: { width: '100%', aspectRatio: 1, backgroundColor: '#f3f6fa', borderRadius: 15, overflow: 'hidden', marginTop: 10 },
  generatedImage: { width: '100%', height: '100%' },
  uploadContainer: { width: 250, height: 300, backgroundColor: '#f3f6fa', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  uploadImage: { width: '100%', height: '100%', borderRadius: 15, marginBottom: 10 },
  uploadText: { fontSize: 18, color: '#555', textAlign: 'center' },
});

export default ImageGenScreen;
