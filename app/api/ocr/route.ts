import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const base64Data = imageBase64.split(",")[1] || imageBase64;
    if (!base64Data) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are an OCR assistant. Look at this image. If it DOES NOT contain an Aadhaar card, ID card, or medical slip, return exactly {"error": "NO_CARD"}.
      If it DOES contain an Aadhaar card, extract the person's information.
      Return ONLY a valid JSON object (no markdown, no backticks, no extra text) with these exact keys:
      {
        "firstName": "first part of the name, or empty string",
        "lastName": "last part of the name, or empty string",
        "dob": "date of birth (e.g., DD/MM/YYYY) or year of birth, or empty string",
        "patientId": "the 12-digit Aadhaar number (remove spaces) or ID number, or empty string",
        "address": "value or empty string"
      }
      Read carefully. Aadhaar cards typically have a name, a DOB, a gender, and a 12-digit number. Split the full name into firstName and lastName. Use the 12-digit Aadhaar number as the patientId.
    `;

    // Try multiple model names in order of preference. 
    const modelNames = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
    
    let errors: any[] = [];
    
    for (const modelName of modelNames) {
      try {
        console.log(`Trying model: ${modelName}`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: "image/jpeg",
                  },
                },
              ],
            },
          ],
        });

        const textResponse = response.text || "";
        console.log(`Gemini (${modelName}) Response:`, textResponse);

        const jsonStr = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
        const extractedData = JSON.parse(jsonStr);

        if (extractedData.error === "NO_CARD") {
          return NextResponse.json({ error: "NO_CARD" }, { status: 400 });
        }

        return NextResponse.json({ data: extractedData, model: modelName }, { status: 200 });
      } catch (err: any) {
        const errString = typeof err?.message === 'string' ? err.message : JSON.stringify(err?.message || err || {});
        console.warn(`Model ${modelName} failed:`, errString);
        errors.push({ model: modelName, error: errString });
        
        // Don't return on 429, we want to try the next available model in the fallback array.
        continue; 
      }
    }

    const finalErrString = JSON.stringify(errors);
    if (finalErrString.includes("429") || finalErrString.includes("exceeded your current quota") || finalErrString.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    // All models failed with some other error
    return NextResponse.json(
      { error: "All Gemini models failed. " + finalErrString },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong during OCR processing." },
      { status: 500 }
    );
  }
}
