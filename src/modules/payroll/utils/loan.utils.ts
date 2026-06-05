/**
 * Loan amortization (mock + client). All money is integer minor units. Supports
 * three interest methods — REDUCING (declining balance), FLAT (interest on the
 * original principal), and ZERO (interest-free advance). The method is data, so a
 * new method would be a new branch here, never a country/loan special-case in the UI.
 */
import type { LoanInterestMethod, LoanScheduleEntry } from '../types/payroll.types';

/** Monthly rate as a fraction (e.g. 12% p.a. → 0.01). */
export function monthlyRate(annualRatePct: number): number {
  return annualRatePct / 100 / 12;
}

/** Advance a `YYYY-MM` period by `n` months. */
export function addMonths(period: string, n: number): string {
  const [y, m] = period.split('-').map(Number);
  const offset = m - 1 + n;
  const year = y + Math.floor(offset / 12);
  const month = (offset % 12) + 1;
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Level EMI for the chosen method (minor units). */
export function computeEmi(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  method: LoanInterestMethod,
): number {
  if (tenureMonths <= 0) return 0;
  if (method === 'ZERO' || annualRatePct === 0) return Math.round(principal / tenureMonths);
  if (method === 'FLAT') {
    const totalInterest = principal * (annualRatePct / 100) * (tenureMonths / 12);
    return Math.round((principal + totalInterest) / tenureMonths);
  }
  // REDUCING balance
  const r = monthlyRate(annualRatePct);
  const f = Math.pow(1 + r, tenureMonths);
  return Math.round((principal * r * f) / (f - 1));
}

/** Full amortization schedule; the final installment absorbs rounding to clear the balance. */
export function buildSchedule(
  principal: number,
  annualRatePct: number,
  tenureMonths: number,
  method: LoanInterestMethod,
  startPeriod: string,
): LoanScheduleEntry[] {
  const emi = computeEmi(principal, annualRatePct, tenureMonths, method);
  const r = monthlyRate(annualRatePct);
  const flatInterestPer =
    method === 'FLAT'
      ? Math.round((principal * (annualRatePct / 100) * (tenureMonths / 12)) / tenureMonths)
      : 0;

  const schedule: LoanScheduleEntry[] = [];
  let balance = principal;
  for (let i = 1; i <= tenureMonths; i++) {
    const isLast = i === tenureMonths;
    let interest: number;
    if (method === 'ZERO' || annualRatePct === 0) interest = 0;
    else if (method === 'FLAT') interest = flatInterestPer;
    else interest = Math.round(balance * r);

    let principalComponent = isLast ? balance : emi - interest;
    if (principalComponent > balance) principalComponent = balance;
    balance = Math.max(0, balance - principalComponent);

    schedule.push({
      installmentNo: i,
      period: addMonths(startPeriod, i - 1),
      emi: principalComponent + interest,
      principalComponent,
      interestComponent: interest,
      balanceAfter: balance,
      status: 'PENDING',
    });
  }
  return schedule;
}
