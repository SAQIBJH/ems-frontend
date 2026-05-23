import type React from 'react';
import type {
  FieldValues,
  Path,
  FieldError,
  UseFormReturn,
  SubmitHandler,
  ControllerRenderProps,
} from 'react-hook-form';

export type FormFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'date'
  | 'number'
  | 'password'
  | 'textarea'
  | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormFieldConfig<TValues extends FieldValues = FieldValues> {
  name: Path<TValues>;
  type?: FormFieldType;
  label: string;
  placeholder?: string;
  required?: boolean;
  description?: string;
  options?: SelectOption[];
  rows?: number;
  colSpan?: 1 | 2;
  // Escape hatch for fields that need custom rendering (e.g. dynamic selects)
  // Uses ControllerRenderProps with loose types to support all field shapes
  render?: (ctx: {
    field: ControllerRenderProps<FieldValues, string>;
    error?: FieldError;
  }) => React.ReactNode;
}

export interface FormSectionConfig<TValues extends FieldValues = FieldValues> {
  title: string;
  fields: FormFieldConfig<TValues>[];
}

export interface DynamicFormProps<TValues extends FieldValues> {
  form: UseFormReturn<TValues>;
  sections: FormSectionConfig<TValues>[];
  onSubmit: SubmitHandler<TValues>;
  submitLabel?: string;
  cancelHref?: string;
  onCancel?: () => void;
  isPending?: boolean;
}
