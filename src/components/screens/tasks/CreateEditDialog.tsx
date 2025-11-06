"use client";

import * as React from "react";
import { PlusIcon, Edit2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Calendar24 } from "@/components/ui/date-picker";
import {
  Task,
  TaskFormValues,
  DEMO_USERS,
  createEmptyTask,
} from "./types";
import { useTasks } from "./TasksProvider";

type CreateEditDialogProps = {
  mode: "create" | "edit";
  task?: Task;
  trigger?: "new" | "icon";
};

export const CreateEditDialog: React.FC<CreateEditDialogProps> = ({
  mode,
  task,
  trigger = mode === "edit" ? "icon" : "new",
}) => {
  const { setTasks } = useTasks();

  const [open, setOpen] = React.useState<boolean>(false);
  const [formValues, setFormValues] = React.useState<TaskFormValues>(() =>
    mode === "edit" && task
      ? {
          title: task.title,
          description: task.description,
          assignee: task.assignee,
          reminderEnabled: task.reminderEnabled,
        }
      : createEmptyTask()
  );
  const [formErrors, setFormErrors] = React.useState<{
    title?: string;
    description?: string;
  } | null>(null);

  const resetForm = React.useCallback((): void => {
    setFormValues(
      mode === "edit" && task
        ? {
            title: task.title,
            description: task.description,
            assignee: task.assignee,
            reminderEnabled: task.reminderEnabled,
          }
        : createEmptyTask()
    );
    setFormErrors(null);
  }, [mode, task]);

  const validateForm = React.useCallback(
    (values: TaskFormValues): boolean => {
      const errors: { title?: string; description?: string } = {};
      if (!values.title.trim()) errors.title = "Title is required";
      if (!values.description.trim()) errors.description = "Description is required";
      setFormErrors(Object.keys(errors).length ? errors : null);
      return !Object.keys(errors).length;
    },
    []
  );

  const handleSubmit = React.useCallback((): void => {
    try {
      if (!validateForm(formValues)) return;
      if (mode === "create") {
        const newTask: Task = {
          id: `t-${Date.now()}`,
          title: formValues.title.trim(),
          description: formValues.description.trim(),
          assignee: formValues.assignee,
          completed: false,
          reminderEnabled: formValues.reminderEnabled,
        };
        setTasks((prev) => [newTask, ...prev]);
      } else if (mode === "edit" && task) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id
              ? {
                  ...t,
                  title: formValues.title.trim(),
                  description: formValues.description.trim(),
                  assignee: formValues.assignee,
                  reminderEnabled: formValues.reminderEnabled,
                }
              : t
          )
        );
      }
      setOpen(false);
      resetForm();
    } catch {
      setFormErrors({ title: "Unable to save task. Try again." });
    }
  }, [formValues, mode, task, resetForm, setTasks, validateForm]);

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
            <DialogTitle>{mode === "edit" ? "Edit task" : "Create task"}</DialogTitle>
            <DialogDescription id="task-dialog-description">
              {mode === "edit"
                ? "Update task details and assignment."
                : "Add a new task and assign a user."}
            </DialogDescription>
          </DialogHeader>
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
                    value={formValues.title}
                    onChange={(e) =>
                      setFormValues((v) => ({ ...v, title: e.target.value }))
                    }
                    aria-invalid={Boolean(formErrors?.title) || undefined}
                  />
                  <FieldError
                    errors={[
                      formErrors?.title ? { message: formErrors.title } : undefined,
                    ]}
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
                    value={formValues.description}
                    onChange={(e) =>
                      setFormValues((v) => ({
                        ...v,
                        description: e.target.value,
                      }))
                    }
                    aria-invalid={Boolean(formErrors?.description) || undefined}
                  />
                  <FieldError
                    errors={[
                      formErrors?.description
                        ? { message: formErrors.description }
                        : undefined,
                    ]}
                  />
                </FieldContent>
              </Field>

              <Field orientation="responsive">
                <FieldLabel>
                  <FieldTitle>Assign user</FieldTitle>
                  <FieldDescription>Select a collaborator</FieldDescription>
                </FieldLabel>
                <FieldContent>
                  <Select
                    value={formValues.assignee}
                    onValueChange={(a) =>
                      setFormValues((v) => ({ ...v, assignee: a }))
                    }
                  >
                    <SelectTrigger aria-label="Assignee" className="w-40">
                      <SelectValue placeholder="Select user" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {DEMO_USERS.map((u) => (
                        <SelectItem key={u} value={u} className="rounded-lg">
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              <Field orientation="responsive">
                <FieldLabel htmlFor="task-reminder">
                  <FieldTitle>Reminder system</FieldTitle>
                  <FieldDescription>Enable to display the date picker</FieldDescription>
                </FieldLabel>
                <FieldContent>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="task-reminder"
                      checked={formValues.reminderEnabled}
                      onCheckedChange={(checked) =>
                        setFormValues((v) => ({
                          ...v,
                          reminderEnabled: Boolean(checked),
                        }))
                      }
                      aria-label="Enable reminder system"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formValues.reminderEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  {formValues.reminderEnabled && (
                    <div className="mt-4">
                      <Calendar24 />
                      <p className="text-muted-foreground mt-2 text-xs">
                        Notifications will be sent via email
                      </p>
                    </div>
                  )}
                </FieldContent>
              </Field>
            </FieldGroup>
          </FieldSet>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} aria-label="Cancel">
              Cancel
            </Button>
            <Button onClick={handleSubmit} aria-label={mode === "edit" ? "Save changes" : "Create task"}>
              {mode === "edit" ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};