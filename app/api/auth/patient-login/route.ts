import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as crypto from "crypto";
import * as jose from "jose";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { patientId, password } = await req.json();

    if (!patientId || !password) {
      return NextResponse.json({ error: "Patient ID and password are required" }, { status: 400 });
    }

    const patient = await prisma.patient.findUnique({ where: { patientId } });
    if (!patient || !patient.password) {
      return NextResponse.json({ error: "Invalid Patient ID or password" }, { status: 401 });
    }

    if (patient.password !== hashPassword(password)) {
      return NextResponse.json({ error: "Invalid Patient ID or password" }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const token = await new jose.SignJWT({ id: patient.id, patientId: patient.patientId, role: "patient" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      patient: { id: patient.id, firstName: patient.firstName, lastName: patient.lastName, patientId: patient.patientId },
    });

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Patient login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
