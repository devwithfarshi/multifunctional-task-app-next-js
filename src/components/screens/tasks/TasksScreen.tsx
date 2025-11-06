"use client";

import * as React from "react";
import { LayoutGridIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { TasksProvider, useTasks } from "./TasksProvider";
import { TaskCard } from "./TaskCard";
import { TasksHeader } from "./TasksHeader";
import { ViewMode } from "./types";

const TasksContent: React.FC = () => {
  const { tasks, loading, error } = useTasks();
  const [view, setView] = React.useState<ViewMode>("grid");

  const renderLoading = (): React.ReactNode => (
    <div
      className={
        view === "grid"
          ? "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3"
          : "flex flex-col gap-4"
      }
    >
      {[...Array(6)].map((_, i) => (
        <div key={i} className="rounded-xl border p-6">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-3 h-4 w-full" />
        </div>
      ))}
    </div>
  );

  const renderEmpty = (): React.ReactNode => (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LayoutGridIcon />
        </EmptyMedia>
        <EmptyTitle>No tasks yet</EmptyTitle>
        <EmptyDescription>Create a task to get started.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );

  const renderList = (): React.ReactNode => (
    <div
      className={
        view === "grid"
          ? "grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-3"
          : "flex flex-col gap-4"
      }
    >
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <TasksHeader view={view} onChangeView={setView} />

        <div className="mt-4">
          {loading
            ? renderLoading()
            : error
            ? (
                <div className="flex items-center gap-2 text-destructive">
                  <span role="img" aria-label="Error">⚠️</span>
                  <span>{error}</span>
                </div>
              )
            : tasks.length === 0
            ? renderEmpty()
            : renderList()}
        </div>
      </div>
    </div>
  );
};

export const TasksScreen: React.FC = () => {
  return (
    <TasksProvider>
      <TasksContent />
    </TasksProvider>
  );
};