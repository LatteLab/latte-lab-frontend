"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  MapPin,
  FileText,
  Users,
  Eye,
  ListChecks,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { createEventAction, updateEventAction } from "@/app/actions/events";
import { CoverImagePicker } from "@/components/admin/events/cover-image-picker";
import { TiptapEditor } from "@/components/admin/events/tiptap-editor";
import {
  DateTimePicker,
  TimezonePicker,
} from "@/components/admin/events/date-time-picker";
import type { Event } from "@/lib/db/schema";

export function EventForm({
  event,
  compact,
}: {
  event?: Event;
  compact?: boolean;
}) {
  const [coverImage, setCoverImage] = useState<string>(event?.coverImage || "");
  const [name, setName] = useState(event?.name || "");
  const [startDate, setStartDate] = useState<Date | undefined>(
    event?.date ? new Date(event.date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    event?.endDate ? new Date(event.endDate) : undefined
  );
  const [location, setLocation] = useState(event?.location || "");
  const [description, setDescription] = useState(event?.description || "");
  const [visibility, setVisibility] = useState<"private" | "public">(
    event?.visibility || "private"
  );
  const [capacity, setCapacity] = useState<string>(
    event?.capacity ? String(event.capacity) : ""
  );
  const [waitlistEnabled, setWaitlistEnabled] = useState(
    event?.waitlistEnabled ?? false
  );
  const [requireApproval, setRequireApproval] = useState(
    event?.requireApproval ?? false
  );
  const [timezone, setTimezone] = useState(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isEditing = !!event;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();
    formData.set("name", name);
    formData.set("coverImage", coverImage);
    formData.set("description", description);
    formData.set("location", location);
    formData.set("capacity", capacity);
    formData.set("visibility", visibility);
    formData.set("waitlistEnabled", String(waitlistEnabled));
    if (!isEditing) {
      formData.set("requireApproval", String(requireApproval));
    }

    if (startDate) formData.set("date", startDate.toISOString());
    if (endDate) formData.set("endDate", endDate.toISOString());

    startTransition(async () => {
      try {
        if (event) {
          await updateEventAction(event.id, formData);
          toast.success("Event updated");
        } else {
          const created = await createEventAction(formData);
          toast.success("Event created");
          router.push(`/admin/events/${created.id}`);
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to save event"
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={
          compact
            ? "space-y-6"
            : "grid gap-6 md:gap-8 md:grid-cols-[minmax(280px,420px)_1fr]"
        }
      >
        {/* Cover Image */}
        <CoverImagePicker
          value={coverImage || null}
          onChange={setCoverImage}
          compact={compact}
        />

        {/* Right: Form Fields */}
        <div className="space-y-4">
          {/* Event Name */}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Event Name"
            className="border-0 text-4xl md:text-5xl font-bold placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 h-auto tracking-tight leading-tight"
            required
          />

          {/* Date/Time Section */}
          <div className="rounded-xl border bg-muted/30 px-2.5 py-2 sm:px-3 sm:py-2.5">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="flex-1 space-y-1.5">
                <DateTimePicker
                  label="Start"
                  value={startDate}
                  onChange={setStartDate}
                />
                <DateTimePicker
                  label="End"
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
              <div className="self-center sm:self-auto">
                <TimezonePicker value={timezone} onChange={setTimezone} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-3 rounded-xl border bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add Event Location"
              className="border-0 bg-transparent p-0 h-auto text-sm focus-visible:ring-0 placeholder:text-muted-foreground"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Description</span>
            </div>
            <TiptapEditor
              content={description}
              onChange={setDescription}
              placeholder="Add Description"
            />
          </div>

          {/* Event Options */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Event Options</h3>
            <div className="rounded-xl border divide-y">
              {/* Visibility */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Visibility</span>
                </div>
                <Select
                  value={visibility}
                  onValueChange={(v) =>
                    setVisibility(v as "private" | "public")
                  }
                >
                  <SelectTrigger className="w-[110px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm">Capacity</span>
                </div>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-[110px] h-7 text-xs text-right"
                  required
                />
              </div>

              {/* Waitlist (conditional: shown when capacity is set and approval is off) */}
              {capacity && !requireApproval && (
                <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm">Enable Waitlist</span>
                  </div>
                  <Switch
                    checked={waitlistEnabled}
                    onCheckedChange={setWaitlistEnabled}
                  />
                </div>
              )}

              {/* Require Approval */}
              <div className="flex items-center justify-between px-3 sm:px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  <div>
                    <span className="text-sm">Require Approval</span>
                    <p className="text-[11px] text-muted-foreground">
                      Includes manual selection & lottery-based
                    </p>
                  </div>
                </div>
                {isEditing ? (
                  <span className="text-xs text-muted-foreground">
                    {requireApproval ? "On" : "Off"}
                  </span>
                ) : (
                  <Switch
                    checked={requireApproval}
                    onCheckedChange={(checked) => {
                      setRequireApproval(checked);
                      if (checked) setWaitlistEnabled(false);
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-xl"
            disabled={isPending}
          >
            {isPending ? "Saving..." : event ? "Update Event" : "Create Event"}
          </Button>
        </div>
      </div>
    </form>
  );
}
