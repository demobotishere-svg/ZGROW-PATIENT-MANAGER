import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);

    if (payload.role === "patient") {
      const patient = await prisma.patient.findUnique({ where: { id: payload.id as string } });
      return NextResponse.json({ 
        authenticated: true, 
        session: { ...payload, firstName: patient?.firstName, lastName: patient?.lastName, dob: patient?.dob, address: patient?.address } 
      }, { status: 200 });
    }

    return NextResponse.json({ authenticated: true, session: payload }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
