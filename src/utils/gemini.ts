import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '@env';

let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

const initializeGemini = () => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Using gemini-pro for text and gemini-pro-vision for images when needed
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('Gemini API initialized successfully');
  }
};

export const transcribeAudio = async (audioPath: string): Promise<string> => {
  try {
    initializeGemini();
    // Note: Currently, Gemini API doesn't support direct audio transcription
    // We can use other Google APIs for this in the future
    throw new Error('שירות התמלול עדיין לא זמין. בקרוב נוסיף תמיכה בשירותי תמלול של Google.');
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};

export const generateResponse = async (text: string): Promise<string> => {
  try {
    initializeGemini();
    
    if (!model) {
      throw new Error('Gemini model not initialized');
    }

    console.log('Sending request to Gemini API...');
    const result = await model.generateContent(text);
    console.log('Received response from Gemini API');
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error generating response:', error);
    if (error.message?.includes('API key')) {
      throw new Error('בעיה עם מפתח ה-API. אנא ודא שהמפתח תקין ומוגדר כראוי');
    }
    throw new Error('שגיאה בקבלת תשובה מ-Gemini: ' + (error.message || 'שגיאה לא ידועה'));
  }
};

// Define the Session type
export interface Session {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  onMessage: (callback: (message: string) => void) => void;
  sendMessage: (message: string) => Promise<void>;
}

export const startLiveSession = (): Session => {
  try {
    initializeGemini();
    // Note: Currently, Gemini API doesn't support live audio sessions
    // We can implement this when the feature becomes available
    throw new Error('שיחות שמע חיות עדיין לא נתמכות. בקרוב נוסיף תמיכה בשיחות חיות.');
  } catch (error) {
    console.error('Error starting live session:', error);
    throw error;
  }
}; 