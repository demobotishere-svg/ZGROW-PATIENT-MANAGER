import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as jose from "jose";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  if (!token) return false;
  
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.role === "admin" || !!payload.userId;
  } catch (error) {
    return false;
  }
}

export async function GET() {
  try {
    const doctors = await prisma.doctor.findMany({
      orderBy: { createdAt: 'desc' },
      include: { appointments: true }
    });
    return NextResponse.json(doctors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!(await verifyAdmin(req))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, designation, availableSlots } = await req.json();

    if (!name || !designation || !availableSlots) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const doctor = await prisma.doctor.create({
      data: {
        name,
        designation,
        availableSlots
      }
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}
