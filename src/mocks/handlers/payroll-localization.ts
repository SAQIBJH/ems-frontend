import { http, HttpResponse } from 'msw';
import type {
  BankField,
  Country,
  LegalEntity,
  LegalEntityInput,
} from '@/modules/payroll/types/localization.types';

// Per-country bank-account field schemas (rendered by the salary-assignment form).
const BANK_SCHEMAS: Record<string, BankField[]> = {
  IN: [
    { key: 'accountName', label: 'Account holder name', type: 'text', required: true },
    {
      key: 'accountNumber',
      label: 'Account number',
      type: 'text',
      required: true,
      regex: '^[0-9X]{9,18}$',
      placeholder: '1234567890',
    },
    {
      key: 'ifsc',
      label: 'IFSC code',
      type: 'text',
      required: true,
      regex: '^[A-Z]{4}0[A-Z0-9]{6}$',
      placeholder: 'HDFC0001234',
    },
    {
      key: 'bankName',
      label: 'Bank name',
      type: 'text',
      required: false,
      placeholder: 'HDFC Bank',
    },
  ],
  US: [
    { key: 'accountName', label: 'Account holder name', type: 'text', required: true },
    {
      key: 'routingNumber',
      label: 'Routing number',
      type: 'text',
      required: true,
      regex: '^[0-9]{9}$',
      placeholder: '021000021',
    },
    {
      key: 'accountNumber',
      label: 'Account number',
      type: 'text',
      required: true,
      regex: '^[0-9X]{4,17}$',
    },
    {
      key: 'accountType',
      label: 'Account type',
      type: 'text',
      required: false,
      placeholder: 'CHECKING / SAVINGS',
    },
  ],
  GB: [
    { key: 'accountName', label: 'Account holder name', type: 'text', required: true },
    {
      key: 'sortCode',
      label: 'Sort code',
      type: 'text',
      required: true,
      regex: '^[0-9]{2}-?[0-9]{2}-?[0-9]{2}$',
      placeholder: '12-34-56',
    },
    {
      key: 'accountNumber',
      label: 'Account number',
      type: 'text',
      required: true,
      regex: '^[0-9]{8}$',
    },
  ],
};

// SEPA / international fallback for any country without a specific schema.
const DEFAULT_BANK_SCHEMA: BankField[] = [
  { key: 'accountName', label: 'Account holder name', type: 'text', required: true },
  {
    key: 'iban',
    label: 'IBAN',
    type: 'text',
    required: true,
    regex: '^[A-Z]{2}[0-9A-Z]{13,32}$',
    placeholder: 'DE89370400440532013000',
  },
  { key: 'bic', label: 'BIC / SWIFT', type: 'text', required: false, placeholder: 'DEUTDEFF' },
];

const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', currency: 'INR', locale: 'en-IN', fiscalYearStartMonth: 4 },
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', fiscalYearStartMonth: 1 },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', fiscalYearStartMonth: 4 },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    locale: 'en-AE',
    fiscalYearStartMonth: 1,
  },
  { code: 'SG', name: 'Singapore', currency: 'SGD', locale: 'en-SG', fiscalYearStartMonth: 1 },
];

let legalEntities: LegalEntity[] = [
  {
    id: 'le-in',
    name: 'Acme India Pvt Ltd',
    country: 'IN',
    currency: 'INR',
    fiscalYearStartMonth: 4,
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    registrationIds: {
      PF: 'MHBAN1234567',
      ESI: '12345678901234',
      PAN: 'AAAAA1234A',
      TAN: 'MUMA12345B',
    },
    statutoryPackId: null,
    payCalendarId: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'le-us',
    name: 'Acme USA Inc',
    country: 'US',
    currency: 'USD',
    fiscalYearStartMonth: 1,
    timezone: 'America/New_York',
    locale: 'en-US',
    registrationIds: { EIN: '12-3456789' },
    statutoryPackId: null,
    payCalendarId: null,
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

let idCounter = 100;

export const payrollLocalizationHandlers = [
  http.get('/api/payroll/countries', () => {
    return HttpResponse.json({ success: true, data: COUNTRIES });
  }),

  http.get('/api/payroll/countries/:code/bank-schema', ({ params }) => {
    const { code } = params as { code: string };
    const fields = BANK_SCHEMAS[code.toUpperCase()] ?? DEFAULT_BANK_SCHEMA;
    return HttpResponse.json({
      success: true,
      data: { country: code.toUpperCase(), fields },
    });
  }),

  http.get('/api/payroll/legal-entities', () => {
    return HttpResponse.json({ success: true, data: legalEntities });
  }),

  http.post('/api/payroll/legal-entities', async ({ request }) => {
    const body = (await request.json()) as LegalEntityInput;
    const now = new Date().toISOString();
    const created: LegalEntity = {
      ...body,
      id: `le-${++idCounter}`,
      statutoryPackId: null,
      payCalendarId: null,
      createdAt: now,
      updatedAt: now,
    };
    legalEntities = [...legalEntities, created];
    return HttpResponse.json({ success: true, data: created }, { status: 201 });
  }),

  http.patch('/api/payroll/legal-entities/:id', async ({ params, request }) => {
    const { id } = params as { id: string };
    const body = (await request.json()) as Partial<LegalEntityInput>;
    const idx = legalEntities.findIndex((e) => e.id === id);
    if (idx === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Legal entity not found' } },
        { status: 404 },
      );
    }
    const updated: LegalEntity = {
      ...legalEntities[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    legalEntities = [...legalEntities.slice(0, idx), updated, ...legalEntities.slice(idx + 1)];
    return HttpResponse.json({ success: true, data: updated });
  }),
];
