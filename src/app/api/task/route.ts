import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import ReminderModel, { CreateReminderInput } from "@/models/reminder";
import TaskModel, { TaskPriority, TaskStatus } from "@/models/task";
import { PaginatedResponse } from "@/types/api";
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

    const pageParam = searchParams.get("page") || "1";
    const limitParam = searchParams.get("limit") || "10";
    const status = searchParams.get("status") as TaskStatus | null;
    const priority = searchParams.get("priority") as TaskPriority | null;
    const userId = searchParams.get("userId");

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

    const options = {
      page,
      limit,
      sort: { createdAt: -1 },
    };

    const result = await (TaskModel as any).paginate(filter, options);

    const paginatedResponse: PaginatedResponse<(typeof result.docs)[0]> = {
      items: result.docs,
      totalItems: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      limit: result.limit,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
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

    const body = await request.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string"
        ? body.description.trim()
        : undefined;
    const status = body.status as TaskStatus | undefined;
    const priority = body.priority as TaskPriority | undefined;
    const dueDateRaw = body.dueDate as string | Date | undefined;
    const reminderEnabled = Boolean(body.reminderEnabled);
    const channel = typeof body.channel === "string" ? body.channel : undefined;
    const timezone =
      typeof body.timezone === "string" ? body.timezone : undefined;
    const userIdRaw = body.userId as string | undefined;

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: "Title is required",
        },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: "Title must be at most 200 characters",
        },
        { status: 400 }
      );
    }

    if (description && description.length > 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: "Description must be at most 2000 characters",
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
    const validPriorities: TaskPriority[] = ["low", "medium", "high"];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: `Status must be one of: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: `Priority must be one of: ${validPriorities.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let dueDate: Date | undefined;
    if (dueDateRaw) {
      const parsed = new Date(dueDateRaw);
      if (isNaN(parsed.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            message: "Invalid dueDate",
          },
          { status: 400 }
        );
      }
      dueDate = parsed;
    }

    if (reminderEnabled) {
      if (!dueDate) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            message: "dueDate is required when reminderEnabled is true",
          },
          { status: 400 }
        );
      }
      if (!timezone || !timezone.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: "Validation error",
            message: "timezone is required when reminderEnabled is true",
          },
          { status: 400 }
        );
      }
    }

    const effectiveUserId =
      session.user.role === "admin" && userIdRaw ? userIdRaw : session.user.id;

    try {
      const taskPayload = {
        userId: new Types.ObjectId(effectiveUserId),
        title,
        description,
        status: status ?? "pending",
        priority: priority ?? "medium",
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
