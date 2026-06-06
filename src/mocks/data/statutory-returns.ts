/**
 * Template-driven statutory-return exporter (§12).
 *
 * Statutory filing returns (India PF ECR, India TDS 24Q, UK RTI FPS, …) are **data**:
 * each is a template of delimited columns, every column pointing at a key in a generic
 * per-employee context (identifier + gross/taxable/tax/net + `contribution.<CODE>`).
 * `resolveStatutoryReturn` is country-agnostic — it fills any registered template from
 * that context with no `if (type === …)` branch in the build. A new country's return is
 * added by registering a template, never by writing bespoke code. Component codes are
 * read from the run's payslips (which come from the pinned pack), never hardcoded here.
 */
import type { StatutoryReturnType } from '@/modules/payroll/types/payroll.types';

/** Identifier scheme for a return — the synthetic id stands in for a real employee field. */
type IdentifierKind = 'UAN' | 'PAN' | 'NINO';

interface ReturnColumnDef {
  label: string;
  /** Context key: `identifier`, a base field, or `contribution.<CODE>`. */
  key: string;
}

interface ReturnTemplate {
  type: StatutoryReturnType;
  title: string;
  jurisdiction: string;
  authority: string;
  identifier: IdentifierKind;
  /** File delimiter — ECR uses `#~#` per EPFO spec; others are comma-delimited. */
  delimiter: string;
  fileExtension: string;
  columns: ReturnColumnDef[];
}

/**
 * Return template registry — the single source of truth for every supported return.
 * Column `key`s resolve against the generic context built per employee; missing keys
 * (e.g. UK NIC on an India roster) format as `0` rather than branching the builder.
 */
const RETURN_TEMPLATES: Record<StatutoryReturnType, ReturnTemplate> = {
  ECR: {
    type: 'ECR',
    title: 'EPFO Electronic Challan-cum-Return',
    jurisdiction: 'IN',
    authority: "Employees' Provident Fund Organisation",
    identifier: 'UAN',
    delimiter: '#~#',
    fileExtension: 'txt',
    columns: [
      { label: 'UAN', key: 'identifier' },
      { label: 'Member Name', key: 'employeeName' },
      { label: 'Gross Wages', key: 'gross' },
      { label: 'EPF Wages', key: 'gross' },
      { label: 'EPS Wages', key: 'gross' },
      { label: 'EPF Contribution (EE)', key: 'contribution.PF' },
      { label: 'EPF + EPS Contribution (ER)', key: 'contribution.PF_ER' },
      { label: 'NCP Days', key: 'lopDays' },
    ],
  },
  '24Q': {
    type: '24Q',
    title: 'Quarterly TDS Return on Salary (Form 24Q)',
    jurisdiction: 'IN',
    authority: 'Income Tax Department of India',
    identifier: 'PAN',
    delimiter: ',',
    fileExtension: 'txt',
    columns: [
      { label: 'PAN', key: 'identifier' },
      { label: 'Deductee Name', key: 'employeeName' },
      { label: 'Amount Paid/Credited', key: 'gross' },
      { label: 'Taxable Income', key: 'taxable' },
      { label: 'TDS Deducted', key: 'taxDeducted' },
    ],
  },
  RTI: {
    type: 'RTI',
    title: 'RTI Full Payment Submission (FPS)',
    jurisdiction: 'GB',
    authority: 'HM Revenue & Customs',
    identifier: 'NINO',
    delimiter: ',',
    fileExtension: 'txt',
    columns: [
      { label: 'National Insurance No.', key: 'identifier' },
      { label: 'Employee Name', key: 'employeeName' },
      { label: 'Taxable Pay', key: 'taxable' },
      { label: 'Tax Deducted', key: 'taxDeducted' },
      { label: 'Employee NIC', key: 'contribution.NI' },
    ],
  },
};

export function isStatutoryReturnType(value: string): value is StatutoryReturnType {
  return value in RETURN_TEMPLATES;
}

/** A deterministic synthetic statutory id — real values live on the employee record. */
function syntheticId(employeeCode: string, kind: IdentifierKind): string {
  const digits = employeeCode.replace(/\D/g, '').padStart(8, '0');
  switch (kind) {
    case 'UAN':
      return `1000${digits.slice(-8)}`; // 12-digit Universal Account Number
    case 'PAN':
      return `ABCDE${digits.slice(-4)}F`;
    case 'NINO':
      return `AB${digits.slice(-6)}C`;
  }
}

/** The generic per-employee context a return template's column keys resolve against. */
export interface ReturnEmployeeContext {
  employeeCode: string;
  employeeName: string;
  gross: number;
  taxable: number;
  taxDeducted: number;
  net: number;
  lopDays: number;
  /** Statutory contribution amounts by component code (employee + employer). */
  contributions: Record<string, number>;
}

export interface StatutoryReturnFile {
  type: StatutoryReturnType;
  title: string;
  jurisdiction: string;
  authority: string;
  filename: string;
  content: string;
}

/** Resolve a single column's raw value from the context (number keys formatted to 2dp). */
function resolveCell(col: ReturnColumnDef, ctx: ReturnEmployeeContext, identifier: string): string {
  if (col.key === 'identifier') return identifier;
  if (col.key === 'employeeName') return ctx.employeeName;
  let value: number;
  if (col.key.startsWith('contribution.')) {
    value = ctx.contributions[col.key.slice('contribution.'.length)] ?? 0;
  } else {
    value = (ctx as unknown as Record<string, number>)[col.key] ?? 0;
  }
  return col.key === 'lopDays' ? String(value) : value.toFixed(2);
}

/**
 * Build the delimited return file for a run — generic over the return type. The
 * employee identifier is injected per-row (synthetic for the demo); every other column
 * is resolved from the context against the registered template.
 */
export function resolveStatutoryReturn(args: {
  type: StatutoryReturnType;
  period: string;
  employees: ReturnEmployeeContext[];
}): StatutoryReturnFile {
  const template = RETURN_TEMPLATES[args.type];
  const header = template.columns.map((c) => c.label).join(template.delimiter);
  const rows = args.employees.map((ctx) => {
    const identifier = syntheticId(ctx.employeeCode, template.identifier);
    return template.columns
      .map((col) => resolveCell(col, ctx, identifier))
      .join(template.delimiter);
  });
  return {
    type: template.type,
    title: template.title,
    jurisdiction: template.jurisdiction,
    authority: template.authority,
    filename: `statutory-return-${args.period}-${template.type}.${template.fileExtension}`,
    content: [header, ...rows].join('\n'),
  };
}
