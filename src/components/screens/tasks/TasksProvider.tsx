"use client";

import * as React from "react";
import { Task } from "./types";

type TasksContextValue = {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loading: boolean;
  error: string | null;
};

const TasksContext = React.createContext<TasksContextValue | undefined>(
  undefined
);

const useTasksDemo = (): {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  loading: boolean;
  error: string | null;
} => {
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const demo: Task[] = [
          {
            id: "t-1",
            title: "Design landing page",
            description:
              "Create responsive hero and CTA section following brand guidelines.",
            assignee: "Alice",
            completed: false,
            reminderEnabled: true,
          },
          {
            id: "t-2",
            title: "Implement auth flow",
            description: "Integrate OAuth provider and session persistence.",
            assignee: "Bob",
            completed: true,
            reminderEnabled: false,
          },
          {
            id: "t-3",
            title: "Write API docs",
            description: "Document tasks CRUD endpoints and usage examples.",
            assignee: "Carol",
            completed: false,
            reminderEnabled: false,
          },
        ];
        setTasks(demo);
        setLoading(false);
      } catch {
        setError("Failed to load tasks");
        setLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { tasks, setTasks, loading, error };
};

export const TasksProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { tasks, setTasks, loading, error } = useTasksDemo();

  return (
    <TasksContext.Provider value={{ tasks, setTasks, loading, error }}>
      {children}
    </TasksContext.Provider>
  );
};

export const useTasks = (): TasksContextValue => {
  const ctx = React.useContext(TasksContext);
  if (!ctx) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return ctx;
};