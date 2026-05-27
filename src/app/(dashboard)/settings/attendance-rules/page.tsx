import { PlaceholderPanel } from '@/modules/settings/components/PlaceholderPanel';

export const metadata = { title: 'Attendance Rules — Settings' };

export default function AttendanceRulesPage() {
  return (
    <PlaceholderPanel
      title="Attendance Rules"
      description="Set check-in/check-out grace periods, overtime policies, and automatic regularisation thresholds."
    />
  );
}
