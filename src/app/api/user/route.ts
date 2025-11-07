import type { IUser, UserDocument } from "@/models";
import { UserModel } from "@/models";
import { PaginatedResponse } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q") ?? undefined;
    const pageRaw = searchParams.get("page");
    const limitRaw = searchParams.get("limit");

    const page = pageRaw ? Number(pageRaw) : 1;
    const limit = limitRaw ? Number(limitRaw) : 10;

    if (!Number.isFinite(page) || page < 1) {
      return NextResponse.json(
        { error: "Invalid 'page' parameter" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid 'limit' parameter (1-100)" },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = {};
    if (q && q.trim().length > 0) {
      const regex = new RegExp(q.trim(), "i");
      Object.assign(filter, {
        $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
      });
    }

    const result = await UserModel.paginate(filter, {
      page,
      limit,
      sort: { createdAt: -1 },
      select: "name email role provider emailVerified createdAt updatedAt",
    });

    const items: IUser[] = result.docs.map((doc: UserDocument) => ({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      provider: doc.provider,
      emailVerified: doc.emailVerified ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    const payload: PaginatedResponse<IUser> = {
      items,
      totalItems: result.totalDocs ?? items.length,
      totalPages: result.totalPages ?? 1,
      page: result.page ?? page,
      limit: result.limit ?? limit,
      hasPrevPage: Boolean(result.hasPrevPage),
      hasNextPage: Boolean(result.hasNextPage),
      prevPage: result.prevPage ?? null,
      nextPage: result.nextPage ?? null,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Users retrieved successfully",
        data: payload,
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
