import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "crypto";

function hashPassword(password: string): string {
  return bcrypt.createHash("sha256").update(password).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, adminSecret } = await req.json();

    if (!email || !password || !adminSecret) {
      return NextResponse.json({ error: "Email, password, and Registration Key are required" }, { status: 400 });
    }

    if (adminSecret !== process.env.ADMIN_REGISTRATION_SECRET) {
      return NextResponse.json({ error: "Invalid Registration Key. You are not authorized to create an Admin account." }, { status: 403 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Failed to register user" }, { status: 500 });
  }
}
