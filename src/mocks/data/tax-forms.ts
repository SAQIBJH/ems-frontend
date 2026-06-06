/**
 * Template-driven tax-form engine (§10).
 *
 * Annual statutory forms (Form 16, W-2, P60, …) are **data**: each is a template of
 * sections + fields, every field pointing at a key in a generic data context built from
 * the employee's YTD ledger + statutory pack. `resolveTaxForm` is country-agnostic — it
 * fills any registered template from that context with no `if (type === …)` branch. A new
 * form type is added by registering a template, never by writing a component.
 */
import type {
  PayslipYtd,
  TaxFormType,
  TaxFormDocument,
  TaxFormSection,
} from '@/modules/payroll/types/payroll.types';
import { formatMajor } from '@/modules/payroll/utils/money.utils';

interface TaxFormFieldDef {
  label: string;
  /** Context key: a YTD field, or `contribution.<CODE>`. */
  key: string;
}

interface TaxFormSectionDef {
  title: string;
  fields: TaxFormFieldDef[];
}

interface TaxFormTemplate {
  type: TaxFormType;
  title: string;
  jurisdiction: string;
  authority: string;
  employerIdLabel: string;
  employeeIdLabel: string;
  sections: TaxFormSectionDef[];
}

/** The demo tenant employer — tenant-level config, surfaced on every form. */
const EMPLOYER = {
  name: 'Acme Corp',
  address: '123 Tech Park, Pune 411001',
};

/** Form template registry — the single source of truth for every supported form. */
const TAX_FORM_TEMPLATES: Record<TaxFormType, TaxFormTemplate> = {
  FORM16: {
    type: 'FORM16',
    title: 'Form 16 — Certificate of Tax Deducted at Source',
    jurisdiction: 'IN',
    authority: 'Income Tax Department of India',
    employerIdLabel: 'TAN',
    employeeIdLabel: 'PAN',
    sections: [
      {
        title: 'Part B — Salary & allowances',
        fields: [
          { label: 'Gross salary', key: 'grossEarnings' },
          { label: 'Taxable income', key: 'taxableIncome' },
        ],
      },
      {
        title: 'Deductions under Chapter VI-A',
        fields: [
          { label: 'Provident fund', key: 'contribution.PF' },
          { label: 'Professional tax', key: 'contribution.PROF_TAX' },
          { label: 'Total deductions', key: 'totalDeductions' },
        ],
      },
      {
        title: 'Tax deducted at source',
        fields: [{ label: 'Total TDS deposited', key: 'taxDeducted' }],
      },
    ],
  },
  W2: {
    type: 'W2',
    title: 'Form W-2 — Wage and Tax Statement',
    jurisdiction: 'US',
    authority: 'Internal Revenue Service',
    employerIdLabel: 'EIN',
    employeeIdLabel: 'SSN',
    sections: [
      {
        title: 'Wages & withholding',
        fields: [
          { label: 'Box 1 — Wages, tips, other compensation', key: 'grossEarnings' },
          { label: 'Box 2 — Federal income tax withheld', key: 'taxDeducted' },
          { label: 'Box 3 — Social security wages', key: 'taxableIncome' },
        ],
      },
      {
        title: 'Social security & medicare',
        fields: [
          { label: 'Box 4 — Social security tax withheld', key: 'contribution.SS_EE' },
          { label: 'Box 6 — Medicare tax withheld', key: 'contribution.MED_EE' },
        ],
      },
    ],
  },
  P60: {
    type: 'P60',
    title: 'P60 — End of Year Certificate',
    jurisdiction: 'GB',
    authority: 'HM Revenue & Customs',
    employerIdLabel: 'PAYE Reference',
    employeeIdLabel: 'National Insurance No.',
    sections: [
      {
        title: 'Pay & income tax',
        fields: [
          { label: 'Total pay for year', key: 'grossEarnings' },
          { label: 'Total tax deducted', key: 'taxDeducted' },
          { label: 'Pay after deductions', key: 'netPay' },
        ],
      },
      {
        title: 'National Insurance contributions',
        fields: [{ label: 'Employee NIC', key: 'contribution.NI' }],
      },
    ],
  },
};

export function isTaxFormType(value: string): value is TaxFormType {
  return value in TAX_FORM_TEMPLATES;
}

/** Deterministic mock statutory identifier — real values come from the employee record. */
function syntheticId(employeeCode: string, type: TaxFormType): string {
  const digits = employeeCode.replace(/\D/g, '').padStart(4, '0').slice(-4);
  switch (type) {
    case 'FORM16':
      return `ABCDE${digits}F`;
    case 'W2':
      return `XXX-XX-${digits}`;
    case 'P60':
      return `AB${digits}23C`;
  }
}

function employerId(type: TaxFormType): string {
  switch (type) {
    case 'FORM16':
      return 'PNEA12345B';
    case 'W2':
      return '12-3456789';
    case 'P60':
      return '120/AB456';
  }
}

interface ResolveArgs {
  type: TaxFormType;
  employeeName: string;
  employeeCode: string;
  ytd: PayslipYtd;
  currency: string;
}

/** Build the generic data context a template's field keys resolve against. */
function buildContext(ytd: PayslipYtd): Record<string, number> {
  const ctx: Record<string, number> = {
    grossEarnings: ytd.grossEarnings,
    taxableIncome: ytd.taxableIncome,
    taxDeducted: ytd.taxDeducted,
    totalDeductions: ytd.totalDeductions,
    netPay: ytd.netPay,
  };
  for (const [code, amount] of Object.entries(ytd.contributions)) {
    ctx[`contribution.${code}`] = amount;
  }
  return ctx;
}

/** Resolve a template into a fully-formatted document — generic over the form type. */
export function resolveTaxForm({
  type,
  employeeName,
  employeeCode,
  ytd,
  currency,
}: ResolveArgs): TaxFormDocument {
  const template = TAX_FORM_TEMPLATES[type];
  const ctx = buildContext(ytd);
  const money = (n: number) => formatMajor(n, currency);

  const sections: TaxFormSection[] = template.sections.map((section) => ({
    title: section.title,
    rows: section.fields.map((field) => ({
      label: field.label,
      value: money(ctx[field.key] ?? 0),
    })),
  }));

  return {
    type,
    title: template.title,
    fiscalYear: ytd.fiscalYear,
    jurisdiction: template.jurisdiction,
    authority: template.authority,
    currency,
    employer: {
      name: EMPLOYER.name,
      subtitle: EMPLOYER.address,
      identifiers: [{ label: template.employerIdLabel, value: employerId(type) }],
    },
    employee: {
      name: employeeName,
      subtitle: employeeCode,
      identifiers: [{ label: template.employeeIdLabel, value: syntheticId(employeeCode, type) }],
    },
    sections,
    generatedAt: new Date().toISOString(),
  };
}
