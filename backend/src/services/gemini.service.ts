import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    if (config.geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    } else {
      console.warn('⚠️  Gemini API key not configured. AI responses will be disabled.');
    }
  }

  /**
   * Generate a response from Gemini AI with system prompt and conversation history
   */
  async generateResponse(
    userMessage: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
  ): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    try {
      // Validate conversation history format
      if (!Array.isArray(conversationHistory)) {
        throw new Error('Conversation history must be an array');
      }

      // Create chat with history
      const chat = this.model.startChat({
        history: conversationHistory,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
        },
      });

      // Prepend system prompt to the first message if history is empty
      const messageToSend = conversationHistory.length === 0 
        ? `${systemPrompt}\n\nUsuario: ${userMessage}`
        : userMessage;

      const result = await chat.sendMessage(messageToSend);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error('Gemini returned empty response');
      }

      return text;
    } catch (error: any) {
      console.error('Gemini AI error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      // Re-throw with original error message for better debugging
      throw error;
    }
  }

  /**
   * Generate a simple response without conversation history
   */
  async generateSimpleResponse(userMessage: string, systemPrompt: string): Promise<string> {
    if (!this.model) {
      throw new Error('Gemini AI is not configured. Please set GEMINI_API_KEY in environment variables.');
    }

    try {
      const prompt = `${systemPrompt}\n\nUsuario: ${userMessage}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (error) {
      console.error('Gemini AI error:', error);
      throw new Error('Error al generar respuesta de IA');
    }
  }

  /**
   * Check if Gemini AI is configured and available
   */
  isAvailable(): boolean {
    return this.model !== null;
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
export default geminiService;
