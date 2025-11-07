import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { UserModel } from "@/models";
import type { UserRole } from "@/models";
import { Types } from "mongoose";
import { z } from "zod";

interface UpdateRoleBody {
  role: UserRole;
}

const updateRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({     success: false,error: "Forbidden" }, { status: 403 });
    }

    const { id: userId } = await params;
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({     success: false,error: "Invalid user id" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json({    success: false, error: message }, { status: 400 });
    }

    const { role } = parsed.data as UpdateRoleBody;
    const updated = await UserModel.updateUserById(userId, { role });
    if (!updated) {
      return NextResponse.json({     success: false,error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "User role updated successfully",
        data: updated,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
