'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller, useWatch } from 'react-hook-form';
import type { UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { CheckIcon, FileTextIcon, Loader2Icon, PlusIcon, TrashIcon, Wand2Icon } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { FormFieldWrapper } from '@/shared/engines/DynamicForm/FormFieldWrapper';
import { useAuth } from '@/providers';
import type { ApiError } from '@/types/api';

import { z } from 'zod';
import { employeeCreateSchema } from '../validations/employee.schema';

// Stepper-only extension: Access step fields not needed by the edit form
const stepperSchema = employeeCreateSchema.extend({
  memberType: z.string(),
  sendInviteEmail: z.boolean(),
});
type StepperValues = z.infer<typeof stepperSchema>;
import { EMPLOYMENT_TYPE_LABELS } from '../constants';
import { useDepartments, findDepartmentPath, type Department } from '@/modules/departments';
import type {
  DocumentType,
  EmployeeCreateInput,
  EmploymentType,
  Gender,
} from '../types/employee.types';
import { useCreateEmployee } from '../hooks/useEmployeeMutations';
import { useNextEmployeeCode } from '../hooks/useNextEmployeeCode';
import { documentsApi } from '../services/documents.api';

/* ── constants ────────────────────────────────────────────────────────────── */

const STEP_LABELS = ['Personal', 'Job', 'Documents', 'Access'] as const;
const TOTAL_STEPS = 4;

// Required fields that must pass validation before advancing each step
const STEP_REQUIRED_FIELDS: Record<number, (keyof StepperValues)[]> = {
  1: ['firstName', 'lastName', 'workEmail'],
  2: ['employeeCode', 'designation', 'departmentId', 'employmentType', 'joinedOn'],
  3: [],
  4: [],
};

// Which step owns each field (for jumping on server-side errors)
const FIELD_STEP: Partial<Record<keyof StepperValues, number>> = {
  firstName: 1,
  lastName: 1,
  workEmail: 1,
  phone: 1,
  personalEmail: 1,
  dateOfBirth: 1,
  gender: 1,
  address: 1,
  employeeCode: 2,
  designation: 2,
  departmentId: 2,
  managerId: 2,
  employmentType: 2,
  joinedOn: 2,
  location: 2,
};

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  ID_PROOF: 'ID Proof',
  OFFER_LETTER: 'Offer Letter',
  CONTRACT: 'Contract',
  AADHAAR: 'Aadhaar',
  PAN: 'PAN Card',
  BANK: 'Bank Statement',
  OTHER: 'Other',
};

const ACCEPTED_MIME = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
const MAX_SIZE_MB = 10;

const MEMBER_TYPE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'MANAGER', label: 'Manager' },
  { value: 'HR_ADMIN', label: 'HR Admin' },
];

function draftKey(userId: string) {
  return `ems:emp-create-draft:${userId}`;
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

function buildPayload(values: StepperValues): EmployeeCreateInput {
  return {
    firstName: values.firstName,
    lastName: values.lastName,
    workEmail: values.workEmail,
    employeeCode: values.employeeCode,
    employmentType: values.employmentType as EmploymentType,
    joinedOn: values.joinedOn,
    designation: values.designation,
    departmentId: values.departmentId,
    managerId: values.managerId || undefined,
    phone: values.phone || undefined,
    location: values.location || undefined,
    address: values.address || undefined,
    gender: (values.gender as Gender) || undefined,
    dateOfBirth: toDateInput(values.dateOfBirth) || undefined,
    personalEmail: values.personalEmail || undefined,
  };
}

/* ── queued document type ─────────────────────────────────────────────────── */

interface QueuedDoc {
  localId: string;
  file: File;
  type: DocumentType;
}

/* ── step indicator ───────────────────────────────────────────────────────── */

function StepIndicator({ current, labels }: { current: number; labels: readonly string[] }) {
  return (
    <div className="flex items-center border-b border-subtle px-6 py-4">
      {labels.map((label, i) => {
        const num = i + 1;
        const isActive = num === current;
        const isDone = num < current;
        return (
          <div key={label} className="flex flex-1 items-center">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  isDone && 'bg-brand text-white',
                  isActive && 'border border-brand bg-brand/10 text-brand',
                  !isDone && !isActive && 'border border-subtle bg-surface-2 text-fg-muted',
                )}
              >
                {isDone ? <CheckIcon className="size-3" /> : num}
              </div>
              <span
                className={cn(
                  'text-sm',
                  isActive && 'font-medium text-fg',
                  isDone && 'text-fg-muted',
                  !isDone && !isActive && 'text-fg-muted',
                )}
              >
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={cn('mx-3 h-px flex-1', isDone ? 'bg-brand/40' : 'bg-subtle')} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── step 1: personal ─────────────────────────────────────────────────────── */

function Step1Personal({ form }: { form: UseFormReturn<StepperValues> }) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">Identity</h3>
        <Separator />
      </div>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <FormFieldWrapper
          id="df-firstName"
          label="First name"
          required
          error={(form.formState.errors.firstName as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-firstName"
            placeholder="Priya"
            aria-invalid={!!form.formState.errors.firstName}
            {...form.register('firstName')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-lastName"
          label="Last name"
          required
          error={(form.formState.errors.lastName as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-lastName"
            placeholder="Sharma"
            aria-invalid={!!form.formState.errors.lastName}
            {...form.register('lastName')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-workEmail"
          label="Work email"
          required
          error={(form.formState.errors.workEmail as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-workEmail"
            type="email"
            placeholder="priya@acme.com"
            aria-invalid={!!form.formState.errors.workEmail}
            {...form.register('workEmail')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-phone"
          label="Phone"
          error={(form.formState.errors.phone as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-phone"
            type="tel"
            placeholder="+91 98765 43210"
            {...form.register('phone')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-personalEmail"
          label="Personal email"
          error={(form.formState.errors.personalEmail as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-personalEmail"
            type="email"
            placeholder="priya.s@gmail.com"
            aria-invalid={!!form.formState.errors.personalEmail}
            {...form.register('personalEmail')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-dateOfBirth"
          label="Date of birth"
          error={(form.formState.errors.dateOfBirth as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-dateOfBirth"
            type="date"
            aria-invalid={!!form.formState.errors.dateOfBirth}
            {...form.register('dateOfBirth')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-gender"
          label="Gender"
          error={(form.formState.errors.gender as { message?: string } | undefined)?.message}
        >
          <Controller
            control={form.control}
            name="gender"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger id="df-gender" className="w-full">
                  <SelectValue placeholder="Not specified" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Not specified</SelectItem>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-address"
          label="Address"
          error={(form.formState.errors.address as { message?: string } | undefined)?.message}
          colSpan={2}
        >
          <textarea
            id="df-address"
            rows={3}
            placeholder="Street, city, state"
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...form.register('address')}
          />
        </FormFieldWrapper>
      </div>
    </div>
  );
}

/* ── department → sub-department cascade ──────────────────────────────────── */

/**
 * Turn the selected department id into a chain of select levels: roots first, then
 * the children of each selected node. The deepest selected node IS `departmentId`;
 * drilling into a sub-department is optional (a parent is a valid choice).
 */
function buildDepartmentLevels(
  tree: Department[],
  selectedId: string,
): { options: Department[]; value: string }[] {
  const path = findDepartmentPath(tree, selectedId);
  const levels: { options: Department[]; value: string }[] = [];
  let options = tree;
  for (let i = 0; ; i++) {
    const node = path[i];
    levels.push({ options, value: node?.id ?? '' });
    if (!node || node.children.length === 0) break;
    options = node.children;
  }
  return levels;
}

/**
 * Renders the Department select, plus a Sub-department select for each level that has
 * children. Selecting any level sets `departmentId` to that node (the most specific
 * pick wins); deeper levels reset automatically because the chain is derived from the
 * value. Optional: the user may stop at any level.
 */
function DepartmentCascade({
  tree,
  value,
  onChange,
  invalid,
}: {
  tree: Department[];
  value: string;
  onChange: (id: string) => void;
  invalid: boolean;
}) {
  const levels = buildDepartmentLevels(tree, value);
  return (
    <div className="space-y-2">
      {levels.map((level, i) => {
        const placeholder = i === 0 ? 'Select department' : 'Select sub-department';
        return (
          <Select key={i} value={level.value} onValueChange={(v) => onChange(v ?? '')}>
            <SelectTrigger
              id={i === 0 ? 'df-departmentId' : undefined}
              className="w-full"
              aria-invalid={i === 0 ? invalid : undefined}
            >
              <SelectValue placeholder={placeholder}>
                {(v) => level.options.find((d) => d.id === v)?.name ?? placeholder}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {level.options.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      })}
    </div>
  );
}

/* ── step 2: job ──────────────────────────────────────────────────────────── */

function Step2Job({
  form,
  departments,
  isGeneratingCode,
  onGenerateCode,
}: {
  form: UseFormReturn<StepperValues>;
  departments: Department[];
  isGeneratingCode: boolean;
  onGenerateCode: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">Job</h3>
        <Separator />
      </div>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <FormFieldWrapper
          id="df-employeeCode"
          label="Employee code"
          required
          error={(form.formState.errors.employeeCode as { message?: string } | undefined)?.message}
        >
          <div className="flex gap-2">
            <Controller
              control={form.control}
              name="employeeCode"
              render={({ field }) => (
                <Input
                  {...field}
                  id="df-employeeCode"
                  placeholder="Auto / E20XX"
                  aria-invalid={!!form.formState.errors.employeeCode}
                  className="flex-1"
                />
              )}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isGeneratingCode}
              onClick={onGenerateCode}
              className="shrink-0"
            >
              <Wand2Icon className="mr-1.5 h-3.5 w-3.5" />
              {isGeneratingCode ? 'Generating…' : 'Generate'}
            </Button>
          </div>
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-designation"
          label="Designation"
          required
          error={(form.formState.errors.designation as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-designation"
            placeholder="Senior Engineer"
            aria-invalid={!!form.formState.errors.designation}
            {...form.register('designation')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-departmentId"
          label="Department"
          required
          error={(form.formState.errors.departmentId as { message?: string } | undefined)?.message}
        >
          <Controller
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <DepartmentCascade
                tree={departments}
                value={field.value}
                onChange={field.onChange}
                invalid={!!form.formState.errors.departmentId}
              />
            )}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-managerId"
          label="Reports to"
          error={(form.formState.errors.managerId as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-managerId"
            placeholder="Employee ID of their manager"
            {...form.register('managerId')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-employmentType"
          label="Employment type"
          required
          error={
            (form.formState.errors.employmentType as { message?: string } | undefined)?.message
          }
        >
          <Controller
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="df-employmentType"
                  className="w-full"
                  aria-invalid={!!form.formState.errors.employmentType}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(EMPLOYMENT_TYPE_LABELS) as [EmploymentType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            )}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-joinedOn"
          label="Joined on"
          required
          error={(form.formState.errors.joinedOn as { message?: string } | undefined)?.message}
        >
          <Input
            id="df-joinedOn"
            type="date"
            aria-invalid={!!form.formState.errors.joinedOn}
            {...form.register('joinedOn')}
          />
        </FormFieldWrapper>
        <FormFieldWrapper
          id="df-location"
          label="Location"
          error={(form.formState.errors.location as { message?: string } | undefined)?.message}
        >
          <Input id="df-location" placeholder="Mumbai" {...form.register('location')} />
        </FormFieldWrapper>
      </div>
    </div>
  );
}

/* ── step 3: documents ────────────────────────────────────────────────────── */

function Step3Documents({
  docs,
  onAdd,
  onTypeChange,
  onRemove,
}: {
  docs: QueuedDoc[];
  onAdd: (file: File) => void;
  onTypeChange: (localId: string, type: DocumentType) => void;
  onRemove: (localId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File exceeds ${MAX_SIZE_MB} MB limit.`);
      e.target.value = '';
      return;
    }
    onAdd(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">Documents</h3>
        <Separator />
      </div>
      <p className="text-sm text-fg-muted">
        Upload onboarding documents now. Files are saved after the employee profile is created. You
        can also add documents later from the employee profile.
      </p>

      {docs.length > 0 && (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.localId}
              className="flex items-center gap-3 rounded-lg border border-subtle bg-surface p-3"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-2">
                <FileTextIcon className="size-4 text-fg-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{doc.file.name}</p>
                <p className="text-xs text-fg-muted">{(doc.file.size / 1024).toFixed(0)} KB</p>
              </div>
              <Select
                value={doc.type}
                onValueChange={(v) => onTypeChange(doc.localId, v as DocumentType)}
              >
                <SelectTrigger className="w-36 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(DOCUMENT_TYPE_LABELS) as [DocumentType, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value} className="text-xs">
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-fg-muted hover:text-danger"
                onClick={() => onRemove(doc.localId)}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_MIME}
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <PlusIcon className="mr-1.5 size-3.5" />
        Add document
      </Button>
      <p className="text-xs text-fg-muted">
        Accepted: PDF, JPG, PNG, DOC, DOCX · Max {MAX_SIZE_MB} MB per file
      </p>
    </div>
  );
}

/* ── step 4: access ───────────────────────────────────────────────────────── */

function Step4Access({
  memberType,
  onMemberTypeChange,
  sendInviteEmail,
  onSendInviteEmailChange,
}: {
  memberType: string;
  onMemberTypeChange: (v: string) => void;
  sendInviteEmail: boolean;
  onSendInviteEmailChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-fg">Access</h3>
        <Separator />
      </div>
      <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="access-memberType">
            Role
            <span className="text-destructive" aria-hidden>
              {' '}
              *
            </span>
          </Label>
          <Select value={memberType} onValueChange={(v) => onMemberTypeChange(v ?? 'EMPLOYEE')}>
            <SelectTrigger id="access-memberType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMBER_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-fg-muted">
            Determines what the employee can see and do in EMS.
          </p>
        </div>
        <div className="flex flex-col justify-end space-y-1.5 pb-0.5">
          <div className="flex items-center justify-between rounded-lg border border-subtle bg-surface p-3">
            <div>
              <p className="text-sm font-medium text-fg">Send invite email</p>
              <p className="text-xs text-fg-muted">
                Email the employee their login link on creation.
              </p>
            </div>
            <Switch
              id="access-invite"
              checked={sendInviteEmail}
              onCheckedChange={onSendInviteEmailChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── main stepper ─────────────────────────────────────────────────────────── */

export function EmployeeFormStepper() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [queuedDocs, setQueuedDocs] = useState<QueuedDoc[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const draftLoadedRef = useRef(false);

  const { data: deptList } = useDepartments();
  const { refetch: fetchNextCode, isFetching: isGeneratingCode } = useNextEmployeeCode();
  const createMutation = useCreateEmployee();

  const form = useForm<StepperValues>({
    resolver: zodResolver(stepperSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      workEmail: '',
      employeeCode: '',
      employmentType: 'FULL_TIME',
      joinedOn: '',
      designation: '',
      departmentId: '',
      managerId: '',
      phone: '',
      location: '',
      address: '',
      gender: '',
      dateOfBirth: '',
      personalEmail: '',
      memberType: 'EMPLOYEE',
      sendInviteEmail: true,
    },
  });

  const userId = user?.id;
  const watchedMemberType = useWatch({
    control: form.control,
    name: 'memberType',
    defaultValue: 'EMPLOYEE',
  });
  const watchedSendInviteEmail = useWatch({
    control: form.control,
    name: 'sendInviteEmail',
    defaultValue: true,
  });

  // Load draft once user ID is available — only calls form.reset(), no setState
  useEffect(() => {
    if (!userId || draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<StepperValues>;
      form.reset({ ...form.getValues(), ...saved });
    } catch {
      // corrupted draft — ignore
    }
  }, [userId, form]);

  const saveDraft = useCallback(() => {
    if (!userId) return;
    localStorage.setItem(draftKey(userId), JSON.stringify(form.getValues()));
  }, [form, userId]);

  // Auto-save every 30 s
  useEffect(() => {
    const id = setInterval(saveDraft, 30_000);
    return () => clearInterval(id);
  }, [saveDraft]);

  async function handleNext() {
    const fields = STEP_REQUIRED_FIELDS[step];
    const ok = fields.length === 0 || (await form.trigger(fields));
    if (ok) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleGenerateCode() {
    const result = await fetchNextCode();
    if (result.data) {
      form.setValue('employeeCode', result.data, { shouldValidate: true });
    } else {
      toast.error('Failed to generate employee code.');
    }
  }

  async function handleSubmit() {
    const valid = await form.trigger();
    if (!valid) {
      // Jump to the first step that has an error
      const errFields = Object.keys(form.formState.errors) as (keyof StepperValues)[];
      const errStep = errFields.map((f) => FIELD_STEP[f] ?? 1).sort()[0];
      setStep(errStep);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const employee = await createMutation.mutateAsync(buildPayload(form.getValues()));

      // Upload queued documents after employee is created
      const failedUploads: string[] = [];
      for (const doc of queuedDocs) {
        try {
          await documentsApi.upload(employee.id, doc.file, doc.type);
        } catch {
          failedUploads.push(doc.file.name);
        }
      }

      if (userId) localStorage.removeItem(draftKey(userId));

      if (failedUploads.length > 0) {
        toast.warning(
          `Employee created. ${failedUploads.length} document(s) failed to upload — retry from the profile.`,
        );
      } else {
        toast.success('Employee created successfully.');
      }

      router.push(`/employees/${employee.id}`);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const status = axiosErr.response?.status;
      const apiError = axiosErr.response?.data?.error;

      if (status === 422 && Array.isArray(apiError?.details)) {
        apiError.details.forEach(({ field, message }: { field: string; message: string }) => {
          form.setError(field as keyof StepperValues, { message });
        });
        const errFields = Object.keys(form.formState.errors) as (keyof StepperValues)[];
        const errStep = errFields.map((f) => FIELD_STEP[f] ?? 1).sort()[0];
        setStep(errStep);
        toast.error('Please fix the highlighted fields.');
        return;
      }

      if (status === 409) {
        if (apiError?.code === 'DUPLICATE_EMPLOYEE_CODE') {
          form.setError('employeeCode', { message: 'This employee code is already taken.' });
          setStep(2);
          return;
        }
        if (apiError?.code === 'DUPLICATE_WORK_EMAIL') {
          form.setError('workEmail', { message: 'This email is already in use.' });
          setStep(1);
          return;
        }
      }

      toast.error(apiError?.message ?? 'Failed to create employee. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAddDoc(file: File) {
    setQueuedDocs((prev) => [...prev, { localId: crypto.randomUUID(), file, type: 'OTHER' }]);
  }

  function handleDocTypeChange(localId: string, type: DocumentType) {
    setQueuedDocs((prev) => prev.map((d) => (d.localId === localId ? { ...d, type } : d)));
  }

  function handleDocRemove(localId: string) {
    setQueuedDocs((prev) => prev.filter((d) => d.localId !== localId));
  }

  const isLastStep = step === TOTAL_STEPS;

  return (
    <>
      <PageHeader
        title="New Employee"
        breadcrumbs={[{ label: 'Employees', href: '/employees' }, { label: 'New employee' }]}
      />

      <div className="rounded-none border-b border-subtle bg-surface">
        <StepIndicator current={step} labels={STEP_LABELS} />
      </div>

      <div className="px-6 py-6">
        {step === 1 && <Step1Personal form={form} />}
        {step === 2 && (
          <Step2Job
            form={form}
            departments={deptList ?? []}
            isGeneratingCode={isGeneratingCode}
            onGenerateCode={handleGenerateCode}
          />
        )}
        {step === 3 && (
          <Step3Documents
            docs={queuedDocs}
            onAdd={handleAddDoc}
            onTypeChange={handleDocTypeChange}
            onRemove={handleDocRemove}
          />
        )}
        {step === 4 && (
          <Step4Access
            memberType={watchedMemberType}
            onMemberTypeChange={(v) => form.setValue('memberType', v)}
            sendInviteEmail={watchedSendInviteEmail}
            onSendInviteEmailChange={(v) => form.setValue('sendInviteEmail', v)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 flex items-center justify-between border-t border-subtle bg-surface px-6 py-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            saveDraft();
            toast.success('Draft saved.');
          }}
        >
          Save draft
        </Button>

        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
              ← Back
            </Button>
          )}
          {step === 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Discard the work: clear the persisted draft (otherwise it gets
                // restored on the next visit), reset the fields, and drop queued docs.
                if (userId) localStorage.removeItem(draftKey(userId));
                form.reset();
                setQueuedDocs([]);
                router.push('/employees');
              }}
            >
              Cancel
            </Button>
          )}

          {!isLastStep ? (
            <Button type="button" onClick={handleNext}>
              Next →
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              {isSubmitting ? 'Creating…' : 'Create employee'}
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
