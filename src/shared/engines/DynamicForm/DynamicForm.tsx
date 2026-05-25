'use client';

import type { ReactElement } from 'react';
import { Controller } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { FormSection } from './FormSection';
import { FormFieldWrapper } from './FormFieldWrapper';
import { FormFooter } from './FormFooter';
import type { DynamicFormProps, FormFieldConfig } from './types';

function AutoField<TValues extends FieldValues>({
  config,
  form,
}: {
  config: FormFieldConfig<TValues>;
  form: DynamicFormProps<TValues>['form'];
}) {
  const {
    name,
    type = 'text',
    label,
    placeholder,
    required,
    description,
    options,
    rows,
    colSpan,
  } = config;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const error = ((form.formState.errors as any)[String(name)] as { message?: string } | undefined)
    ?.message;
  const fieldId = `df-${String(name)}`;

  if (config.render) {
    return (
      <FormFieldWrapper
        id={fieldId}
        label={label}
        required={required}
        description={description}
        error={error}
        colSpan={colSpan}
      >
        <Controller
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
          name={name}
          render={({ field, fieldState }) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            config.render!({ field: field as any, error: fieldState.error }) as ReactElement
          }
        />
      </FormFieldWrapper>
    );
  }

  if (type === 'select') {
    return (
      <FormFieldWrapper
        id={fieldId}
        label={label}
        required={required}
        description={description}
        error={error}
        colSpan={colSpan}
      >
        <Controller
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          control={form.control as any}
          name={name}
          render={({ field }) => (
            <Select value={field.value ?? ''} onValueChange={field.onChange}>
              <SelectTrigger id={fieldId} className="w-full" aria-invalid={!!error}>
                <SelectValue placeholder={placeholder}>
                  {(v) => (options ?? []).find((o) => o.value === v)?.label ?? v}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(options ?? []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FormFieldWrapper>
    );
  }

  if (type === 'textarea') {
    return (
      <FormFieldWrapper
        id={fieldId}
        label={label}
        required={required}
        description={description}
        error={error}
        colSpan={colSpan}
      >
        <Textarea
          id={fieldId}
          placeholder={placeholder}
          rows={rows ?? 3}
          aria-invalid={!!error}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          {...(form.register as any)(name)}
        />
      </FormFieldWrapper>
    );
  }

  return (
    <FormFieldWrapper
      id={fieldId}
      label={label}
      required={required}
      description={description}
      error={error}
      colSpan={colSpan}
    >
      <Input
        id={fieldId}
        type={type}
        placeholder={placeholder}
        aria-invalid={!!error}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...(form.register as any)(name)}
      />
    </FormFieldWrapper>
  );
}

export function DynamicForm<TValues extends FieldValues>({
  form,
  sections,
  onSubmit,
  submitLabel = 'Save',
  cancelHref,
  onCancel,
  isPending = false,
}: DynamicFormProps<TValues>) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-8 px-6 py-6">
        {sections.map((section) => (
          <FormSection key={section.title} title={section.title}>
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {section.fields.map((field) => (
                <AutoField key={String(field.name)} config={field} form={form} />
              ))}
            </div>
          </FormSection>
        ))}
      </div>

      <FormFooter
        submitLabel={submitLabel}
        cancelHref={cancelHref}
        onCancel={onCancel}
        isPending={isPending}
      />
    </form>
  );
}
