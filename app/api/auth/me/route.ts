import { NextRequest, NextResponse } from "next/server";
import * as jose from "jose";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "fallback-secret");
    const { payload } = await jose.jwtVerify(token, secret);

    return NextResponse.json({
      authenticated: true,
      user: { id: payload.userId, name: payload.name, email: payload.email },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
