import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.password) {
      return NextResponse.json({ error: "Password is required for patient registration" }, { status: 400 });
    }

    if (data.patientId) {
      const existing = await prisma.patient.findUnique({ where: { patientId: data.patientId } });
      if (existing) {
        return NextResponse.json({ error: "Patient with this ID already exists. Please log in instead." }, { status: 409 });
      }
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName || "Unknown",
        lastName: data.lastName || "Unknown",
        dob: data.dob,
        patientId: data.patientId,
        address: data.address,
        password: hashPassword(data.password),
        verificationStatus: "Verified",
      },
    });

    return NextResponse.json({ success: true, patient }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to save patient:", error);
    return NextResponse.json({ error: "Failed to save patient record: " + error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        include: { 
          reports: { 
            orderBy: { uploadDate: "desc" },
            select: { id: true, patientId: true, reportName: true, uploadDate: true, category: true, createdAt: true, updatedAt: true }
          } 
        }
      });
      if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      return NextResponse.json({ reports: patient.reports, patient }, { status: 200 });
    }

    const patients = await prisma.patient.findMany({
      orderBy: { createdAt: "desc" },
      include: { 
        reports: {
          select: { id: true, patientId: true, reportName: true, uploadDate: true, category: true, createdAt: true, updatedAt: true }
        } 
      },
    });
    return NextResponse.json({ patients }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch patients: " + error.message }, { status: 500 });
  }
}
