"use client";

export type ViewMode = "grid" | "list";

export type Task = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  completed: boolean;
  reminderEnabled: boolean;
};

export type TaskFormValues = {
  title: string;
  description: string;
  assignee: string;
  reminderEnabled: boolean;
};

export const DEMO_USERS = ["Alice", "Bob", "Carol", "Dave"] as const;

export const createEmptyTask = (): TaskFormValues => ({
  title: "",
  description: "",
  assignee: DEMO_USERS[0],
  reminderEnabled: false,
});