import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Plan — Settings' };

export default function BillingPlanPage() {
  return (
    <PlaceholderPanel
      title="Plan"
      description="View your current subscription, upgrade your plan, or manage add-ons for your organisation."
      phase2
    />
  );
}
