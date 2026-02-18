"use client";

import { useState } from "react";
import { format, setHours, setMinutes, getHours, getMinutes } from "date-fns";
import { CalendarIcon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function generateTimeOptions() {
  const options: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const value = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const period = h >= 12 ? "PM" : "AM";
      const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const label = `${displayHour.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${period}`;
      options.push({ value, label });
    }
  }
  return options;
}

const timeOptions = generateTimeOptions();

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  label: string;
}

function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentTimeValue = value
    ? `${getHours(value).toString().padStart(2, "0")}:${getMinutes(value).toString().padStart(2, "0")}`
    : undefined;

  function handleDateSelect(selectedDate: Date | undefined) {
    if (!selectedDate) {
      onChange(undefined);
      return;
    }

    if (value) {
      const withTime = setMinutes(
        setHours(selectedDate, getHours(value)),
        getMinutes(value)
      );
      onChange(withTime);
    } else {
      onChange(selectedDate);
    }

    setCalendarOpen(false);
  }

  function handleTimeSelect(timeValue: string) {
    const [hours, minutes] = timeValue.split(":").map(Number);
    const base = value ?? new Date();
    const updated = setMinutes(setHours(base, hours), minutes);
    onChange(updated);
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground min-w-[40px]">
        {label}
      </span>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted min-w-[140px]",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            {value ? format(value, "EEE, MMM d") : "Pick a date"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>

      <Select value={currentTimeValue} onValueChange={handleTimeSelect}>
        <SelectTrigger className="rounded-lg border bg-background w-[120px]">
          <SelectValue placeholder="Time" />
        </SelectTrigger>
        <SelectContent>
          {timeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function TimezoneDisplay() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") ?? timeZone;

  const offsetMinutes = new Date().getTimezoneOffset();
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const absMinutes = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absMinutes / 60)
    .toString()
    .padStart(2, "0");
  const offsetMins = (absMinutes % 60).toString().padStart(2, "0");
  const gmtOffset = `GMT${sign}${offsetHours}:${offsetMins}`;

  return (
    <div className="flex flex-col items-center justify-center border rounded-xl px-3 py-2 text-xs text-muted-foreground min-w-[90px]">
      <Globe className="h-4 w-4 mb-1" />
      <span>{gmtOffset}</span>
      <span>{city}</span>
    </div>
  );
}

export { DateTimePicker, TimezoneDisplay };
