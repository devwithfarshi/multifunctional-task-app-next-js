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
import { useTasks } from "./TasksProvider";
import { AssignedBadge } from "./AssignedBadge";
import { CreateEditDialog } from "./CreateEditDialog";
import { ITask, IUser } from "@/models";
import { toast } from "sonner";

type TaskCardProps = {
  task: ITask & {
    user: Pick<IUser, "name">;
  };
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { setTasks } = useTasks();
  const [deleting, setDeleting] = React.useState<boolean>(false);

  const handleToggleComplete = React.useCallback(async (): Promise<void> => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
    try {
      const payload = {
        status: task.status === "completed" ? "pending" : "completed",
      };

      await fetch(`/api/task/${String(task._id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to update task");
    } finally {
    }
  }, [setTasks, task._id, task.status]);

  const handleDeleteTask = React.useCallback(async (): Promise<void> => {
    try {
      setDeleting(true);
      const res = await fetch(`/api/task/${String(task._id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.message || "Failed to delete task";
        throw new Error(message);
      }
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
      toast.success("Task deleted");
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete task");
    } finally {
      setDeleting(false);
    }
  }, [setTasks, task._id]);

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
                  checked={task.status === "completed"}
                  onCheckedChange={handleToggleComplete}
                  aria-label="Toggle completion"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {task.status === "completed" ? "Completed" : "Pending"}
            </TooltipContent>
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete task"
                  >
                    <Trash2Icon />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete task</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the task "{task.title}".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel aria-label="Cancel deletion">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      aria-label="Confirm deletion"
                      onClick={handleDeleteTask}
                      disabled={deleting}
                    >
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
        <AssignedBadge
          assignee={task.user.name || task.userId.toString() || "Unassigned"}
        />
        <p className="text-sm text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      </CardContent>
    </Card>
  );
};
