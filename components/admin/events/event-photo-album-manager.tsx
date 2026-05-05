'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Camera, ImagePlus, Images, Loader2, Pencil, Send, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { EVENT_PHOTO_LIMITS } from '@/lib/supabase/image-utils';
import {
  deleteEventPhotoAction,
  uploadEventPhotosAction,
  updateEventPhotoCaptionAction,
  notifyPhotoAlbumAction,
} from '@/app/actions/events';
import type { Event, EventPhoto } from '@/lib/db/schema';

interface EventPhotoAlbumManagerProps {
  event: Event;
  photos: EventPhoto[];
}

function eventHasEnded(event: Event) {
  return new Date(event.endDate ?? event.date) < new Date()
    || event.status === 'closed'
    || event.status === 'completed'
    || event.status === 'cancelled';
}

function photoLabel(count: number) {
  return count === 1 ? '1 photo' : `${count} photos`;
}

export function EventPhotoAlbumManager({ event, photos }: EventPhotoAlbumManagerProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null);
  const [editingPhoto, setEditingPhoto] = useState<EventPhoto | null>(null);
  const [caption, setCaption] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isCaptionPending, startCaptionTransition] = useTransition();
  const [notifying, setNotifying] = useState(false);
  const [showNotifyConfirm, setShowNotifyConfirm] = useState(false);
  const hasEnded = eventHasEnded(event);

  function openNotifyConfirm() {
    if (photos.length === 0) {
      toast.error('Upload at least one photo before notifying');
      return;
    }
    setShowNotifyConfirm(true);
  }

  async function performNotify() {
    setShowNotifyConfirm(false);
    setNotifying(true);
    try {
      const result = await notifyPhotoAlbumAction(event.id);
      const parts: string[] = [`Notified ${result.newlySent} attendee${result.newlySent === 1 ? '' : 's'}`];
      if (result.duplicate > 0) parts.push(`${result.duplicate} already notified`);
      if (result.errored > 0) parts.push(`${result.errored} failed`);
      toast.success(parts.join(' - '));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to notify attendees');
    } finally {
      setNotifying(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    const selected = Array.from(files ?? []);
    if (selected.length === 0) return;

    if (selected.length > EVENT_PHOTO_LIMITS.maxBatchSize) {
      toast.error(`Upload ${EVENT_PHOTO_LIMITS.maxBatchSize} photos or fewer at a time`);
      return;
    }

    for (const file of selected) {
      if (!EVENT_PHOTO_LIMITS.allowedTypes.includes(file.type)) {
        toast.error(`Only ${EVENT_PHOTO_LIMITS.allowedExtensionsLabel} images are allowed`);
        return;
      }
      if (file.size > EVENT_PHOTO_LIMITS.maxSizeBytes) {
        toast.error(`${file.name} must be under ${EVENT_PHOTO_LIMITS.maxSizeLabel}`);
        return;
      }
    }

    const formData = new FormData();
    selected.forEach((file) => formData.append('photos', file));

    setUploading(true);
    setUploadProgress({ done: 0, total: selected.length });

    try {
      const created = await uploadEventPhotosAction(event.id, formData);
      setUploadProgress({ done: created.length, total: selected.length });
      router.refresh();
      toast.success(`${photoLabel(created.length)} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save photos');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function openCaptionDialog(photo: EventPhoto) {
    setEditingPhoto(photo);
    setCaption(photo.caption ?? '');
  }

  function saveCaption() {
    if (!editingPhoto) return;
    startCaptionTransition(async () => {
      try {
        await updateEventPhotoCaptionAction(editingPhoto.id, caption);
        toast.success('Caption updated');
        setEditingPhoto(null);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update caption');
      }
    });
  }

  async function deletePhoto(photoId: string) {
    setDeletingId(photoId);
    try {
      await deleteEventPhotoAction(photoId);
      toast.success('Photo deleted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-muted/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
              <Images className="size-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Event Photos</h3>
              <p className="text-xs text-muted-foreground">
                {photoLabel(photos.length)} in this album
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {uploadProgress && (
              <Badge variant="secondary">
                {uploadProgress.done}/{uploadProgress.total}
              </Badge>
            )}
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 data-icon="inline-start" className="animate-spin" />
              ) : (
                <ImagePlus data-icon="inline-start" />
              )}
              Upload
            </Button>
            {hasEnded && photos.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={openNotifyConfirm}
                disabled={notifying}
                title="Email every confirmed attendee that photos are up"
              >
                {notifying ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Notify attendees
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={EVENT_PHOTO_LIMITS.allowedTypes.join(',')}
              multiple
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
          </div>
        </div>

        {!hasEnded && (
          <Alert className="mt-4">
            <Camera className="size-4" />
            <AlertTitle>Before event end</AlertTitle>
            <AlertDescription>
              Members will only see this album after the event is closed, completed, or past its end time.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Images className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">No photos yet</p>
            <p className="text-xs text-muted-foreground">
              Upload photos from this event when they are ready.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <ImagePlus data-icon="inline-start" />
            Add Photos
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <Card key={photo.id} className="gap-0 overflow-hidden py-0">
              <div className="relative aspect-square bg-muted">
                <img
                  src={photo.publicUrl}
                  alt={photo.caption || 'Event photo'}
                  className="size-full object-cover"
                />
              </div>
              <CardContent className="flex flex-col gap-3 p-3">
                <p className={cn(
                  'min-h-9 text-sm leading-snug',
                  !photo.caption && 'text-muted-foreground',
                )}>
                  {photo.caption || 'No caption'}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openCaptionDialog(photo)}
                  >
                    <Pencil data-icon="inline-start" />
                    Caption
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        disabled={deletingId === photo.id}
                        aria-label="Delete photo"
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Trash2 />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes the photo from the event album.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => deletePhoto(photo.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Caption</DialogTitle>
            <DialogDescription>
              Captions are shown below photos in the member album.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Add a caption"
          />
          <div className="text-right text-xs text-muted-foreground">
            {caption.length}/200
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPhoto(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={saveCaption}
              disabled={isCaptionPending}
            >
              {isCaptionPending ? 'Saving...' : 'Save Caption'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showNotifyConfirm} onOpenChange={setShowNotifyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email confirmed attendees?</AlertDialogTitle>
            <AlertDialogDescription>
              {`Send a "Photos from ${event.name} are up" email to every confirmed attendee.
              Recipients who were already notified will not receive a duplicate.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performNotify}>Notify attendees</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
