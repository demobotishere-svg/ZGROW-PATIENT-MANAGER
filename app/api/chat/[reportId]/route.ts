import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ reportId: string }> }) {
  try {
    const patientId = await verifyPatient(req);
    if (!patientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await params;

    // Verify report belongs to patient
    const report = await prisma.medicalReport.findUnique({ where: { id: reportId } });
    if (!report || report.patientId !== patientId) {
      return NextResponse.json({ error: "Report not found or unauthorized" }, { status: 404 });
    }

    const chatSession = await prisma.chatSession.findFirst({
      where: { reportId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    return NextResponse.json(chatSession?.messages || []);

  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
