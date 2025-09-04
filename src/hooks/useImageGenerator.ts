import { useState } from 'react';
import { Alert, Share } from 'react-native';
import RNFS from 'react-native-fs';
import { saveToHistory } from '../utils/storage';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'blur';

export const useImageGenerator = (apiKey: string) => {
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');

  const saveImageLocally = async (base64Data: string) => {
    try {
      const path = `${RNFS.DocumentDirectoryPath}/image_${Date.now()}.jpg`;
      await RNFS.writeFile(path, base64Data, 'base64');
      return `file://${path}`;
    } catch (err) {
      console.error('Error saving image locally:', err);
      return null;
    }
  };

  const fetchWithRetry = async (url: string, options: any, retries = 3, delay = 2000): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status !== 503) throw new Error(`HTTP error! status: ${response.status}`);
      await new Promise(res => setTimeout(res, delay)); // מחכה לפני ניסיון נוסף
    }
    throw new Error('Server unavailable (503) – נסיונות חוזרים נכשלו');
  };

  const generateImages = async (prompt: string) => {
    setError('');
    setGeneratedImages([]);
    setCaption('');
    setSaveSuccess(false);

    if (!prompt.trim()) {
      setError('נא להזין טקסט ליצירת תמונה');
      return;
    }

    setLoading(true);

    try {
      const responses = await Promise.all([0, 1, 2].map(async () => {
        const res = await fetchWithRetry(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${apiKey}`,
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
                responseModalities: ["TEXT", "IMAGE"],
              },
            }),
          }
        );
        return await res.json();
      }));

      const newImages: string[] = [];
      for (const data of responses) {
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((part: any) => part.inlineData?.mimeType?.startsWith('image/'));
        if (imagePart?.inlineData?.data) {
          const localUri = await saveImageLocally(imagePart.inlineData.data);
          if (localUri) {
            newImages.push(localUri);
            try { await saveToHistory({ type: 'image', content: localUri, prompt }); } 
            catch (err) { console.error('Error saving history:', err); }
          }
        }
      }

      if (newImages.length === 0) {
        setError('לא התקבלה תמונה מה־AI. נסה שוב.');
      } else {
        setGeneratedImages(newImages);
        setSaveSuccess(true);
        setCaption(`AI Caption: יצירת תמונה עבור "${prompt}"`);
      }

    } catch (e) {
      let errorMsg = 'שגיאה ביצירת תמונה.';
      if (e instanceof Error) errorMsg += ' ' + e.message;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const shareImage = async (uri: string) => {
    try {
      await Share.share({ url: uri });
    } catch (e) {
      console.error('Error sharing image:', e);
      Alert.alert('שגיאה', 'לא ניתן לשתף את התמונה', [{ text: 'אישור' }]);
    }
  };

  const applyFilterStyle = (filter: FilterType) => {
    switch(filter){
      case 'grayscale': return { tintColor: 'gray' };
      case 'sepia': return { tintColor: '#704214' };
      case 'blur': return { opacity: 0.7 };
      default: return {};
    }
  };

  return {
    generatedImages,
    loading,
    error,
    saveSuccess,
    caption,
    selectedFilter,
    setSelectedFilter,
    generateImages,
    shareImage,
    applyFilterStyle,
  };
};