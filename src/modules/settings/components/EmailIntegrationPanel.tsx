'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { MailIcon, EyeIcon, EyeOffIcon, SendIcon } from 'lucide-react';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useEmailIntegration } from '../hooks/useSettings';
import { useUpdateEmailIntegration, useTestEmailIntegration } from '../hooks/useSettingsMutations';
import type { EmailProvider, IntegrationStatus, SmtpEncryption } from '../types/settings.types';

// ── Constants ─────────────────────────────────────────────────────────────────

const PROVIDER_LABELS: Record<EmailProvider, string> = {
  resend: 'Resend',
  sendgrid: 'SendGrid',
  ses: 'AWS SES',
  smtp: 'Custom SMTP',
};

const PROVIDERS: EmailProvider[] = ['resend', 'sendgrid', 'ses', 'smtp'];

const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
];

const SMTP_ENCRYPTIONS: { value: SmtpEncryption; label: string }[] = [
  { value: 'tls', label: 'TLS (port 465)' },
  { value: 'starttls', label: 'STARTTLS (port 587)' },
  { value: 'none', label: 'None (not recommended)' },
];

// ── Schema — flat object, port as string to avoid z.coerce TS issues ─────────

const emailIntegrationSchema = z
  .object({
    provider: z.enum(['resend', 'sendgrid', 'ses', 'smtp'] as const),
    fromAddress: z.string().email('Valid email required'),
    fromName: z.string().min(1, 'Required'),
    apiKey: z.string().optional(),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
    region: z.string().optional(),
    host: z.string().optional(),
    port: z.string().optional(),
    username: z.string().optional(),
    password: z.string().optional(),
    encryption: z.enum(['tls', 'starttls', 'none'] as const).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.provider === 'resend' || val.provider === 'sendgrid') {
      if (!val.apiKey)
        ctx.addIssue({ path: ['apiKey'], code: 'custom', message: 'API key required' });
    }
    if (val.provider === 'ses') {
      if (!val.accessKeyId)
        ctx.addIssue({ path: ['accessKeyId'], code: 'custom', message: 'Access Key ID required' });
      if (!val.secretAccessKey)
        ctx.addIssue({
          path: ['secretAccessKey'],
          code: 'custom',
          message: 'Secret Access Key required',
        });
      if (!val.region)
        ctx.addIssue({ path: ['region'], code: 'custom', message: 'Region required' });
    }
    if (val.provider === 'smtp') {
      if (!val.host) ctx.addIssue({ path: ['host'], code: 'custom', message: 'Host required' });
      if (!val.port || isNaN(Number(val.port)))
        ctx.addIssue({ path: ['port'], code: 'custom', message: 'Valid port required' });
      if (!val.username)
        ctx.addIssue({ path: ['username'], code: 'custom', message: 'Username required' });
      if (!val.password)
        ctx.addIssue({ path: ['password'], code: 'custom', message: 'Password required' });
      if (!val.encryption)
        ctx.addIssue({ path: ['encryption'], code: 'custom', message: 'Encryption required' });
    }
  });

type FormValues = z.infer<typeof emailIntegrationSchema>;

// ── Status pill ───────────────────────────────────────────────────────────────

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

// ── Password field ────────────────────────────────────────────────────────────

function PasswordInput({
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

// ── Loading skeleton ──────────────────────────────────────────────────────────

function EmailIntegrationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-20" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-md" />
          ))}
        </div>
      </div>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
      </div>
    </div>
  );
}

// ── Test email dialog ─────────────────────────────────────────────────────────

function TestEmailDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [to, setTo] = useState('');
  const mutation = useTestEmailIntegration();

  function handleSend() {
    mutation.mutate(to, {
      onSuccess: () => {
        toast.success(`Test email sent to ${to}`);
        onOpenChange(false);
        setTo('');
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to send test email');
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Send test email</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="test-to">To</Label>
          <Input
            id="test-to"
            type="email"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={mutation.isPending}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="default"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button size="default" onClick={handleSend} disabled={!to || mutation.isPending}>
            {mutation.isPending ? 'Sending…' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function EmailIntegrationPanel() {
  const { data, isLoading, isError, refetch } = useEmailIntegration();
  const updateMutation = useUpdateEmailIntegration();
  const [status, setStatus] = useState<IntegrationStatus>('unconfigured');
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(emailIntegrationSchema),
    defaultValues: {
      provider: 'resend' as const,
      fromAddress: '',
      fromName: '',
      apiKey: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      host: '',
      port: '',
      username: '',
      password: '',
      encryption: 'tls' as const,
    },
  });

  const provider = watch('provider');

  useEffect(() => {
    if (!data) return;
    const p: EmailProvider = data.provider ?? 'resend';
    setStatus(data.status);
    setLastTestedAt(data.lastTestedAt);
    reset({
      provider: p,
      fromAddress: data.fromAddress,
      fromName: data.fromName,
      apiKey: data.config.apiKey ?? '',
      accessKeyId: data.config.accessKeyId ?? '',
      secretAccessKey: '',
      region: data.config.region ?? '',
      host: data.config.host ?? '',
      port: data.config.port != null ? String(data.config.port) : '',
      username: data.config.username ?? '',
      password: '',
      encryption: data.config.encryption ?? 'tls',
    });
  }, [data, reset]);

  function handleProviderChange(p: EmailProvider) {
    const fromAddress = watch('fromAddress');
    const fromName = watch('fromName');
    reset({
      provider: p,
      fromAddress,
      fromName,
      apiKey: '',
      accessKeyId: '',
      secretAccessKey: '',
      region: '',
      host: '',
      port: '',
      username: '',
      password: '',
      encryption: 'tls',
    });
  }

  function onSubmit(values: FormValues) {
    const { provider: prov, fromAddress, fromName } = values;
    const config: Record<string, string | number | null | undefined> = {};

    if (prov === 'resend' || prov === 'sendgrid') {
      config.apiKey = values.apiKey;
    } else if (prov === 'ses') {
      config.accessKeyId = values.accessKeyId;
      config.secretAccessKey = values.secretAccessKey;
      config.region = values.region;
    } else {
      config.host = values.host;
      config.port = values.port ? Number(values.port) : undefined;
      config.username = values.username;
      config.password = values.password;
      config.encryption = values.encryption;
    }

    updateMutation.mutate(
      { provider: prov, fromAddress, fromName, config },
      {
        onSuccess: (updated) => {
          toast.success('Email configuration saved');
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

  if (isError) {
    return (
      <ErrorState
        message="Failed to load email integration settings."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MailIcon className="size-4 text-fg-subtle" />
            <h2 className="text-sm font-semibold text-fg">Email Integration</h2>
          </div>
          <p className="text-sm text-fg-muted">
            Configure the transactional email provider for outbound notifications.
          </p>
        </div>
        <EmailIntegrationSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MailIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Email Integration</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Configure the transactional email provider for outbound notifications.
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
              key={p}
              type="button"
              onClick={() => handleProviderChange(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors cursor-pointer ${
                provider === p
                  ? 'bg-brand text-on-primary border-brand'
                  : 'bg-surface border-subtle text-fg-subtle hover:bg-surface-raised hover:text-fg'
              }`}
            >
              {PROVIDER_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Resend / SendGrid */}
        {(provider === 'resend' || provider === 'sendgrid') && (
          <div className="space-y-1.5">
            <Label htmlFor="apiKey">API Key</Label>
            <PasswordInput
              id="apiKey"
              placeholder="Enter API key"
              value={watch('apiKey') ?? ''}
              onChange={(e) => setValue('apiKey', e.target.value)}
              error={errors.apiKey?.message}
            />
          </div>
        )}

        {/* AWS SES */}
        {provider === 'ses' && (
          <div className="space-y-4">
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
              <PasswordInput
                id="secretAccessKey"
                placeholder="wJalrXUtnFEMI..."
                value={watch('secretAccessKey') ?? ''}
                onChange={(e) => setValue('secretAccessKey', e.target.value)}
                error={errors.secretAccessKey?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="region">AWS Region</Label>
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
        )}

        {/* Custom SMTP */}
        {provider === 'smtp' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="host">Host</Label>
                <Input id="host" placeholder="smtp.example.com" {...register('host')} />
                {errors.host && <p className="text-xs text-danger">{errors.host.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="port">Port</Label>
                <Input id="port" type="number" placeholder="465" {...register('port')} />
                {errors.port && <p className="text-xs text-danger">{errors.port.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="user@example.com" {...register('username')} />
              {errors.username && <p className="text-xs text-danger">{errors.username.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="SMTP password"
                value={watch('password') ?? ''}
                onChange={(e) => setValue('password', e.target.value)}
                error={errors.password?.message}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="encryption">Encryption</Label>
              <Select
                value={watch('encryption') ?? 'tls'}
                onValueChange={(v) => setValue('encryption', v as SmtpEncryption)}
              >
                <SelectTrigger id="encryption">
                  <SelectValue placeholder="Select encryption" />
                </SelectTrigger>
                <SelectContent>
                  {SMTP_ENCRYPTIONS.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.encryption && (
                <p className="text-xs text-danger">{errors.encryption.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Common fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="fromAddress">From Address</Label>
            <Input
              id="fromAddress"
              type="email"
              placeholder="noreply@yourcompany.com"
              {...register('fromAddress')}
            />
            {errors.fromAddress && (
              <p className="text-xs text-danger">{errors.fromAddress.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fromName">From Name</Label>
            <Input id="fromName" placeholder="Acme HR" {...register('fromName')} />
            {errors.fromName && <p className="text-xs text-danger">{errors.fromName.message}</p>}
          </div>
        </div>

        {/* Status + action row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-subtle">
          <StatusPill status={status} lastTestedAt={lastTestedAt} />
          <div className="flex gap-2 sm:ml-auto">
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={status === 'unconfigured' || updateMutation.isPending}
              onClick={() => setTestDialogOpen(true)}
            >
              <SendIcon className="size-3.5 mr-1.5" />
              Send test email
            </Button>
            <Button type="submit" size="default" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving…' : 'Save configuration'}
            </Button>
          </div>
        </div>
      </form>

      <TestEmailDialog open={testDialogOpen} onOpenChange={setTestDialogOpen} />
    </div>
  );
}
