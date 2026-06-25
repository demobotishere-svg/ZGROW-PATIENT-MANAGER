import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await prisma.medicalReport.findUnique({ where: { id } });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Return the base64 PDF data
    const base64Data = report.pdfData.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");
    const mimeType = report.pdfData.split(";")[0].split(":")[1] || "application/pdf";
    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "pdf";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${report.reportName}.${extension}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}

import * as crypto from "crypto";
import * as jose from "jose";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);

    const report = await prisma.medicalReport.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const hashedPassword = hashPassword(password);

    if (payload.role === "patient") {
      const patient = await prisma.patient.findUnique({ where: { id: payload.id as string } });
      if (!patient || patient.password !== hashedPassword) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
      }
      // Ensure patient is deleting their own report
      if (report.patientId !== patient.id) {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      // Admin flow
      const admin = await prisma.user.findUnique({ where: { id: payload.userId as string } });
      if (!admin || admin.password !== hashedPassword) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
      }
    }

    await prisma.medicalReport.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Report deleted successfully" }, { status: 200 });

  } catch (error: any) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 });
  }
}
