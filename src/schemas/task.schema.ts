import * as z from "zod";

/**
 * Zod validation schema for task updates
 * Used to validate PATCH /api/task/[id] request bodies
 */
export const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title must not be empty")
    .max(200, "Title must be at most 200 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"], {
      message: "Status must be one of: pending, in_progress, completed, cancelled",
    })
    .optional(),
  priority: z
    .enum(["low", "medium", "high"], {
      message: "Priority must be one of: low, medium, high",
    })
    .optional(),
  dueDate: z
    .string()
    .datetime({ message: "Due date must be a valid ISO 8601 datetime string" })
    .nullable()
    .optional(),
  reminderEnabled: z.boolean().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
