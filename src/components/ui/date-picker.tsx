"use client";

import { ChevronDownIcon } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Calendar24Props = {
  value?: string | null;
  onChangeAction?: (value: string | null) => void;
  idDate?: string;
  idTime?: string;
  disabled?: boolean;
};

export function Calendar24({
  value,
  onChangeAction,
  idDate = "date-picker",
  idTime = "time-picker",
  disabled = false,
}: Calendar24Props) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!value) {
      setDate(undefined);
      setTime(undefined);
      return;
    }
    try {
      const d = new Date(value);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(d.getUTCDate()).padStart(2, "0");
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mi = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      setDate(new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`));
      const parsedTime = `${hh}:${mi}:${ss}`;
      setTime(parsedTime === "00:00:00" ? undefined : parsedTime);
    } catch {}
  }, [value]);

  const emitChange = (nextDate?: Date, nextTime?: string) => {
    if (!onChangeAction) return;
    if (!nextDate || !nextTime) {
      onChangeAction(null);
      return;
    }
    const yyyy = nextDate.getUTCFullYear();
    const mm = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getUTCDate()).padStart(2, "0");
    const timePart = nextTime.padEnd(8, "0");
    const iso = new Date(`${yyyy}-${mm}-${dd}T${timePart}.000Z`).toISOString();
    onChangeAction(iso);
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3">
        <Label htmlFor={idDate} className="px-1">
          Date
        </Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={idDate}
              disabled={disabled}
              className="w-40 justify-between font-normal"
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              classNames={{ today: "rounded-md" }}
              onSelect={(d) => {
                setDate(d);
                setOpen(false);
                emitChange(d, time);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-3">
        <Label htmlFor={idTime} className="px-1">
          Time
        </Label>
        <Input
          type="time"
          id={idTime}
          step="1"
          value={time ?? ""}
          disabled={disabled}
          onChange={(e) => {
            const t = e.target.value;
            const next = t && t.length >= 4 ? t : undefined;
            setTime(next);
            emitChange(date, next);
          }}
          className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        />
      </div>
    </div>
  );
}
