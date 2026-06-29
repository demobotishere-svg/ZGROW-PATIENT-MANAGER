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

export async function GET(req: NextRequest) {
  try {
    const patientId = await verifyPatient(req);
    if (!patientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appointments = await prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: { select: { name: true, designation: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const patientId = await verifyPatient(req);
    if (!patientId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { doctorId, date, timeSlot } = await req.json();

    if (!doctorId || !date || !timeSlot) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        date,
        timeSlot,
        status: "PENDING"
      }
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}
