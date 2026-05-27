import { CreditCardIcon } from 'lucide-react';
import { Phase2Panel } from '@/modules/settings/components/Phase2Panel';

export const metadata = { title: 'Plan — Settings' };

export default function BillingPlanPage() {
  return (
    <Phase2Panel
      icon={CreditCardIcon}
      title="Plan &amp; Subscription"
      description="View your current plan, manage seats, and unlock Phase 2 modules — Payroll, Recruitment, and Performance."
      capabilities={[
        'Seat-based billing — pay only for active employees',
        'Upgrade or downgrade your plan with prorated adjustment',
        'Add-on modules: Payroll, Recruitment, Performance Management',
        'Usage dashboard — active seats, storage consumed, API calls',
        'Auto-renew controls and cancellation with data-export window',
      ]}
      roadmapNote="During the Phase 1 pilot your organisation is on a complimentary plan. Billing activates when Phase 2 modules are enabled."
    />
  );
}
