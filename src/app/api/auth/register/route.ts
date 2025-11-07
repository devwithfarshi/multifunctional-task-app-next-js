import { UserModel } from "@/models";
import { registerPayloadSchema } from "@/schemas/auth.schema";
import { hash } from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = registerPayloadSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);
    await UserModel.createUser({
      name,
      email,
      passwordHash,
      emailVerified: null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
