import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await prisma.medicalReport.findUnique({
      where: { id },
      select: { pdfData: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const mimeType = report.pdfData.split(";")[0].split(":")[1] || "application/pdf";
    const isImage = mimeType.startsWith("image/");

    return NextResponse.json({ mimeType, isImage }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch report meta" }, { status: 500 });
  }
}
