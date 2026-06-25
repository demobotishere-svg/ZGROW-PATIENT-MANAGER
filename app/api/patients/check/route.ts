import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) {
    return NextResponse.json({ exists: false }, { status: 400 });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { patientId },
      select: { id: true },
    });

    return NextResponse.json({ exists: !!patient });
  } catch (error) {
    return NextResponse.json({ exists: false }, { status: 500 });
  }
}
