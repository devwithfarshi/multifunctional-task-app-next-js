import { NextResponse } from "next/server";
import { UserModel } from "@/models";

export async function GET(): Promise<NextResponse> {
  try {
    const docs = await UserModel.find({}, { name: 1 }).lean();

    const items = (docs || []).map((doc: any) => ({
      id: String(doc._id),
      name: typeof doc.name === "string" ? doc.name : "",
    }));

    return NextResponse.json(
      {
        success: true,
        message: "User list retrieved",
        data: items,
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