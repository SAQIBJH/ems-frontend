'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import {
  HardDriveIcon,
  EyeIcon,
  EyeOffIcon,
  ZapIcon,
  ShieldCheckIcon,
  ClockIcon,
  BugIcon,
} from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useStorageIntegration } from '../hooks/useSettings';
import {
  useUpdateStorageIntegration,
  useTestStorageIntegration,
} from '../hooks/useSettingsMutations';
import type {
  DocumentType,
  IntegrationStatus,
  StorageProvider,
  VirusScanProvider,
} from '../types/settings.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDERS: { value: StorageProvider; label: string; short: string }[] = [
  { value: 's3', label: 'AWS S3', short: 'S3' },
  { value: 'gcs', label: 'Google Cloud Storage', short: 'GCS' },
  { value: 'azure', label: 'Azure Blob Storage', short: 'Azure' },
];

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  EMPLOYEE_RECORD: 'Employee Records',
  PAYSLIP: 'Payslips',
  CONTRACT: 'Contracts',
  ID_PROOF: 'ID Documents',
  OTHER: 'Other',
};

const DOCUMENT_TYPES: DocumentType[] = [
  'EMPLOYEE_RECORD',
  'PAYSLIP',
  'CONTRACT',
  'ID_PROOF',
  'OTHER',
];

const VIRUS_SCAN_PROVIDERS: { value: VirusScanProvider; label: string }[] = [
  { value: 'clamav', label: 'ClamAV (self-hosted)' },
  { value: 'cloudmind', label: 'CloudMind (API)' },
];

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
];

// ── Schema ────────────────────────────────────────────────────────────────────

const retentionPolicySchema = z.object({
  documentType: z.enum(['EMPLOYEE_RECORD', 'PAYSLIP', 'CONTRACT', 'ID_PROOF', 'OTHER'] as const),
  retentionDays: z.string().min(1, 'Required'),
  autoDeletionEnabled: z.boolean(),
});

const storageIntegrationSchema = z
  .object({
    provider: z.enum(['s3', 'gcs', 'azure'] as const),
    // S3
    bucket: z.string().optional(),
    region: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    // GCS
    projectId: z.string().optional(),
    serviceAccountJson: z.string().optional(),
    // Azure
    accountName: z.string().optional(),
    containerName: z.string().optional(),
    connectionString: z.string().optional(),
    // Common
    versioningEnabled: z.boolean(),
    presignedUrlTtlSeconds: z.string().min(1, 'Required'),
    // Retention
    retentionPolicies: z.array(retentionPolicySchema),
    // Virus scan
    virusScanEnabled: z.boolean(),
    virusScanProvider: z.enum(['clamav', 'cloudmind'] as const).optional(),
    virusScanWebhookUrl: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === 's3') {
      if (!val.bucket) ctx.addIssue({ path: ['bucket'], code: 'custom', message: 'Required' });
      if (!val.region) ctx.addIssue({ path: ['region'], code: 'custom', message: 'Required' });
      if (!val.accessKeyId)
        ctx.addIssue({ path: ['accessKeyId'], code: 'custom', message: 'Required' });
      if (!val.secretAccessKey)
        ctx.addIssue({ path: ['secretAccessKey'], code: 'custom', message: 'Required' });
    }
    if (val.provider === 'gcs') {
      if (!val.bucket) ctx.addIssue({ path: ['bucket'], code: 'custom', message: 'Required' });
      if (!val.projectId)
        ctx.addIssue({ path: ['projectId'], code: 'custom', message: 'Required' });
      if (!val.serviceAccountJson)
        ctx.addIssue({ path: ['serviceAccountJson'], code: 'custom', message: 'Required' });
    }
    if (val.provider === 'azure') {
      if (!val.accountName)
        ctx.addIssue({ path: ['accountName'], code: 'custom', message: 'Required' });
      if (!val.containerName)
        ctx.addIssue({ path: ['containerName'], code: 'custom', message: 'Required' });
      if (!val.connectionString)
        ctx.addIssue({ path: ['connectionString'], code: 'custom', message: 'Required' });
    }
    if (
      val.virusScanEnabled &&
      (!val.virusScanProvider ||
        !(['clamav', 'cloudmind'] as const).includes(val.virusScanProvider))
    ) {
      ctx.addIssue({ path: ['virusScanProvider'], code: 'custom', message: 'Required' });
    }
    const ttl = Number(val.presignedUrlTtlSeconds);
    if (isNaN(ttl) || ttl < 60 || ttl > 86400) {
      ctx.addIssue({
        path: ['presignedUrlTtlSeconds'],
        code: 'custom',
        message: 'Must be between 60 and 86400 seconds',
      });
    }
    for (let i = 0; i < val.retentionPolicies.length; i++) {
      const days = Number(val.retentionPolicies[i].retentionDays);
      if (isNaN(days) || days < 1) {
        ctx.addIssue({
          path: ['retentionPolicies', i, 'retentionDays'],
          code: 'custom',
          message: 'Min 1 day',
        });
      }
    }
  });

type FormValues = z.infer<typeof storageIntegrationSchema>;

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusPill({
  status,
  lastTestedAt,
}: {
  status: IntegrationStatus;
  lastTestedAt: string | null;
}) {
  const map: Record<IntegrationStatus, { label: string; className: string }> = {
    connected: { label: 'Connected', className: 'text-success border-success/30 bg-success/5' },
    error: { label: 'Error', className: 'text-danger border-danger/30 bg-danger/5' },
    unconfigured: {
      label: 'Not configured',
      className: 'text-fg-muted border-subtle bg-surface-raised/40',
    },
  };
  const { label, className } = map[status];
  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className={className}>
        {label}
      </Badge>
      {lastTestedAt && status === 'connected' && (
        <span className="text-xs text-fg-muted">
          Last tested {format(parseISO(lastTestedAt), 'd MMM yyyy, HH:mm')}
        </span>
      )}
    </div>
  );
}

function SecretInput({
  id,
  placeholder,
  value,
  onChange,
  error,
}: {
  id: string;
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Input
          id={id}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-subtle">
      <Icon className="size-3.5 text-fg-subtle" />
      <p className="text-xs font-semibold text-fg">{title}</p>
    </div>
  );
}

function StorageIntegrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-md" />
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function StorageIntegrationPanel() {
  const { data, isLoading, isError, refetch } = useStorageIntegration();
  const updateMutation = useUpdateStorageIntegration();
  const testMutation = useTestStorageIntegration();
  const [status, setStatus] = useState<IntegrationStatus>('unconfigured');
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(storageIntegrationSchema),
    defaultValues: {
      provider: 's3' as const,
      bucket: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      projectId: '',
      serviceAccountJson: '',
      accountName: '',
      containerName: '',
      connectionString: '',
      versioningEnabled: false,
      presignedUrlTtlSeconds: '3600',
      retentionPolicies: DOCUMENT_TYPES.map((dt) => ({
        documentType: dt,
        retentionDays: '365',
        autoDeletionEnabled: false,
      })),
      virusScanEnabled: false,
      virusScanProvider: undefined,
      virusScanWebhookUrl: '',
    },
  });

  const { fields } = useFieldArray({ control, name: 'retentionPolicies' });
  const provider = watch('provider');
  const virusScanEnabled = watch('virusScanEnabled');

  useEffect(() => {
    if (!data) return;
    setStatus(data.status);
    setLastTestedAt(data.lastTestedAt);
    reset({
      provider: data.provider ?? 's3',
      bucket: data.config.bucket ?? '',
      region: data.config.region ?? '',
      accessKeyId: data.config.accessKeyId ?? '',
      secretAccessKey: '',
      projectId: data.config.projectId ?? '',
      serviceAccountJson: '',
      accountName: data.config.accountName ?? '',
      containerName: data.config.containerName ?? '',
      connectionString: '',
      versioningEnabled: data.config.versioningEnabled,
      presignedUrlTtlSeconds: String(data.config.presignedUrlTtlSeconds),
      retentionPolicies: DOCUMENT_TYPES.map((dt) => {
        const existing = data.retentionPolicies.find((p) => p.documentType === dt);
        return {
          documentType: dt,
          retentionDays: String(existing?.retentionDays ?? 365),
          autoDeletionEnabled: existing?.autoDeletionEnabled ?? false,
        };
      }),
      virusScanEnabled: data.virusScan.enabled,
      virusScanProvider: data.virusScan.provider ?? undefined,
      virusScanWebhookUrl: data.virusScan.webhookUrl ?? '',
    });
  }, [data, reset]);

  function handleProviderChange(p: StorageProvider) {
    const current = {
      versioningEnabled: watch('versioningEnabled'),
      presignedUrlTtlSeconds: watch('presignedUrlTtlSeconds'),
      retentionPolicies: watch('retentionPolicies'),
      virusScanEnabled: watch('virusScanEnabled'),
      virusScanProvider: watch('virusScanProvider'),
      virusScanWebhookUrl: watch('virusScanWebhookUrl'),
    };
    reset({
      provider: p,
      bucket: '',
      region: '',
      accessKeyId: '',
      secretAccessKey: '',
      projectId: '',
      serviceAccountJson: '',
      accountName: '',
      containerName: '',
      connectionString: '',
      ...current,
    });
  }

  function onSubmit(values: FormValues) {
    const config: Record<string, unknown> = {
      versioningEnabled: values.versioningEnabled,
      presignedUrlTtlSeconds: Number(values.presignedUrlTtlSeconds),
    };

    if (values.provider === 's3') {
      config.bucket = values.bucket;
      config.region = values.region;
      config.accessKeyId = values.accessKeyId;
      if (values.secretAccessKey) config.secretAccessKey = values.secretAccessKey;
    } else if (values.provider === 'gcs') {
      config.bucket = values.bucket;
      config.projectId = values.projectId;
      if (values.serviceAccountJson) config.serviceAccountJson = values.serviceAccountJson;
    } else {
      config.accountName = values.accountName;
      config.containerName = values.containerName;
      if (values.connectionString) config.connectionString = values.connectionString;
    }

    updateMutation.mutate(
      {
        provider: values.provider,
        config,
        retentionPolicies: values.retentionPolicies.map((p) => ({
          documentType: p.documentType,
          retentionDays: Number(p.retentionDays),
          autoDeletionEnabled: p.autoDeletionEnabled,
        })),
        virusScan: {
          enabled: values.virusScanEnabled,
          provider: values.virusScanEnabled ? (values.virusScanProvider ?? null) : null,
          webhookUrl:
            values.virusScanEnabled && values.virusScanWebhookUrl
              ? values.virusScanWebhookUrl
              : null,
        },
      },
      {
        onSuccess: (updated) => {
          toast.success('Storage configuration saved');
          setStatus(updated.status);
          setLastTestedAt(updated.lastTestedAt);
        },
        onError: (err) => {
          const axiosErr = err as AxiosError<ApiError>;
          toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save configuration');
        },
      },
    );
  }

  function handleTest() {
    testMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Connected to ${result.bucket} — ${result.latencyMs}ms`);
        setLastTestedAt(new Date().toISOString());
        setStatus('connected');
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Connection test failed');
        setStatus('error');
      },
    });
  }

  if (isError) {
    return (
      <ErrorState
        message="Failed to load storage integration settings."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HardDriveIcon className="size-4 text-fg-subtle" />
            <h2 className="text-sm font-semibold text-fg">Storage Integration</h2>
          </div>
          <p className="text-sm text-fg-muted">
            Connect your cloud storage bucket for documents, payslips, and assets.
          </p>
        </div>
        <StorageIntegrationSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <HardDriveIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Storage Integration</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Connect your cloud storage bucket for documents, payslips, and assets — with
          access-controlled pre-signed URLs and configurable retention policies.
        </p>
      </div>

      {/* Provider picker */}
      <div className="space-y-2">
        <p className="text-[0.625rem] font-semibold uppercase tracking-widest text-fg-disabled">
          Provider
        </p>
        <div className="flex flex-wrap gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handleProviderChange(p.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
                provider === p.value
                  ? 'bg-brand text-on-primary border-brand'
                  : 'bg-surface border-subtle text-fg-subtle hover:bg-surface-raised hover:text-fg'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* ── Provider credentials ── */}
        <div className="space-y-4">
          <SectionHeader icon={ShieldCheckIcon} title="Credentials" />

          {/* S3 */}
          {provider === 's3' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bucket">Bucket name</Label>
                  <Input id="bucket" placeholder="acme-ems-documents" {...register('bucket')} />
                  {errors.bucket && <p className="text-xs text-danger">{errors.bucket.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="region">Region</Label>
                  <Select
                    value={watch('region') ?? ''}
                    onValueChange={(v) => setValue('region', v as string)}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {AWS_REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.region && <p className="text-xs text-danger">{errors.region.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="accessKeyId">Access Key ID</Label>
                <Input
                  id="accessKeyId"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  {...register('accessKeyId')}
                />
                {errors.accessKeyId && (
                  <p className="text-xs text-danger">{errors.accessKeyId.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="secretAccessKey">Secret Access Key</Label>
                <SecretInput
                  id="secretAccessKey"
                  placeholder="Leave blank to keep existing key"
                  value={watch('secretAccessKey') ?? ''}
                  onChange={(e) => setValue('secretAccessKey', e.target.value)}
                  error={errors.secretAccessKey?.message}
                />
              </div>
            </div>
          )}

          {/* GCS */}
          {provider === 'gcs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bucket">Bucket name</Label>
                  <Input id="bucket" placeholder="acme-ems-documents" {...register('bucket')} />
                  {errors.bucket && <p className="text-xs text-danger">{errors.bucket.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    placeholder="my-gcp-project-123"
                    {...register('projectId')}
                  />
                  {errors.projectId && (
                    <p className="text-xs text-danger">{errors.projectId.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="serviceAccountJson">Service Account JSON</Label>
                <Textarea
                  id="serviceAccountJson"
                  {...register('serviceAccountJson')}
                  rows={5}
                  placeholder='{"type":"service_account","project_id":"..."}'
                  className="font-mono text-xs"
                />
                <p className="text-xs text-fg-muted">
                  Paste the full service account JSON key. Stored encrypted.
                </p>
                {errors.serviceAccountJson && (
                  <p className="text-xs text-danger">{errors.serviceAccountJson.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Azure */}
          {provider === 'azure' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="accountName">Storage account name</Label>
                  <Input id="accountName" placeholder="acmeemsdocs" {...register('accountName')} />
                  {errors.accountName && (
                    <p className="text-xs text-danger">{errors.accountName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="containerName">Container name</Label>
                  <Input
                    id="containerName"
                    placeholder="documents"
                    {...register('containerName')}
                  />
                  {errors.containerName && (
                    <p className="text-xs text-danger">{errors.containerName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="connectionString">Connection string</Label>
                <SecretInput
                  id="connectionString"
                  placeholder="DefaultEndpointsProtocol=https;AccountName=..."
                  value={watch('connectionString') ?? ''}
                  onChange={(e) => setValue('connectionString', e.target.value)}
                  error={errors.connectionString?.message}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Access settings ── */}
        <div className="space-y-4">
          <SectionHeader icon={ZapIcon} title="Access &amp; Versioning" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-fg">Document versioning</p>
                <p className="text-xs text-fg-muted mt-0.5">
                  Keep full history of every upload. Versions retained for the full retention
                  period.
                </p>
              </div>
              <Switch
                checked={watch('versioningEnabled')}
                onCheckedChange={(v) => setValue('versioningEnabled', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="presignedUrlTtlSeconds">Pre-signed URL TTL (seconds)</Label>
              <Input
                id="presignedUrlTtlSeconds"
                type="number"
                min={60}
                max={86400}
                placeholder="3600"
                {...register('presignedUrlTtlSeconds')}
              />
              <p className="text-xs text-fg-muted">
                How long download links remain valid (60 – 86400 s). Files are never publicly
                accessible.
              </p>
              {errors.presignedUrlTtlSeconds && (
                <p className="text-xs text-danger">{errors.presignedUrlTtlSeconds.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Retention policies ── */}
        <div className="space-y-4">
          <SectionHeader icon={ClockIcon} title="Retention &amp; Auto-deletion" />
          <p className="text-xs text-fg-muted -mt-1">
            Files older than the retention period are flagged. Enable auto-deletion to permanently
            remove them via a nightly job.
          </p>
          <div className="rounded-lg border border-subtle overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-subtle bg-surface-raised/40">
                  <th className="text-left text-xs font-semibold text-fg-muted px-4 py-2.5">
                    Document type
                  </th>
                  <th className="text-left text-xs font-semibold text-fg-muted px-4 py-2.5 w-36">
                    Retention (days)
                  </th>
                  <th className="text-center text-xs font-semibold text-fg-muted px-4 py-2.5 w-28">
                    Auto-delete
                  </th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, i) => (
                  <tr key={field.id} className="border-b border-subtle last:border-0">
                    <td className="px-4 py-2.5 text-fg">
                      {DOCUMENT_TYPE_LABELS[field.documentType]}
                    </td>
                    <td className="px-4 py-2.5">
                      <Input
                        type="number"
                        min={1}
                        className="h-8 w-24"
                        {...register(`retentionPolicies.${i}.retentionDays`)}
                      />
                      {errors.retentionPolicies?.[i]?.retentionDays && (
                        <p className="text-xs text-danger mt-0.5">
                          {errors.retentionPolicies[i]?.retentionDays?.message}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <Switch
                        checked={watch(`retentionPolicies.${i}.autoDeletionEnabled`)}
                        onCheckedChange={(v) =>
                          setValue(`retentionPolicies.${i}.autoDeletionEnabled`, v)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Virus scan ── */}
        <div className="space-y-4">
          <SectionHeader icon={BugIcon} title="Virus Scanning" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-fg">Scan uploads for malware</p>
              <p className="text-xs text-fg-muted mt-0.5">
                Every uploaded file is scanned before it is accessible. Infected files are
                quarantined automatically.
              </p>
            </div>
            <Switch
              checked={virusScanEnabled}
              onCheckedChange={(v) => setValue('virusScanEnabled', v)}
            />
          </div>

          {virusScanEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0">
              <div className="space-y-1.5">
                <Label htmlFor="virusScanProvider">Scan provider</Label>
                <Select
                  value={watch('virusScanProvider') ?? ''}
                  onValueChange={(v) => setValue('virusScanProvider', v as VirusScanProvider)}
                >
                  <SelectTrigger id="virusScanProvider">
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {VIRUS_SCAN_PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.virusScanProvider && (
                  <p className="text-xs text-danger">{errors.virusScanProvider.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="virusScanWebhookUrl">Scan result webhook URL</Label>
                <Input
                  id="virusScanWebhookUrl"
                  type="url"
                  placeholder="https://yourapp.com/api/webhooks/scan"
                  {...register('virusScanWebhookUrl')}
                />
                <p className="text-xs text-fg-muted">
                  Receives a POST when a scan completes (clean or infected).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Status + actions ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-subtle">
          <StatusPill status={status} lastTestedAt={lastTestedAt} />
          <div className="flex gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={
                status === 'unconfigured' || testMutation.isPending || updateMutation.isPending
              }
              onClick={handleTest}
            >
              {testMutation.isPending ? 'Testing…' : 'Test connection'}
            </Button>
            <Button type="submit" size="default" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save configuration'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
