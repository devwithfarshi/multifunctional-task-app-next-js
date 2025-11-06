"use client";

import * as React from "react";
import { SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Spinner } from "@/components/ui/spinner";
import { Calendar24 } from "@/components/ui/date-picker";
import { Task } from "./types";
import { useTasks } from "./TasksProvider";

type SettingsPanelProps = {
  task: Task;
};

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ task }) => {
  const { setTasks } = useTasks();
  const [open, setOpen] = React.useState<boolean>(false);

  const toggleCompleted = React.useCallback((): void => {
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))
    );
  }, [setTasks, task.id, task.completed]);

  const toggleReminder = React.useCallback(
    (checked: boolean): void => {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, reminderEnabled: Boolean(checked) } : t
        )
      );
    },
    [setTasks, task.id]
  );

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Task settings"
        onClick={() => setOpen(true)}
      >
        <SettingsIcon />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Task settings</SheetTitle>
            <SheetDescription>Configure reminder and completion settings.</SheetDescription>
          </SheetHeader>
          {task ? (
            <div className="flex flex-col gap-6 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="task-completed">Completed</Label>
                  <span className="text-muted-foreground text-xs">
                    Toggle to mark the task as done
                  </span>
                </div>
                <Switch
                  id="task-completed"
                  checked={task.completed}
                  onCheckedChange={toggleCompleted}
                  aria-label="Toggle completion"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="task-reminder-settings">Reminder system</Label>
                  <span className="text-muted-foreground text-xs">
                    Enable to show date and time pickers
                  </span>
                </div>
                <Switch
                  id="task-reminder-settings"
                  checked={task.reminderEnabled}
                  onCheckedChange={(checked) => toggleReminder(Boolean(checked))}
                  aria-label="Enable reminder system"
                />
              </div>

              {task.reminderEnabled && (
                <div className="mt-1">
                  <Calendar24 />
                  <p className="text-muted-foreground mt-2 text-xs">
                    Notifications will be sent via email
                  </p>
                </div>
              )}

              <SheetFooter>
                <Button variant="outline" onClick={() => setOpen(false)} aria-label="Close settings">
                  Close
                </Button>
              </SheetFooter>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <Spinner />
              <span>Loading settings…</span>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};