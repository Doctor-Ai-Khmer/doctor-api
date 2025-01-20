import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });
  }

  async analyzeImage(imageData: Buffer): Promise<string> {
    try {
      const prompt = "Analyze only medical image and provide detailed observations about what you see. Include any potential abnormalities or areas of concern.";
      const warning = " But, if you see any other document or image do respond to user with 'I'm sorry, I can't see any medical image in this image.'";
      const language = "you have to explain everything in Khmer Language"
      const result = await this.model.generateContent([
        {
          inlineData: {
            data: Buffer.from(imageData).toString('base64'),
            mimeType: "image/jpeg"
          }
        },
        prompt,
        warning, 
        language
      ]);

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