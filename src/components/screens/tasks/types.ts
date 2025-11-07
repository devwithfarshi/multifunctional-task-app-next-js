"use client";

import { TaskPriority } from "@/models";

export type ViewMode = "grid" | "list";

export type TaskFormValues = {
  title: string;
  description: string;
  assignee: string;
  reminderEnabled: boolean;
  priority: TaskPriority;
  dueDate: string | null;
};

export const DEMO_USERS = ["Alice", "Bob", "Carol", "Dave"] as const;

export const createEmptyTask = (): TaskFormValues => ({
  title: "",
  description: "",
  assignee: "",
  reminderEnabled: false,
  priority: "medium",
  dueDate: null,
});
