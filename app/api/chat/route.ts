import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GoogleGenAI } from "@google/genai";
import * as jose from "jose";

async function verifyPatient(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return null;
  
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);
    if (payload.role === "patient") {
      return payload.id as string;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const patientId = await verifyPatient(req);
    if (!patientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId, message } = await req.json();
    if (!reportId || !message) {
      return NextResponse.json({ error: "Missing reportId or message" }, { status: 400 });
    }

    // Verify report belongs to patient
    const report = await prisma.medicalReport.findUnique({ where: { id: reportId } });
    if (!report || report.patientId !== patientId) {
      return NextResponse.json({ error: "Report not found or unauthorized" }, { status: 404 });
    }

    // Parse base64 and mime type
    const mimeMatch = report.pdfData.match(/^data:(.*?);base64,/);
    let mimeType = "application/pdf";
    let base64Data = report.pdfData;
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      base64Data = report.pdfData.replace(/^data:.*?;base64,/, "");
    }

    // Save user message to database (find or create a ChatSession)
    let chatSession = await prisma.chatSession.findFirst({ where: { reportId } });
    if (!chatSession) {
      chatSession = await prisma.chatSession.create({ data: { reportId } });
    }

    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message
      }
    });

    // We'll send the document context and the user's latest query
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `
      You are an expert medical AI assistant. Look at the provided medical document (which may be a PDF or an Image).
      The user is asking a question about this specific document.
      User's question: "${message}"
      
      Provide a helpful, clear, and easy-to-understand answer based ONLY on the provided document.
      If the document does not contain the answer, explicitly state that it's not found in the document.
      Keep the response concise, professional, and accessible to a patient. Do not use complex medical jargon without explaining it.
    `;

    const modelNames = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"];
    let aiResponseText = "";
    
    for (const modelName of modelNames) {
      try {
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
                    mimeType: mimeType,
                  },
                },
              ],
            },
          ],
        });
        
        aiResponseText = response.text || "I'm sorry, I couldn't generate a response.";
        break; // Success!
      } catch (err: any) {
        console.warn(`Model ${modelName} failed for chat:`, err.message);
        continue;
      }
    }

    if (!aiResponseText) {
      return NextResponse.json({ error: "Failed to generate AI response. Rate limit or server error." }, { status: 500 });
    }

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "ai",
        content: aiResponseText
      }
    });

    return NextResponse.json({ response: aiMessage.content }, { status: 200 });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: "Failed to process chat request." }, { status: 500 });
  }
}
