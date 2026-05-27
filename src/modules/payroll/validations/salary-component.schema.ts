import { z } from 'zod';

export const salaryComponentSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    code: z
      .string()
      .min(1, 'Code is required')
      .max(30)
      .regex(/^[A-Z][A-Z0-9_]*$/, 'Code must be UPPER_SNAKE_CASE'),
    type: z.enum(['EARNING', 'DEDUCTION', 'BENEFIT', 'REIMBURSEMENT']),
    calculationType: z.enum(['FLAT', 'PERCENTAGE', 'FORMULA']),
    value: z.number().nullable(),
    basisCode: z.string().nullable(),
    formula: z.string().nullable(),
    taxable: z.boolean(),
    active: z.boolean(),
    displayOrder: z.number().int().min(1),
    description: z.string().max(500).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.calculationType === 'FLAT' && (data.value === null || data.value === undefined)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is required', path: ['value'] });
    }
    if (data.calculationType === 'PERCENTAGE') {
      if (data.value === null || data.value === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Percentage is required',
          path: ['value'],
        });
      }
      if (!data.basisCode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Basis component is required',
          path: ['basisCode'],
        });
      }
    }
    if (data.calculationType === 'FORMULA' && !data.formula) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formula is required',
        path: ['formula'],
      });
    }
  });

export type SalaryComponentFormValues = z.infer<typeof salaryComponentSchema>;
