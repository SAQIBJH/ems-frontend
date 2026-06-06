/**
 * Config-driven bank-file format registry (§9).
 *
 * Each payout file format is **data**: an ordered list of columns, every column
 * mapping a header to a resolvable field key. A new country/scheme is supported by
 * adding a spec here — never by branching on country in the serializer. The builder
 * below is fully generic: it iterates the spec's columns and renders rows, with no
 * `if (format === …)` / `if (country === …)` logic anywhere.
 */
import type { BankFileFormat } from '@/modules/payroll/types/payroll.types';
import { currencyDecimals } from '@/modules/payroll/utils/money.utils';

/** Fields a format column may reference. Resolved per payout line at render time. */
export type BankFileFieldKey =
  | 'employeeCode'
  | 'employeeName'
  | 'amount'
  | 'currency'
  | 'reference'
  | 'accountNumber'
  | 'ifsc'
  | 'routingNumber'
  | 'iban'
  | 'bic'
  | 'sortCode';

interface BankFileColumn {
  header: string;
  field: BankFileFieldKey;
}

export interface BankFileFormatSpec {
  code: BankFileFormat;
  /** Short label shown in the format picker. */
  label: string;
  /** Country/scheme the format serves. */
  description: string;
  delimiter: string;
  columns: BankFileColumn[];
}

/** The format registry — the single source of truth for every supported payout file. */
export const BANK_FILE_FORMATS: Record<BankFileFormat, BankFileFormatSpec> = {
  NACH: {
    code: 'NACH',
    label: 'NACH / H2H',
    description: 'India — NACH host-to-host',
    delimiter: ',',
    columns: [
      { header: 'BeneficiaryCode', field: 'employeeCode' },
      { header: 'BeneficiaryName', field: 'employeeName' },
      { header: 'IFSC', field: 'ifsc' },
      { header: 'AccountNumber', field: 'accountNumber' },
      { header: 'Amount', field: 'amount' },
      { header: 'Reference', field: 'reference' },
    ],
  },
  ACH: {
    code: 'ACH',
    label: 'ACH (NACHA)',
    description: 'United States — ACH / NACHA',
    delimiter: ',',
    columns: [
      { header: 'EmployeeId', field: 'employeeCode' },
      { header: 'Name', field: 'employeeName' },
      { header: 'RoutingNumber', field: 'routingNumber' },
      { header: 'AccountNumber', field: 'accountNumber' },
      { header: 'Amount', field: 'amount' },
      { header: 'Currency', field: 'currency' },
    ],
  },
  SEPA: {
    code: 'SEPA',
    label: 'SEPA pain.001',
    description: 'Eurozone — SEPA credit transfer',
    delimiter: ',',
    columns: [
      { header: 'CreditorName', field: 'employeeName' },
      { header: 'IBAN', field: 'iban' },
      { header: 'BIC', field: 'bic' },
      { header: 'Amount', field: 'amount' },
      { header: 'Currency', field: 'currency' },
      { header: 'RemittanceInfo', field: 'reference' },
    ],
  },
  BACS: {
    code: 'BACS',
    label: 'Bacs',
    description: 'United Kingdom — Bacs',
    delimiter: ',',
    columns: [
      { header: 'Name', field: 'employeeName' },
      { header: 'SortCode', field: 'sortCode' },
      { header: 'AccountNumber', field: 'accountNumber' },
      { header: 'Amount', field: 'amount' },
      { header: 'Reference', field: 'reference' },
    ],
  },
};

export function isBankFileFormat(value: string): value is BankFileFormat {
  return value in BANK_FILE_FORMATS;
}

/** A payout row the serializer renders — currency-aware amount, mock bank identifiers. */
export interface BankFileRowInput {
  employeeCode: string;
  employeeName: string;
  amount: number; // run-domain major units
  currency: string;
  reference: string;
}

/**
 * Deterministic mock bank identifiers per employee. Real bank fields would come from
 * the employee's country bank schema (§3.4); for the demo we synthesize stable values
 * so the file is reproducible. Not country-branched — every identifier is always
 * derived; the format spec decides which columns are emitted.
 */
function syntheticBank(employeeCode: string) {
  const digits = employeeCode.replace(/\D/g, '').padStart(6, '0').slice(-6);
  return {
    accountNumber: `00${digits}5500`,
    ifsc: `HDFC0${digits.slice(0, 3)}`,
    routingNumber: `0210${digits.slice(0, 5)}`,
    iban: `DE89${digits}0000000000`,
    bic: 'DEUTDEFFXXX',
    sortCode: `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`,
  };
}

/** Build the full field record for one payout line. */
function resolveRow(row: BankFileRowInput): Record<BankFileFieldKey, string> {
  const bank = syntheticBank(row.employeeCode);
  return {
    employeeCode: row.employeeCode,
    employeeName: row.employeeName,
    amount: row.amount.toFixed(currencyDecimals(row.currency)),
    currency: row.currency,
    reference: row.reference,
    accountNumber: bank.accountNumber,
    ifsc: bank.ifsc,
    routingNumber: bank.routingNumber,
    iban: bank.iban,
    bic: bank.bic,
    sortCode: bank.sortCode,
  };
}

/**
 * Serialize payout rows to a delimited bank file using the format spec's column order.
 * Generic over the format — the spec drives the header and every cell.
 */
export function buildBankFile(format: BankFileFormat, rows: BankFileRowInput[]): string {
  const spec = BANK_FILE_FORMATS[format];
  const header = spec.columns.map((c) => c.header).join(spec.delimiter);
  const body = rows.map((row) => {
    const resolved = resolveRow(row);
    return spec.columns.map((c) => resolved[c.field]).join(spec.delimiter);
  });
  return [header, ...body].join('\n');
}
