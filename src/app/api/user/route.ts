import type { IUser, UserDocument } from "@/models";
import { UserModel, TaskModel } from "@/models";
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

    const userIds = result.docs.map((doc) => doc._id);
    let statsByUserId: Record<
      string,
      { total: number; pending: number; completed: number }
    > = {};
    if (userIds.length > 0) {
      const taskStats = await TaskModel.aggregate([
        { $match: { userId: { $in: userIds } } },
        {
          $group: {
            _id: "$userId",
            total: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
          },
        },
      ]).exec();
      statsByUserId = taskStats.reduce(
        (
          acc: Record<
            string,
            { total: number; pending: number; completed: number }
          >,
          s: any
        ) => {
          acc[String(s._id)] = {
            total: Number(s.total) || 0,
            pending: Number(s.pending) || 0,
            completed: Number(s.completed) || 0,
          };
          return acc;
        },
        {}
      );
    }

    interface UserListItem extends IUser {
      id: string;
      taskCounts: { total: number; pending: number; completed: number };
    }

    const items: UserListItem[] = result.docs.map((doc: UserDocument) => ({
      id: String(doc._id),
      name: doc.name,
      email: doc.email,
      role: doc.role,
      provider: doc.provider,
      emailVerified: doc.emailVerified ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      taskCounts: statsByUserId[String(doc._id)] ?? {
        total: 0,
        pending: 0,
        completed: 0,
      },
    }));

    const payload: PaginatedResponse<UserListItem> = {
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
