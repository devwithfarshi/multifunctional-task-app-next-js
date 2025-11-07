"use client";

import * as React from "react";
import { PlusIcon, Edit2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar24 } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreateTaskInput,
  createTaskSchema,
  updateTaskSchema,
} from "@/schemas/task.schema";
import type { TaskPriority, ITask } from "@/models";
import { useTasks } from "./TasksProvider";
import { toast } from "sonner";

type CreateEditDialogProps = {
  mode: "create" | "edit";
  task?: ITask;
  trigger?: "new" | "icon";
};

export const CreateEditDialog: React.FC<CreateEditDialogProps> = ({
  mode,
  task,
  trigger = mode === "edit" ? "icon" : "new",
}) => {
  const { setTasks } = useTasks();

  const [open, setOpen] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [users, setUsers] = React.useState<{ id: string; name: string }[]>([]);
  const schema = React.useMemo(
    () => (mode === "edit" ? updateTaskSchema : createTaskSchema),
    [mode]
  );

  const defaultValues = React.useMemo(
    () => ({
      title: task?.title ?? "",
      description: task?.description ?? "",
      priority: (task?.priority as TaskPriority) ?? "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString() : null,
      reminderEnabled: Boolean(task?.reminderEnabled ?? false),
      timezone: undefined as string | undefined,
      userId: task?.userId ? String(task.userId) : undefined,
      status: task?.status ?? undefined,
    }),
    [task]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    reset,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  React.useEffect(() => {
    const loadUsers = async (): Promise<void> => {
      try {
        const res = await fetch("/api/user/names");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load users");
        }
        setUsers(Array.isArray(data?.data) ? data.data : []);
      } catch (err: any) {
        toast.error(err.message || "Failed to load users");
      }
    };

    if (open) {
      loadUsers();
    }
  }, [open]);

  const onSubmit = async (values: any): Promise<void> => {
    try {
      setSubmitting(true);
      const payload: CreateTaskInput = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as TaskPriority,
        status: values.status || undefined,
        dueDate: values.dueDate ?? null,
        reminderEnabled: Boolean(values.reminderEnabled),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        userId: values.userId || undefined,
      };

      const res = await fetch(
        mode === "edit" && task?._id
          ? `/api/task/${String(task._id)}`
          : "/api/task",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        const message: string = data?.message || "Failed to submit";
        if (message.toLowerCase().includes("title"))
          setError("title", { message });
        if (message.toLowerCase().includes("description"))
          setError("description", { message });
        if (message.toLowerCase().includes("priority"))
          setError("priority", { message });
        if (message.toLowerCase().includes("due"))
          setError("dueDate", { message });
        if (message.toLowerCase().includes("timezone"))
          setError("timezone", { message });
        if (message.toLowerCase().includes("userid"))
          setError("userId", { message });
        throw new Error(message);
      }

      if (mode === "edit") {
        setTasks((prev) =>
          prev.map((t) => (t._id === task?._id ? { ...t, ...data.data } : t))
        );
      } else {
        setTasks((prev) => [
          {
            ...data.data,
            user: {
              id: data.userId,
              name:
                users.find((u) => u.id === data.userId)?.name || "Unassigned",
            },
          },
          ...prev,
        ]);
      }

      setOpen(false);
      reset(defaultValues);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const renderTrigger = (): React.ReactNode => {
    if (trigger === "new") {
      return (
        <Button onClick={() => setOpen(true)} aria-label="Create new task">
          <PlusIcon />
          New Task
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit task"
        onClick={() => setOpen(true)}
      >
        <Edit2Icon />
      </Button>
    );
  };

  return (
    <>
      {renderTrigger()}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent aria-describedby="task-dialog-description">
          <DialogHeader>
            <DialogTitle>
              {mode === "edit" ? "Edit task" : "Create task"}
            </DialogTitle>
            <DialogDescription id="task-dialog-description">
              {mode === "edit"
                ? "Update task details and assignment."
                : "Add a new task and assign a user."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldSet>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="task-title">
                    <FieldTitle>Title</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="task-title"
                      placeholder="e.g., Prepare sprint planning"
                      {...register("title")}
                    />
                    <FieldError
                      errors={
                        errors.title
                          ? [
                              {
                                message: errors.title.message as string,
                              },
                            ]
                          : []
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-description">
                    <FieldTitle>Description</FieldTitle>
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="task-description"
                      placeholder="Describe the task scope and acceptance criteria"
                      {...register("description")}
                    />
                    <FieldError
                      errors={
                        errors.description
                          ? [
                              {
                                message: errors.description.message as string,
                              },
                            ]
                          : []
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-priority">
                    <FieldTitle>Priority</FieldTitle>
                    <FieldDescription>Select task importance</FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            aria-label="Priority"
                            id="task-priority"
                            className="w-40"
                          >
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {["low", "medium", "high"].map((p) => (
                              <SelectItem
                                key={p}
                                value={p}
                                className="rounded-lg"
                              >
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError
                      errors={
                        errors.priority
                          ? [
                              {
                                message: errors.priority.message as string,
                              },
                            ]
                          : []
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-user">
                    <FieldTitle>Assigned user</FieldTitle>
                    <FieldDescription>
                      Select who owns this task
                    </FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="userId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(val) =>
                            field.onChange(val || undefined)
                          }
                        >
                          <SelectTrigger
                            aria-label="Assigned user"
                            id="task-user"
                            className="w-60"
                          >
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {users.map((u) => (
                              <SelectItem
                                key={u.id}
                                value={u.id}
                                className="rounded-lg"
                              >
                                {u.name || u.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError
                      errors={
                        errors.userId
                          ? [
                              {
                                message: errors.userId.message as string,
                              },
                            ]
                          : []
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="task-due-date">
                    <FieldTitle>Due date</FieldTitle>
                    <FieldDescription>
                      Optional deadline for this task
                    </FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="dueDate"
                      control={control}
                      render={({ field }) => (
                        <Calendar24
                          value={field.value}
                          onChangeAction={field.onChange}
                          idDate="task-due-date"
                          idTime="task-due-time"
                        />
                      )}
                    />
                    <FieldError
                      errors={
                        errors.dueDate
                          ? [
                              {
                                message: errors.dueDate.message as string,
                              },
                            ]
                          : []
                      }
                    />
                  </FieldContent>
                </Field>

                <Field orientation="responsive">
                  <FieldLabel htmlFor="task-reminder">
                    <FieldTitle>Reminder system</FieldTitle>
                    <FieldDescription>
                      It will notify before 1 hour of the due date
                    </FieldDescription>
                  </FieldLabel>
                  <FieldContent>
                    <div className="flex items-center gap-3">
                      <Controller
                        name="reminderEnabled"
                        control={control}
                        render={({ field }) => (
                          <>
                            <Switch
                              id="task-reminder"
                              checked={Boolean(field.value)}
                              onCheckedChange={(checked) =>
                                field.onChange(Boolean(checked))
                              }
                            />
                            <span className="text-sm text-muted-foreground">
                              {field.value ? "Enabled" : "Disabled"}
                            </span>
                          </>
                        )}
                      />
                    </div>
                  </FieldContent>
                </Field>
              </FieldGroup>
            </FieldSet>
            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                aria-label={mode === "edit" ? "Save changes" : "Create task"}
              >
                {submitting
                  ? mode === "edit"
                    ? "Saving..."
                    : "Creating..."
                  : mode === "edit"
                  ? "Save"
                  : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
