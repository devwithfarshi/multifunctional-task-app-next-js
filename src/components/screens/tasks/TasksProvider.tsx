"use client";

import { ITask, IUser } from "@/models";
import * as React from "react";

type TasksContextValue = {
  tasks: (ITask & {
    user: Pick<IUser, "name">;
  })[];
  setTasks: React.Dispatch<
    React.SetStateAction<
      (ITask & {
        user: Pick<IUser, "name">;
      })[]
    >
  >;
  loading: boolean;
  error: string | null;
};

const TasksContext = React.createContext<TasksContextValue | undefined>(
  undefined
);

const useTasksDemo = (): {
  tasks: (ITask & {
    user: Pick<IUser, "name">;
  })[];
  setTasks: React.Dispatch<
    React.SetStateAction<
      (ITask & {
        user: Pick<IUser, "name">;
      })[]
    >
  >;
  loading: boolean;
  error: string | null;
} => {
  const [tasks, setTasks] = React.useState<
    (ITask & {
      user: Pick<IUser, "name">;
    })[]
  >([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ac = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const url =
          "/api/task?page=1&limit=20&includeUser=1&includeReminders=1";
        const res = await fetch(url, {
          method: "GET",
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
        });
        const json = await res.json();
        if (!res.ok || !json?.success) {
          const message = json?.message || "Failed to load tasks";
          setError(message);
          setTasks([]);
          return;
        }
        const items: (ITask & {
          user: Pick<IUser, "name">;
        })[] = json.data?.items ?? [];
        setTasks(items);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setError("Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
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
