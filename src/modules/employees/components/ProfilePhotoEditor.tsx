'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CameraIcon, Loader2Icon, TrashIcon } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { ApiError } from '@/types/api';

import { useDeletePhoto, useUploadPhoto } from '../hooks/usePhoto';

const ACCEPTED_MIME = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_SIZE_MB = 5;

function getInitials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

function apiMessage(err: unknown, fallback: string): string {
  return (err as AxiosError<ApiError>).response?.data?.error?.message ?? fallback;
}

/* ── upload / remove dialog ───────────────────────────────────────────────── */

function PhotoDialog({
  open,
  onOpenChange,
  employeeId,
  photoUrl,
  initials,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
  photoUrl: string | null;
  initials: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadMutation = useUploadPhoto(employeeId);
  const deleteMutation = useDeletePhoto(employeeId);
  const busy = uploadMutation.isPending || deleteMutation.isPending;

  // Revoke the object URL when it changes or the dialog unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function reset() {
    setSelectedFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    if (busy) return;
    reset();
    onOpenChange(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file (JPG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  async function handleSave() {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync(selectedFile);
      toast.success('Profile photo updated.');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to upload photo.'));
    }
  }

  async function handleRemove() {
    try {
      await deleteMutation.mutateAsync();
      toast.success('Profile photo removed.');
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(apiMessage(err, 'Failed to remove photo.'));
    }
  }

  const shownPhoto = previewUrl ?? photoUrl ?? undefined;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Profile photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <Avatar className="size-24" variant="brand">
            <AvatarImage src={shownPhoto} alt="Profile photo preview" />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_MIME}
            className="sr-only"
            id="photo-upload-input"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-1.5">
            <Label htmlFor="photo-upload-input" className="sr-only">
              Choose an image
            </Label>
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              {selectedFile ? 'Choose a different image' : 'Choose image'}
            </Button>
            <p className="text-xs text-fg-subtle">JPG, PNG, WebP, GIF — max {MAX_SIZE_MB} MB</p>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          {photoUrl && !selectedFile ? (
            <Button
              variant="ghost"
              type="button"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={handleRemove}
              disabled={busy}
              aria-busy={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <TrashIcon className="size-3.5" aria-hidden />
              )}
              Remove photo
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" type="button" onClick={handleClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!selectedFile || busy}
              aria-busy={uploadMutation.isPending}
            >
              {uploadMutation.isPending && (
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
              )}
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── avatar + edit affordance ─────────────────────────────────────────────── */

export function ProfilePhotoEditor({
  employeeId,
  firstName,
  lastName,
  photoUrl,
  canEdit,
}: {
  employeeId: string;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const initials = getInitials(firstName, lastName);

  return (
    <div className="relative shrink-0">
      <Avatar className="size-14">
        <AvatarImage src={photoUrl ?? undefined} alt={`${firstName} ${lastName}`} />
        <AvatarFallback className="bg-brand-50 text-base font-semibold text-brand">
          {initials}
        </AvatarFallback>
      </Avatar>

      {canEdit && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Change profile photo"
            className="absolute -right-1 -bottom-1 flex size-6 cursor-pointer items-center justify-center rounded-full border border-subtle bg-surface text-fg-muted shadow-sm transition-colors hover:bg-surface-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-brand focus-visible:outline-none"
          >
            <CameraIcon className="size-3.5" aria-hidden />
          </button>
          <PhotoDialog
            open={open}
            onOpenChange={setOpen}
            employeeId={employeeId}
            photoUrl={photoUrl}
            initials={initials}
          />
        </>
      )}
    </div>
  );
}
