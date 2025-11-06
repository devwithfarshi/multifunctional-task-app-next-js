"use client";

import * as React from "react";
import { Edit2Icon, Trash2Icon } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Task } from "./types";
import { useTasks } from "./TasksProvider";
import { AssignedBadge } from "./AssignedBadge";
import { SettingsPanel } from "./SettingsPanel";
import { CreateEditDialog } from "./CreateEditDialog";

type TaskCardProps = {
  task: Task;
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { setTasks } = useTasks();

  const handleToggleComplete = React.useCallback((): void => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
  }, [setTasks, task.id, task.completed]);

  const handleDeleteTask = React.useCallback((): void => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }, [setTasks, task.id]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle className="line-clamp-1 text-base font-medium @[250px]/card:text-lg">
          {task.title}
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch
                  checked={task.completed}
                  onCheckedChange={handleToggleComplete}
                  aria-label="Toggle completion"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{task.completed ? "Completed" : "Pending"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <CreateEditDialog mode="edit" task={task} trigger="icon" />
              </div>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SettingsPanel task={task} />
              </div>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Delete task">
                    <Trash2Icon />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the task "{task.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel aria-label="Cancel deletion">Cancel</AlertDialogCancel>
                    <AlertDialogAction aria-label="Confirm deletion" onClick={handleDeleteTask}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <AssignedBadge assignee={task.assignee} />
        <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
      </CardContent>
    </Card>
  );
};