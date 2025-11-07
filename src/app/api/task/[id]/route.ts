import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import TaskModel from "@/models/task";
import ReminderModel from "@/models/reminder";
import { updateTaskSchema } from "@/schemas/task.schema";
import { Types } from "mongoose";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const taskId = id;
    if (!Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid task ID",
          message: "Task ID must be a valid MongoDB ObjectId",
        },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          message: "Request body must be valid JSON",
        },
        { status: 400 }
      );
    }

    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Invalid request body";
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message,
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const existingTask = await TaskModel.findById(taskId).exec();

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Task not found",
        },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = existingTask.userId.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You do not have permission to update this task",
        },
        { status: 403 }
      );
    }

    const updates: any = { ...parsed.data };
    if (updates.dueDate !== undefined) {
      updates.dueDate = updates.dueDate ? new Date(updates.dueDate) : null;
    }

    const updatedTask = await TaskModel.updateTaskById(taskId, updates);

    return NextResponse.json(
      {
        success: true,
        message: "Task updated successfully",
        data: updatedTask,
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
            message: "Task ID has invalid format",
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

      if (err.name === "SyntaxError" && err.message.includes("JSON")) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid request body",
            message: "Request body must be valid JSON",
          },
          { status: 400 }
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const taskId = id;
    if (!Types.ObjectId.isValid(taskId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid task ID",
          message: "Task ID must be a valid MongoDB ObjectId",
        },
        { status: 400 }
      );
    }

    const existingTask = await TaskModel.findById(taskId).exec();

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: "Not found",
          message: "Task not found",
        },
        { status: 404 }
      );
    }

    const isAdmin = session.user.role === "admin";
    const isOwner = existingTask.userId.toString() === session.user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
          message: "You do not have permission to delete this task",
        },
        { status: 403 }
      );
    }

    await ReminderModel.deleteMany({ taskId }).exec();

    const deleted = await TaskModel.deleteTaskById(taskId);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          error: "Deletion failed",
          message: "Failed to delete task",
        },
        { status: 500 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.name === "CastError") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid parameter format",
            message: "Task ID has invalid format",
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
