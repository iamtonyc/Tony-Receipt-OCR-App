
import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

export const processReceiptWithGemini = async (base64Image: string, mimeType: string): Promise<ReceiptData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze this receipt image. 
    1. Perform OCR to extract all visible text.
    2. Identify the merchant name, date, and currency.
    3. The date MUST be formatted as YYYY-MM-DD (e.g., 2024-03-15). If only month and year are found, use the first day of the month (e.g., 2024-03-01).
    4. Extract a list of items including their quantity and individual price.
    5. Detect the original language. If it is NOT English, translate the merchant name and all item names into English.
    6. Return the result in the specified JSON format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING },
          date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
          currency: { type: Type.STRING },
          totalAmount: { type: Type.NUMBER },
          originalLanguage: { type: Type.STRING },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalName: { type: Type.STRING },
                translatedName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              },
              required: ["originalName", "translatedName", "quantity", "price", "total"]
            }
          }
        },
        required: ["merchantName", "date", "currency", "totalAmount", "items", "originalLanguage"]
      }
    }
  });

  if (!response.text) {
    throw new Error("Failed to receive data from Gemini API");
  }

  return JSON.parse(response.text.trim());
};
