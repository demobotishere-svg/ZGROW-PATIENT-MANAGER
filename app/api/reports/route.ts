import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const patientDbId = formData.get("patientId") as string;
    const reportName = formData.get("reportName") as string;
    const category = formData.get("category") as string;

    if (!file || !patientDbId || !reportName) {
      return NextResponse.json({ error: "File, patientId, and reportName are required" }, { status: 400 });
    }

    // Convert file to base64 for storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const pdfData = `data:${file.type};base64,${base64}`;

    const report = await prisma.medicalReport.create({
      data: {
        patientId: patientDbId,
        reportName,
        category: category || "General",
        pdfData,
      },
    });

    return NextResponse.json({ success: true, report: { id: report.id, reportName: report.reportName } }, { status: 201 });
  } catch (error: any) {
    console.error("Report upload error:", error);
    return NextResponse.json({ error: "Failed to upload report: " + error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientDbId = searchParams.get("patientId");

    if (!patientDbId) {
      return NextResponse.json({ error: "patientId query param required" }, { status: 400 });
    }

    const reports = await prisma.medicalReport.findMany({
      where: { patientId: patientDbId },
      orderBy: { uploadDate: "desc" },
      select: { id: true, reportName: true, category: true, uploadDate: true },
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
