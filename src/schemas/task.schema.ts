import * as z from "zod";

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title must not be empty")
      .max(200, "Title must be at most 200 characters"),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters")
      .optional(),
    status: z
      .enum(["pending", "in_progress", "completed", "cancelled"], {
        message:
          "Status must be one of: pending, in_progress, completed, cancelled",
      })
      .optional(),
    priority: z
      .enum(["low", "medium", "high"], {
        message: "Priority must be one of: low, medium, high",
      })
      .optional(),
    dueDate: z.iso
      .datetime({
        message: "Due date must be a valid ISO 8601 datetime string",
      })
      .nullable()
      .optional(),
    reminderEnabled: z.boolean().optional(),
    timezone: z.string().trim().min(1, "Timezone must not be empty").optional(),
    userId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/i, "userId must be a valid ObjectId")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reminderEnabled) {
      if (!data.dueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "dueDate is required when reminderEnabled is true",
        });
      }
    }
  });

export const updateTaskSchema = z
  .object({
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
        message:
          "Status must be one of: pending, in_progress, completed, cancelled",
      })
      .optional(),
    priority: z
      .enum(["low", "medium", "high"], {
        message: "Priority must be one of: low, medium, high",
      })
      .optional(),
    dueDate: z.iso
      .datetime({
        message: "Due date must be a valid ISO 8601 datetime string",
      })
      .nullable()
      .optional(),
    reminderEnabled: z.boolean().optional(),
    timezone: z.string().trim().min(1, "Timezone must not be empty").optional(),
    userId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/i, "userId must be a valid ObjectId")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.reminderEnabled) {
      if (!data.dueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "dueDate is required when reminderEnabled is true",
        });
      }
    }
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
