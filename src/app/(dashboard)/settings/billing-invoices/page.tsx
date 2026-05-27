import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Invoices — Settings' };

export default function BillingInvoicesPage() {
  return (
    <PlaceholderPanel
      title="Invoices"
      description="Download past invoices and receipts for your subscription payments."
      phase2
    />
  );
}
