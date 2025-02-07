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
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType,
      },
    };
  }

  async analyzeImage(imageData: Buffer): Promise<string> {
    try {
      const prompt = "Analyze this medical image and provide detailed observations about what you see. Include any potential abnormalities or areas of concern. If this is not a medical image, please respond with 'This is not a medical image.' Please provide the response in Khmer language.";
      
      const imagePart = this.bufferToGenerativePart(imageData, "image/jpeg");

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