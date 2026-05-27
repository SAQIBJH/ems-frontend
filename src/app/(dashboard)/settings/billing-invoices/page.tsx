import { ReceiptIcon } from 'lucide-react';
import { Phase2Panel } from '@/modules/settings/components/Phase2Panel';

export const metadata = { title: 'Invoices — Settings' };

export default function BillingInvoicesPage() {
  return (
    <Phase2Panel
      icon={ReceiptIcon}
      title="Invoices"
      description="Access your full payment history, download PDF invoices, and export records for your finance team."
      capabilities={[
        'PDF invoice generated automatically on each billing cycle',
        'CSV export for accounting software (Tally, QuickBooks, Zoho Books)',
        'Invoices auto-emailed to the designated billing address',
        'Credit notes and refund records in the same view',
        'GST-compliant invoice format for Indian entities',
      ]}
      roadmapNote="Invoices will be available from the first billing cycle after Phase 2 activation."
    />
  );
}
