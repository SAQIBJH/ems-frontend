import { z } from 'zod';

/**
 * Full statutory-pack editor schema. Unlike the wire shape (`StatutoryPackInput`,
 * which stores money in integer MINOR units), this form captures money in MAJOR
 * units — what a human actually types (e.g. 75000, not 7500000). The editor
 * converts major↔minor at the boundary (`toMinor`/`fromMinor`) so HR never deals
 * with paise/cents. Every nested rule array a country needs is editable here.
 */

const moneyMajor = z.number({ error: 'Required' }).min(0, 'Must be ≥ 0');

const nullableMoneyMajor = moneyMajor.nullable();

const percent = z.number({ error: 'Required' }).min(0, '≥ 0').max(100, '≤ 100');

const upperCode = (max = 40) =>
  z
    .string()
    .min(1, 'Required')
    .max(max)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'UPPER_SNAKE_CASE');

const taxSlab = z
  .object({
    from: moneyMajor,
    to: nullableMoneyMajor,
    rate: percent,
  })
  .superRefine((s, ctx) => {
    if (s.to !== null && s.to < s.from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'To must be ≥ From', path: ['to'] });
    }
  });

const surcharge = z.object({
  thresholdAnnual: moneyMajor,
  rate: percent,
});

const taxRegime = z.object({
  code: upperCode(40),
  fiscalYear: z.string().min(1, 'Required').max(20),
  currency: z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 (e.g. INR)'),
  standardDeduction: moneyMajor,
  cessRate: percent.nullable(),
  slabs: z.array(taxSlab).min(1, 'Add at least one slab'),
  surcharges: z.array(surcharge),
  allowedExemptions: z.array(z.string()),
});

const contributionScheme = z.object({
  code: upperCode(40),
  name: z.string().min(1, 'Required').max(80),
  wageBaseTag: upperCode(40),
  wageCeiling: nullableMoneyMajor,
  // Optional — live backend may omit it (verified 2026-06-09). Empty is allowed.
  applicability: z.string().max(60),
  employeeRate: percent,
  employeeComponent: upperCode(40),
  employerRate: percent,
  employerComponent: upperCode(40),
  employerSplit: z.record(z.string(), z.number()),
});

const localTaxSlab = z
  .object({
    from: moneyMajor,
    to: nullableMoneyMajor,
    amount: moneyMajor,
  })
  .superRefine((s, ctx) => {
    if (s.to !== null && s.to < s.from) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'To must be ≥ From', path: ['to'] });
    }
  });

const localTax = z.object({
  code: z.string().min(1, 'Required').max(40),
  name: z.string().min(1, 'Required').max(80),
  // Optional — live backend may omit it (verified 2026-06-09). Empty is allowed.
  jurisdiction: z.string().max(20),
  component: upperCode(40),
  slabs: z.array(localTaxSlab).min(1, 'Add at least one band'),
});

const minimumWage = z.object({
  jurisdiction: z.string().min(1, 'Required').max(20),
  monthlyFloor: moneyMajor,
});

export const statutoryPackEditorSchema = z
  .object({
    country: z.string().regex(/^[A-Za-z]{2}$/, 'ISO 3166-1 alpha-2 (e.g. IN)'),
    version: z
      .string()
      .min(1, 'Required')
      .max(20)
      .regex(/^[A-Za-z0-9.\-_]+$/, 'Letters, digits, dot, dash, underscore'),
    effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
    effectiveTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD')
      .nullable(),
    /** Pack-level currency used for schemes, local taxes & minimum wages. */
    currency: z.string().regex(/^[A-Z]{3}$/, 'ISO 4217 (e.g. INR)'),
    roundingMode: z.enum(['NEAREST', 'UP', 'DOWN']),
    roundingPrecision: z.number().int().min(0).max(4),
    prorationBasis: z.enum(['CALENDAR_DAYS', 'WORKING_DAYS', 'FIXED_30']),
    taxRegimes: z.array(taxRegime).min(1, 'A pack needs at least one tax regime'),
    contributionSchemes: z.array(contributionScheme),
    localTaxes: z.array(localTax),
    minimumWages: z.array(minimumWage),
    statutoryComponents: z.array(z.string()),
  })
  .superRefine((data, ctx) => {
    if (data.effectiveTo && data.effectiveTo < data.effectiveFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'End date must be on or after the start date',
        path: ['effectiveTo'],
      });
    }
  });

export type StatutoryPackEditorValues = z.infer<typeof statutoryPackEditorSchema>;

/** Which top-level field belongs to which editor tab — used to jump to the first tab with errors. */
export const EDITOR_TAB_FIELDS = {
  general: [
    'country',
    'version',
    'effectiveFrom',
    'effectiveTo',
    'currency',
    'roundingMode',
    'roundingPrecision',
    'prorationBasis',
  ],
  regimes: ['taxRegimes'],
  contributions: ['contributionSchemes'],
  local: ['localTaxes'],
  minwage: ['minimumWages'],
  components: ['statutoryComponents'],
} as const;

export type EditorTab = keyof typeof EDITOR_TAB_FIELDS;
