import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { IReminder, IUser } from "@/models";
import { UserModel } from "@/models";
import ReminderModel, { CreateReminderInput } from "@/models/reminder";
import TaskModel, { ITask, TaskPriority, TaskStatus } from "@/models/task";
import { createTaskSchema } from "@/schemas/task.schema";
import { PaginatedResponse } from "@/types/api";
import type { SortOrder } from "mongoose";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;

    const parseBooleanParam = (value: string | null): boolean => {
      if (!value) return false;
      const v = value.toLowerCase();
      return v === "1" || v === "true" || v === "yes";
    };

    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "10";
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as TaskPriority | null;
    const userId = searchParams.get("userId");
    const includeUser = parseBooleanParam(searchParams.get("includeUser"));
    const includeReminders = parseBooleanParam(
      searchParams.get("includeReminders")
    );

    const page = parseInt(pageParam, 10);
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid page parameter",
          message: "Page must be a number greater than or equal to 1",
        },
        { status: 400 }
      );
    }

    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid limit parameter",
          message: "Limit must be a number between 1 and 100",
        },
        { status: 400 }
      );
    }

    const validStatuses: TaskStatus[] = [
      "pending",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status parameter",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const validPriorities: TaskPriority[] = ["low", "medium", "high"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid priority parameter",
          message: `Priority must be one of: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const filter: Record<string, unknown> = {};

    if (session.user.role === "admin") {
      if (userId) {
        filter.userId = new Types.ObjectId(userId);
      }
    } else {
      filter.userId = new Types.ObjectId(session.user.id);
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    const sort: Record<string, SortOrder> = { createdAt: "desc" };
    const skip = (page - 1) * limit;
    const [docsRaw, totalItems] = await Promise.all([
      TaskModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean<ITask[]>()
        .exec(),
      TaskModel.countDocuments(filter).exec(),
    ]);
    const docs: ITask[] = docsRaw ?? [];

    type TaskListItem = ITask & {
      user?: Partial<IUser> | null;
      reminders?: IReminder[];
    };
    let items: TaskListItem[] = docs.map((d) => ({ ...d }));

    if (includeUser) {
      const userIdStrings = Array.from(
        new Set(docs.map((d) => d.userId.toString()))
      );
      const userObjectIds = userIdStrings.map((id) => new Types.ObjectId(id));
      type LeanUser = Partial<IUser> & { _id: Types.ObjectId };
      const users = await UserModel.find({ _id: { $in: userObjectIds } })
        .select("name email role provider emailVerified createdAt updatedAt")
        .lean<LeanUser[]>()
        .exec();
      const userMap = new Map<string, LeanUser>(
        (users ?? []).map((u) => [u._id.toString(), u])
      );
      items = items.map((obj) => {
        const user = userMap.get(obj.userId.toString()) ?? null;
        return { ...obj, user };
      });
    }

    if (includeReminders) {
      const taskIdStrings = docs.map((d) => d._id!.toString());
      const taskObjectIds = taskIdStrings.map((id) => new Types.ObjectId(id));
      type LeanReminder = IReminder & { _id: Types.ObjectId };
      const reminders = await ReminderModel.find({
        taskId: { $in: taskObjectIds },
      })
        .sort({ scheduledAt: 1 })
        .lean<LeanReminder[]>()
        .exec();
      const remindersMap = new Map<string, LeanReminder[]>();
      for (const r of reminders ?? []) {
        const key = r.taskId.toString();
        const arr = remindersMap.get(key) ?? [];
        arr.push(r);
        remindersMap.set(key, arr);
      }
      items = items.map((obj) => {
        const key = obj._id!.toString();
        const list = remindersMap.get(key) ?? [];
        return { ...obj, reminders: list };
      });
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const hasPrevPage = page > 1;
    const hasNextPage = page < totalPages;
    const paginatedResponse: PaginatedResponse<(typeof items)[0]> = {
      items,
      totalItems,
      totalPages,
      page,
      limit,
      hasPrevPage,
      hasNextPage,
      prevPage: hasPrevPage ? page - 1 : null,
      nextPage: hasNextPage ? page + 1 : null,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Tasks retrieved successfully",
        data: paginatedResponse,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "CastError") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid parameter format",
            message: "One or more parameters have invalid format",
          },
          { status: 400 }
        );
      }

      if (err.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            message: err.message,
          },
          { status: 400 }
        );
      }

      if (
        err.message.includes("connect") ||
        err.message.includes("connection")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error",
            message: "Unable to connect to database. Please try again later.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          message: err.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }
    const rawBody = await request.json();

    const parsed = createTaskSchema.safeParse(rawBody);
    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join("; ");
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: messages,
        },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate: dueDateIso,
      reminderEnabled,
      timezone,
      userId: userIdRaw,
    } = parsed.data;

    const effectiveUserId =
      session.user.role === "admin" && userIdRaw ? userIdRaw : session.user.id;

    const dueDate = dueDateIso ? new Date(dueDateIso) : null;

    try {
      const taskPayload = {
        userId: new Types.ObjectId(effectiveUserId),
        title,
        description,
        status: (status as TaskStatus) ?? "pending",
        priority: (priority as TaskPriority) ?? "medium",
        dueDate: dueDate ?? null,
        reminderEnabled: Boolean(reminderEnabled),
      };

      const task = await TaskModel.createTask(taskPayload);

      if (reminderEnabled && dueDate) {
        const scheduledAt = new Date(dueDate.getTime() - 60 * 60 * 1000);
        const reminderPayload: CreateReminderInput = {
          taskId: task._id,
          userId: task.userId,
          scheduledAt,
          status: "scheduled",
          channel: "email",
          timezone: timezone!,
          processedAt: null,
        };
        await ReminderModel.scheduleReminder(reminderPayload);
      }

      return NextResponse.json(
        {
          success: true,
          message: "Task created successfully",
          data: task,
        },
        { status: 201 }
      );
    } catch (err) {
      throw err;
    }
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "CastError") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid parameter format",
            message: "One or more parameters have invalid format",
          },
          { status: 400 }
        );
      }

      if (err.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            message: err.message,
          },
          { status: 400 }
        );
      }

      if (
        err.message.includes("connect") ||
        err.message.includes("connection")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error",
            message: "Unable to connect to database. Please try again later.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: "Internal server error",
          message: err.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
