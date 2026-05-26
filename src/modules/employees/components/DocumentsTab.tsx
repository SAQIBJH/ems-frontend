'use client';

import { useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { DownloadIcon, FileTextIcon, Loader2Icon, TrashIcon, UploadIcon } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { Skeleton } from '@/components/feedback/Skeleton';
import { PermissionWrapper } from '@/shared/guards/PermissionWrapper';
import { useAuth } from '@/providers';
import type { ApiError } from '@/types/api';

import type {
  DocumentType,
  DocumentVerificationStatus,
  EmployeeDocument,
} from '../types/employee.types';
import { useEmployeeDocuments, useRemoveDocument, useUploadDocument } from '../hooks/useDocuments';

/* ── constants ────────────────────────────────────────────────────────────── */

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_PROOF: 'ID Proof',
  OFFER_LETTER: 'Offer Letter',
  CONTRACT: 'Contract',
  AADHAAR: 'Aadhaar',
  PAN: 'PAN Card',
  BANK: 'Bank Statement',
  OTHER: 'Other',
};

const STATUS_CLASS: Record<DocumentVerificationStatus, string> = {
  PENDING: 'border-warning/40 bg-warning/10 text-warning',
  VERIFIED: 'border-success/40 bg-success/10 text-success',
  REJECTED: 'border-danger/40 bg-danger/10 text-danger',
};

const ACCEPTED_MIME = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_SIZE_MB = 10;

/* ── sub-components ───────────────────────────────────────────────────────── */

function DocRow({
  doc,
  canDelete,
  onDelete,
}: {
  doc: EmployeeDocument;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-subtle bg-surface p-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2">
          <FileTextIcon className="size-4 text-fg-muted" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-fg">{doc.fileName}</p>
          <p className="mt-0.5 text-xs text-fg-muted">
            {format(parseISO(doc.createdAt), 'dd MMM yyyy')}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
          {DOCUMENT_TYPE_LABELS[doc.documentType] ?? doc.documentType}
        </Badge>
        <Badge
          variant="outline"
          className={`text-[10px] ${STATUS_CLASS[doc.verificationStatus] ?? ''}`}
        >
          {doc.verificationStatus.charAt(0) + doc.verificationStatus.slice(1).toLowerCase()}
        </Badge>

        <a href={doc.fileUrl} target="_blank" rel="noreferrer" download={doc.fileName}>
          <Button variant="ghost" size="icon" className="size-8" aria-label="Download document">
            <DownloadIcon className="size-3.5" aria-hidden />
          </Button>
        </a>

        {canDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-danger hover:bg-danger/10 hover:text-danger"
            aria-label="Delete document"
            onClick={() => onDelete(doc.id)}
          >
            <TrashIcon className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── upload dialog ────────────────────────────────────────────────────────── */

function UploadDialog({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeId: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>('OTHER');
  const uploadMutation = useUploadDocument(employeeId);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSelectedFile(file);
  }

  function handleClose() {
    if (uploadMutation.isPending) return;
    setSelectedFile(null);
    setDocType('OTHER');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    try {
      await uploadMutation.mutateAsync({ file: selectedFile, documentType: docType });
      toast.success('Document uploaded successfully.');
      handleClose();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to upload document.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File picker */}
          <div className="space-y-1.5">
            <Label>File</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MIME}
              className="sr-only"
              id="doc-upload-input"
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
              >
                Choose file
              </Button>
              <span className="min-w-0 truncate text-sm text-fg-muted">
                {selectedFile ? selectedFile.name : 'No file chosen'}
              </span>
            </div>
            <p className="text-xs text-fg-subtle">PDF, JPG, PNG, DOC — max {MAX_SIZE_MB} MB</p>
          </div>

          {/* Document type */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-type-select">Document type</Label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocumentType)}
              disabled={uploadMutation.isPending}
            >
              <SelectTrigger id="doc-type-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {DOCUMENT_TYPE_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={uploadMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || uploadMutation.isPending}
            aria-busy={uploadMutation.isPending}
          >
            {uploadMutation.isPending && (
              <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
            )}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── skeleton ─────────────────────────────────────────────────────────────── */

function DocumentsSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((n) => (
        <Skeleton key={n} className="h-[60px] w-full rounded-lg" />
      ))}
    </div>
  );
}

/* ── main component ───────────────────────────────────────────────────────── */

export function DocumentsTab({ employeeId }: { employeeId: string }) {
  const { permissions } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: documents, isLoading, isError, refetch } = useEmployeeDocuments(employeeId);
  const removeMutation = useRemoveDocument(employeeId);

  const canUpload = permissions.includes('employees:write');
  const canDelete = permissions.includes('employees:delete');

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeMutation.mutateAsync(deleteTarget);
      toast.success('Document deleted.');
      setDeleteTarget(null);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to delete document.');
    }
  }

  if (isLoading) return <DocumentsSkeleton />;

  if (isError) {
    return <ErrorState message="Could not load documents." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          {documents && documents.length > 0
            ? `${documents.length} document${documents.length !== 1 ? 's' : ''}`
            : 'No documents'}
        </p>
        {canUpload && (
          <PermissionWrapper permission="employees:write">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setUploadOpen(true)}
              className="gap-1.5"
            >
              <UploadIcon className="size-3.5" aria-hidden />
              Upload
            </Button>
          </PermissionWrapper>
        )}
      </div>

      {/* Document list */}
      {!documents || documents.length === 0 ? (
        <EmptyState
          title="No documents"
          description={
            canUpload
              ? 'Upload an ID proof, contract, or other document.'
              : 'No documents have been uploaded for this employee.'
          }
          icon={<FileTextIcon className="size-6 text-fg-muted" aria-hidden />}
          action={
            canUpload ? (
              <Button size="sm" onClick={() => setUploadOpen(true)} className="gap-1.5">
                <UploadIcon className="size-3.5" aria-hidden />
                Upload first document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <DocRow key={doc.id} doc={doc} canDelete={canDelete} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Upload dialog */}
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} employeeId={employeeId} />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete document?"
        description="This document will be permanently removed from the employee's profile and cannot be recovered."
        confirmLabel="Delete"
        variant="danger"
        loading={removeMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
