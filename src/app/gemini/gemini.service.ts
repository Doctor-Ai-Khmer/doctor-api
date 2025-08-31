import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private visionModel: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    this.visionModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  private bufferToGenerativePart(buffer: Buffer, mimeType: string) {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Input must be a valid Buffer');
    }
    
    try {
      return {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: mimeType || 'image/jpeg',
        },
      };
    } catch (error) {
      throw new Error(`Failed to convert buffer to base64: ${error.message}`);
    }
  }

  async analyzeImage(imageData: Buffer): Promise<string> {
    try {
      if (!Buffer.isBuffer(imageData)) {
        throw new Error('Image data must be a valid Buffer');
      }

      const prompt = `Please analyze this health check result image. Provide a detailed analysis including:
- Interpretation of each result
- Whether each result is normal or abnormal
- Health improvement recommendations
Please structure your response in easy-to-read paragraphs and provide ALL output in Khmer (Cambodian) language.`;
      
      const imagePart = this.bufferToGenerativePart(imageData, 'image/jpeg');
      
      if (!imagePart || !imagePart.inlineData || !imagePart.inlineData.data) {
        throw new Error('Failed to prepare image data for analysis');
      }

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to analyze image: ${error.message}`);
    }
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent([prompt]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }
} 