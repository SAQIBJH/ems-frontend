'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaletteIcon, SaveIcon, UploadIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { AxiosError } from 'axios';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import type { ApiError } from '@/types/api';

import { useBranding } from '../hooks/useSettings';
import { useUpdateBranding } from '../hooks/useSettingsMutations';
import { brandingSchema, type BrandingFormValues } from '../validations/settings.schema';

const MAX_LOGO_BYTES = 1 * 1024 * 1024; // 1 MB
const ALLOWED_TYPES = ['image/png', 'image/svg+xml'];

function BrandingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-48 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-44" />
        </div>
      </div>
    </div>
  );
}

export function BrandingPanel() {
  const { data, isLoading, isError, refetch } = useBranding();
  const mutation = useUpdateBranding();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: { primary_color_hex: '' },
  });

  useEffect(() => {
    if (data) {
      form.reset({ primary_color_hex: data.primary_color_hex ?? '' });
    }
  }, [data, form]);

  // Release object URL when logo file changes or component unmounts
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only PNG or SVG files are allowed.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error('Logo must be 1 MB or smaller.');
      return;
    }

    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    // Reset file input so re-selecting same file triggers change
    e.target.value = '';
  }

  function handleRemoveLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  }

  const isDirty = form.formState.isDirty || logoFile !== null;

  function onSubmit(values: BrandingFormValues) {
    let payload: FormData | { primary_color_hex?: string };

    if (logoFile) {
      const fd = new FormData();
      fd.append('logo', logoFile);
      if (values.primary_color_hex) fd.append('primary_color_hex', values.primary_color_hex);
      payload = fd;
    } else {
      payload = { primary_color_hex: values.primary_color_hex || undefined };
    }

    mutation.mutate(payload, {
      onSuccess: () => {
        toast.success('Branding saved');
        setLogoFile(null);
        setLogoPreview(null);
        form.reset(values); // reset dirty state without re-fetching defaults
      },
      onError: (err) => {
        const axiosErr = err as AxiosError<ApiError>;
        toast.error(axiosErr.response?.data?.error?.message ?? 'Failed to save branding');
      },
    });
  }

  function handleDiscard() {
    form.reset({ primary_color_hex: data?.primary_color_hex ?? '' });
    handleRemoveLogo();
  }

  if (isError) {
    return (
      <ErrorState message="Failed to load branding settings." onRetry={() => void refetch()} />
    );
  }

  if (isLoading) {
    return <BrandingSkeleton />;
  }

  const currentLogo = logoPreview ?? data?.logo_url ?? null;
  const currentColor = form.watch('primary_color_hex') || data?.primary_color_hex || '#3b5cff';

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PaletteIcon className="size-4 text-fg-subtle" />
          <h2 className="text-sm font-semibold text-fg">Branding</h2>
        </div>
        <p className="text-sm text-fg-muted">
          Public-facing information about your workspace — logo and brand colour.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo section */}
        <div className="space-y-3">
          <Label>Logo</Label>

          <div className="flex items-start gap-4">
            {/* Preview box */}
            <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-subtle bg-surface-raised overflow-hidden">
              {currentLogo ? (
                // next/image cannot handle blob: URLs or arbitrary CDN origins without allowlist config
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentLogo}
                  alt="Organisation logo"
                  className="max-h-full max-w-full object-contain p-2"
                />
              ) : (
                <span className="text-xs text-fg-muted text-center px-2">No logo</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadIcon className="size-3.5 mr-1.5" />
                  {currentLogo ? 'Replace' : 'Upload'}
                </Button>

                {logoFile && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    <XIcon className="size-3.5 mr-1" />
                    Remove
                  </Button>
                )}
              </div>

              <p className="text-xs text-fg-muted">PNG or SVG, max 1 MB</p>

              {logoFile && (
                <p className="text-xs text-fg-subtle truncate max-w-[200px]">{logoFile.name}</p>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.svg,image/png,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Primary colour */}
        <div className="space-y-2">
          <Label htmlFor="primary_color_hex">Brand Colour</Label>
          <div className="flex items-center gap-3">
            {/* Colour swatch preview */}
            <div
              className="size-9 rounded-md border border-subtle shrink-0"
              style={{
                backgroundColor: /^#[0-9a-fA-F]{6}$/.test(currentColor) ? currentColor : undefined,
              }}
            />
            <Input
              id="primary_color_hex"
              placeholder="#3b5cff"
              className="max-w-[180px] font-mono"
              {...form.register('primary_color_hex')}
            />
          </div>
          {form.formState.errors.primary_color_hex && (
            <p className="text-xs text-danger">{form.formState.errors.primary_color_hex.message}</p>
          )}
        </div>

        {/* Actions — only when dirty */}
        {isDirty && (
          <div className="flex items-center gap-3">
            <Button type="submit" size="default" disabled={mutation.isPending}>
              <SaveIcon className="size-3.5 mr-1.5" />
              {mutation.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={handleDiscard}
              disabled={mutation.isPending}
            >
              Discard
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
