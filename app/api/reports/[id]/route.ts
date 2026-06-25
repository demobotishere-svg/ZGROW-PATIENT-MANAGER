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
